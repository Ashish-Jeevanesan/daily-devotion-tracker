-- Create the 'daily_check_ins' table to store yes/no answers for prayer and bible reading
CREATE TABLE public.daily_check_ins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  prayed boolean NOT NULL DEFAULT false,
  read_bible boolean NOT NULL DEFAULT false,
  CONSTRAINT daily_check_ins_pkey PRIMARY KEY (id),
  CONSTRAINT daily_check_ins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT daily_check_ins_user_id_date_key UNIQUE (user_id, date) -- Ensure only one entry per user per day
);

-- Enable RLS for the new table
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;

-- Create policies for the 'daily_check_ins' table
CREATE POLICY "Users can view their own check-ins." ON public.daily_check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own check-ins." ON public.daily_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own check-ins." ON public.daily_check_ins FOR UPDATE USING (auth.uid() = user_id);

-- (Existing tables below - no changes needed if you already ran this)

-- Create the 'profiles' table to store user information
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NULL,
  full_name text NULL,
  age int4 NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_username_key UNIQUE (username),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create the 'devotions' table to store devotion entries
CREATE TABLE public.devotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text NULL,
  CONSTRAINT devotions_pkey PRIMARY KEY (id),
  CONSTRAINT devotions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS) for the tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotions ENABLE ROW LEVEL SECURITY;

-- Create policies for the 'profiles' table
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create policies for the 'devotions' table
CREATE POLICY "Users can view their own devotions." ON public.devotions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own devotions." ON public.devotions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own devotions." ON public.devotions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own devotions." ON public.devotions FOR DELETE USING (auth.uid() = user_id);