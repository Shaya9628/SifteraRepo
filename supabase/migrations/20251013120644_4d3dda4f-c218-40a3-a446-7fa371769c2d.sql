-- Create security definer function for admins to view all profiles
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  phone text,
  designation text,
  selected_domain text,
  total_points integer,
  resumes_screened integer,
  calls_completed integer,
  red_flags_found integer,
  created_at timestamp with time zone,
  avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify requester is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Return all profiles
  RETURN QUERY 
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.designation,
    p.selected_domain,
    p.total_points,
    p.resumes_screened,
    p.calls_completed,
    p.red_flags_found,
    p.created_at,
    p.avatar_url
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));