-- Allow authenticated users to read from resumes bucket
CREATE POLICY "Authenticated users can download resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- Update resumes table RLS to allow users to view all resumes (not just their own)
DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;

CREATE POLICY "Users can view all resumes"
ON public.resumes
FOR SELECT
TO authenticated
USING (true);