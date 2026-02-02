import { supabase } from '@/integrations/supabase/client';
import { evaluateAndAwardBadges } from './badgeEvaluation';

// One-time function to evaluate badges for all existing users
// This can be called from admin dashboard or run once to fix existing users
export const backfillUserBadges = async (): Promise<void> => {
  try {
    // Get all users who have points but might be missing badges
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, total_points')
      .gt('total_points', 0);

    if (error) {
      console.error('Error fetching users for badge backfill:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users with points found for badge backfill');
      return;
    }

    console.log(`Starting badge backfill for ${users.length} users`);

    // Process users in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (user) => {
          try {
            await evaluateAndAwardBadges(user.id);
            console.log(`Processed badges for user ${user.id} (${user.total_points} points)`);
          } catch (error) {
            console.error(`Error processing badges for user ${user.id}:`, error);
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('Badge backfill completed');
  } catch (error) {
    console.error('Error in badge backfill process:', error);
  }
};

// Function to check if a user has any badges
export const userHasBadges = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking user badges:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking user badges:', error);
    return false;
  }
};