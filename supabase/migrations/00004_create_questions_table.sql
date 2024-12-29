-- Create question type enum
CREATE TYPE question_type AS ENUM ('single_choice', 'multiple_choice', 'long_answer');

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    question_image_url TEXT,
    order_number INTEGER NOT NULL,
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quiz_id, order_number)
);

-- Create trigger for updated_at
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update quiz question count
CREATE TRIGGER update_quiz_questions_count
    AFTER INSERT OR DELETE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_question_count();

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policies

-- Questions are viewable by everyone for published quizzes
CREATE POLICY "Questions are viewable for published quizzes" ON questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND status = 'published'
            AND is_active = true
        )
    );

-- Quiz creators can view all questions in their quizzes
CREATE POLICY "Creators can view their quiz questions" ON questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Quiz creators can update questions in their quizzes
CREATE POLICY "Creators can update their quiz questions" ON questions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Quiz creators can delete questions in their quizzes
CREATE POLICY "Creators can delete their quiz questions" ON questions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Quiz creators can insert questions in their quizzes
CREATE POLICY "Creators can insert questions in their quizzes" ON questions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX questions_quiz_id_idx ON questions(quiz_id);
CREATE INDEX questions_quiz_id_order_idx ON questions(quiz_id, order_number); 