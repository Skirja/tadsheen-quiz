-- Drop all existing policies first
DROP POLICY IF EXISTS "Questions are viewable for published quizzes" ON questions;
DROP POLICY IF EXISTS "Creators can view their quiz questions" ON questions;
DROP POLICY IF EXISTS "Creators can update their quiz questions" ON questions;
DROP POLICY IF EXISTS "Creators can delete their quiz questions" ON questions;
DROP POLICY IF EXISTS "Creators can insert questions in their quizzes" ON questions;

-- Drop reference_answer column
ALTER TABLE public.questions
DROP COLUMN IF EXISTS reference_answer;

-- Recreate all policies without reference to reference_answer
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

CREATE POLICY "Creators can update their quiz questions" ON questions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    );

CREATE POLICY "Creators can delete their quiz questions" ON questions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    );

CREATE POLICY "Creators can insert questions in their quizzes" ON questions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    ); 