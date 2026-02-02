import { supabase } from '@/integrations/supabase/client';

interface BadgeEvaluation {
  badgeId: string;
  earned: boolean;
  progress: number;
}

export const evaluateAndAwardBadges = async (userId: string): Promise<BadgeEvaluation[]> => {
  try {
    // Get user's current stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, resumes_screened, red_flags_found, calls_completed')
      .eq('id', userId)
      .single();

    if (!profile) {
      console.error('No profile found for user:', userId);
      return [];
    }

    // Get all available badges
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (!allBadges) {
      console.error('No badges found');
      return [];
    }

    // Get already earned badges
    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);
    const evaluations: BadgeEvaluation[] = [];
    const newlyEarnedBadges = [];

    for (const badge of allBadges) {
      const alreadyEarned = earnedBadgeIds.has(badge.id);
      let currentValue = 0;
      let progress = 0;

      // Determine current value based on requirement type
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

      progress = Math.min(100, (currentValue / badge.requirement_value) * 100);
      const shouldEarn = currentValue >= badge.requirement_value && !alreadyEarned;

      evaluations.push({
        badgeId: badge.id,
        earned: alreadyEarned || shouldEarn,
        progress
      });

      if (shouldEarn) {
        newlyEarnedBadges.push(badge);
      }
    }

    // Award newly earned badges
    if (newlyEarnedBadges.length > 0) {
      const insertData = newlyEarnedBadges.map(badge => ({
        user_id: userId,
        badge_id: badge.id
      }));

      const { error } = await supabase
        .from('user_badges')
        .insert(insertData);

      if (error) {
        console.error('Error inserting badges:', error);
      } else {
        console.log(`Awarded ${newlyEarnedBadges.length} new badges to user ${userId}`);
        
        // Award badge points to user
        const totalBadgePoints = newlyEarnedBadges.reduce((sum, badge) => sum + (badge.points || 0), 0);
        
        if (totalBadgePoints > 0) {
          await supabase
            .from('profiles')
            .update({
              total_points: (profile.total_points || 0) + totalBadgePoints
            })
            .eq('id', userId);
        }
      }
    }

    return evaluations;
  } catch (error) {
    console.error('Error evaluating badges:', error);
    return [];
  }
};

export const getBadgeRecommendations = async (userId: string): Promise<string[]> => {
  try {
    // Get user's current stats and earned badges
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, resumes_screened, red_flags_found, calls_completed')
      .eq('id', userId)
      .single();

    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (!profile || !allBadges) {
      return ['Complete more assessments to unlock recommendations!'];
    }

    const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);
    const recommendations = [];

    // Find next achievable badges
    const unearnedBadges = allBadges.filter(badge => !earnedBadgeIds.has(badge.id));
    
    for (const badge of unearnedBadges.slice(0, 3)) {
      let currentValue = 0;
      let actionText = '';

      switch (badge.requirement_type) {
        case 'resumes_screened':
          currentValue = profile.resumes_screened || 0;
          const remaining = badge.requirement_value - currentValue;
          actionText = remaining > 0 
            ? `Screen ${remaining} more resume${remaining > 1 ? 's' : ''} to earn "${badge.name}"`
            : `You've earned "${badge.name}"! Check back shortly.`;
          break;
        case 'red_flags_found':
          currentValue = profile.red_flags_found || 0;
          const flagsNeeded = badge.requirement_value - currentValue;
          actionText = flagsNeeded > 0
            ? `Find ${flagsNeeded} more red flag${flagsNeeded > 1 ? 's' : ''} to earn "${badge.name}"`
            : `You've earned "${badge.name}"! Check back shortly.`;
          break;
        case 'calls_completed':
          currentValue = profile.calls_completed || 0;
          const callsNeeded = badge.requirement_value - currentValue;
          actionText = callsNeeded > 0
            ? `Complete ${callsNeeded} more screening call${callsNeeded > 1 ? 's' : ''} to earn "${badge.name}"`
            : `You've earned "${badge.name}"! Check back shortly.`;
          break;
      }

      if (actionText) {
        recommendations.push(actionText);
      }
    }

    // Add general recommendations if no specific ones
    if (recommendations.length === 0) {
      if (earnedBadges?.length === 0) {
        recommendations.push('Start screening resumes to earn your first badge!');
        recommendations.push('Look for red flags in resumes to improve your detection skills.');
      } else {
        recommendations.push('Great progress! Continue screening to unlock more achievements.');
        recommendations.push('Try the challenge mode for extra points and recognition.');
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return ['Keep practicing to improve your screening skills!'];
  }
};