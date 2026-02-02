import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, FileText, CheckCircle, XCircle, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import Papa from 'papaparse';
import { z } from 'zod';

const csvRowSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required"),
  candidate_name: z.string().trim().min(2, "Name must be at least 2 characters"),
  department: z.string().trim().min(2, "Department is required"),
  domain: z.enum(['sales', 'crm'], { required_error: "Domain must be 'sales' or 'crm'" }),
});

type CSVRow = z.infer<typeof csvRowSchema>;

interface UploadResult {
  filename: string;
  candidateName: string;
  status: 'success' | 'error';
  message: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
};

interface BulkUploadResumeProps {
  onUploadComplete: () => void;
}

export const BulkUploadResume = ({ onUploadComplete }: BulkUploadResumeProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null }>>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [isPoolResume, setIsPoolResume] = useState(false);

  useState(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (!error && data) {
        setUsers(data);
      }
    };
    fetchUsers();
  });

  const handleResumeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      const invalidFiles = files.filter(f => 
        f.size > 10 * 1024 * 1024 || !ALLOWED_MIME_TYPES.includes(f.type)
      );
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid files",
          description: `${invalidFiles.length} file(s) are either too large (>10MB) or invalid format`,
          variant: "destructive",
        });
        return;
      }
      
      setResumeFiles(files);
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      setCsvFile(file);
    }
  };

  const downloadTemplate = () => {
    const template = 'filename,candidate_name,department,domain\nexample-resume.pdf,John Doe,Sales,sales\nanother-resume.docx,Jane Smith,Marketing,crm';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!csvFile || resumeFiles.length === 0 || !selectedUserId) {
      toast({
        title: "Missing information",
        description: "Please upload CSV, resume files, and select a user",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setResults([]);

    try {
      // Parse CSV
      const csvText = await csvFile.text();
      const parseResult = Papa.parse<CSVRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
      });

      if (parseResult.errors.length > 0) {
        throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
      }

      const csvData = parseResult.data;
      
      // Validate CSV rows
      const validatedRows: CSVRow[] = [];
      for (let i = 0; i < csvData.length; i++) {
        try {
          const validated = csvRowSchema.parse(csvData[i]);
          validatedRows.push(validated);
        } catch (error: any) {
          toast({
            title: `CSV validation error at row ${i + 2}`,
            description: error.errors[0].message,
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
      }

      // Match files with CSV rows
      const uploadResults: UploadResult[] = [];
      const totalFiles = resumeFiles.length;

      for (let i = 0; i < resumeFiles.length; i++) {
        const file = resumeFiles[i];
        const csvRow = validatedRows.find(row => 
          row.filename.toLowerCase() === file.name.toLowerCase()
        );

        if (!csvRow) {
          uploadResults.push({
            filename: file.name,
            candidateName: 'Unknown',
            status: 'error',
            message: 'No matching metadata in CSV',
          });
          setProgress(((i + 1) / totalFiles) * 100);
          continue;
        }

        try {
          // Upload to storage
          const fileExt = file.name.split('.').pop();
          const sanitizedName = sanitizeFilename(file.name.replace(`.${fileExt}`, ''));
          const fileName = `${selectedUserId}/${sanitizedName}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, file, {
              contentType: file.type,
            });

          if (uploadError) throw uploadError;

          // For private bucket, we don't need to store public URL
          // Signed URLs will be generated when needed for viewing
          const { error: dbError } = await supabase
            .from('resumes')
            .insert({
              user_id: selectedUserId,
              candidate_name: csvRow.candidate_name,
              department: csvRow.department,
              domain: csvRow.domain,
              file_path: fileName,
              is_pool_resume: isPoolResume,
            });

          if (dbError) throw dbError;

          uploadResults.push({
            filename: file.name,
            candidateName: csvRow.candidate_name,
            status: 'success',
            message: 'Uploaded successfully',
          });
        } catch (error: any) {
          uploadResults.push({
            filename: file.name,
            candidateName: csvRow.candidate_name,
            status: 'error',
            message: error.message || 'Upload failed',
          });
        }

        setProgress(((i + 1) / totalFiles) * 100);
      }

      setResults(uploadResults);

      const successCount = uploadResults.filter(r => r.status === 'success').length;
      const errorCount = uploadResults.filter(r => r.status === 'error').length;

      toast({
        title: 'Bulk upload completed',
        description: `${successCount} successful, ${errorCount} failed`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      if (successCount > 0) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast({
        title: 'Bulk upload failed',
        description: error.message || 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Bulk Resume Upload
        </CardTitle>
        <CardDescription>
          Upload multiple resumes with CSV metadata (max 10MB per file)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Upload For User *</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || 'Unknown User'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>CSV Metadata File *</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="h-auto p-0 text-primary hover:text-primary/80"
            >
              <Download className="w-4 h-4 mr-1" />
              Download Template
            </Button>
          </div>
          <Input
            type="file"
            accept=".csv"
            onChange={handleCsvFileChange}
          />
          {csvFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {csvFile.name}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            CSV should include: filename, candidate_name, department, domain
          </p>
        </div>

        <div className="space-y-2">
          <Label>Resume Files (PDF/DOC) *</Label>
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            onChange={handleResumeFilesChange}
          />
          {resumeFiles.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Selected: {resumeFiles.length} file(s)
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="pool-resume-bulk"
            checked={isPoolResume}
            onCheckedChange={(checked) => setIsPoolResume(checked as boolean)}
          />
          <Label
            htmlFor="pool-resume-bulk"
            className="text-sm font-normal cursor-pointer"
          >
            Add to resume pool (for "Other Resume" rotation)
          </Label>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Upload Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
            <h4 className="font-semibold text-sm mb-2">Upload Results:</h4>
            {results.map((result, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {result.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.candidateName}</p>
                  <p className="text-xs text-muted-foreground truncate">{result.filename}</p>
                  <p className={`text-xs ${result.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleBulkUpload}
          disabled={!csvFile || resumeFiles.length === 0 || !selectedUserId || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading {Math.round(progress)}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {resumeFiles.length} Resume{resumeFiles.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
