-- =====================================================================
-- SKJ Academy v2 — Phase B : abonnements, cours, quiz, labs, compétences
-- =====================================================================

-- ---------- Abonnements (architecture prête, paiement non branché) ----------
CREATE TABLE public.plans (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'month',
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans viewable by all" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins manage plans" ON public.plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL REFERENCES public.plans(key),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','past_due','canceled','expired')),
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_ref TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON public.subscriptions (user_id);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.has_active_subscription(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _uid AND s.status IN ('active','trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now()))
$$;

-- ---------- Cours : extension de la table existante ----------
ALTER TABLE public.courses
  ADD COLUMN slug TEXT,
  ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN access public.access_type NOT NULL DEFAULT 'free',
  ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN required_level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN objectives TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN prerequisites TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
UPDATE public.courses SET access = CASE WHEN is_free THEN 'free'::public.access_type ELSE 'premium'::public.access_type END,
  slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 6);
ALTER TABLE public.courses ALTER COLUMN slug SET NOT NULL, ALTER COLUMN slug SET DEFAULT '';
-- slug généré depuis le titre quand il n'est pas fourni (compatibilité avec l'ancien formulaire admin)
CREATE OR REPLACE FUNCTION public.ensure_slug() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := trim(both '-' from regexp_replace(translate(lower(NEW.title), 'àâäéèêëîïôöùûüç', 'aaaeeeeiioouuuc'), '[^a-z0-9]+', '-', 'g'))
                || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER courses_ensure_slug BEFORE INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.ensure_slug();
CREATE UNIQUE INDEX courses_slug_key ON public.courses (slug);
-- is_free reste en lecture seule, synchronisé avec access (compatibilité)
CREATE OR REPLACE FUNCTION public.sync_is_free() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.is_free := (NEW.access = 'free'); RETURN NEW; END $$;
CREATE TRIGGER courses_sync_is_free BEFORE INSERT OR UPDATE OF access ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.sync_is_free();

CREATE OR REPLACE FUNCTION public.guard_publish() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published')
     AND NOT public.has_instructor_perm(auth.uid(), 'publish') THEN
    RAISE EXCEPTION 'Permission de publication requise';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER courses_guard_publish BEFORE INSERT OR UPDATE OF status ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.guard_publish();

-- Policies cours : un instructeur ne gère que ses propres cours
DROP POLICY "Published courses viewable by all" ON public.courses;
DROP POLICY "Admins and instructors can insert courses" ON public.courses;
DROP POLICY "Admins and instructors can update courses" ON public.courses;
CREATE POLICY "View published or own courses" ON public.courses FOR SELECT USING (
  status = 'published' OR public.has_role(auth.uid(), 'admin') OR created_by = auth.uid());
CREATE POLICY "Create courses" ON public.courses FOR INSERT WITH CHECK (
  public.has_instructor_perm(auth.uid(), 'courses') AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Update own courses" ON public.courses FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR (created_by = auth.uid() AND public.has_instructor_perm(auth.uid(), 'courses')));

-- ---------- Accès (free / premium / niveau requis) ----------
CREATE OR REPLACE FUNCTION public.can_access_course(_course uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.courses c WHERE c.id = _course AND (
      public.has_role(auth.uid(), 'admin') OR c.created_by = auth.uid()
      OR (c.status = 'published'
          AND (c.access = 'free' OR public.has_active_subscription(auth.uid()))
          AND COALESCE((SELECT level FROM public.profiles WHERE user_id = auth.uid()), 1) >= c.required_level)))
$$;

-- ---------- Modules / leçons : métadonnées publiques, contenu protégé ----------
ALTER TABLE public.lessons ADD COLUMN is_preview BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.lesson_contents (
  lesson_id UUID PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  content TEXT,
  video_url TEXT,
  resources JSONB NOT NULL DEFAULT '[]'
);
INSERT INTO public.lesson_contents (lesson_id, content) SELECT id, content FROM public.lessons WHERE content IS NOT NULL;
ALTER TABLE public.lessons DROP COLUMN content;

CREATE OR REPLACE FUNCTION public.can_read_lesson(_lesson uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = _lesson AND (public.can_access_course(c.id) OR (l.is_preview AND c.status = 'published')))
$$;

ALTER TABLE public.lesson_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read content if access" ON public.lesson_contents FOR SELECT USING (public.can_read_lesson(lesson_id));
CREATE POLICY "Staff write content" ON public.lesson_contents FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.modules m ON m.id = l.module_id JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = lesson_id AND c.created_by = auth.uid() AND public.has_instructor_perm(auth.uid(), 'courses')))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.modules m ON m.id = l.module_id JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = lesson_id AND c.created_by = auth.uid() AND public.has_instructor_perm(auth.uid(), 'courses')));

