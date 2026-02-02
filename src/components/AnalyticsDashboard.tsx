import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Trophy, TrendingUp, Activity } from 'lucide-react';

interface Analytics {
  totalUsers: number;
  totalResumes: number;
  totalAssessments: number;
  completionRate: number;
  avgScore: number;
  topPerformers: Array<{
    name: string;
    points: number;
  }>;
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalResumes: 0,
    totalAssessments: 0,
    completionRate: 0,
    avgScore: 0,
    topPerformers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total resumes
      const { count: resumeCount } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true });

      // Get total assessments
      const { count: assessmentCount } = await supabase
        .from('assessment_progress')
        .select('*', { count: 'exact', head: true });

      // Get completed assessments
      const { count: completedCount } = await supabase
        .from('assessment_progress')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null);

      // Get average scores
      const { data: scores } = await supabase
        .from('assessment_progress')
        .select('user_score')
        .not('user_score', 'is', null);

      const avgScore = scores && scores.length > 0
        ? scores.reduce((sum, s) => sum + (Number(s.user_score) || 0), 0) / scores.length
        : 0;

      // Get top performers
      const { data: topUsers } = await supabase
        .from('profiles')
        .select('full_name, total_points')
        .order('total_points', { ascending: false })
        .limit(5);

      setAnalytics({
        totalUsers: userCount || 0,
        totalResumes: resumeCount || 0,
        totalAssessments: assessmentCount || 0,
        completionRate: assessmentCount ? ((completedCount || 0) / assessmentCount) * 100 : 0,
        avgScore: avgScore,
        topPerformers: topUsers?.map(u => ({
          name: u.full_name || 'Unknown',
          points: u.total_points || 0,
        })) || [],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered on platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalResumes}</div>
            <p className="text-xs text-muted-foreground">Uploaded for screening</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">Total attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Assessments completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Users with highest points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{performer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-bold">{performer.points}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
