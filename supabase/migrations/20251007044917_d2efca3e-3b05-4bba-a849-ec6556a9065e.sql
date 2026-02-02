-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table for secure role management
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  total_points integer default 0,
  resumes_screened integer default 0,
  red_flags_found integer default 0,
  calls_completed integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles for select to authenticated using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- Create resumes table
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  candidate_name text not null,
  file_path text not null,
  file_url text,
  department text not null check (department in ('sales', 'customer_support')),
  status text default 'pending' check (status in ('pending', 'screening', 'completed')),
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.resumes enable row level security;

create policy "Users can view own resumes" on public.resumes for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own resumes" on public.resumes for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins can view all resumes" on public.resumes for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Create resume_scores table
create table public.resume_scores (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  experience_score integer not null check (experience_score between 0 and 100),
  skills_score integer not null check (skills_score between 0 and 100),
  progression_score integer not null check (progression_score between 0 and 100),
  achievements_score integer not null check (achievements_score between 0 and 100),
  communication_score integer not null check (communication_score between 0 and 100),
  cultural_fit_score integer not null check (cultural_fit_score between 0 and 100),
  total_score numeric(5,2) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.resume_scores enable row level security;

create policy "Users can view own scores" on public.resume_scores for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own scores" on public.resume_scores for insert to authenticated with check (auth.uid() = user_id);

-- Create red_flags table
create table public.red_flags (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  flag_type text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.red_flags enable row level security;

create policy "Users can view own flags" on public.red_flags for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own flags" on public.red_flags for insert to authenticated with check (auth.uid() = user_id);

-- Create call_simulations table
create table public.call_simulations (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  question text not null,
  answer text,
  score integer check (score between 0 and 10),
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.call_simulations enable row level security;

create policy "Users can view own simulations" on public.call_simulations for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own simulations" on public.call_simulations for insert to authenticated with check (auth.uid() = user_id);

-- Create badges table
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null,
  requirement_type text not null,
  requirement_value integer not null,
  points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.badges enable row level security;

create policy "Anyone can view badges" on public.badges for select to authenticated using (true);

-- Create user_badges table
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Users can view all user badges" on public.user_badges for select to authenticated using (true);
create policy "Users can insert own badges" on public.user_badges for insert to authenticated with check (auth.uid() = user_id);

-- Create storage bucket for resumes
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false) on conflict (id) do nothing;

-- Storage policies for resumes bucket
create policy "Users can upload own resumes" on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own resumes" on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Admins can view all resumes" on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and public.has_role(auth.uid(), 'admin'));

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Insert default badges
insert into public.badges (name, description, icon, requirement_type, requirement_value, points) values
  ('First Resume', 'Screen your first resume', '📄', 'resumes_screened', 1, 10),
  ('Resume Master', 'Screen 10 resumes', '🎯', 'resumes_screened', 10, 50),
  ('Resume Legend', 'Screen 50 resumes', '👑', 'resumes_screened', 50, 200),
  ('Red Flag Detective', 'Identify 5 red flags', '🚩', 'red_flags_found', 5, 30),
  ('Eagle Eye', 'Identify 20 red flags', '🦅', 'red_flags_found', 20, 100),
  ('Call Champion', 'Complete 5 screening calls', '📞', 'calls_completed', 5, 40),
  ('Interview Pro', 'Complete 25 screening calls', '🎤', 'calls_completed', 25, 150);