CREATE OR REPLACE FUNCTION public.owns_course(_course uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.courses WHERE id = _course AND created_by = auth.uid()
      AND public.has_instructor_perm(auth.uid(), 'courses'))
$$;

-- modules / lessons : écriture limitée au propriétaire du cours
DROP POLICY "Admins and instructors can insert modules" ON public.modules;
DROP POLICY "Admins and instructors can update modules" ON public.modules;
DROP POLICY "Admins can delete modules" ON public.modules;
CREATE POLICY "Owner inserts modules" ON public.modules FOR INSERT WITH CHECK (public.owns_course(course_id));
CREATE POLICY "Owner updates modules" ON public.modules FOR UPDATE USING (public.owns_course(course_id));
CREATE POLICY "Owner deletes modules" ON public.modules FOR DELETE USING (public.owns_course(course_id));

-- ---------- Quiz (réponses jamais exposées au client) ----------
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pass_score INTEGER NOT NULL DEFAULT 70 CHECK (pass_score BETWEEN 1 AND 100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'single' CHECK (kind IN ('single','multiple','truefalse')),
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE public.question_answers (
  question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  correct JSONB NOT NULL,
  explanation TEXT
);
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quiz_attempts_user_idx ON public.quiz_attempts (user_id, quiz_id);
ALTER TABLE public.lessons ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.can_read_quiz(_quiz uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = _quiz
    AND (q.course_id IS NULL OR public.can_access_course(q.course_id) OR public.owns_course(q.course_id)))
$$;

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read quizzes with access" ON public.quizzes FOR SELECT USING (public.can_read_quiz(id));
CREATE POLICY "Staff manage quizzes" ON public.quizzes FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR (course_id IS NOT NULL AND public.owns_course(course_id)))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR (course_id IS NOT NULL AND public.owns_course(course_id)));
CREATE POLICY "Read questions with access" ON public.questions FOR SELECT USING (public.can_read_quiz(quiz_id));
CREATE POLICY "Staff manage questions" ON public.questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (public.has_role(auth.uid(), 'admin') OR (q.course_id IS NOT NULL AND public.owns_course(q.course_id)))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (public.has_role(auth.uid(), 'admin') OR (q.course_id IS NOT NULL AND public.owns_course(q.course_id)))));
CREATE POLICY "Staff read answers" ON public.question_answers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.questions x JOIN public.quizzes q ON q.id = x.quiz_id WHERE x.id = question_id AND (public.has_role(auth.uid(), 'admin') OR (q.course_id IS NOT NULL AND public.owns_course(q.course_id)))));
CREATE POLICY "Staff write answers" ON public.question_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.questions x JOIN public.quizzes q ON q.id = x.quiz_id WHERE x.id = question_id AND (public.has_role(auth.uid(), 'admin') OR (q.course_id IS NOT NULL AND public.owns_course(q.course_id)))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.questions x JOIN public.quizzes q ON q.id = x.quiz_id WHERE x.id = question_id AND (public.has_role(auth.uid(), 'admin') OR (q.course_id IS NOT NULL AND public.owns_course(q.course_id)))));
CREATE POLICY "Users view own attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view attempts" ON public.quiz_attempts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ---------- Labs ----------
CREATE TYPE public.lab_difficulty AS ENUM ('beginner','intermediate','advanced','expert');
CREATE TABLE public.labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE DEFAULT '',
  title TEXT NOT NULL,
  description TEXT,
  technology TEXT NOT NULL DEFAULT 'networking'
    CHECK (technology IN ('cisco','juniper','arista','linux','voip','security','networking','other')),
  engine TEXT NOT NULL DEFAULT 'manual' CHECK (engine IN ('cisco-sim','linux-sim','manual','external')),
  engine_ref TEXT,
  difficulty public.lab_difficulty NOT NULL DEFAULT 'beginner',
  required_level INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  objectives TEXT[] NOT NULL DEFAULT '{}',
  topology JSONB NOT NULL DEFAULT '{}',
  instructions TEXT,
  initial_config JSONB NOT NULL DEFAULT '{}',
  variables JSONB NOT NULL DEFAULT '{}',
  validation JSONB NOT NULL DEFAULT '{}',
  score_max INTEGER NOT NULL DEFAULT 100,
  pass_score INTEGER NOT NULL DEFAULT 70,
  xp_reward INTEGER,
  access public.access_type NOT NULL DEFAULT 'free',
  status public.course_status NOT NULL DEFAULT 'draft',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER labs_ensure_slug BEFORE INSERT ON public.labs FOR EACH ROW EXECUTE FUNCTION public.ensure_slug();
