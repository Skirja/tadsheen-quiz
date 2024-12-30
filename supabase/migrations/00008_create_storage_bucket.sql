-- Create storage bucket for quiz images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-images', 'quiz-images', true);

-- Set up storage policies for quiz images bucket
CREATE POLICY "Quiz images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quiz-images');

-- Only authenticated users can upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-images');

-- Users can update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'quiz-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'quiz-images' AND owner = auth.uid());

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quiz-images' AND owner = auth.uid()); 