import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Lock, RefreshCw } from 'lucide-react';
import { evaluateAndAwardBadges } from '@/lib/badgeEvaluation';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_value: number;
  points: number;
  earned: boolean;
  earned_at?: string;
}

interface UserBadgesProps {
  userId: string;
  totalPoints: number;
}

export const UserBadges = ({ userId, totalPoints }: UserBadgesProps) => {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      loadBadges();
    }
  }, [userId, totalPoints]);

  const loadBadges = async () => {
    try {
      // Evaluate and award any missing badges first
      await evaluateAndAwardBadges(userId);
      
      // Get user profile for progress calculation
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points, resumes_screened, red_flags_found, calls_completed')
        .eq('id', userId)
        .single();
      
      setUserProfile(profile);

      const { data: allBadges } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value', { ascending: true });

      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', userId);

      if (allBadges && profile) {
        const earnedIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
        const badgeData = allBadges.map(badge => {
          let currentValue = 0;
          
          // Calculate current progress based on requirement type
          switch (badge.requirement_type) {
            case 'resumes_screened':
              currentValue = profile.resumes_screened || 0;
              break;
            case 'red_flags_found':
              currentValue = profile.red_flags_found || 0;
              break;
            case 'calls_completed':
              currentValue = profile.calls_completed || 0;
              break;
            case 'total_points':
              currentValue = profile.total_points || 0;
              break;
            default:
              currentValue = 0;
          }
          
          return {
            ...badge,
            earned: earnedIds.has(badge.id),
            earned_at: userBadges?.find(ub => ub.badge_id === badge.id)?.earned_at,
            currentValue,
            progressPercent: Math.min(100, (currentValue / badge.requirement_value) * 100)
          };
        });
        setBadges(badgeData);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Badges</CardTitle>
              <CardDescription>
                Earn badges by completing challenges and reaching milestones
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                loadBadges();
              }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <Card
                key={badge.id}
                className={`relative overflow-hidden transition-all ${
                  badge.earned
                    ? 'border-gold-dark shadow-lg hover-scale gold-highlight'
                    : 'opacity-60 grayscale hover:opacity-80'
                }`}
              >
                <CardContent className="p-6 text-center space-y-3">
                  {!badge.earned && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-5xl">{badge.icon}</div>
                  <h3 className="font-bold">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                  
                  {badge.earned ? (
                    <div className="space-y-2">
                      <Badge className="w-full gold-badge">
                        Earned {badge.earned_at && new Date(badge.earned_at).toLocaleDateString()}
                      </Badge>
                      <div className="text-xs gold-icon font-semibold">
                        +{badge.points} points
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Badge variant="outline" className="w-full">
                        {badge.points} points reward
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {(badge as any).currentValue || 0} / {badge.requirement_value}
                      </div>
                      <Progress 
                        value={(badge as any).progressPercent || 0}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
