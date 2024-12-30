-- Add reference_answer column to questions table
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS reference_answer TEXT;

-- Update RLS policies to include reference_answer
DROP POLICY IF EXISTS "Questions are viewable for published quizzes" ON questions;
DROP POLICY IF EXISTS "Creators can view their quiz questions" ON questions;

-- Recreate policies
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

CREATE POLICY "Creators can view their quiz questions" ON questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    ); 