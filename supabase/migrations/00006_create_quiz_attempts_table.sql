-- Create attempt status enum
CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'timed_out');

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_full_name VARCHAR(255) NOT NULL, -- For non-logged in users
    status attempt_status DEFAULT 'in_progress',
    score INTEGER,
    time_spent_seconds INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Calculated from quiz time_limit_minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_spent CHECK (time_spent_seconds >= 0)
);

-- Create quiz responses table for storing user answers
CREATE TABLE IF NOT EXISTS public.quiz_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
    text_response TEXT, -- For long answer questions
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    response_time_seconds INTEGER, -- Track time spent on each question
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_response_time CHECK (response_time_seconds >= 0)
);

-- Create triggers for updated_at
CREATE TRIGGER update_quiz_attempts_updated_at
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_responses_updated_at
    BEFORE UPDATE ON quiz_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update quiz attempt count
CREATE TRIGGER update_quiz_attempts_count
    AFTER INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_attempt_count();

-- Create function to set expires_at on quiz attempt creation
CREATE OR REPLACE FUNCTION set_quiz_attempt_expiry()
RETURNS TRIGGER AS $$
BEGIN
    SELECT started_at + (time_limit_minutes || ' minutes')::interval
    INTO NEW.expires_at
    FROM quizzes
    WHERE id = NEW.quiz_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set expires_at
CREATE TRIGGER set_attempt_expiry
    BEFORE INSERT ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION set_quiz_attempt_expiry();

-- Create function to auto-complete timed out attempts
CREATE OR REPLACE FUNCTION complete_timed_out_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in_progress' AND CURRENT_TIMESTAMP >= NEW.expires_at THEN
        NEW.status = 'timed_out';
        NEW.completed_at = NEW.expires_at;
        NEW.time_spent_seconds = EXTRACT(EPOCH FROM (NEW.expires_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle timed out attempts
CREATE TRIGGER handle_timed_out_attempts
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION complete_timed_out_attempts();

-- Enable RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_attempts

-- Quiz creators can view all attempts for their quizzes
CREATE POLICY "Creators can view attempts on their quizzes" ON quiz_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes
            WHERE quizzes.id = quiz_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Users can view their own attempts
CREATE POLICY "Users can view their own attempts" ON quiz_attempts
    FOR SELECT
    USING (
        CASE
            WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
            ELSE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        END
    );

-- Anyone can insert an attempt
CREATE POLICY "Anyone can start a quiz attempt" ON quiz_attempts
    FOR INSERT
    WITH CHECK (true);

-- Users can update their own incomplete attempts
CREATE POLICY "Users can update their own attempts" ON quiz_attempts
    FOR UPDATE
    USING (
        CASE
            WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
            ELSE created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        END
    );

-- Policies for quiz_responses

-- Quiz creators can view responses for their quizzes
CREATE POLICY "Creators can view responses on their quizzes" ON quiz_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts
            JOIN quizzes ON quizzes.id = quiz_attempts.quiz_id
            WHERE quiz_attempts.id = attempt_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Users can view their own responses
CREATE POLICY "Users can view their own responses" ON quiz_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts
            WHERE quiz_attempts.id = attempt_id
            AND (
                CASE
                    WHEN auth.uid() IS NOT NULL THEN quiz_attempts.user_id = auth.uid()
                    ELSE quiz_attempts.created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
                END
            )
        )
    );

-- Anyone can insert responses
CREATE POLICY "Anyone can insert responses" ON quiz_responses
    FOR INSERT
    WITH CHECK (true);

-- Create indexes
CREATE INDEX quiz_attempts_quiz_id_idx ON quiz_attempts(quiz_id);
CREATE INDEX quiz_attempts_user_id_idx ON quiz_attempts(user_id);
CREATE INDEX quiz_attempts_status_idx ON quiz_attempts(status);
CREATE INDEX quiz_attempts_expires_idx ON quiz_attempts(expires_at) WHERE status = 'in_progress';
CREATE INDEX quiz_responses_attempt_id_idx ON quiz_responses(attempt_id);
CREATE INDEX quiz_responses_question_id_idx ON quiz_responses(question_id);
CREATE INDEX quiz_responses_answer_id_idx ON quiz_responses(answer_id); 