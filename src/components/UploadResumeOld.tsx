import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';

const resumeUploadSchema = z.object({
  candidateName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  department: z.string().trim().min(2, "Department must be selected"),
  domain: z.enum(['sales', 'crm'], { required_error: "Domain must be selected" }),
  fileName: z.string().max(255, "Filename too long"),
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
};

interface UploadResumeProps {
  onUploadComplete: () => void;
}

export const UploadResume = ({ onUploadComplete }: UploadResumeProps) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [department, setDepartment] = useState('');
  const [domain, setDomain] = useState<'sales' | 'crm' | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null }>>([]);
  const [isPoolResume, setIsPoolResume] = useState(false);

  // ✅ Fetch users for admin only using admin RPC function
  const fetchUsers = async () => {
    try {
      // Use the admin function to fetch all profiles
      const { data, error } = await supabase
        .rpc('get_all_profiles_admin');
        
      if (error) {
        console.error("Error fetching users via RPC:", error.message);
        // Fallback to direct query if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .order('full_name');
          
        if (fallbackError) {
          console.error("Fallback fetch error:", fallbackError.message);
          toast({
            title: "Error loading users",
            description: fallbackError.message,
            variant: "destructive",
          });
        } else if (fallbackData) {
          setUsers(fallbackData);
        }
      } else if (data) {
        setUsers(data.map((p: any) => ({ id: p.id, full_name: p.full_name })));
      }
    } catch (err: any) {
      console.error("Error in fetchUsers:", err);
      toast({
        title: "Error loading users",
        description: err.message || "Failed to load users",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // ✅ Auto-assign logged-in user's ID if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      setSelectedUserId(user.id);
    }
  }, [user, isAdmin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !candidateName || !department || !domain || !selectedUserId) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    const validation = resumeUploadSchema.safeParse({
      candidateName,
      department,
      domain,
      fileName: file.name,
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const sanitizedName = sanitizeFilename(file.name.replace(`.${fileExt}`, ''));
      const fileName = `${selectedUserId}/${sanitizedName}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: selectedUserId,
          candidate_name: candidateName,
          department,
          domain,
          file_path: fileName,
          is_pool_resume: isPoolResume,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success!',
        description: 'Resume uploaded successfully.',
      });

      // Reset fields
      setCandidateName('');
      setDepartment('');
      setDomain('');
      setFile(null);
      setIsPoolResume(false);
      if (!isAdmin) setSelectedUserId(user?.id || '');
      
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || "Failed to upload resume",
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
          <Upload className="w-5 h-5" />
          Upload Resume
        </CardTitle>
        <CardDescription>
          Upload candidate resumes for assessment (PDF/DOC, max 10MB)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAdmin && (
          <div className="space-y-2">
            <Label>Upload For User *</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              onOpenChange={(open) => open && fetchUsers()} // ✅ Refresh on dropdown open
            >
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
        )}

        <div className="space-y-2">
          <Label>Candidate Name *</Label>
          <Input
            placeholder="John Doe"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Department *</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="customer_support">Customer Support</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Domain *</Label>
          <Select value={domain} onValueChange={(value) => setDomain(value as 'sales' | 'crm')}>
            <SelectTrigger>
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="crm">CRM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Resume File *</Label>
          <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          {file && (
            <p className="text-sm text-muted-foreground">Selected: {file.name}</p>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pool-resume"
              checked={isPoolResume}
              onCheckedChange={(checked) => setIsPoolResume(checked as boolean)}
            />
            <Label
              htmlFor="pool-resume"
              className="text-sm font-normal cursor-pointer"
            >
              Add to resume pool (for "Other Resume" rotation)
            </Label>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || !candidateName || !department || !domain || !selectedUserId || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
