-- Drop existing policies
DROP POLICY IF EXISTS "Creators can view attempts on their quizzes" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Anyone can start a quiz attempt" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Creators can view responses on their quizzes" ON quiz_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON quiz_responses;
DROP POLICY IF EXISTS "Anyone can insert responses" ON quiz_responses;

-- Drop existing triggers
DROP TRIGGER IF EXISTS set_attempt_expiry ON quiz_attempts;
DROP TRIGGER IF EXISTS handle_timed_out_attempts ON quiz_attempts;

-- Drop existing functions
DROP FUNCTION IF EXISTS set_quiz_attempt_expiry();
DROP FUNCTION IF EXISTS complete_timed_out_attempts();

-- Recreate functions with SECURITY DEFINER
CREATE OR REPLACE FUNCTION set_quiz_attempt_expiry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at := CURRENT_TIMESTAMP + INTERVAL '1 hour';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_timed_out_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in_progress' AND CURRENT_TIMESTAMP >= NEW.expires_at THEN
        NEW.status := 'timed_out';
        NEW.completed_at := NEW.expires_at;
        NEW.time_spent_seconds := EXTRACT(EPOCH FROM (NEW.expires_at - NEW.created_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER set_attempt_expiry
    BEFORE INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION set_quiz_attempt_expiry();

CREATE TRIGGER handle_timed_out_attempts
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION complete_timed_out_attempts();

-- Recreate policies with simpler logic
CREATE POLICY "Creators can view attempts on their quizzes" ON quiz_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own attempts" ON quiz_attempts
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    );

CREATE POLICY "Anyone can start a quiz attempt" ON quiz_attempts
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own attempts" ON quiz_attempts
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    );

-- Simplified policies for quiz_responses
CREATE POLICY "Creators can view responses on their quizzes" ON quiz_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts a
            JOIN quizzes q ON q.id = a.quiz_id
            WHERE a.id = attempt_id
            AND q.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own responses" ON quiz_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts a
            WHERE a.id = attempt_id
            AND (
                a.user_id = auth.uid()
                OR a.created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
            )
        )
    );

CREATE POLICY "Anyone can insert responses" ON quiz_responses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quiz_attempts a
            WHERE a.id = attempt_id
        )
    ); 