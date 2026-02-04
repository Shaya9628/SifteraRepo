import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, TrendingUp, AlertTriangle, FileText, Calendar, Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AssessmentReport {
  id: string;
  resume_id: string;
  user_total_score: number;
  ai_total_score: number;
  user_scores: any;
  ai_scores: any;
  comparative_feedback: any;
  overall_feedback: string;
  created_at: string;
  red_flags?: any[];
  interview_questions?: any[];
  recommendation?: string;
  reasoning?: string;
  suitability_summary?: string;
  resumes?: {
    candidate_name?: string;
    file_path?: string;
  } | null;
}

export default function AIResults() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessmentReports, setAssessmentReports] = useState<AssessmentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AssessmentReport | null>(null);

  useEffect(() => {
    if (user) {
      fetchAssessmentReports();
    }
  }, [user]);

  const fetchAssessmentReports = async () => {
    try {
      // First try to get assessment reports with resume data
      const { data: reportsWithResumes, error: reportsError } = await supabase
        .from('assessment_reports')
        .select(`
          *,
          resumes (
            candidate_name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.warn('Error fetching reports with resumes:', reportsError);
        
        // Fallback: try to get reports without resume relationship
        const { data: basicReports, error: basicError } = await supabase
          .from('assessment_reports')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (basicError) throw basicError;
        
        // For each report, try to get resume data separately
        const reportsWithResumeData = await Promise.all(
          (basicReports || []).map(async (report) => {
            try {
              const { data: resumeData } = await supabase
                .from('resumes')
                .select('candidate_name, file_path')
                .eq('id', report.resume_id)
                .single();
              
              return {
                ...report,
                resumes: resumeData ? { candidate_name: resumeData.candidate_name, file_path: resumeData.file_path } : null
              };
            } catch {
              return {
                ...report,
                resumes: null
              };
            }
          })
        );
        
        setAssessmentReports(reportsWithResumeData);
      } else {
        setAssessmentReports(reportsWithResumes || []);
      }

      // Also check for completed resumes that might not have assessment reports
      const { data: completedResumes, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (!resumeError && completedResumes) {
        // For completed resumes without assessment reports, create placeholder entries
        const existingResumeIds = new Set((reportsWithResumes || []).map(r => r.resume_id));
        const missingReports = completedResumes
          .filter(resume => !existingResumeIds.has(resume.id))
          .map(resume => ({
            id: `placeholder-${resume.id}`,
            resume_id: resume.id,
            user_total_score: 0,
            ai_total_score: 0,
            user_scores: {},
            ai_scores: {},
            comparative_feedback: {},
            overall_feedback: 'Assessment completed. Detailed feedback available.',
            created_at: resume.uploaded_at,
            resumes: {
              file_path: resume.file_path,
              candidate_name: resume.candidate_name
            }
          }));

        if (missingReports.length > 0) {
          setAssessmentReports(prev => [...prev, ...missingReports]);
        }
      }

    } catch (error: any) {
      console.error('Error fetching assessment reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment reports.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading your AI feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedReport(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Button>
        </div>

        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Assessment Report
                  </CardTitle>
                  <CardDescription>
                    Resume: {selectedReport.resumes?.file_path?.split('/').pop() || selectedReport.resumes?.candidate_name || 'Unknown'}
                    {selectedReport.resumes?.candidate_name && (
                      <span> • Candidate: {selectedReport.resumes.candidate_name}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(selectedReport.created_at)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="scores">Score Analysis</TabsTrigger>
              <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Your Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {Math.round(selectedReport.user_total_score)}
                      <span className="text-sm text-muted-foreground ml-1">/100</span>
                    </div>
                    <Badge variant={getScoreBadgeVariant(selectedReport.user_total_score)} className="mt-2">
                      {selectedReport.user_total_score >= 80 ? 'Excellent' : 
                       selectedReport.user_total_score >= 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {Math.round(selectedReport.ai_total_score)}
                      <span className="text-sm text-muted-foreground ml-1">/100</span>
                    </div>
                    <Badge variant={getScoreBadgeVariant(selectedReport.ai_total_score)} className="mt-2">
                      {selectedReport.ai_total_score >= 80 ? 'Excellent' : 
                       selectedReport.ai_total_score >= 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {100 - Math.abs(selectedReport.user_total_score - selectedReport.ai_total_score)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      How close your assessment was to AI
                    </p>
                  </CardContent>
                </Card>
              </div>

              {selectedReport.red_flags && selectedReport.red_flags.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Red Flags Detected</AlertTitle>
                  <AlertDescription>
                    {selectedReport.red_flags.length} potential issue(s) were identified in this resume.
                  </AlertDescription>
                </Alert>
              )}

              {selectedReport.recommendation && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{selectedReport.recommendation}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="scores" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Score Comparison</CardTitle>
                  <CardDescription>
                    Compare your assessment scores with AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedReport.user_scores && Object.entries(selectedReport.user_scores).map(([category, userScore]) => {
                      const aiScore = selectedReport.ai_scores?.[category] || 0;
                      const userScoreNum = typeof userScore === 'number' ? userScore : 0;
                      const aiScoreNum = typeof aiScore === 'number' ? aiScore : 0;
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="capitalize font-medium">
                              {category.replace('_', ' ')}
                            </span>
                            <div className="flex gap-4 text-sm">
                              <span>Your: {userScoreNum}</span>
                              <span>AI: {aiScoreNum}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.min(userScoreNum, 100)}%` }}
                              />
                            </div>
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-accent h-2 rounded-full" 
                                style={{ width: `${Math.min(aiScoreNum, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{selectedReport.overall_feedback}</p>
                  </div>
                </CardContent>
              </Card>

              {selectedReport.reasoning && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Reasoning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{selectedReport.reasoning}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedReport.comparative_feedback && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparative Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(selectedReport.comparative_feedback).map(([key, feedback]) => (
                        <div key={key} className="border-l-4 border-primary pl-4">
                          <h4 className="font-medium capitalize mb-1">{key.replace('_', ' ')}</h4>
                          <div className="text-sm text-muted-foreground">
                            {typeof feedback === 'object' && feedback !== null ? (
                              <div className="space-y-2">
                                {Object.entries(feedback).map(([subKey, subValue]) => (
                                  <div key={subKey} className="ml-2">
                                    <span className="font-medium capitalize">{subKey.replace('_', ' ')}: </span>
                                    <span>{String(subValue)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p>{String(feedback)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="w-8 h-8" />
          AI Feedback & Results
        </h1>
        <p className="text-muted-foreground mt-2">
          Review your completed assessment reports and AI analysis
        </p>
      </div>

              {assessmentReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assessment Reports Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Complete your first resume assessment to see AI feedback and detailed analysis here.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Start New Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Found {assessmentReports.length} completed assessment{assessmentReports.length !== 1 ? 's' : ''}
          </div>
          <div className="grid gap-6">
            {assessmentReports.map((report) => (
              <Card 
                key={report.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedReport(report)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {report.resumes?.file_path?.split('/').pop() || report.resumes?.candidate_name || 'Assessment Report'}
                      </CardTitle>
                      <CardDescription>
                        {report.resumes?.candidate_name && (
                          <span>Candidate: {report.resumes.candidate_name} • </span>
                        )}
                        Completed {formatDate(report.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getScoreBadgeVariant(report.user_total_score)}>
                        Your Score: {Math.round(report.user_total_score)}
                      </Badge>
                      <Badge variant={getScoreBadgeVariant(report.ai_total_score)}>
                        AI Score: {Math.round(report.ai_total_score)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Accuracy: {100 - Math.abs(report.user_total_score - report.ai_total_score)}%
                      </span>
                      {report.red_flags && report.red_flags.length > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          {report.red_flags.length} Red Flag{report.red_flags.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {report.id.startsWith('placeholder-') && (
                        <Badge variant="outline" className="text-xs">
                          Legacy Assessment
                        </Badge>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}