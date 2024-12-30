-- Drop existing policies for quiz_responses
DROP POLICY IF EXISTS "Creators can view responses on their quizzes" ON quiz_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON quiz_responses;
DROP POLICY IF EXISTS "Anyone can insert responses" ON quiz_responses;

-- Recreate simplified policies for quiz_responses
CREATE POLICY "Enable read access for quiz responses" ON quiz_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts a
            WHERE a.id = attempt_id
            AND (
                a.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM quizzes q
                    WHERE q.id = a.quiz_id
                    AND q.creator_id = auth.uid()
                )
                OR a.created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
            )
        )
    );

CREATE POLICY "Enable insert access for quiz responses" ON quiz_responses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quiz_attempts a
            WHERE a.id = attempt_id
            AND (
                a.user_id = auth.uid()
                OR a.created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
            )
        )
    ); 