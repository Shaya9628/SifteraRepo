-- Create admin user account
-- This creates a dedicated admin account separate from regular users
-- Email: admin@hrtraining.com
-- Password: Admin@2025!Secure

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Insert admin user into auth.users (if not exists)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@hrtraining.com',
    crypt('Admin@2025!Secure', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Administrator"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@hrtraining.com'
  )
  RETURNING id INTO admin_user_id;

  -- Get the admin user id if already exists
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@hrtraining.com';
  END IF;

  -- Create profile for admin user
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (admin_user_id, 'System Administrator', 'admin@hrtraining.com')
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'System Administrator',
    email = 'admin@hrtraining.com';

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin account created successfully';
END $$;