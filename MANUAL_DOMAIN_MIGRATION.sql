-- Run this SQL in your Supabase dashboard SQL editor to add global domains

-- Add new domain values to the domain_type enum (if it exists)
-- Note: You may need to run these one at a time in the Supabase SQL editor

-- First, check if we can add to existing enum
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_type') THEN
        -- Add new domain values one by one
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'marketing';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'finance';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'hr';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'it';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'operations';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'healthcare';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'education';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'engineering';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'consulting';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'retail';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'manufacturing';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'legal';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'hospitality';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'logistics';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'real_estate';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'media';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'nonprofit';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE domain_type ADD VALUE 'general';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Add domain column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domain text;

-- Update existing profiles with default domain if they don't have one
UPDATE profiles 
SET domain = 'general' 
WHERE domain IS NULL;

-- Add index on domain column for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_domain ON profiles (domain);