CREATE TRIGGER labs_updated_at BEFORE UPDATE ON public.labs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER labs_guard_publish BEFORE INSERT OR UPDATE OF status ON public.labs FOR EACH ROW EXECUTE FUNCTION public.guard_publish();
ALTER TABLE public.lessons ADD COLUMN lab_id UUID REFERENCES public.labs(id) ON DELETE SET NULL;

CREATE TABLE public.lab_private (
  lab_id UUID PRIMARY KEY REFERENCES public.labs(id) ON DELETE CASCADE,
  solution TEXT
);
CREATE TABLE public.lab_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  node_type TEXT NOT NULL DEFAULT 'router' CHECK (node_type IN ('router','switch','firewall','server','pc','phone','pbx','cloud')),
  vendor TEXT,
  os_image TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (lab_id, name)
);
CREATE TABLE public.lab_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  node_a UUID NOT NULL REFERENCES public.lab_nodes(id) ON DELETE CASCADE,
  if_a TEXT,
  node_b UUID NOT NULL REFERENCES public.lab_nodes(id) ON DELETE CASCADE,
  if_b TEXT
);
CREATE TABLE public.lab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  score INTEGER NOT NULL DEFAULT 0,
  solution_viewed BOOLEAN NOT NULL DEFAULT false,
  state JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX lab_sessions_user_idx ON public.lab_sessions (user_id, lab_id);

CREATE OR REPLACE FUNCTION public.owns_lab(_lab uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.labs WHERE id = _lab AND created_by = auth.uid()
      AND public.has_instructor_perm(auth.uid(), 'labs'))
$$;
CREATE OR REPLACE FUNCTION public.can_access_lab(_lab uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.labs l WHERE l.id = _lab AND (
      public.has_role(auth.uid(), 'admin') OR l.created_by = auth.uid()
      OR (l.status = 'published'
          AND (l.access = 'free' OR public.has_active_subscription(auth.uid()))
          AND COALESCE((SELECT level FROM public.profiles WHERE user_id = auth.uid()), 1) >= l.required_level)))
$$;

ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_sessions ENABLE ROW LEVEL SECURITY;
-- Les labs publiés sont listés pour tous (le détail sensible passe par can_access_lab côté nœuds/instructions)
CREATE POLICY "View published or own labs" ON public.labs FOR SELECT USING (
  status = 'published' OR public.has_role(auth.uid(), 'admin') OR created_by = auth.uid());
