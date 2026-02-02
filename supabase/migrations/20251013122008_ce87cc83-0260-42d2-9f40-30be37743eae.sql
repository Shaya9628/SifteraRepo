-- Fix admin role assignment
-- Update the user_roles to ensure admin has the correct admin role

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@hrtraining.com';

  -- Delete any existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = admin_user_id;

  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin'::app_role);

  RAISE NOTICE 'Admin role assigned successfully to user: %', admin_user_id;
END $$;

-- Verify the admin role was assigned
SELECT u.email, ur.role 
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@hrtraining.com';