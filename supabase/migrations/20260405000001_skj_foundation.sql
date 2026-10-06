-- =====================================================================
-- SKJ Academy v2 — Phase A : fondations, sécurité, configuration
-- =====================================================================

CREATE TYPE public.access_type AS ENUM ('free', 'premium');
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'exam';

-- ---------- Helpers ----------
CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'admin') OR public.has_role(_uid, 'instructor')
$$;

-- Permissions fines des instructeurs
CREATE TABLE public.instructor_permissions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  can_create_courses BOOLEAN NOT NULL DEFAULT true,
  can_create_labs BOOLEAN NOT NULL DEFAULT true,
  can_publish BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.instructor_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin can view instructor perms" ON public.instructor_permissions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage instructor perms" ON public.instructor_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.has_instructor_perm(_uid uuid, _perm text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'admin') OR (
    public.has_role(_uid, 'instructor') AND EXISTS (
      SELECT 1 FROM public.instructor_permissions p
      WHERE p.user_id = _uid AND CASE _perm
        WHEN 'courses' THEN p.can_create_courses
        WHEN 'labs' THEN p.can_create_labs
        WHEN 'publish' THEN p.can_publish
        ELSE false END))
$$;

CREATE OR REPLACE FUNCTION public.handle_instructor_role() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'instructor' THEN
    INSERT INTO public.instructor_permissions (user_id) VALUES (NEW.user_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_instructor_role AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_instructor_role();

-- ---------- Catégories ----------
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'folder',
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable by all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- Niveaux & règles XP (configurables) ----------
CREATE TABLE public.levels (
  rank INTEGER PRIMARY KEY CHECK (rank > 0),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  min_xp INTEGER NOT NULL CHECK (min_xp >= 0) UNIQUE,
  description TEXT,
  color TEXT
);
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels viewable by all" ON public.levels FOR SELECT USING (true);
CREATE POLICY "Admins manage levels" ON public.levels FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.xp_rules (
  event TEXT PRIMARY KEY,
  xp INTEGER NOT NULL CHECK (xp >= 0),
  label TEXT NOT NULL,
  description TEXT
);
ALTER TABLE public.xp_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "XP rules viewable by all" ON public.xp_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage xp rules" ON public.xp_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by all" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.app_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.level_for_xp(_xp integer) RETURNS integer
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(MAX(rank), 1) FROM public.levels WHERE min_xp <= _xp
$$;

CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  xp INTEGER NOT NULL,
  ref_type TEXT,
  ref_key TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event, ref_key)
);
CREATE INDEX xp_transactions_user_idx ON public.xp_transactions (user_id, created_at DESC);
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own xp" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all xp" ON public.xp_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
-- aucune policy INSERT/UPDATE/DELETE : écriture uniquement via fonctions SECURITY DEFINER

-- ---------- Profils : handle, visibilité, durcissement ----------
ALTER TABLE public.profiles
  ADD COLUMN handle TEXT,
  ADD COLUMN headline TEXT,
  ADD COLUMN goal TEXT,
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN visibility JSONB NOT NULL DEFAULT
    '{"xp":true,"skills":true,"badges":true,"courses":true,"labs":true,"certifications":true}',
  ADD COLUMN last_activity_date DATE;

CREATE OR REPLACE FUNCTION public.generate_handle(_base text) RETURNS text
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE h text; cand text; n int := 0;
BEGIN
  h := trim(both '-' from regexp_replace(lower(coalesce(_base, 'user')), '[^a-z0-9]+', '-', 'g'));
  IF length(h) < 3 THEN h := h || '-user'; END IF;
  h := left(h, 24);
  cand := h;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(handle) = cand) LOOP
    n := n + 1; cand := h || '-' || n;
  END LOOP;
  RETURN cand;
END $$;

UPDATE public.profiles SET handle = public.generate_handle(split_part(coalesce(full_name, 'user'), '@', 1))
  WHERE handle IS NULL;
ALTER TABLE public.profiles ALTER COLUMN handle SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_handle_format CHECK (handle ~ '^[a-z0-9][a-z0-9-]{2,29}$');
CREATE UNIQUE INDEX profiles_handle_key ON public.profiles (lower(handle));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  v_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (user_id, full_name, handle)
  VALUES (NEW.id, v_name, public.generate_handle(v_name));
  RETURN NEW;
END $$;

-- Faille corrigée : un utilisateur ne peut plus modifier son XP / niveau / statut
DROP POLICY "Profiles viewable by everyone" ON public.profiles;
DROP POLICY "Users can update own profile" ON public.profiles;
DROP POLICY "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url, bio, handle, headline, goal, is_public, visibility)
  ON public.profiles TO authenticated;
