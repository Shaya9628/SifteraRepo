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
        {/* Header with welcome and stats */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {profile?.full_name || 'User'}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Continue your HR assessment journey
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{profile?.total_points || 0}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{profile?.resumes_screened || 0}</p>
                <p className="text-xs text-muted-foreground">Screened</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Progress Stepper */}
        {(hasCompletedFirstAssessment || assessmentProgress) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Assessment Progress
              </CardTitle>
              <CardDescription>
                Track your progress through the 3-stage assessment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssessmentStepper 
                currentStep={getCurrentStep()}
                completedSteps={getCompletedSteps()}
              />
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="start" className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Start</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Start Assessment
                </CardTitle>
                <CardDescription>
                  Begin or continue your HR assessment practice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasCompletedFirstAssessment ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Great job completing your first assessment! Ready for the next challenge?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={() => setShowNewAssessmentDialog(true)} size="lg" className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        New Assessment
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('progress')} size="lg" className="flex-1">
                        <Trophy className="w-4 h-4 mr-2" />
                        View Progress
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Start your first assessment to begin building your HR screening skills.
                    </p>
                    <Button onClick={startAssessment} size="lg" className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Start Your First Assessment
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