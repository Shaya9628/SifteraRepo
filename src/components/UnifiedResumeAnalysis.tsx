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
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          🔥 Battle in Progress...
        </>
      );
    }
    
    if (!canAnalyze) {
      return (
        <>
          <AlertTriangle className="w-5 h-5 mr-2 animate-pulse" />
          Complete Stages to Battle!
        </>
      );
    }
    
    return (
      <>
        <Sparkles className="w-5 h-5 mr-2 animate-bounce" />
        ⚡ START AI BATTLE
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="glass-strong border-2 border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-blue-600/5 to-cyan-500/5 animate-gradient"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl glow-purple bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                <Sparkles className="w-6 h-6 text-purple-400 animate-pulse drop-shadow-lg" />
                AI Battle Arena 🔥
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg mt-2">
                Epic showdown: You vs AI for {candidateName} - {department}
              </CardDescription>
              {assessmentStatus.length > 0 && (
                <div className="mt-4 p-4 glass-strong border border-orange-400/40 rounded-xl">
                  <div className="text-sm text-orange-300 mb-2 font-semibold animate-pulse">
                    🎯 Complete these stages to unleash AI power:
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {assessmentStatus.map((stage, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs border-yellow-400/60 text-yellow-300 hover:glow-yellow animate-bounce"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        ⚡ {stage}
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
                className={canAnalyze 
                  ? "glass-strong border-2 border-purple-400/60 hover:glow-purple hover:scale-110 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-lg px-8 py-3 transition-all duration-300 animate-pulse" 
                  : "glass-strong border-2 border-gray-500/40 text-gray-400 cursor-not-allowed"
                }
              >
                {getButtonContent()}
              </Button>
            )}
            {existingReport && (
              <Badge 
                variant="secondary" 
                className="text-sm glass-strong border-2 border-green-400/60 text-green-400 glow-green px-4 py-2 animate-pulse"
              >
                ✅ Battle Complete!
              </Badge>
            )}
          </div>
        </CardHeader>
        
        {loading && (
          <CardContent className="relative z-10">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto drop-shadow-lg" />
                <div className="space-y-2">
                  <div className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Loading battle data...
                  </div>
                  <div className="text-sm text-gray-400 animate-pulse">
                    Preparing for epic AI showdown ⚡
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
        
        {aiAnalysis && (
          <CardContent className="relative z-10">
            <Tabs defaultValue="scores" className="w-full">
              <TabsList className="grid w-full grid-cols-4 glass-strong border-2 border-purple-400/30 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 p-2 rounded-2xl">
                <TabsTrigger 
                  value="scores"
                  className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-purple-400/60 data-[state=active]:glow-purple data-[state=active]:text-purple-300 hover:glow-purple transition-all duration-300"
                >
                  <Trophy className="w-4 h-4 mr-2 animate-bounce" />
                  Battle Scores
                </TabsTrigger>
                <TabsTrigger 
                  value="flags"
                  className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-red-400/60 data-[state=active]:glow-red data-[state=active]:text-red-300 hover:glow-red transition-all duration-300"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  🚩 Flags ({aiAnalysis.red_flags?.length || 0})
                </TabsTrigger>
                <TabsTrigger 
                  value="interview"
                  className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-blue-400/60 data-[state=active]:glow-blue data-[state=active]:text-blue-300 hover:glow-blue transition-all duration-300"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  💬 Questions ({aiAnalysis.interview_questions?.length || 0})
                </TabsTrigger>
                <TabsTrigger 
                  value="summary"
                  className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-green-400/60 data-[state=active]:glow-green data-[state=active]:text-green-300 hover:glow-green transition-all duration-300"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  📊 Final Verdict
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scores" className="space-y-6 mt-6">
                {/* Epic Battle Arena Header */}
                <div className="text-center py-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-500/10 rounded-3xl animate-gradient"></div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent relative z-10 mb-2">
                    ⚡ ULTIMATE SCORING BATTLE ⚡
                  </h2>
                  <p className="text-gray-400 relative z-10">Who scored it better? Let's find out! 🔥</p>
                </div>

                {/* Battle Arena Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Your Score - Left Corner */}
                  <Card className="glass-strong border-2 border-blue-400/60 hover:glow-blue hover:scale-105 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 animate-gradient"></div>
                    <CardContent className="pt-8 relative z-10">
                      <div className="text-center">
                        <div className="text-lg text-blue-300 mb-3 font-bold">👤 YOUR BATTLE SCORE</div>
                        <div className="relative mb-6">
                          <div className="text-7xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2 drop-shadow-lg animate-pulse">
                            {aiAnalysis.user_total_score !== undefined ? Math.round(aiAnalysis.user_total_score) : '?'}
                          </div>
                          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">💪</div>
                        </div>
                        <div className="text-sm text-blue-200/80 font-medium">Out of 100 points</div>
                        <div className="mt-3 text-xs text-blue-300/60 animate-pulse">Human intuition power!</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Score - Right Corner */}
                  <Card className="glass-strong border-2 border-purple-400/60 hover:glow-purple hover:scale-105 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-500/20 animate-gradient"></div>
                    <CardContent className="pt-8 relative z-10">
                      <div className="text-center">
                        <div className="text-lg text-purple-300 mb-3 font-bold">🤖 AI BATTLE SCORE</div>
                        <div className="relative mb-6">
                          <div className="text-7xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 drop-shadow-lg animate-pulse">
                            {aiAnalysis.ai_total_score !== undefined ? Math.round(aiAnalysis.ai_total_score) : '?'}
                          </div>
                          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🧠</div>
                        </div>
                        <div className="text-sm text-purple-200/80 font-medium">Out of 100 points</div>
                        <div className="mt-3 text-xs text-purple-300/60 animate-pulse">Neural network magic!</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Winner Declaration */}
                {aiAnalysis.user_total_score !== undefined && aiAnalysis.ai_total_score !== undefined && (
                  <div className="text-center py-6">
                    <div className="glass-strong border-2 border-yellow-400/60 rounded-2xl p-6 glow-yellow">
                      <div className="text-2xl mb-3">
                        {Math.round(aiAnalysis.user_total_score) > Math.round(aiAnalysis.ai_total_score) ? '🏆 YOU WON!' : 
                         Math.round(aiAnalysis.user_total_score) < Math.round(aiAnalysis.ai_total_score) ? '🤖 AI WINS!' : 
                         '🤝 EPIC TIE!'}
                      </div>
                      <div className="text-sm text-yellow-300">
                        Score difference: {Math.abs(Math.round(aiAnalysis.user_total_score) - Math.round(aiAnalysis.ai_total_score))} points
                      </div>
                    </div>
                  </div>
                )}

                <Card className="glass-strong border-2 border-cyan-400/40 hover:border-cyan-400/60 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                      <div className="animate-bounce">⚔️</div>
                      Category-by-Category Battle
                    </CardTitle>
                    <CardDescription className="text-gray-300">Round-by-round breakdown of the scoring battle</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {aiAnalysis.comparative_feedback?.map((item: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="glass-strong border border-purple-400/30 hover:border-purple-400/60 rounded-xl p-6 transition-all duration-300 hover:glow-purple"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-lg font-bold capitalize bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            {item.category.replace('_', ' ')} Battle
                          </Label>
                          <Badge 
                            className={
                              item.performance === 'excellent' 
                                ? 'glass-strong border border-green-400/60 text-green-400 glow-green animate-pulse' 
                                : item.performance === 'good' 
                                ? 'glass-strong border border-yellow-400/60 text-yellow-400 glow-yellow' 
                                : 'glass-strong border border-red-400/60 text-red-400 glow-red'
                            }
                          >
                            {item.performance === 'excellent' ? '🔥 EXCELLENT' : 
                             item.performance === 'good' ? '👍 GOOD' : 
                             '⚠️ NEEDS WORK'}
                          </Badge>
                        </div>
                        
                        {/* Battle Bars */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-blue-300 font-semibold">👤 Your Power</div>
                              <div className="text-lg font-bold text-blue-400">{item.user_score}/100</div>
                            </div>
                            <div className="relative">
                              <Progress 
                                value={item.user_score} 
                                className="h-4 bg-gray-800/50 rounded-full overflow-hidden"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-purple-300 font-semibold">🤖 AI Power</div>
                              <div className="text-lg font-bold text-purple-400">{item.ai_score}/100</div>
                            </div>
                            <div className="relative">
                              <Progress 
                                value={item.ai_score} 
                                className="h-4 bg-gray-800/50 rounded-full overflow-hidden"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Battle Commentary */}
                        <div className="glass-strong border border-gray-600/30 rounded-lg p-4 bg-gradient-to-r from-gray-900/40 to-gray-800/40">
                          <div className="text-sm text-gray-300 leading-relaxed">
                            <span className="text-cyan-400 font-semibold">💬 Battle Analysis:</span> {item.feedback}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flags" className="space-y-4 mt-6">
                {!aiAnalysis.red_flags || aiAnalysis.red_flags.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="glass-strong border-2 border-green-400/60 rounded-2xl p-8 glow-green">
                      <div className="text-6xl mb-4">🎉</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                        All Clear!
                      </div>
                      <div className="text-green-300">NO red flags detected - This candidate is looking awesome! ✨</div>
                    </div>
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