CREATE POLICY "Create labs" ON public.labs FOR INSERT WITH CHECK (
  public.has_instructor_perm(auth.uid(), 'labs') AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Update own labs" ON public.labs FOR UPDATE USING (public.owns_lab(id));
CREATE POLICY "Admins delete labs" ON public.labs FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff read lab_private" ON public.lab_private FOR SELECT USING (public.owns_lab(lab_id));
CREATE POLICY "Staff write lab_private" ON public.lab_private FOR ALL USING (public.owns_lab(lab_id)) WITH CHECK (public.owns_lab(lab_id));
CREATE POLICY "Read nodes with access" ON public.lab_nodes FOR SELECT USING (public.can_access_lab(lab_id));
CREATE POLICY "Staff write nodes" ON public.lab_nodes FOR ALL USING (public.owns_lab(lab_id)) WITH CHECK (public.owns_lab(lab_id));
CREATE POLICY "Read links with access" ON public.lab_links FOR SELECT USING (public.can_access_lab(lab_id));
CREATE POLICY "Staff write links" ON public.lab_links FOR ALL USING (public.owns_lab(lab_id)) WITH CHECK (public.owns_lab(lab_id));
CREATE POLICY "Users view own lab sessions" ON public.lab_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view lab sessions" ON public.lab_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ---------- Compétences ----------
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  target_points INTEGER NOT NULL DEFAULT 1000 CHECK (target_points > 0),
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE public.user_skills (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, skill_id)
);
CREATE TABLE public.course_skills (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 100,
  PRIMARY KEY (course_id, skill_id)
);
CREATE TABLE public.lab_skills (
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 100,
  PRIMARY KEY (lab_id, skill_id)
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills viewable by all" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Admins manage skills" ON public.skills FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own skills" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view user skills" ON public.user_skills FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Course skills viewable" ON public.course_skills FOR SELECT USING (true);
CREATE POLICY "Owner manages course skills" ON public.course_skills FOR ALL USING (public.owns_course(course_id)) WITH CHECK (public.owns_course(course_id));
CREATE POLICY "Lab skills viewable" ON public.lab_skills FOR SELECT USING (true);
CREATE POLICY "Owner manages lab skills" ON public.lab_skills FOR ALL USING (public.owns_lab(lab_id)) WITH CHECK (public.owns_lab(lab_id));

-- ---------- Inscriptions / progression : plus d'écriture directe par le client ----------
ALTER TABLE public.enrollments ADD COLUMN last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();
DROP POLICY "Users can enroll themselves" ON public.enrollments;
DROP POLICY "Users can update own enrollments" ON public.enrollments;
CREATE POLICY "Users enroll with access" ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND progress = 0 AND completed = false AND public.can_access_course(course_id));
DROP POLICY "Users can insert own lesson progress" ON public.lesson_progress;
DROP POLICY "Users can update own lesson progress" ON public.lesson_progress;
REVOKE UPDATE ON public.enrollments FROM authenticated, anon;

CREATE TABLE public.course_reviews (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable" ON public.course_reviews FOR SELECT USING (true);
CREATE POLICY "Enrolled users review" ON public.course_reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = course_reviews.course_id));
CREATE POLICY "Users edit own review" ON public.course_reviews FOR UPDATE USING (auth.uid() = user_id);

-- ---------- Badges / certifications (critères déclaratifs) ----------
ALTER TABLE public.badges
  ADD COLUMN slug TEXT,
  ADD COLUMN criteria JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN xp_reward INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
UPDATE public.badges SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 4);
ALTER TABLE public.badges ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX badges_slug_key ON public.badges (slug);
CREATE POLICY "Admins update badges" ON public.badges FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete badges" ON public.badges FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certifications viewable" ON public.certifications FOR SELECT USING (true);
CREATE POLICY "Admins manage certifications" ON public.certifications FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.certificates ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE public.certificates ADD COLUMN certification_id UUID REFERENCES public.certifications(id) ON DELETE CASCADE;
ALTER TABLE public.certificates ADD CONSTRAINT certificates_user_cert_key UNIQUE (user_id, certification_id);
CREATE POLICY "Admins delete certificates" ON public.certificates FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ---------- Carrière ----------
CREATE TABLE public.career_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE public.career_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.career_tracks(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank > 0),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  UNIQUE (track_id, rank)
);
CREATE TABLE public.career_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.career_tracks(id) ON DELETE SET NULL,
  stage_rank INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.career_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tracks viewable" ON public.career_tracks FOR SELECT USING (true);
