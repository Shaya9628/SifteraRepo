import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  total_points: number;
  avatar_url: string | null;
}

interface LeaderboardProps {
  currentUserId: string;
}

export const Leaderboard = ({ currentUserId }: LeaderboardProps) => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
    
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => loadLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLeaderboard = async () => {
    // Use security definer function to get leaderboard data
    const { data: leaders, error } = await supabase
      .rpc('get_leaderboard', { limit_count: 10 });

    if (error) {
      console.error('Error loading leaderboard:', error);
      setLoading(false);
      return;
    }

    setLeaders(leaders || []);

    // Find current user's rank
    if (currentUserId) {
      const { data: allLeaders } = await supabase
        .rpc('get_leaderboard', { limit_count: 1000 });

      if (allLeaders) {
        const userRank = allLeaders.findIndex(p => p.id === currentUserId) + 1;
        setCurrentUserRank(userRank > 0 ? userRank : null);
      }
    }

    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 trophy-gold achievement-glow" />;
      case 1:
        return <Medal className="w-6 h-6 gold-icon" />;
      case 2:
        return <Award className="w-6 h-6 gold-icon" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Live Leaderboard
        </CardTitle>
        <CardDescription>
          Top performers this season
          {currentUserRank && ` • You're ranked #${currentUserRank}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaders.map((leader, index) => (
            <div
              key={leader.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                leader.id === currentUserId
                  ? 'bg-primary/10 border-primary shadow-lg'
                  : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {leader.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {leader.full_name || 'Anonymous'}
                    {leader.id === currentUserId && (
                      <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                    )}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {leader.total_points} pts
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
