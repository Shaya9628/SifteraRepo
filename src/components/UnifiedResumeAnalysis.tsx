import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, Loader2, Trophy, Flag, Phone, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { optimizedLoadAssessment, triggerComprehensiveAIAnalysis } from '@/lib/assessmentOptimization';

interface UnifiedResumeAnalysisProps {
  resumeId: string;
  resumeText: string;
  candidateName: string;
  department: string;
}

interface UserScores {
  experience_score: number;
  skills_score: number;
  progression_score: number;
  achievements_score: number;
  communication_score: number;
  cultural_fit_score: number;
  total_score: number;
  notes?: string;
}

const UnifiedResumeAnalysis = ({ resumeId, resumeText, candidateName, department }: UnifiedResumeAnalysisProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [userScores, setUserScores] = useState<UserScores | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentStatus, setAssessmentStatus] = useState<string[]>([]);
  const [canAnalyze, setCanAnalyze] = useState(false);

  // Function to check if scorecard is complete
  const isScorecardComplete = useCallback((): boolean => {
    if (!userScores) return false;
    
    const requiredFields: (keyof UserScores)[] = [
      'experience_score',
      'skills_score',
      'progression_score',
      'achievements_score',
      'communication_score',
      'cultural_fit_score',
      'total_score'
    ];
    
    return requiredFields.every(field => {
      const value = userScores[field];
      return value !== null && value !== undefined && typeof value === 'number' && value >= 0;
    });
  }, [userScores]);

  const loadData = useCallback(async () => {
    if (!user || !resumeId) return;
    
    setLoading(true);
    console.log('Loading optimized assessment data for resume:', resumeId);
    
    try {
      // Use optimized loading to get all assessment data and status
      const { data: assessmentData, needsCompletion, canAnalyze: canPerformAnalysis } = 
        await optimizedLoadAssessment(resumeId, user.id);
      
      setAssessmentStatus(needsCompletion);
      setCanAnalyze(canPerformAnalysis);
      
      if (assessmentData.scorecard) {
        setUserScores({
          experience_score: assessmentData.scorecard.experience_score,
          skills_score: assessmentData.scorecard.skills_score,
          progression_score: assessmentData.scorecard.progression_score,
          achievements_score: assessmentData.scorecard.achievements_score,
          communication_score: assessmentData.scorecard.communication_score,
          cultural_fit_score: assessmentData.scorecard.cultural_fit_score,
          total_score: assessmentData.scorecard.total_score,
          notes: assessmentData.scorecard.notes
        });
        setUserNotes(assessmentData.scorecard.notes || '');
      }
      
      // Check for existing AI analysis report
      const { data: reportData } = await supabase
        .from('assessment_reports')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (reportData && reportData.length > 0) {
        const report = reportData[0];
        setExistingReport(report);
        
        // Reconstruct AI analysis from stored report data
        // Cast report to any to access extended fields that may or may not exist
        const extendedReport = report as any;
        const reconstructedAnalysis = {
          ai_total_score: report.ai_total_score,
          user_total_score: report.user_total_score,
          ai_scores: report.ai_scores,
          comparative_feedback: report.comparative_feedback,
          overall_feedback: report.overall_feedback,
          red_flags: extendedReport.red_flags || [],
          interview_questions: extendedReport.interview_questions || [],
          recommendation: extendedReport.recommendation || 'Please complete the assessment for detailed recommendations.',
          reasoning: extendedReport.reasoning || '',
          suitability_summary: extendedReport.suitability_summary || ''
        };
        
        setAiAnalysis(reconstructedAnalysis);
        console.log('Loaded existing AI analysis report');
      }
      
      console.log('Assessment status:', {
        needsCompletion,
        canPerformAnalysis,
        hasExistingReport: !!reportData?.length
      });
      
    } catch (error) {
      console.error('Error loading assessment data:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load assessment information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, resumeId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAIAnalysis = async () => {
    if (!canAnalyze) {
      toast({
        title: 'Complete All Stages First',
        description: `Please complete: ${assessmentStatus.join(', ')} before running AI analysis.`,
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setAnalyzing(true);
    try {
      console.log('Starting comprehensive AI analysis...');
      
      // Load all assessment data for comprehensive analysis
      const { data: assessmentData } = await optimizedLoadAssessment(resumeId, user.id);
      
      // Trigger comprehensive AI analysis with all three stages
      const analysisResult = await triggerComprehensiveAIAnalysis(
        resumeId,
        resumeText,
        assessmentData,
        department
      );

      setAiAnalysis(analysisResult);
      
      const userTotal = assessmentData.scorecard?.total_score || 0;
      const aiTotal = analysisResult.ai_total_score || 0;
      
      console.log('AI Analysis Results:', {
        userTotal,
        aiTotal,
        analysisResult: Object.keys(analysisResult),
        hasUserScores: !!analysisResult.user_total_score,
        hasAiScores: !!analysisResult.ai_total_score,
        hasComparativeFeedback: !!analysisResult.comparative_feedback
      });
      
      toast({
        title: 'AI Analysis Complete',
        description: `Your Score: ${userTotal.toFixed(1)}/100 | AI Score: ${aiTotal.toFixed(1)}/100`,
      });
      
    } catch (error: any) {
      console.error('Comprehensive AI analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !aiAnalysis || !userScores) return;
    
    setSaving(true);
    try {
      // Prepare the basic report data that we know exists in the table
      const basicReportData = {
        resume_id: resumeId,
        user_id: user.id,
        user_total_score: aiAnalysis.user_total_score,
        ai_total_score: aiAnalysis.ai_total_score,
        user_scores: {
          experience: userScores.experience_score,
          skills: userScores.skills_score,
          progression: userScores.progression_score,
          achievements: userScores.achievements_score,
          communication: userScores.communication_score,
          cultural_fit: userScores.cultural_fit_score
        },
        ai_scores: aiAnalysis.ai_scores,
        comparative_feedback: aiAnalysis.comparative_feedback,
        overall_feedback: `${aiAnalysis.overall_feedback}\n\nUser Notes: ${userNotes}`,
      };

      // Try to add the new fields, but handle gracefully if they don't exist
      const extendedReportData = {
        ...basicReportData,
        red_flags: aiAnalysis.red_flags || [],
        interview_questions: aiAnalysis.interview_questions || [],
        recommendation: aiAnalysis.recommendation || '',
        reasoning: aiAnalysis.reasoning || '',
        suitability_summary: aiAnalysis.suitability_summary || ''
      };

      // First try with extended data
      let { error: reportError } = await supabase.from('assessment_reports').insert(extendedReportData);
      
      // If that fails (likely due to missing columns), fall back to basic data
      if (reportError && (reportError.code === 'PGRST204' || (reportError.message?.includes('column') && reportError.message?.includes('does not exist')))) {
        console.log('New fields not available, using basic report structure');
        const { error: fallbackError } = await supabase.from('assessment_reports').insert(basicReportData);
        reportError = fallbackError;
      }

      if (reportError) throw reportError;

      // Save red flags if any
      if (aiAnalysis.red_flags && aiAnalysis.red_flags.length > 0) {
        const flagsToInsert = aiAnalysis.red_flags.map((flag: any) => ({
          resume_id: resumeId,
          user_id: user.id,
          flag_type: flag.type,
          description: flag.description,
        }));

        const { error: flagError } = await supabase
          .from('red_flags')
          .insert(flagsToInsert);

        if (flagError) throw flagError;
      }

      // Save interview questions if any
      if (aiAnalysis.interview_questions && aiAnalysis.interview_questions.length > 0) {
        const callsToInsert = aiAnalysis.interview_questions.map((q: any) => ({
          resume_id: resumeId,
          user_id: user.id,
          question: q.question,
          answer: '',
          score: null,
          feedback: `Type: ${q.type}`,
        }));

        const { error: callError } = await supabase
          .from('call_simulations')
          .insert(callsToInsert);

        if (callError) throw callError;
      }

      // Update resume status
      await supabase
        .from('resumes')
        .update({ status: 'completed' })
        .eq('id', resumeId);

      // Calculate and award points
      const accuracyBonus = Math.max(0, 100 - Math.abs(aiAnalysis.user_total_score - aiAnalysis.ai_total_score));
      const redFlagCount = aiAnalysis.red_flags?.length || 0;
      const points = Math.round(aiAnalysis.ai_total_score) + (redFlagCount * 5) + Math.round(accuracyBonus / 2);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points, resumes_screened, red_flags_found, calls_completed, assessment_completed')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ 
            total_points: (profile.total_points || 0) + points,
            resumes_screened: (profile.resumes_screened || 0) + 1,
            red_flags_found: (profile.red_flags_found || 0) + redFlagCount,
            calls_completed: (profile.calls_completed || 0) + (aiAnalysis.interview_questions?.length || 0),
            assessment_completed: true  // Mark first assessment as completed
          })
          .eq('id', user.id);
      }

      // Also mark the assessment_progress as completed
      await supabase
        .from('assessment_progress')
        .update({ 
          completed_at: new Date().toISOString(),
          ai_score: aiAnalysis.ai_total_score,
          user_score: aiAnalysis.user_total_score
        })
        .eq('user_id', user.id)
        .eq('resume_id', resumeId);

      toast({
        title: 'Analysis Saved!',
        description: `You earned ${points} points!`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error saving',
        description: error.message || 'Failed to save analysis.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Button text and state logic
  const getButtonContent = () => {
    if (analyzing) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Analyzing All Stages...
        </>
      );
    }
    
    if (!canAnalyze) {
      return (
        <>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Complete All Stages First
        </>
      );
    }
    
    return (
      <>
        <Sparkles className="w-4 h-4 mr-2" />
        Compare with AI Analysis
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI-Powered Resume Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive screening for {candidateName} - {department}
              </CardDescription>
              {assessmentStatus.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground mb-1">
                    Complete these stages for AI analysis:
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {assessmentStatus.map((stage, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {!aiAnalysis && !loading && (
              <Button 
                onClick={handleAIAnalysis} 
                disabled={analyzing || !canAnalyze}
                variant={canAnalyze ? "default" : "outline"}
              >
                {getButtonContent()}
              </Button>
            )}
            {existingReport && (
              <Badge variant="secondary" className="text-sm">
                Completed Assessment
              </Badge>
            )}
          </div>
        </CardHeader>
        
        {loading && (
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading assessment data...</span>
            </div>
          </CardContent>
        )}
        
        {aiAnalysis && (
          <CardContent>
            <Tabs defaultValue="scores" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scores">
                  <Trophy className="w-4 h-4 mr-2" />
                  Scores
                </TabsTrigger>
                <TabsTrigger value="flags">
                  <Flag className="w-4 h-4 mr-2" />
                  Red Flags ({aiAnalysis.red_flags?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="interview">
                  <Phone className="w-4 h-4 mr-2" />
                  Questions ({aiAnalysis.interview_questions?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="summary">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scores" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <Card className="bg-secondary/20 border-secondary">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">Your Score</div>
                        <div className="text-5xl font-bold text-secondary mb-2">
                          {aiAnalysis.user_total_score !== undefined ? Math.round(aiAnalysis.user_total_score) : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">Out of 100</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/20 border-primary">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">AI Score</div>
                        <div className="text-5xl font-bold text-primary mb-2">
                          {aiAnalysis.ai_total_score !== undefined ? Math.round(aiAnalysis.ai_total_score) : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">Out of 100</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Comparative Analysis</CardTitle>
                    <CardDescription>See how your assessment compares to AI evaluation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {aiAnalysis.comparative_feedback?.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold capitalize">
                            {item.category.replace('_', ' ')}
                          </Label>
                          <Badge variant={
                            item.performance === 'excellent' ? 'default' : 
                            item.performance === 'good' ? 'secondary' : 
                            'destructive'
                          }>
                            {item.performance}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Your Score</div>
                            <Progress value={item.user_score} className="h-2" />
                            <div className="text-sm font-medium">{item.user_score}/100</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">AI Score</div>
                            <Progress value={item.ai_score} className="h-2" />
                            <div className="text-sm font-medium">{item.ai_score}/100</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {item.feedback}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flags" className="space-y-4 mt-6">
                {!aiAnalysis.red_flags || aiAnalysis.red_flags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No red flags detected
                  </div>
                ) : (
                  aiAnalysis.red_flags.map((flag: any, idx: number) => (
                    <Card key={idx} className="border-destructive bg-destructive/5">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Flag className="w-5 h-5 text-destructive mt-1" />
                          <div>
                            <div className="font-semibold text-destructive mb-1">
                              {flag.type}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {flag.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="interview" className="space-y-4 mt-6">
                {aiAnalysis.interview_questions?.map((q: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Badge variant={q.type === 'behavioral' ? 'default' : 'secondary'}>
                          {q.type === 'behavioral' ? 'Behavioral' : 'Cultural Fit'}
                        </Badge>
                        <p className="flex-1 text-sm">{q.question}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="summary" className="space-y-4 mt-6">
                <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 border-primary">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-primary" />
                          Overall Performance Feedback
                        </Label>
                        <div className="bg-background/80 backdrop-blur p-4 rounded-lg">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {aiAnalysis.overall_feedback}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-4 bg-background/60 backdrop-blur rounded-lg">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Accuracy Rate</div>
                          <div className="text-2xl font-bold text-primary">
                            {Math.max(0, 100 - Math.abs(aiAnalysis.user_total_score - aiAnalysis.ai_total_score)).toFixed(0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Score Difference</div>
                          <div className="text-2xl font-bold text-secondary">
                            ±{Math.abs(aiAnalysis.user_total_score - aiAnalysis.ai_total_score).toFixed(0)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-lg font-semibold mb-2">Hiring Recommendation</Label>
                        <p className="text-sm mt-2">{aiAnalysis.recommendation}</p>
                      </div>
                      
                      <div>
                        <Label className="text-lg font-semibold mb-2">AI Reasoning</Label>
                        <p className="text-sm mt-2 text-muted-foreground">
                          {aiAnalysis.reasoning}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Your Additional Notes</Label>
                  <Textarea
                    placeholder="Add your own observations and notes..."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    rows={5}
                  />
                </div>

                {!existingReport && (
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    size="lg"
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Complete Analysis'}
                  </Button>
                )}
                {existingReport && (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    This assessment was completed on {new Date(existingReport.created_at).toLocaleDateString()}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UnifiedResumeAnalysis;
