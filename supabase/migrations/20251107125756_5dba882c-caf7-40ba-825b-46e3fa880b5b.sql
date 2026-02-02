
-- Add storage policy for admins to upload resumes for any user
CREATE POLICY "Admins can upload resumes for any user"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' 
  AND has_role(auth.uid(), 'admin'::app_role)
);
