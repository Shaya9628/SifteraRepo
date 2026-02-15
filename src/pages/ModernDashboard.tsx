import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserBadges } from '@/components/UserBadges';
import { Leaderboard } from '@/components/Leaderboard';
import { UserResumeUpload } from '@/components/UserResumeUpload';
import { AssessmentStepper } from '@/components/AssessmentStepper';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Users, 
  BookOpen, 
  Play, 
  RefreshCw, 
  Loader2,
  Upload,
  FileText,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HR_THEORIES } from '@/lib/constants';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { evaluateAndAwardBadges, getBadgeRecommendations } from '@/lib/badgeEvaluation';
import { userHasBadges } from '@/lib/badgeBackfill';

const ModernDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedFirstAssessment, setHasCompletedFirstAssessment] = useState(false);
  const [showNewAssessmentDialog, setShowNewAssessmentDialog] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('start');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [assessmentProgress, setAssessmentProgress] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfileAndCheckCompletion();
    loadAssessmentProgress();
  }, [user, navigate]);

  const loadAssessmentProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('assessment_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setAssessmentProgress(data);
      }
    } catch (error) {
      console.log('No assessment progress found');
    }
  };

  const getCurrentStep = () => {
    if (!assessmentProgress) return 'scorecard';
    
    if (!assessmentProgress.scorecard_completed) return 'scorecard';
    if (!assessmentProgress.red_flags_completed) return 'red_flags';
    if (!assessmentProgress.behavioral_completed) return 'screening_calls';
    return 'completed';
  };

  const getCompletedSteps = () => {
    if (!assessmentProgress) return [];
    
    const completed = [];
    if (assessmentProgress.scorecard_completed) completed.push('scorecard');
    if (assessmentProgress.red_flags_completed) completed.push('red_flags');
    if (assessmentProgress.behavioral_completed) completed.push('screening_calls');
    return completed;
  };

  const loadProfileAndCheckCompletion = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setLoading(false);
        return;
      }

      if (!profileData.has_completed_onboarding) {
        navigate('/onboarding');
        return;
      }

      if (!profileData.selected_domain) {
        navigate('/profile-selection');
        return;
      }

      setProfile(profileData);

      let isCompleted = profileData.assessment_completed === true;

      if (!isCompleted) {
        const { data: reports, error: reportsError } = await supabase
          .from('assessment_reports')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!reportsError && reports && reports.length > 0) {
          isCompleted = true;
        }
      }

      if (!isCompleted) {
        const { data: progressData, error: progressError } = await supabase
          .from('assessment_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('scorecard_completed', true)
          .eq('red_flags_completed', true)
          .eq('behavioral_completed', true)
          .limit(1);

        if (!progressError && progressData && progressData.length > 0) {
          isCompleted = true;
        }
      }

      if (isCompleted && !profileData.assessment_completed) {
        await supabase
          .from('profiles')
          .update({ assessment_completed: true })
          .eq('id', user.id);
      }

      setHasCompletedFirstAssessment(isCompleted);

      const { data: resumes } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(1);

      if (resumes && resumes.length > 0) {
        setCurrentResumeId(resumes[0].id);
      }

      // Evaluate badges and get recommendations
      try {
        // Check if user has any badges, if not and they have points, this might be an existing user
        const hasBadges = await userHasBadges(user.id);
        const hasPoints = profileData.total_points > 0;

        if (!hasBadges && hasPoints) {
          // This is an existing user without badges - run backfill evaluation
          await evaluateAndAwardBadges(user.id);
          
          // Reload profile to get updated points
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (updatedProfile) {
            setProfile(updatedProfile);
          }
        }

        const recs = await getBadgeRecommendations(user.id);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error with badge evaluation:', error);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  // ... rest of the original Dashboard logic for handleOtherResume, startAssessment, etc.
  // I'll keep the existing logic but focus on the UI modernization

  const handleOtherResume = async () => {
    if (!user || !profile) return;

    try {
      const { data: poolResumes, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('is_pool_resume', true)
        .eq('domain', profile.selected_domain)
        .order('id');

      if (error || !poolResumes || poolResumes.length === 0) {
        toast({
          title: 'No pool resumes available',
          description: 'Please contact admin to add resumes to the pool.',
          variant: 'destructive',
        });
        return;
      }

      const currentIndex = profile.last_pool_resume_index || 0;
      const nextIndex = (currentIndex + 1) % poolResumes.length;
      const nextResume = poolResumes[nextIndex];

      await supabase
        .from('profiles')
        .update({ last_pool_resume_index: nextIndex })
        .eq('id', user.id);

      const { data: existingAssignment } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', nextResume.id)
        .eq('user_id', user.id)
        .single();

      if (!existingAssignment) {
        await supabase
          .from('resumes')
          .insert({
            user_id: user.id,
            candidate_name: nextResume.candidate_name,
            file_path: nextResume.file_path,
            department: nextResume.department,
            domain: nextResume.domain,
            status: 'pending',
          });
      }

      toast({
        title: 'New resume assigned',
        description: `You have been assigned ${nextResume.candidate_name}'s resume.`,
      });

      navigate(`/screen/${nextResume.id}`);
    } catch (error) {
      console.error('Error getting other resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to get another resume.',
        variant: 'destructive',
      });
    } finally {
      setShowNewAssessmentDialog(false);
    }
  };

  const startAssessment = async () => {
    if (!user || !profile) return;

    try {
      const { data: resumes, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(1);

      if (error || !resumes || resumes.length === 0) {
        toast({
          title: 'No resumes available',
          description: 'Please upload a resume first to start assessment.',
          variant: 'destructive',
        });
        setActiveTab('upload');
        return;
      }

      navigate(`/screen/${resumes[0].id}`);
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to start assessment.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout profile={profile || { full_name: '', total_points: 0 }}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout profile={profile || { full_name: '', total_points: 0 }}>
      <div className="space-y-6">
        {/* EPIC WELCOME HEADER */}
        <div className="glass-strong border-2 border-purple-400/40 hover:border-purple-400/60 rounded-2xl p-8 transition-all duration-300 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-cyan-500/10 animate-gradient"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Welcome back, {profile?.full_name || 'HR Legend'}! 🔥
              </h1>
              <p className="text-gray-300 text-lg animate-pulse">
                Ready to dominate the HR assessment world? ⚡
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div className="glass-strong border border-purple-400/60 rounded-xl p-4 hover:glow-purple transition-all duration-300">
                <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {profile?.total_points || 0}
                </p>
                <p className="text-xs text-purple-300 font-semibold">🏆 POINTS</p>
              </div>
              <div className="glass-strong border border-cyan-400/60 rounded-xl p-4 hover:glow-cyan transition-all duration-300">
                <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {profile?.resumes_screened || 0}
                </p>
                <p className="text-xs text-cyan-300 font-semibold">📝 CRUSHED</p>
              </div>
            </div>
          </div>
        </div>

        {/* ASSESSMENT PROGRESS TRACKER */}
        {(hasCompletedFirstAssessment || assessmentProgress) && (
          <Card className="glass-strong border-2 border-green-400/40 hover:border-green-400/60 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 via-emerald-600/5 to-teal-500/5 animate-gradient"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                <Target className="w-6 h-6 text-green-400 animate-pulse" />
                ✨ Your Assessment Journey
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Track your epic progress through the 3-stage battle system! 🚀
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <AssessmentStepper 
                currentStep={getCurrentStep()}
                completedSteps={getCompletedSteps()}
              />
            </CardContent>
          </Card>
        )}

        {/* EPIC NAVIGATION TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4 glass-strong border-2 border-purple-400/30 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 p-2 rounded-2xl mx-auto">
            <TabsTrigger 
              value="start" 
              className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-green-400/60 data-[state=active]:glow-green data-[state=active]:text-green-300 hover:glow-green transition-all duration-300 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span className="font-semibold">🚀 Start</span>
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-blue-400/60 data-[state=active]:glow-blue data-[state=active]:text-blue-300 hover:glow-blue transition-all duration-300 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span className="font-semibold">📁 Upload</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-purple-400/60 data-[state=active]:glow-purple data-[state=active]:text-purple-300 hover:glow-purple transition-all duration-300 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">📈 Progress</span>
            </TabsTrigger>
            <TabsTrigger 
              value="community" 
              className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-yellow-400/60 data-[state=active]:glow-yellow data-[state=active]:text-yellow-300 hover:glow-yellow transition-all duration-300 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span className="font-semibold">🎆 Squad</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-6">
            <Card className="glass-strong border-2 border-green-400/40 hover:border-green-400/60 transition-all duration-500 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-emerald-600/10 to-teal-500/10 animate-gradient"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  <Play className="w-6 h-6 text-green-400 animate-pulse group-hover:animate-bounce" />
                  🚀 Launch Assessment Battle
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  Time to show your HR skills! Ready to dominate? ⚡
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                {hasCompletedFirstAssessment ? (
                  <div className="space-y-6">
                    <div className="glass-strong border border-purple-400/40 rounded-xl p-6">
                      <p className="text-gray-300 text-lg leading-relaxed">
                        🔥 <span className="font-bold text-purple-400">LEGEND STATUS UNLOCKED!</span> You've crushed your first assessment! Ready for the next level? 🎮
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={() => setShowNewAssessmentDialog(true)} 
                        size="lg" 
                        className="flex-1 glass-strong border-2 border-purple-400/60 hover:glow-purple hover:scale-105 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg py-4 transition-all duration-300"
                      >
                        <Play className="w-5 h-5 mr-2 animate-bounce" />
                        🎯 NEW BATTLE
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab('progress')} 
                        size="lg" 
                        className="flex-1 glass-strong border-2 border-yellow-400/60 hover:glow-yellow hover:scale-105 text-yellow-300 border-yellow-400/60 py-4 transition-all duration-300"
                      >
                        <Trophy className="w-5 h-5 mr-2" />
                        🏆 VIEW STATS
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="glass-strong border border-blue-400/40 rounded-xl p-6">
                      <p className="text-gray-300 text-lg leading-relaxed">
                        ✨ Welcome to the <span className="font-bold text-cyan-400">HR Battle Arena!</span> Time to level up your screening skills and become a legend! 🌟
                      </p>
                    </div>
                    <Button 
                      onClick={startAssessment} 
                      size="lg" 
                      className="w-full glass-strong border-2 border-cyan-400/60 hover:glow-cyan hover:scale-105 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xl py-6 transition-all duration-300 animate-pulse"
                    >
                      <Play className="w-6 h-6 mr-3 animate-bounce" />
                      🚀 START YOUR LEGEND JOURNEY
                    </Button>
                  </div>
                )}

                {/* Quick Tips */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Assessment Tips
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Take your time to thoroughly review each resume</li>
                    <li>• Look for red flags and qualification mismatches</li>
                    <li>• Use the scoring system to maintain consistency</li>
                    <li>• Practice regularly to improve your screening skills</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <UserResumeUpload onUploadComplete={loadProfileAndCheckCompletion} />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Your Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserBadges userId={user?.id || ''} totalPoints={profile?.total_points || 0} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{profile?.total_points || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Points</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{profile?.resumes_screened || 0}</p>
                      <p className="text-xs text-muted-foreground">Resumes Screened</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{profile?.red_flags_found || 0}</p>
                      <p className="text-xs text-muted-foreground">Red Flags Found</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{profile?.calls_completed || 0}</p>
                      <p className="text-xs text-muted-foreground">Calls Completed</p>
                    </div>
                  </div>

                  {recommendations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Leaderboard
                </CardTitle>
                <CardDescription>
                  See how you rank among other HR professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Leaderboard currentUserId={user?.id || ''} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Assessment Dialog */}
        <Dialog open={showNewAssessmentDialog} onOpenChange={setShowNewAssessmentDialog}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Start New Assessment</DialogTitle>
              <DialogDescription>
                Choose how you want to proceed with your next assessment
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button 
                onClick={startAssessment} 
                size="lg" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play className="w-5 h-5 mr-2" />
                Reassess Same Resume
              </Button>
              <Button 
                onClick={handleOtherResume} 
                size="lg" 
                className="w-full" 
                variant="outline"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Other Resume
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ModernDashboard;