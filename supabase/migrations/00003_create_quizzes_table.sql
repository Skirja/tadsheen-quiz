-- Create quiz status enum
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE quiz_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES quiz_categories(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    thumbnail_url TEXT,
    status quiz_status DEFAULT 'draft',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    difficulty quiz_difficulty DEFAULT 'intermediate',
    time_limit_minutes INTEGER DEFAULT 30,
    total_questions INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_limit CHECK (time_limit_minutes > 0)
);

-- Create trigger for updated_at
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view published and active quizzes
CREATE POLICY "Published quizzes are viewable by everyone" ON quizzes
    FOR SELECT
    USING (status = 'published' AND is_active = true);

-- Creators can view all their quizzes
CREATE POLICY "Creators can view their own quizzes" ON quizzes
    FOR SELECT
    USING (auth.uid() = creator_id);

-- Creators can update their own quizzes
CREATE POLICY "Creators can update their own quizzes" ON quizzes
    FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their own quizzes
CREATE POLICY "Creators can delete their own quizzes" ON quizzes
    FOR DELETE
    USING (auth.uid() = creator_id);

-- Creators can insert quizzes
CREATE POLICY "Authenticated users can create quizzes" ON quizzes
    FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Create indexes
CREATE INDEX quizzes_category_id_idx ON quizzes(category_id);
CREATE INDEX quizzes_creator_id_idx ON quizzes(creator_id);
CREATE INDEX quizzes_status_idx ON quizzes(status) WHERE status = 'published';
CREATE INDEX quizzes_featured_idx ON quizzes(is_featured) WHERE is_featured = true;
CREATE INDEX quizzes_difficulty_idx ON quizzes(difficulty);

-- Create function to update total questions
CREATE OR REPLACE FUNCTION update_quiz_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE quizzes
        SET total_questions = total_questions + 1
        WHERE id = NEW.quiz_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE quizzes
        SET total_questions = total_questions - 1
        WHERE id = OLD.quiz_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update total attempts
CREATE OR REPLACE FUNCTION update_quiz_attempt_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE quizzes
        SET total_attempts = total_attempts + 1
        WHERE id = NEW.quiz_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 