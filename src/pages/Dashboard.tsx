import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserBadges } from '@/components/UserBadges';
import { Leaderboard } from '@/components/Leaderboard';
import { UserResumeUpload } from '@/components/UserResumeUpload';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Users, BookOpen, Play, RefreshCw, Loader2, Upload } from 'lucide-react';
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

const Dashboard = () => {
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

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfileAndCheckCompletion();
  }, [user, navigate]);

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
          console.log(`User ${user.id} has ${profileData.total_points} points but no badges, running evaluation`);
        }
        
        await evaluateAndAwardBadges(user.id);
        const recs = await getBadgeRecommendations(user.id);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading badges/recommendations:', error);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in loadProfileAndCheckCompletion:', err);
      setLoading(false);
    }
  };

  const handleReassessSameResume = async () => {
    setShowNewAssessmentDialog(false);
    if (currentResumeId) {
      navigate(`/screen/${currentResumeId}`);
    } else {
      await startAssessment();
    }
  };

  const handleOtherResume = async () => {
    setShowNewAssessmentDialog(false);
    if (!user || !profile) return;

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
  };

  const startAssessment = async () => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to start an assessment.',
        variant: 'destructive',
      });
      return;
    }

    if (!profile) {
      toast({
        title: 'Profile not loaded',
        description: 'Please wait while your profile loads.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: resumes, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Resume fetch error:', error);
        toast({
          title: 'Database Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (!resumes || resumes.length === 0) {
        toast({
          title: 'No resume available',
          description: 'Please upload a resume first or wait for admin to assign one.',
          variant: 'destructive',
        });
        // Automatically switch to upload tab if no resumes
        setActiveTab('upload');
        return;
      }

      const resume = resumes[0];
      setCurrentResumeId(resume.id);
      toast({
        title: 'Assessment started',
        description: 'Good luck with your assessment!',
      });
      navigate(`/screen/${resume.id}`);
    } catch (err: any) {
      console.error('Start assessment error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to start assessment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <DashboardLayout profile={profile} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {activeTab === 'start' && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Begin Your Assessment</CardTitle>
              <CardDescription>
                You're assessing candidates for{' '}
                <span className="text-primary font-semibold">
                  {profile?.selected_domain?.toUpperCase()}
                </span>{' '}
                positions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Click the button below to start evaluating your assigned resume.
                You'll complete three tasks: Scorecard, Red Flags Detection, and Behavioral Assessment.
              </p>
              
              {/* Show upload reminder if no resumes */}
              {(!currentResumeId) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Get Started</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    To begin your assessment, you'll need to upload a resume or wait for an admin to assign one.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('upload')} 
                    variant="outline" 
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Resume
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={startAssessment} 
                  size="lg" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Assessment
                </Button>
                  <Button
                    onClick={() => setShowNewAssessmentDialog(true)}
                    size="lg"
                    className="w-full"
                    variant="outline"
                    disabled={!hasCompletedFirstAssessment}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Start New Assessment
                  </Button>
                </div>
                {!hasCompletedFirstAssessment && (
                  <p className="text-xs text-muted-foreground text-center">
                    Complete your first assessment to unlock "Start New Assessment"
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6">
              <UserResumeUpload onUploadComplete={loadProfileAndCheckCompletion} />
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-6">
              <UserBadges userId={user.id} totalPoints={profile?.total_points || 0} />
              
              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>
                      Here's what you can do next to improve your skills
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg border border-border hover:border-primary/30 transition-all"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-sm text-muted-foreground flex-1">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard currentUserId={user.id} />
          )}

          {activeTab === 'learning' && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">HR Recruitment Theories</CardTitle>
                <CardDescription>Key concepts to master</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(HR_THEORIES).map(([key, theory]) => (
                  <div
                    key={key}
                    className="border border-border rounded-lg p-4 bg-secondary/50 hover:bg-secondary hover:border-primary/30 transition-all"
                  >
                    <h4 className="font-semibold text-foreground">{theory.title}</h4>
                    <p className="text-sm text-muted-foreground">{theory.tooltip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

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
              onClick={handleReassessSameResume} 
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
    </DashboardLayout>
  );
};

export default Dashboard;