CREATE POLICY "Admins manage tracks" ON public.career_tracks FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Stages viewable" ON public.career_stages FOR SELECT USING (true);
CREATE POLICY "Admins manage stages" ON public.career_stages FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own career" ON public.career_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view careers" ON public.career_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
-- le stage est calculé côté serveur ; l'utilisateur ne peut choisir que sa filière via set_career_track()
REVOKE INSERT, UPDATE, DELETE ON public.career_profiles FROM anon, authenticated;

-- ---------- Vues catalogue (agrégats publics, exécutées avec les droits du propriétaire) ----------
CREATE VIEW public.course_catalog AS
SELECT c.id, c.slug, c.title, c.description, c.level, c.thumbnail, c.duration, c.duration_minutes,
       c.access, c.price_cents, c.required_level, c.xp_reward, c.objectives, c.prerequisites, c.created_by, c.created_at,
       cat.slug AS category_slug, cat.name AS category_name,
       COALESCE(e.students, 0) AS students, r.rating, COALESCE(r.reviews, 0) AS reviews,
       COALESCE(l.lessons_count, 0) AS lessons_count
FROM public.courses c
LEFT JOIN public.categories cat ON cat.id = c.category_id
LEFT JOIN (SELECT course_id, count(*)::int AS students FROM public.enrollments GROUP BY course_id) e ON e.course_id = c.id
LEFT JOIN (SELECT course_id, round(avg(rating), 1) AS rating, count(*)::int AS reviews FROM public.course_reviews GROUP BY course_id) r ON r.course_id = c.id
LEFT JOIN (SELECT m.course_id, count(*)::int AS lessons_count FROM public.lessons l JOIN public.modules m ON m.id = l.module_id GROUP BY m.course_id) l ON l.course_id = c.id
WHERE c.status = 'published';

CREATE VIEW public.lab_catalog AS
SELECT l.id, l.slug, l.title, l.description, l.technology, l.engine, l.engine_ref, l.difficulty, l.required_level,
       l.duration_minutes, l.objectives, l.xp_reward, l.access, l.score_max, l.pass_score,
       cat.slug AS category_slug, cat.name AS category_name,
       COALESCE(s.runs, 0) AS runs, COALESCE(s.completions, 0) AS completions
FROM public.labs l
LEFT JOIN public.categories cat ON cat.id = l.category_id
LEFT JOIN (SELECT lab_id, count(*)::int AS runs, count(*) FILTER (WHERE status = 'completed')::int AS completions
           FROM public.lab_sessions GROUP BY lab_id) s ON s.lab_id = l.id
WHERE l.status = 'published';
GRANT SELECT ON public.course_catalog, public.lab_catalog TO anon, authenticated;

-- ---------- Modules / leçons : lecture limitée aux cours publiés (ou propres), écriture au propriétaire ----------
DROP POLICY "Modules viewable by all" ON public.modules;
CREATE POLICY "View modules of visible courses" ON public.modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.status = 'published') OR public.owns_course(course_id));
DROP POLICY "Lessons viewable by all" ON public.lessons;
DROP POLICY "Admins and instructors can insert lessons" ON public.lessons;
DROP POLICY "Admins and instructors can update lessons" ON public.lessons;
DROP POLICY "Admins can delete lessons" ON public.lessons;
CREATE OR REPLACE FUNCTION public.module_course(_module uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT course_id FROM public.modules WHERE id = _module
$$;
CREATE POLICY "View lessons of visible courses" ON public.lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = public.module_course(module_id) AND c.status = 'published')
  OR public.owns_course(public.module_course(module_id)));
CREATE POLICY "Owner inserts lessons" ON public.lessons FOR INSERT WITH CHECK (public.owns_course(public.module_course(module_id)));
CREATE POLICY "Owner updates lessons" ON public.lessons FOR UPDATE USING (public.owns_course(public.module_course(module_id)));
CREATE POLICY "Owner deletes lessons" ON public.lessons FOR DELETE USING (public.owns_course(public.module_course(module_id)));
