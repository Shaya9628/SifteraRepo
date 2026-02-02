-- Create system_notifications table for admin notifications
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  read boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all notifications" ON public.system_notifications 
FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create notifications" ON public.system_notifications 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update notifications" ON public.system_notifications 
FOR UPDATE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_system_notifications_type ON public.system_notifications(type);
CREATE INDEX idx_system_notifications_created_at ON public.system_notifications(created_at DESC);
CREATE INDEX idx_system_notifications_read ON public.system_notifications(read) WHERE read = false;