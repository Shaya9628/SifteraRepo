import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  User,
  Building,
  Globe
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  candidateName: string;
  department: string;
  domain: string;
  isPoolResume: boolean;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  userId: string;
}

interface User {
  id: string;
  full_name: string;
  email?: string;
}

interface ModernResumeUploadProps {
  onUploadComplete?: () => void;
  mode?: 'single' | 'bulk';
}

const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ModernResumeUpload = ({ onUploadComplete, mode = 'single' }: ModernResumeUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [defaultUserId, setDefaultUserId] = useState('');
  const [defaultDepartment, setDefaultDepartment] = useState('');
  const [defaultDomain, setDefaultDomain] = useState('');
  const [defaultIsPoolResume, setDefaultIsPoolResume] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadUsers();
  }, []);

  useEffect(() => {
    // Auto-set user ID for non-admin users
    if (user && !isAdmin) {
      setDefaultUserId(user.id);
    }
  }, [user, isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .limit(1);

      if (!error && data && data.length > 0) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.log('Could not check admin status:', error);
    }
  };

  const loadUsers = async () => {
    // Only load users if admin
    if (!isAdmin) {
      setUsers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: 'Failed to load users',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      return `File type ${fileExtension} not allowed. Please use PDF, DOC, or DOCX files.`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum allowed size is 10MB.`;
    }
    
    return null;
  };

  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9\-_\.]/g, '_').replace(/_{2,}/g, '_');
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Invalid file',
          description: `${file.name}: ${error}`,
          variant: 'destructive',
        });
        return;
      }

      // Check for duplicates
      const duplicate = files.find(f => 
        f.file.name === file.name && f.file.size === file.size
      );
      
      if (duplicate) {
        toast({
          title: 'Duplicate file',
          description: `${file.name} is already added`,
          variant: 'destructive',
        });
        return;
      }

      const candidateName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      validFiles.push({
        id: generateFileId(),
        file,
        candidateName,
        department: defaultDepartment || 'sales',
        domain: defaultDomain || 'sales',
        isPoolResume: defaultIsPoolResume,
        userId: defaultUserId,
        status: 'pending',
        progress: 0,
      });
    });

    if (mode === 'single' && files.length + validFiles.length > 1) {
      setFiles([validFiles[0]]);
      if (validFiles.length > 1) {
        toast({
          title: 'Single file mode',
          description: 'Only one file allowed in single file mode',
          variant: 'default',
        });
      }
    } else {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [files, defaultDepartment, defaultDomain, defaultIsPoolResume, defaultUserId, mode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleFiles(selectedFiles);
    }
    // Clear input to allow re-selection of same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFile = (fileId: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...updates } : f));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    updateFile(uploadFile.id, { status: 'uploading', progress: 0 });

    try {
      // Validate required fields
      if (!uploadFile.userId || !uploadFile.candidateName.trim() || !uploadFile.department || !uploadFile.domain) {
        throw new Error('Missing required information');
      }

      const fileExt = uploadFile.file.name.split('.').pop();
      const sanitizedName = sanitizeFilename(uploadFile.file.name.replace(`.${fileExt}`, ''));
      const fileName = `${uploadFile.userId}/${sanitizedName}_${Date.now()}.${fileExt}`;

      // Upload to storage with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, uploadFile.file, {
          contentType: uploadFile.file.type,
        });

      if (uploadError) throw uploadError;

      updateFile(uploadFile.id, { progress: 50 });

      // Insert record into database
      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: uploadFile.userId,
          candidate_name: uploadFile.candidateName.trim(),
          department: uploadFile.department,
          domain: uploadFile.domain,
          file_path: fileName,
          is_pool_resume: isAdmin ? uploadFile.isPoolResume : false, // Only admins can add to pool
        });

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('resumes').remove([fileName]);
        throw dbError;
      }

      updateFile(uploadFile.id, { status: 'success', progress: 100 });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      updateFile(uploadFile.id, { 
        status: 'error', 
        error: error.message || 'Upload failed',
        progress: 0 
      });
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to upload',
        variant: 'destructive',
      });
      return;
    }

    // Validate all files have required information
    const invalidFiles = files.filter(f => 
      !f.userId || !f.candidateName.trim() || !f.department || !f.domain
    );

    if (invalidFiles.length > 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields for all files',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setGlobalProgress(0);

    const totalFiles = files.length;
    let completedFiles = 0;

    // Upload files sequentially to avoid overwhelming the system
    for (const file of files) {
      if (file.status === 'pending') {
        await uploadFile(file);
      }
      completedFiles++;
      setGlobalProgress((completedFiles / totalFiles) * 100);
    }

    setIsUploading(false);

    // Show results
    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;

    if (successCount > 0) {
      toast({
        title: 'Upload completed',
        description: `${successCount} file(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      if (onUploadComplete) {
        onUploadComplete();
      }

      // Clear successful uploads
      setFiles(prev => prev.filter(f => f.status === 'error'));
    } else if (errorCount > 0) {
      toast({
        title: 'Upload failed',
        description: `All ${errorCount} file(s) failed to upload`,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (file: UploadFile) => {
    switch (file.status) {
      case 'success':
        return <Badge variant="outline" className="text-green-700 border-green-300">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'uploading':
        return <Badge variant="outline" className="text-blue-700 border-blue-300">Uploading</Badge>;
      default:
        return <Badge variant="secondary">Ready</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          {mode === 'bulk' ? 'Bulk Resume Upload' : 'Resume Upload'}
        </CardTitle>
        <CardDescription>
          {mode === 'bulk' 
            ? 'Upload multiple resumes with drag-and-drop (max 10MB per file)'
            : 'Upload a single resume file (max 10MB)'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default settings for new files */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          {isAdmin && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Default User *
              </Label>
              <Select value={defaultUserId} onValueChange={setDefaultUserId}>
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
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building className="w-4 h-4" />
              Default Department *
            </Label>
            <Select value={defaultDepartment} onValueChange={setDefaultDepartment}>
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
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Default Domain *
            </Label>
            <Select value={defaultDomain} onValueChange={setDefaultDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="default-pool-resume"
                checked={defaultIsPoolResume}
                onCheckedChange={(checked) => setDefaultIsPoolResume(checked as boolean)}
              />
              <Label htmlFor="default-pool-resume" className="text-sm font-normal cursor-pointer">
                Add to resume pool by default
              </Label>
            </div>
          )}
        </div>

        {/* Drag and drop area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragOver 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }
          `}
        >
          <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {isDragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports: PDF, DOC, DOCX (max 10MB each)
          </p>
          <Button variant="outline" type="button">
            <FileText className="w-4 h-4 mr-2" />
            Select Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            multiple={mode === 'bulk'}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Files to Upload ({files.length})</h3>
              {files.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {files.map((file) => (
                <Card key={file.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(file.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm truncate">{file.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(file)}
                          {file.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              disabled={isUploading}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {file.status === 'uploading' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Uploading...</span>
                            <span>{file.progress}%</span>
                          </div>
                          <Progress value={file.progress} className="h-1" />
                        </div>
                      )}

                      {file.status === 'error' && file.error && (
                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {file.error}
                        </p>
                      )}

                      {file.status === 'pending' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <Label className="text-xs">Candidate Name *</Label>
                            <Input
                              value={file.candidateName}
                              onChange={(e) => updateFile(file.id, { candidateName: e.target.value })}
                              placeholder="Enter candidate name"
                              disabled={isUploading}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">User *</Label>
                            <Select
                              value={file.userId}
                              onValueChange={(value) => updateFile(file.id, { userId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select user" />
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

                          <div className="space-y-1">
                            <Label className="text-xs">Department *</Label>
                            <Select
                              value={file.department}
                              onValueChange={(value) => updateFile(file.id, { department: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="customer_support">Customer Support</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Domain *</Label>
                            <Select
                              value={file.domain}
                              onValueChange={(value) => updateFile(file.id, { domain: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select domain" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="crm">CRM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-2 flex items-center space-x-2">
                            <Checkbox
                              id={`pool-resume-${file.id}`}
                              checked={file.isPoolResume}
                              onCheckedChange={(checked) => updateFile(file.id, { isPoolResume: checked as boolean })}
                            />
                            <Label htmlFor={`pool-resume-${file.id}`} className="text-xs cursor-pointer">
                              Add to resume pool (for "Other Resume" rotation)
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Global progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(globalProgress)}%</span>
            </div>
            <Progress value={globalProgress} />
          </div>
        )}

        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading || !defaultUserId || !defaultDepartment || !defaultDomain}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading... {Math.round(globalProgress)}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {files.length} File{files.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};