-- Create table for tracking free screen usage limits
CREATE TABLE free_screen_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  session_id TEXT,
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient querying by IP and date
CREATE INDEX idx_free_screen_usage_ip_date ON free_screen_usage(ip_address, created_at);

-- Create index for session tracking
CREATE INDEX idx_free_screen_usage_session ON free_screen_usage(session_id) WHERE session_id IS NOT NULL;

-- Add RLS policy for security (public access needed for free screening)
ALTER TABLE free_screen_usage ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read their own usage data
CREATE POLICY "Allow usage tracking" ON free_screen_usage 
FOR ALL USING (true);

-- Add comment for documentation
COMMENT ON TABLE free_screen_usage IS 'Tracks daily usage limits for free resume screening feature - 2 analyses per IP per day';