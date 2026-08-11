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
CREATE POLICY "Admins can read all check-ins" ON public.daily_check_ins FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.void_fl IS NULL
    AND profiles.role = 'admin'
  )
);
CREATE POLICY "Users can insert their own check-ins." ON public.daily_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own check-ins." ON public.daily_check_ins FOR UPDATE USING (auth.uid() = user_id);

-- (Existing tables below - no changes needed if you already ran this)

-- Create the 'profiles' table to store user information
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NULL,
  full_name text NULL,
  age int4 NULL,
  dob date NULL,
  phone_number text NULL,
  church_name text NULL,
  report_preference text NOT NULL DEFAULT 'MONTHLY',
  role text NOT NULL DEFAULT 'member',
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
CREATE POLICY "Admins can read all devotions" ON public.devotions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
CREATE POLICY "Users can insert their own devotions." ON public.devotions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own devotions." ON public.devotions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own devotions." ON public.devotions FOR DELETE USING (auth.uid() = user_id);

-- Ensure the role column exists for existing databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS church_name text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS report_preference text NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE public.devotions ADD COLUMN IF NOT EXISTS image_url text NULL;

-- Storage bucket & RLS policies for 'user_devotions'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user_devotions', 'user_devotions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read user_devotions'
  ) THEN
    CREATE POLICY "Public Read user_devotions" ON storage.objects FOR SELECT USING (bucket_id = 'user_devotions');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users Upload Own user_devotions'
  ) THEN
    CREATE POLICY "Users Upload Own user_devotions" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'user_devotions' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users Delete Own user_devotions'
  ) THEN
    CREATE POLICY "Users Delete Own user_devotions" ON storage.objects FOR DELETE USING (
      bucket_id = 'user_devotions' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Weekly devotion report for admins
CREATE OR REPLACE FUNCTION public.weekly_devotion_report(
  week_start timestamptz,
  week_end timestamptz
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  devotion_days bigint
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    p.id AS user_id,
      p.full_name,
    COUNT(DISTINCT DATE(d.created_at)) AS devotion_days
  FROM public.profiles p
  LEFT JOIN public.devotions d
    ON d.user_id = p.id
    AND d.void_fl IS NULL
    AND d.created_at >= week_start
    AND d.created_at < week_end
  WHERE p.void_fl IS NULL
    AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.void_fl IS NULL
    AND profiles.role = 'admin'
    AND (
      profiles.church_name IS NULL
      OR btrim(profiles.church_name) = ''
      OR p.church_name = profiles.church_name
    )
  )
  GROUP BY p.id, p.full_name
  ORDER BY p.full_name;
$$;

-- Master access rules for feature-level authorization
CREATE TABLE IF NOT EXISTS public.access_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT access_rules_pkey PRIMARY KEY (id),
  CONSTRAINT access_rules_code_key UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public.profile_access_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  access_rule_id uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid NULL,
  void_fl timestamptz NULL,
  CONSTRAINT profile_access_rules_pkey PRIMARY KEY (id),
  CONSTRAINT profile_access_rules_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT profile_access_rules_access_rule_id_fkey FOREIGN KEY (access_rule_id) REFERENCES public.access_rules(id) ON DELETE CASCADE,
  CONSTRAINT profile_access_rules_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT profile_access_rules_profile_id_access_rule_id_key UNIQUE (profile_id, access_rule_id)
);

ALTER TABLE public.profile_access_rules ADD COLUMN IF NOT EXISTS void_fl timestamptz NULL;

ALTER TABLE public.access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_access_rules ENABLE ROW LEVEL SECURITY;

INSERT INTO public.access_rules (code, name, description)
VALUES (
  'admin_reports',
  'Admin Reports',
  'Can open the admin reports dashboard.'
), (
  'calender_admin_view',
  'Calendar Admin View',
  'Can view other users in the progress calendar.'
), (
  'map_user_access',
  'Map User Access',
  'Can grant or revoke access rules for other users.'
), (
  'run_user_report_job',
  'Run User Report Job',
  'Can trigger the user report edge function from the application.'
)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.current_user_has_access(required_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_access_rules par
    INNER JOIN public.access_rules ar
      ON ar.id = par.access_rule_id
    WHERE par.profile_id = auth.uid()
      AND par.void_fl IS NULL
      AND ar.code = required_code
      AND ar.is_active = true
  );
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'access_rules'
      AND policyname = 'Authenticated users can view active access rules'
  ) THEN
    CREATE POLICY "Authenticated users can view active access rules"
      ON public.access_rules
      FOR SELECT
      USING (auth.uid() IS NOT NULL AND is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_check_ins'
      AND policyname = 'Users with calendar admin view can read all check-ins'
  ) THEN
    CREATE POLICY "Users with calendar admin view can read all check-ins"
      ON public.daily_check_ins
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.profile_access_rules par
          INNER JOIN public.access_rules ar
            ON ar.id = par.access_rule_id
          WHERE par.profile_id = auth.uid()
            AND par.void_fl IS NULL
            AND ar.code = 'calender_admin_view'
            AND ar.is_active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'devotions'
      AND policyname = 'Users with calendar admin view can read all devotions'
  ) THEN
    CREATE POLICY "Users with calendar admin view can read all devotions"
      ON public.devotions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.profile_access_rules par
          INNER JOIN public.access_rules ar
            ON ar.id = par.access_rule_id
          WHERE par.profile_id = auth.uid()
            AND par.void_fl IS NULL
            AND ar.code = 'calender_admin_view'
            AND ar.is_active = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_access_rules'
      AND policyname = 'Users can view their own access mappings'
  ) THEN
    CREATE POLICY "Users can view their own access mappings"
      ON public.profile_access_rules
      FOR SELECT
      USING (auth.uid() = profile_id AND void_fl IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_access_rules'
      AND policyname = 'Admins can view all access mappings'
  ) THEN
    CREATE POLICY "Admins can view all access mappings"
      ON public.profile_access_rules
      FOR SELECT
      USING (
        void_fl IS NULL
        AND
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
        AND current_user_has_access('map_user_access')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_access_rules'
      AND policyname = 'Admins can manage access mappings'
  ) THEN
    CREATE POLICY "Admins can manage access mappings"
      ON public.profile_access_rules
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
        AND current_user_has_access('map_user_access')
        AND void_fl IS NULL
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
        AND current_user_has_access('map_user_access')
      );
  END IF;
END $$;
