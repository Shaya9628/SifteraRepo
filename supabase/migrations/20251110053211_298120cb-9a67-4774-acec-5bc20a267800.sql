-- Update RLS policy for resumes so users only see resumes assigned to them
-- Drop the existing policy that allows users to view all resumes
DROP POLICY IF EXISTS "Users can view all resumes" ON public.resumes;

-- Create new policy: users can only view resumes assigned to them
CREATE POLICY "Users can view assigned resumes"
ON public.resumes
FOR SELECT
USING (auth.uid() = user_id);

-- Note: The existing "Admins can view all resumes" policy remains intact
-- Admins can still see all resumes to manage assignments