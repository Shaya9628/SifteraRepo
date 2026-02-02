import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Play, 
  Loader2,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Resume {
  id: string;
  candidate_name: string;
  department: string;
  domain: string;
  uploaded_at: string;
  status: string;
  is_pool_resume?: boolean;
}

interface ResumeAssessmentSelectionProps {
  onAssessmentStart?: () => void;
}

export const ResumeAssessmentSelection = ({ onAssessmentStart }: ResumeAssessmentSelectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingAssessment, setStartingAssessment] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (user) {
      setDebugInfo(`User found: ${user.id}`);
      loadResumes();
    } else {
      setDebugInfo('No user found');
      setLoading(false);
    }
  }, [user]);

  const loadResumes = async () => {
    if (!user) return;

    try {
      setDebugInfo(prev => prev + ' | Starting query...');
      
      // Simple query - get all resumes for this user
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        setDebugInfo(prev => prev + ` | Error: ${error.message}`);
        console.error('Error loading resumes:', error);
        return;
      }

      setDebugInfo(prev => prev + ` | Query success. Found ${data?.length || 0} total resumes`);

      // Filter out pool resumes if they exist
      const userResumes = (data || []).filter(resume => !resume.is_pool_resume);
      setDebugInfo(prev => prev + ` | After filtering: ${userResumes.length} user resumes`);
      
      setResumes(userResumes);
    } catch (error: any) {
      setDebugInfo(prev => prev + ` | Catch error: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = async (resumeId: string, candidateName: string) => {
    setStartingAssessment(resumeId);
    
    try {
      // Navigate to the assessment screen
      navigate(`/screen/${resumeId}`);
      onAssessmentStart?.();
    } catch (error: any) {
      console.error('Error starting assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to start assessment',
        variant: 'destructive',
      });
    } finally {
      setStartingAssessment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="text-xs">Completed</Badge>;
      case 'screening':
        return <Badge variant="secondary" className="text-xs">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Ready</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading resumes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No resumes uploaded yet</p>
          <p className="text-sm text-muted-foreground">
            Go to the "Upload Resume" tab to upload resumes, then return here to start assessments!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <strong>Debug Info:</strong> {debugInfo}
      </div>
      
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm font-medium">✅ Dialog is working!</p>
        <p className="text-xs text-muted-foreground">User: {user?.email || 'Not logged in'}</p>
        <p className="text-xs text-muted-foreground">Loading: {loading.toString()}</p>
        <p className="text-xs text-muted-foreground">Resumes found: {resumes.length}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Uploaded
          </CardTitle>
        <CardDescription>
          Select a resume to start your assessment practice
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{resume.candidate_name}</span>
                  </div>
                  {getStatusBadge(resume.status)}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    <span>{resume.department}</span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="capitalize">{resume.domain}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(resume.uploaded_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleStartAssessment(resume.id, resume.candidate_name)}
                disabled={startingAssessment === resume.id}
                size="sm"
                variant={resume.status === 'completed' ? 'outline' : 'default'}
                className="ml-4"
              >
                {startingAssessment === resume.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {resume.status === 'completed' ? 'Review' : 'Start Assessment'}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};