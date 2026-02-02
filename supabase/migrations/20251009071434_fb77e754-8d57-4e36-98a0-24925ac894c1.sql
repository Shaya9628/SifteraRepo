-- Allow admins to insert resumes for any user
CREATE POLICY "Admins can insert resumes for any user"
ON public.resumes
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));