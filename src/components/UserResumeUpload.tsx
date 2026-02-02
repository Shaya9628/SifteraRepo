import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  AlertTriangle,
  Building,
  Globe,
  User,
  Play,
  Rocket
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UploadFile {
  id: string;
  file: File;
  candidateName: string;
  department: string;
  domain: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface UserResumeUploadProps {
  onUploadComplete?: () => void;
}

interface ExistingResume {
  id: string;
  candidate_name: string;
  department: string;
  domain: string | null;
  uploaded_at: string;
  status: string | null;
}

const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RESUMES_PER_USER = 2;

export const UserResumeUpload = ({ onUploadComplete }: UserResumeUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [existingResumes, setExistingResumes] = useState<ExistingResume[]>([]);
  const [existingResumesLoading, setExistingResumesLoading] = useState(false);
  const [defaultDepartment, setDefaultDepartment] = useState('');
  const [defaultDomain, setDefaultDomain] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUploadedResumeId, setLastUploadedResumeId] = useState<string | null>(null);
  const [showStartAssessment, setShowStartAssessment] = useState(false);

  const fetchExistingResumes = useCallback(async () => {
    if (!user) return;
    setExistingResumesLoading(true);

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('id,candidate_name,department,domain,uploaded_at,status')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setExistingResumes((data as ExistingResume[]) || []);
    } catch (error: any) {
      console.error('Error fetching resumes:', error);
      toast({
        title: 'Could not load your resumes',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExistingResumesLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      checkUserUploadCount();
      fetchExistingResumes();
    }
  }, [user, fetchExistingResumes]);

  const checkUserUploadCount = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking upload count:', error);
        toast({
          title: 'Error checking upload limit',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setUploadCount(count || 0);
      
    } catch (error: any) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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

  const normalizeDepartment = (value: string): 'sales' | 'customer_support' => {
    const compact = value.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (compact === 'sales') return 'sales';
    if (compact === 'customersupport') return 'customer_support';
    throw new Error('Invalid department. Please select Sales or Customer Support.');
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    // Check if user has reached upload limit
    if (uploadCount >= MAX_RESUMES_PER_USER) {
      toast({
        title: 'Upload limit reached',
        description: 'Admin can only upload additional resumes. Please contact Admin.',
        variant: 'destructive',
      });
      return;
    }

    const fileArray = Array.from(newFiles);
    const validFiles: UploadFile[] = [];

    fileArray.forEach(file => {
      // Check if this upload would exceed the limit
      if (uploadCount + files.length + validFiles.length >= MAX_RESUMES_PER_USER) {
        toast({
          title: 'Upload limit reached',
          description: 'You can only upload 2 resumes total. Admin can upload additional resumes.',
          variant: 'destructive',
        });
        return;
      }

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
        status: 'pending',
        progress: 0,
      });
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (uploadCount >= MAX_RESUMES_PER_USER) {
      toast({
        title: 'Upload limit reached',
        description: 'Admin can only upload additional resumes. Please contact Admin.',
        variant: 'destructive',
      });
      return;
    }
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [files, uploadCount, defaultDepartment, defaultDomain]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (uploadCount < MAX_RESUMES_PER_USER) {
      setIsDragOver(true);
    }
  }, [uploadCount]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadCount >= MAX_RESUMES_PER_USER) {
      toast({
        title: 'Upload limit reached',
        description: 'Admin can only upload additional resumes. Please contact Admin.',
        variant: 'destructive',
      });
      return;
    }

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
      if (!uploadFile.candidateName.trim() || !uploadFile.department || !uploadFile.domain) {
        throw new Error('Missing required information');
      }

      const fileExt = uploadFile.file.name.split('.').pop();
      const sanitizedName = sanitizeFilename(uploadFile.file.name.replace(`.${fileExt}`, ''));
      const fileName = `${user!.id}/${sanitizedName}_${Date.now()}.${fileExt}`;

      // Upload to storage with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, uploadFile.file, {
          contentType: uploadFile.file.type,
        });

      if (uploadError) throw uploadError;

      updateFile(uploadFile.id, { progress: 50 });

      const normalizedDepartment = normalizeDepartment(uploadFile.department);

      // Insert record into database and get the resume ID
      const { data: insertedResume, error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user!.id,
          candidate_name: uploadFile.candidateName.trim(),
          department: normalizedDepartment,
          domain: uploadFile.domain,
          file_path: fileName,
          is_pool_resume: false, // Users cannot add to pool
        })
        .select('id')
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('resumes').remove([fileName]);
        throw dbError;
      }

      // Store the uploaded resume ID for starting assessment
      if (insertedResume?.id) {
        setLastUploadedResumeId(insertedResume.id);
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

    // Final check for upload limit
    if (uploadCount + files.length > MAX_RESUMES_PER_USER) {
      toast({
        title: 'Upload limit exceeded',
        description: 'Admin can only upload additional resumes. Please contact Admin.',
        variant: 'destructive',
      });
      return;
    }

    // Validate all files have required information
    const invalidFiles = files.filter(f => 
      !f.candidateName.trim() || !f.department || !f.domain
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

    // Upload files sequentially to avoid overwhelming the system
    for (const file of files) {
      if (file.status === 'pending') {
        await uploadFile(file);
      }
    }

    setIsUploading(false);

    // Show results and update count
    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;

    if (successCount > 0) {
      toast({
        title: 'Upload completed',
        description: `${successCount} resume(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}. You can now start your assessment!`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      // Update upload count
      setUploadCount(prev => prev + successCount);

      // Show start assessment option
      setShowStartAssessment(true);

      // Refresh list so the uploaded resume appears with row-specific Start Assessment
      fetchExistingResumes();

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

  const handleStartAssessment = () => {
    if (lastUploadedResumeId) {
      navigate(`/screen/${lastUploadedResumeId}`);
    } else {
      // Fallback: navigate to dashboard if no resume ID
      navigate('/dashboard');
    }
  };

  const handleStartAssessmentForResume = (resumeId: string) => {
    navigate(`/screen/${resumeId}`);
  };

  const formatDepartmentLabel = (dept: string) => {
    if (dept === 'customer_support') return 'Customer Support';
    if (dept === 'sales') return 'Sales';
    return dept;
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

  const getUploadLimitIndicator = () => {
    const remainingUploads = MAX_RESUMES_PER_USER - uploadCount;
    const isAtLimit = uploadCount >= MAX_RESUMES_PER_USER;
    const hasOneLeft = remainingUploads === 1;

    return (
      <div className={`p-3 rounded-lg border ${
        isAtLimit ? 'bg-red-50 border-red-200' : 
        hasOneLeft ? 'bg-yellow-50 border-yellow-200' : 
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-2">
          {isAtLimit ? (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          ) : hasOneLeft ? (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          ) : (
            <User className="w-4 h-4 text-blue-600" />
          )}
          <span className={`text-sm font-medium ${
            isAtLimit ? 'text-red-800' : 
            hasOneLeft ? 'text-yellow-800' : 
            'text-blue-800'
          }`}>
            {isAtLimit
              ? 'Upload limit reached (2/2)'
              : `You have used ${uploadCount} of ${MAX_RESUMES_PER_USER} resume uploads`
            }
          </span>
        </div>
        {hasOneLeft && (
          <p className="text-xs text-yellow-700 mt-1">
            Only 1 upload remaining
          </p>
        )}
        {isAtLimit && (
          <p className="text-xs text-red-700 mt-1">
            Admin can upload additional resumes. Please contact Admin.
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUploadDisabled = uploadCount >= MAX_RESUMES_PER_USER;

  return (
    <>
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Resume
        </CardTitle>
        <CardDescription>
          Upload your resume for assessment (PDF, DOC, or DOCX files, max 10MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload limit indicator */}
        {getUploadLimitIndicator()}

        {/* Existing resumes (always visible, even when upload limit reached) */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Your uploaded resumes</h3>
              <p className="text-sm text-muted-foreground">
                Start/continue assessment for any resume below.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExistingResumes}
              disabled={existingResumesLoading}
            >
              Refresh
            </Button>
          </div>

          {existingResumesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading resumes...
            </div>
          ) : existingResumes.length === 0 ? (
            <div className="text-sm text-muted-foreground">No resumes uploaded yet.</div>
          ) : (
            <div className="space-y-2">
              {existingResumes.map((r) => (
                <Card
                  key={r.id}
                  className={`p-4 ${r.id === lastUploadedResumeId ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{r.candidate_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDepartmentLabel(r.department)}
                        {r.domain ? ` • ${r.domain.toUpperCase()}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Badge variant={r.status === 'completed' ? 'secondary' : 'outline'}>
                        {r.status || 'pending'}
                      </Badge>
                      <Button size="sm" onClick={() => handleStartAssessmentForResume(r.id)}>
                        <Play className="w-4 h-4 mr-2" />
                        Start Assessment
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {!isUploadDisabled && (
          <>
            {/* Default settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Department *
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
                  Domain *
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
            </div>

            {/* Drag and drop area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={isUploadDisabled ? undefined : () => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isUploadDisabled 
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
                  : isDragOver 
                    ? 'border-primary bg-primary/10 cursor-pointer' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer'
                }
              `}
            >
              <Upload className={`w-8 h-8 mx-auto mb-4 ${isUploadDisabled ? 'text-gray-400' : 'text-muted-foreground'}`} />
              <p className={`text-lg font-medium mb-2 ${isUploadDisabled ? 'text-gray-500' : ''}`}>
                {isUploadDisabled 
                  ? 'Upload limit reached'
                  : isDragOver 
                    ? 'Drop files here' 
                    : 'Drag & drop files or click to browse'
                }
              </p>
              <p className={`text-sm mb-4 ${isUploadDisabled ? 'text-gray-400' : 'text-muted-foreground'}`}>
                {isUploadDisabled 
                  ? 'Contact Admin for additional uploads'
                  : 'Supports: PDF, DOC, DOCX (max 10MB each)'
                }
              </p>
              {!isUploadDisabled && (
                <Button variant="outline" type="button">
                  <FileText className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                multiple={false} // Users can only upload one at a time
                onChange={handleFileInput}
                className="hidden"
                disabled={isUploadDisabled}
              />
            </div>
          </>
        )}

        {/* File list - show only when there are files and not showing assessment button */}
        {files.length > 0 && !showStartAssessment && (
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

            <div className="space-y-3">
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

                          <div className="space-y-1 md:col-span-2">
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
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upload button */}
        {!isUploadDisabled && (
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading || !defaultDepartment || !defaultDomain}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} File{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>

    {/* Start Assessment Dialog Popup */}
    <Dialog open={showStartAssessment && !!lastUploadedResumeId} onOpenChange={(open) => {
      if (!open) {
        setShowStartAssessment(false);
        setLastUploadedResumeId(null);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Resume Uploaded Successfully!</DialogTitle>
          <DialogDescription className="text-center">
            Your resume is ready. Start the assessment now to evaluate the candidate's skills and qualifications.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleStartAssessment}
            size="lg"
            className="w-full"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Assessment Now
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowStartAssessment(false);
              setLastUploadedResumeId(null);
            }}
          >
            Upload Another Resume
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};