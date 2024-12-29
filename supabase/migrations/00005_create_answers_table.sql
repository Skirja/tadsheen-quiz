-- Create answers table
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    answer_text TEXT NOT NULL,
    answer_image_url TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, order_number)
);

-- Create trigger for updated_at
CREATE TRIGGER update_answers_updated_at
    BEFORE UPDATE ON answers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Policies

-- Answers are viewable by everyone for published quizzes
CREATE POLICY "Answers are viewable for published quizzes" ON answers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN quizzes ON quizzes.id = questions.quiz_id
            WHERE questions.id = question_id
            AND quizzes.status = 'published'
            AND quizzes.is_active = true
        )
    );

-- Quiz creators can view all answers in their quizzes
CREATE POLICY "Creators can view their quiz answers" ON answers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN quizzes ON quizzes.id = questions.quiz_id
            WHERE questions.id = question_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Quiz creators can update answers in their quizzes
CREATE POLICY "Creators can update their quiz answers" ON answers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN quizzes ON quizzes.id = questions.quiz_id
            WHERE questions.id = question_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Quiz creators can delete answers in their quizzes
CREATE POLICY "Creators can delete their quiz answers" ON answers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN quizzes ON quizzes.id = questions.quiz_id
            WHERE questions.id = question_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Quiz creators can insert answers in their quizzes
CREATE POLICY "Creators can insert answers in their quizzes" ON answers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM questions
            JOIN quizzes ON quizzes.id = questions.quiz_id
            WHERE questions.id = question_id
            AND quizzes.creator_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX answers_question_id_idx ON answers(question_id);
CREATE INDEX answers_question_id_order_idx ON answers(question_id, order_number); 