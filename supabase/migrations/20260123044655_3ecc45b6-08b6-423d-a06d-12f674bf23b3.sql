
-- Create landing_page_content table for all text/config content
CREATE TABLE public.landing_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(section, key)
);

-- Create landing_page_media table for images/videos
CREATE TABLE public.landing_page_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_page_content
CREATE POLICY "Anyone can view landing page content"
ON public.landing_page_content
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert landing page content"
ON public.landing_page_content
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update landing page content"
ON public.landing_page_content
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landing page content"
ON public.landing_page_content
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for landing_page_media
CREATE POLICY "Anyone can view landing page media"
ON public.landing_page_media
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert landing page media"
ON public.landing_page_media
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update landing page media"
ON public.landing_page_media
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landing page media"
ON public.landing_page_media
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for landing page assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('landing-assets', 'landing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for landing-assets bucket
CREATE POLICY "Anyone can view landing assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'landing-assets');

CREATE POLICY "Admins can upload landing assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'landing-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update landing assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'landing-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landing assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'landing-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Insert default content
INSERT INTO public.landing_page_content (section, key, value, metadata) VALUES
-- Footer content
('footer', 'description', 'Siftera - Learn Decide and Improve. The new era of intelligent HR and skill management.', '{}'),
('footer', 'tagline', 'Made with ❤️ for HR professionals worldwide', '{}'),
('footer', 'social_twitter', 'https://twitter.com/siftera', '{}'),
('footer', 'social_linkedin', 'https://linkedin.com/company/siftera', '{}'),
('footer', 'social_github', 'https://github.com/siftera', '{}'),
('footer', 'social_email', 'contact@siftera.com', '{}'),
-- Hero content
('hero', 'headline', 'Master Resume Screening with AI-Powered Training', '{}'),
('hero', 'subtitle', 'Transform your HR team into expert resume screeners. Practice with real scenarios, get instant AI feedback, and track your progress.', '{}'),
('hero', 'cta_primary', 'Start Free Trial', '{}'),
('hero', 'cta_secondary', 'Watch Demo', '{}'),
-- Stats
('stats', 'stat_1_value', '50%', '{}'),
('stats', 'stat_1_label', 'Time Saved on Training', '{}'),
('stats', 'stat_1_description', 'Reduce onboarding time for new HR hires', '{}'),
('stats', 'stat_2_value', '95%', '{}'),
('stats', 'stat_2_label', 'Screening Accuracy', '{}'),
('stats', 'stat_2_description', 'After completing our training program', '{}'),
('stats', 'stat_3_value', '3x', '{}'),
('stats', 'stat_3_label', 'Faster Onboarding', '{}'),
('stats', 'stat_3_description', 'Get new team members up to speed quickly', '{}'),
('stats', 'stat_4_value', '10K+', '{}'),
('stats', 'stat_4_label', 'Resumes Analyzed', '{}'),
('stats', 'stat_4_description', 'Practice with real-world examples', '{}'),
-- Demo video
('hero', 'demo_video_url', '', '{"type": "video"}'),
('call_simulation', 'demo_video_url', '', '{"type": "video"}'),
-- Contact
('contact', 'sales_email', 'sales@siftera.com', '{}'),
('contact', 'sales_calendly', '', '{}');
