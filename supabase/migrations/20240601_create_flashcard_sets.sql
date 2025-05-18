-- Create flashcard_sets table
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add set_id to flashcards table
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE;

-- (Optional) You may want to migrate existing flashcards to sets by grouping by category and creating sets for them. This can be done with a script if needed. 