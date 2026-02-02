-- Ensure default badges exist (run this if badges table is empty)
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value, points) VALUES
  ('First Resume', 'Screen your first resume', '📄', 'resumes_screened', 1, 10),
  ('Resume Master', 'Screen 10 resumes', '🎯', 'resumes_screened', 10, 50),
  ('Resume Legend', 'Screen 50 resumes', '👑', 'resumes_screened', 50, 200),
  ('Red Flag Detective', 'Identify 5 red flags', '🚩', 'red_flags_found', 5, 30),
  ('Eagle Eye', 'Identify 20 red flags', '🦅', 'red_flags_found', 20, 100),
  ('Call Champion', 'Complete 5 screening calls', '📞', 'calls_completed', 5, 40),
  ('Interview Pro', 'Complete 25 screening calls', '🎤', 'calls_completed', 25, 150),
  ('Point Master', 'Earn 1000 points', '💯', 'total_points', 1000, 100),
  ('Points Legend', 'Earn 5000 points', '🌟', 'total_points', 5000, 250)
ON CONFLICT (name) DO NOTHING;

-- Create function to manually trigger badge evaluation for all users (admin use)
CREATE OR REPLACE FUNCTION public.evaluate_all_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This would be called from the application layer for all users
  -- Just marking that the function exists for future use
  RAISE NOTICE 'Badge evaluation should be triggered from application layer for all users';
END;
$$;