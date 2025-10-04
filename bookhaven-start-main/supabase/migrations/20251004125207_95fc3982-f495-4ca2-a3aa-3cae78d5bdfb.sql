-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create books table
CREATE TABLE public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  genre TEXT NOT NULL,
  published_year INTEGER NOT NULL,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view books"
  ON public.books FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create books"
  ON public.books FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = added_by);

CREATE POLICY "Users can update their own books"
  ON public.books FOR UPDATE
  USING (auth.uid() = added_by);

CREATE POLICY "Users can delete their own books"
  ON public.books FOR DELETE
  USING (auth.uid() = added_by);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert 20 sample books
INSERT INTO public.books (title, author, description, genre, published_year, added_by) VALUES
('The Midnight Library', 'Matt Haig', 'A dazzling novel about all the choices that go into a life well lived, from the internationally bestselling author of Reasons to Stay Alive and How To Stop Time.', 'Fiction', 2020, NULL),
('Atomic Habits', 'James Clear', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny Changes, Remarkable Results.', 'Self-Help', 2018, NULL),
('Project Hail Mary', 'Andy Weir', 'A lone astronaut must save the earth from disaster in this incredible new science-based thriller from the author of The Martian.', 'Science Fiction', 2021, NULL),
('The Silent Patient', 'Alex Michaelides', 'Alicia Berenson''s life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows.', 'Thriller', 2019, NULL),
('Educated', 'Tara Westover', 'A memoir of a young woman who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.', 'Memoir', 2018, NULL),
('Where the Crawdads Sing', 'Delia Owens', 'For years, rumors of the "Marsh Girl" have haunted Barkley Cove, a quiet town on the North Carolina coast.', 'Fiction', 2018, NULL),
('The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', 'Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life.', 'Historical Fiction', 2017, NULL),
('Sapiens', 'Yuval Noah Harari', 'A Brief History of Humankind. From a renowned historian comes a groundbreaking narrative of humanity''s creation and evolution.', 'Non-Fiction', 2011, NULL),
('The Song of Achilles', 'Madeline Miller', 'A tale of gods, kings, immortal fame and the human heart, THE SONG OF ACHILLES is a dazzling literary feat.', 'Historical Fiction', 2011, NULL),
('Circe', 'Madeline Miller', 'In the house of Helios, god of the sun and mightiest of the Titans, a daughter is born. But Circe is a strange child.', 'Fantasy', 2018, NULL),
('The Invisible Life of Addie LaRue', 'V.E. Schwab', 'A Life No One Will Remember. A Story You Will Never Forget. France, 1714: in a moment of desperation.', 'Fantasy', 2020, NULL),
('Normal People', 'Sally Rooney', 'At school Connell and Marianne pretend not to know each other. He''s popular and well-adjusted, star of the school football team.', 'Romance', 2018, NULL),
('Becoming', 'Michelle Obama', 'An intimate, powerful, and inspiring memoir by the former First Lady of the United States.', 'Memoir', 2018, NULL),
('The Night Circus', 'Erin Morgenstern', 'The circus arrives without warning. No announcements precede it. It is simply there, when yesterday it was not.', 'Fantasy', 2011, NULL),
('All the Light We Cannot See', 'Anthony Doerr', 'Marie-Laure lives with her father in Paris near the Museum of Natural History where he works as the master of its thousands of locks.', 'Historical Fiction', 2014, NULL),
('The Alchemist', 'Paulo Coelho', 'Paulo Coelho''s masterpiece tells the mystical story of Santiago, an Andalusian shepherd boy who yearns to travel.', 'Fiction', 1988, NULL),
('The Goldfinch', 'Donna Tartt', 'A young boy in New York City, Theo Decker, miraculously survives an accident that takes the life of his mother.', 'Fiction', 2013, NULL),
('The Vanishing Half', 'Brit Bennett', 'The Vignes twin sisters will grow up to be women but for now they are girls who share a room.', 'Historical Fiction', 2020, NULL),
('Daisy Jones & The Six', 'Taylor Jenkins Reid', 'Everyone knows DAISY JONES & THE SIX, but nobody knows the reason behind their split at the absolute height of their popularity.', 'Historical Fiction', 2019, NULL),
('The Guest List', 'Lucy Foley', 'On an island off the coast of Ireland, guests gather to celebrate two people joining their lives together as one.', 'Mystery', 2020, NULL);