-- Create users table that syncs with auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    provider VARCHAR(50), -- 'email' or 'google'
    provider_id VARCHAR(255), -- For Google OAuth user ID
    email_verified BOOLEAN DEFAULT FALSE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    remember_token TEXT,
    remember_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        avatar_url, 
        provider,
        provider_id,
        email_verified,
        last_sign_in_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
        CASE 
            WHEN NEW.raw_user_meta_data->>'provider' = 'google' THEN 'google'
            ELSE 'email'
        END,
        NEW.raw_user_meta_data->>'provider_id',
        NEW.email_confirmed_at IS NOT NULL,
        NEW.last_sign_in_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET 
        email_verified = NEW.email_confirmed_at IS NOT NULL,
        last_sign_in_at = NEW.last_sign_in_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user signups
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger to handle user updates
CREATE OR REPLACE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to view basic profile info of other users
CREATE POLICY "Users can view basic profile info of others" ON users
    FOR SELECT
    USING (
        -- Only allow viewing of public fields
        (CURRENT_SETTING('request.select.columns', true)::text[] <@ ARRAY['id', 'full_name', 'avatar_url']::text[])
    );

-- Allow service role to do everything
CREATE POLICY "Service role has full access" ON users
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create a secure schema for private data
CREATE SCHEMA IF NOT EXISTS private;

-- Create a table for email verification tokens
CREATE TABLE IF NOT EXISTS private.email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create a table for password reset tokens
CREATE TABLE IF NOT EXISTS private.password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on private tables
ALTER TABLE private.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access private tables
CREATE POLICY "Service role can manage email verification tokens" ON private.email_verification_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage password reset tokens" ON private.password_reset_tokens
    FOR ALL
    USING (auth.role() = 'service_role'); 