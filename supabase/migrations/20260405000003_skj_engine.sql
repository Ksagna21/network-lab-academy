-- =====================================================================
-- SKJ Academy v2 — Phase C : moteur XP / niveaux / badges / carrière / stats
-- Toutes les écritures de progression passent par ces fonctions SECURITY DEFINER.
-- =====================================================================

-- ---------- Critères déclaratifs ----------
CREATE OR REPLACE FUNCTION public.skill_score(_uid uuid, _slug text) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(LEAST(100, COALESCE(us.points, 0) * 100 / s.target_points), 0)
  FROM public.skills s LEFT JOIN public.user_skills us ON us.skill_id = s.id AND us.user_id = _uid
  WHERE s.slug = _slug
$$;

CREATE OR REPLACE FUNCTION public.criteria_met(_uid uuid, _c jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE item jsonb; t text;
BEGIN
  IF _c IS NULL OR _c = '{}'::jsonb OR _c = 'null'::jsonb THEN RETURN true; END IF;
  IF _c ? 'all' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(_c->'all') LOOP
      IF NOT public.criteria_met(_uid, item) THEN RETURN false; END IF;
    END LOOP;
    RETURN true;
  END IF;
  IF _c ? 'any' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(_c->'any') LOOP
      IF public.criteria_met(_uid, item) THEN RETURN true; END IF;
    END LOOP;
    RETURN false;
  END IF;
  t := _c->>'type';
  IF t = 'course' THEN
    RETURN EXISTS (SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
                   WHERE e.user_id = _uid AND e.completed AND c.slug = _c->>'slug');
  ELSIF t = 'lab' THEN
    RETURN EXISTS (SELECT 1 FROM public.lab_sessions s JOIN public.labs l ON l.id = s.lab_id
                   WHERE s.user_id = _uid AND s.status = 'completed' AND l.slug = _c->>'slug');
  ELSIF t = 'courses_count' THEN
    RETURN (SELECT count(*) FROM public.enrollments WHERE user_id = _uid AND completed) >= (_c->>'min')::int;
  ELSIF t = 'labs_count' THEN
    RETURN (SELECT count(DISTINCT lab_id) FROM public.lab_sessions WHERE user_id = _uid AND status = 'completed') >= (_c->>'min')::int;
  ELSIF t = 'quizzes_count' THEN
    RETURN (SELECT count(DISTINCT quiz_id) FROM public.quiz_attempts WHERE user_id = _uid AND passed) >= (_c->>'min')::int;
  ELSIF t = 'level' THEN
    RETURN COALESCE((SELECT level FROM public.profiles WHERE user_id = _uid), 1) >= (_c->>'min')::int;
  ELSIF t = 'xp' THEN
    RETURN COALESCE((SELECT total_xp FROM public.profiles WHERE user_id = _uid), 0) >= (_c->>'min')::int;
  ELSIF t = 'skill' THEN
    RETURN public.skill_score(_uid, _c->>'slug') >= (_c->>'min')::int;
  ELSIF t = 'badge' THEN
    RETURN EXISTS (SELECT 1 FROM public.user_badges ub JOIN public.badges b ON b.id = ub.badge_id
                   WHERE ub.user_id = _uid AND b.slug = _c->>'slug');
  END IF;
  RETURN false;
END $$;

-- Rapport lisible d'un critère (pour afficher « objectifs suivants »)
CREATE OR REPLACE FUNCTION public.criteria_report(_uid uuid, _c jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE out jsonb := '[]'::jsonb; item jsonb; t text; cur int; tgt int; lbl text;
BEGIN
  IF _c IS NULL OR _c = '{}'::jsonb THEN RETURN out; END IF;
  IF _c ? 'all' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(_c->'all') LOOP
      out := out || public.criteria_report(_uid, item);
    END LOOP;
    RETURN out;
  END IF;
  IF _c ? 'any' THEN
    RETURN jsonb_build_array(jsonb_build_object('label', 'Au moins une condition parmi ' || jsonb_array_length(_c->'any'),
      'met', public.criteria_met(_uid, _c), 'current', null, 'target', null));
  END IF;
  t := _c->>'type';
  tgt := NULLIF(_c->>'min', '')::int;
  IF t = 'skill' THEN
    cur := public.skill_score(_uid, _c->>'slug');
    lbl := 'Compétence « ' || COALESCE((SELECT name FROM public.skills WHERE slug = _c->>'slug'), _c->>'slug') || ' » ≥ ' || tgt || '%';
  ELSIF t = 'level' THEN
    cur := COALESCE((SELECT level FROM public.profiles WHERE user_id = _uid), 1); lbl := 'Niveau ≥ ' || tgt;
  ELSIF t = 'xp' THEN
    cur := COALESCE((SELECT total_xp FROM public.profiles WHERE user_id = _uid), 0); lbl := tgt || ' XP';
  ELSIF t = 'courses_count' THEN
    cur := (SELECT count(*) FROM public.enrollments WHERE user_id = _uid AND completed); lbl := tgt || ' cours terminés';
  ELSIF t = 'labs_count' THEN
    cur := (SELECT count(DISTINCT lab_id) FROM public.lab_sessions WHERE user_id = _uid AND status = 'completed'); lbl := tgt || ' labs réussis';
  ELSIF t = 'quizzes_count' THEN
    cur := (SELECT count(DISTINCT quiz_id) FROM public.quiz_attempts WHERE user_id = _uid AND passed); lbl := tgt || ' quiz réussis';
  ELSIF t = 'course' THEN
    lbl := 'Terminer le cours « ' || COALESCE((SELECT title FROM public.courses WHERE slug = _c->>'slug'), _c->>'slug') || ' »';
  ELSIF t = 'lab' THEN
    lbl := 'Réussir le lab « ' || COALESCE((SELECT title FROM public.labs WHERE slug = _c->>'slug'), _c->>'slug') || ' »';
  ELSIF t = 'badge' THEN
    lbl := 'Obtenir le badge « ' || COALESCE((SELECT title FROM public.badges WHERE slug = _c->>'slug'), _c->>'slug') || ' »';
  ELSE
    lbl := COALESCE(t, 'Condition');
  END IF;
  RETURN jsonb_build_array(jsonb_build_object('label', lbl, 'met', public.criteria_met(_uid, _c), 'current', cur, 'target', tgt));
END $$;

-- ---------- XP ----------
CREATE OR REPLACE FUNCTION public.award_xp(_uid uuid, _event text, _xp integer, _ref_type text, _ref_key text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_xp int; v_total int; v_old_level int; v_new_level int; v_last date; v_streak int; v_lvl_name text;
BEGIN
  v_xp := COALESCE(_xp, (SELECT xp FROM public.xp_rules WHERE event = _event), 0);
  IF v_xp <= 0 THEN RETURN 0; END IF;
  INSERT INTO public.xp_transactions (user_id, event, xp, ref_type, ref_key)
  VALUES (_uid, _event, v_xp, _ref_type, COALESCE(_ref_key, ''))
  ON CONFLICT (user_id, event, ref_key) DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT total_xp, level, last_activity_date, current_streak INTO v_total, v_old_level, v_last, v_streak
  FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  v_total := v_total + v_xp;
  v_new_level := public.level_for_xp(v_total);
  IF v_last IS NULL OR v_last < current_date - 1 THEN v_streak := 1;
  ELSIF v_last = current_date - 1 THEN v_streak := v_streak + 1;
  END IF;
  UPDATE public.profiles SET total_xp = v_total, level = v_new_level, current_streak = v_streak,
    last_activity_date = current_date WHERE user_id = _uid;
  IF v_new_level > v_old_level THEN
    SELECT name INTO v_lvl_name FROM public.levels WHERE rank = v_new_level;
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (_uid, 'system', 'Niveau ' || v_new_level || ' atteint !', 'Vous êtes maintenant ' || COALESCE(v_lvl_name, 'niveau ' || v_new_level) || '.');
  END IF;
  RETURN v_xp;
END $$;

CREATE OR REPLACE FUNCTION public.apply_skills(_uid uuid, _kind text, _ref uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _kind = 'course' THEN
    INSERT INTO public.user_skills (user_id, skill_id, points)
    SELECT _uid, skill_id, points FROM public.course_skills WHERE course_id = _ref
    ON CONFLICT (user_id, skill_id) DO UPDATE SET points = public.user_skills.points + EXCLUDED.points;
  ELSE
    INSERT INTO public.user_skills (user_id, skill_id, points)
    SELECT _uid, skill_id, points FROM public.lab_skills WHERE lab_id = _ref
    ON CONFLICT (user_id, skill_id) DO UPDATE SET points = public.user_skills.points + EXCLUDED.points;
  END IF;
END $$;

-- ---------- Badges, certifications, carrière ----------
CREATE OR REPLACE FUNCTION public.refresh_career(_uid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_track uuid; v_rank int := 1; st record;
BEGIN
  SELECT track_id INTO v_track FROM public.career_profiles WHERE user_id = _uid;
  IF v_track IS NULL THEN
    SELECT id INTO v_track FROM public.career_tracks WHERE is_active ORDER BY sort_order LIMIT 1;
  END IF;
  IF v_track IS NULL THEN RETURN; END IF;
  FOR st IN SELECT rank, criteria FROM public.career_stages WHERE track_id = v_track ORDER BY rank LOOP
    IF public.criteria_met(_uid, st.criteria) THEN v_rank := st.rank; ELSE EXIT; END IF;
  END LOOP;
  INSERT INTO public.career_profiles (user_id, track_id, stage_rank) VALUES (_uid, v_track, v_rank)
  ON CONFLICT (user_id) DO UPDATE SET stage_rank = EXCLUDED.stage_rank,
    track_id = COALESCE(public.career_profiles.track_id, EXCLUDED.track_id), updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.evaluate_awards(_uid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b record; c record; pass int := 0; changed boolean := true;
BEGIN
  WHILE changed AND pass < 4 LOOP
    changed := false; pass := pass + 1;
    FOR b IN SELECT * FROM public.badges bd WHERE bd.is_active AND bd.criteria <> '{}'::jsonb
             AND NOT EXISTS (SELECT 1 FROM public.user_badges ub WHERE ub.user_id = _uid AND ub.badge_id = bd.id) LOOP
      IF public.criteria_met(_uid, b.criteria) THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (_uid, b.id) ON CONFLICT DO NOTHING;
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (_uid, 'badge_earned', 'Badge obtenu : ' || b.title, b.description);
        PERFORM public.award_xp(_uid, 'badge_earned', NULLIF(b.xp_reward, 0), 'badge', b.id::text);
        changed := true;
      END IF;
    END LOOP;
    FOR c IN SELECT * FROM public.certifications ct WHERE ct.is_active AND ct.criteria <> '{}'::jsonb
             AND NOT EXISTS (SELECT 1 FROM public.certificates x WHERE x.user_id = _uid AND x.certification_id = ct.id) LOOP
      IF public.criteria_met(_uid, c.criteria) THEN
        INSERT INTO public.certificates (user_id, certification_id, certificate_number)
        VALUES (_uid, c.id, 'SKJ-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)))
        ON CONFLICT DO NOTHING;
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (_uid, 'system', 'Certification obtenue : ' || c.title, c.description);
        PERFORM public.award_xp(_uid, 'certification', NULLIF(c.xp_reward, 0), 'certification', c.id::text);
        changed := true;
      END IF;
    END LOOP;
  END LOOP;
  PERFORM public.refresh_career(_uid);
END $$;

-- ---------- Leçons ----------
CREATE OR REPLACE FUNCTION public.finish_lesson(_uid uuid, _lesson uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course uuid; v_total int; v_done int;
BEGIN
  SELECT m.course_id INTO v_course FROM public.lessons l JOIN public.modules m ON m.id = l.module_id WHERE l.id = _lesson;
  IF v_course IS NULL THEN RAISE EXCEPTION 'Leçon introuvable'; END IF;
  INSERT INTO public.enrollments (user_id, course_id) VALUES (_uid, v_course) ON CONFLICT DO NOTHING;
  INSERT INTO public.lesson_progress (user_id, lesson_id, completed, completed_at) VALUES (_uid, _lesson, true, now())
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true,
    completed_at = COALESCE(public.lesson_progress.completed_at, now());
  PERFORM public.award_xp(_uid, 'lesson_completed', NULL, 'lesson', _lesson::text);
  SELECT count(*) INTO v_total FROM public.lessons l JOIN public.modules m ON m.id = l.module_id WHERE m.course_id = v_course;
  SELECT count(*) INTO v_done FROM public.lesson_progress lp JOIN public.lessons l ON l.id = lp.lesson_id
    JOIN public.modules m ON m.id = l.module_id WHERE lp.user_id = _uid AND lp.completed AND m.course_id = v_course;
  UPDATE public.enrollments SET progress = CASE WHEN v_total = 0 THEN 0 ELSE LEAST(100, v_done * 100 / v_total) END,
    last_activity_at = now() WHERE user_id = _uid AND course_id = v_course;
  IF v_total > 0 AND v_done >= v_total THEN
    UPDATE public.enrollments SET completed = true, completed_at = now()
      WHERE user_id = _uid AND course_id = v_course AND NOT completed;
    IF FOUND THEN
      PERFORM public.award_xp(_uid, 'course_completed', (SELECT xp_reward FROM public.courses WHERE id = v_course), 'course', v_course::text);
      PERFORM public.apply_skills(_uid, 'course', v_course);
    END IF;
  END IF;
  PERFORM public.evaluate_awards(_uid);
END $$;

CREATE OR REPLACE FUNCTION public.complete_lesson(_lesson uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type public.lesson_type;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  IF NOT public.can_read_lesson(_lesson) THEN RAISE EXCEPTION 'Accès refusé à cette leçon'; END IF;
  SELECT type INTO v_type FROM public.lessons WHERE id = _lesson;
  IF v_type IN ('quiz', 'exam', 'lab') THEN
    RAISE EXCEPTION 'Cette leçon se valide en réussissant son quiz / lab';
  END IF;
  PERFORM public.finish_lesson(auth.uid(), _lesson);
END $$;

CREATE OR REPLACE FUNCTION public.enroll_course(_course uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  IF NOT public.can_access_course(_course) THEN RAISE EXCEPTION 'Accès refusé : contenu premium ou niveau insuffisant'; END IF;
  INSERT INTO public.enrollments (user_id, course_id) VALUES (auth.uid(), _course) ON CONFLICT DO NOTHING;
END $$;

-- ---------- Quiz ----------
CREATE OR REPLACE FUNCTION public.submit_quiz(_quiz uuid, _answers jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q record; v_total int := 0; v_ok int := 0; v_score int; v_pass int; v_passed boolean; v_xp int := 0;
        results jsonb := '[]'::jsonb; given jsonb; right_ok boolean; l record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  IF NOT public.can_read_quiz(_quiz) THEN RAISE EXCEPTION 'Accès refusé à ce quiz'; END IF;
  SELECT pass_score INTO v_pass FROM public.quizzes WHERE id = _quiz;
  FOR q IN SELECT x.id, a.correct, a.explanation FROM public.questions x
           JOIN public.question_answers a ON a.question_id = x.id WHERE x.quiz_id = _quiz ORDER BY x.sort_order LOOP
    v_total := v_total + 1;
    given := COALESCE(_answers -> q.id::text, '[]'::jsonb);
    right_ok := (SELECT COALESCE(jsonb_agg(v ORDER BY v), '[]') FROM jsonb_array_elements_text(given) v)
              = (SELECT COALESCE(jsonb_agg(v ORDER BY v), '[]') FROM jsonb_array_elements_text(q.correct) v);
    IF right_ok THEN v_ok := v_ok + 1; END IF;
    results := results || jsonb_build_object('question_id', q.id, 'correct', right_ok,
      'correct_answer', q.correct, 'explanation', q.explanation);
  END LOOP;
  IF v_total = 0 THEN RAISE EXCEPTION 'Quiz vide'; END IF;
  v_score := round(v_ok * 100.0 / v_total);
  v_passed := v_score >= v_pass;
  INSERT INTO public.quiz_attempts (user_id, quiz_id, score, passed, answers) VALUES (auth.uid(), _quiz, v_score, v_passed, _answers);
  IF v_passed THEN
    v_xp := public.award_xp(auth.uid(), 'quiz_passed', NULL, 'quiz', _quiz::text);
    FOR l IN SELECT id FROM public.lessons WHERE quiz_id = _quiz LOOP
      PERFORM public.finish_lesson(auth.uid(), l.id);
    END LOOP;
    PERFORM public.evaluate_awards(auth.uid());
  END IF;
  RETURN jsonb_build_object('score', v_score, 'passed', v_passed, 'pass_score', v_pass, 'xp_awarded', v_xp,
    'correct', v_ok, 'total', v_total, 'results', results);
END $$;

-- ---------- Labs ----------
CREATE OR REPLACE FUNCTION public.start_lab(_lab uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  IF NOT public.can_access_lab(_lab) THEN RAISE EXCEPTION 'Accès refusé : lab premium ou niveau insuffisant'; END IF;
  SELECT id INTO v_id FROM public.lab_sessions WHERE user_id = auth.uid() AND lab_id = _lab AND status = 'active' ORDER BY started_at DESC LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO public.lab_sessions (user_id, lab_id) VALUES (auth.uid(), _lab) RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.reveal_lab_solution(_session uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lab uuid; v_sol text;
BEGIN
  SELECT lab_id INTO v_lab FROM public.lab_sessions WHERE id = _session AND user_id = auth.uid();
  IF v_lab IS NULL THEN RAISE EXCEPTION 'Session introuvable'; END IF;
  UPDATE public.lab_sessions SET solution_viewed = true WHERE id = _session;
  SELECT solution INTO v_sol FROM public.lab_private WHERE lab_id = v_lab;
  RETURN v_sol;
END $$;

-- NB : pour les labs simulés côté navigateur (cisco-sim, linux-sim) le score est déclaré par le client.
-- L'XP reste plafonnée à 1 attribution par lab ; la validation serveur viendra avec les moteurs externes.
CREATE OR REPLACE FUNCTION public.finish_lab(_session uuid, _score integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; l record; v_xp int; v_base int; v_passed boolean; v_first boolean; v_awarded int := 0;
BEGIN
  SELECT * INTO s FROM public.lab_sessions WHERE id = _session AND user_id = auth.uid();
  IF s.id IS NULL THEN RAISE EXCEPTION 'Session introuvable'; END IF;
  SELECT * INTO l FROM public.labs WHERE id = s.lab_id;
  _score := GREATEST(0, LEAST(_score, l.score_max));
  v_passed := (_score * 100 / l.score_max) >= l.pass_score;
  IF NOT v_passed THEN
    UPDATE public.lab_sessions SET score = GREATEST(score, _score) WHERE id = _session;
    RETURN jsonb_build_object('passed', false, 'score', _score, 'xp_awarded', 0);
  END IF;
  v_first := NOT EXISTS (SELECT 1 FROM public.lab_sessions WHERE user_id = s.user_id AND lab_id = s.lab_id AND status = 'completed');
  UPDATE public.lab_sessions SET status = 'completed', score = _score, finished_at = now() WHERE id = _session;
  IF v_first THEN
    v_base := COALESCE(l.xp_reward, (SELECT xp FROM public.xp_rules WHERE event = CASE WHEN l.difficulty IN ('advanced','expert') THEN 'lab_advanced_completed' ELSE 'lab_completed' END), 0);
    v_xp := CASE WHEN s.solution_viewed THEN v_base / 2 ELSE v_base END;
    v_awarded := public.award_xp(s.user_id, 'lab_completed', v_xp, 'lab', l.id::text);
    PERFORM public.apply_skills(s.user_id, 'lab', l.id);
    PERFORM public.finish_lesson(s.user_id, x.id) FROM public.lessons x WHERE x.lab_id = l.id;
  END IF;
  PERFORM public.evaluate_awards(s.user_id);
  RETURN jsonb_build_object('passed', true, 'score', _score, 'xp_awarded', v_awarded, 'first_completion', v_first);
END $$;

-- ---------- Carrière : choix de filière ----------
CREATE OR REPLACE FUNCTION public.set_career_track(_track uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.career_tracks WHERE id = _track AND is_active) THEN RAISE EXCEPTION 'Filière inconnue'; END IF;
  INSERT INTO public.career_profiles (user_id, track_id) VALUES (auth.uid(), _track)
  ON CONFLICT (user_id) DO UPDATE SET track_id = EXCLUDED.track_id, updated_at = now();
  PERFORM public.refresh_career(auth.uid());
END $$;

-- ---------- Recommandations ----------
CREATE OR REPLACE FUNCTION public.get_recommendations(_limit integer DEFAULT 4) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_level int; courses jsonb; labs jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('courses', '[]'::jsonb, 'labs', '[]'::jsonb); END IF;
  SELECT level INTO v_level FROM public.profiles WHERE user_id = v_uid;
  SELECT COALESCE(jsonb_agg(r), '[]') INTO courses FROM (
    SELECT c.id, c.slug, c.title, c.level, c.access, c.required_level, c.thumbnail,
      (SELECT s.name FROM public.course_skills cs JOIN public.skills s ON s.id = cs.skill_id
         WHERE cs.course_id = c.id ORDER BY public.skill_score(v_uid, s.slug) LIMIT 1) AS reason_skill,
      (SELECT COALESCE(sum((100 - public.skill_score(v_uid, s.slug)) * cs.points), 0)
         FROM public.course_skills cs JOIN public.skills s ON s.id = cs.skill_id WHERE cs.course_id = c.id) AS gap_score
    FROM public.courses c
    WHERE c.status = 'published' AND c.required_level <= v_level + 1
      AND NOT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = v_uid AND e.course_id = c.id AND e.completed)
    ORDER BY (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = v_uid AND e.course_id = c.id)) DESC,
             gap_score DESC, c.required_level, c.sort_order
    LIMIT _limit) r;
  SELECT COALESCE(jsonb_agg(r), '[]') INTO labs FROM (
    SELECT l.id, l.slug, l.title, l.technology, l.difficulty, l.access, l.required_level, l.duration_minutes,
      (SELECT COALESCE(sum((100 - public.skill_score(v_uid, s.slug)) * ls.points), 0)
         FROM public.lab_skills ls JOIN public.skills s ON s.id = ls.skill_id WHERE ls.lab_id = l.id) AS gap_score
    FROM public.labs l
    WHERE l.status = 'published' AND l.required_level <= v_level + 1
      AND NOT EXISTS (SELECT 1 FROM public.lab_sessions s WHERE s.user_id = v_uid AND s.lab_id = l.id AND s.status = 'completed')
    ORDER BY gap_score DESC, l.required_level
    LIMIT _limit) r;
  RETURN jsonb_build_object('courses', courses, 'labs', labs);
END $$;

-- ---------- Carrière : synthèse complète ----------
CREATE OR REPLACE FUNCTION public.career_summary(_uid uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; v_track record; v_stage record; v_next record; lvl record; nxt record; res jsonb;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE user_id = _uid;
  SELECT t.* INTO v_track FROM public.career_profiles cp JOIN public.career_tracks t ON t.id = cp.track_id WHERE cp.user_id = _uid;
  IF v_track.id IS NULL THEN SELECT * INTO v_track FROM public.career_tracks WHERE is_active ORDER BY sort_order LIMIT 1; END IF;
  SELECT s.* INTO v_stage FROM public.career_stages s
    WHERE s.track_id = v_track.id AND s.rank = COALESCE((SELECT stage_rank FROM public.career_profiles WHERE user_id = _uid), 1);
  SELECT s.* INTO v_next FROM public.career_stages s WHERE s.track_id = v_track.id AND s.rank > COALESCE(v_stage.rank, 0) ORDER BY s.rank LIMIT 1;
  SELECT * INTO lvl FROM public.levels WHERE rank = p.level;
  SELECT * INTO nxt FROM public.levels WHERE rank > p.level ORDER BY rank LIMIT 1;
  res := jsonb_build_object(
    'level', jsonb_build_object('rank', p.level, 'name', lvl.name, 'xp', p.total_xp, 'level_min_xp', lvl.min_xp,
       'next_name', nxt.name, 'next_min_xp', nxt.min_xp),
    'streak', p.current_streak,
    'track', CASE WHEN v_track.id IS NULL THEN NULL ELSE jsonb_build_object('id', v_track.id, 'slug', v_track.slug, 'name', v_track.name) END,
    'stage', CASE WHEN v_stage.id IS NULL THEN NULL ELSE jsonb_build_object('rank', v_stage.rank, 'name', v_stage.name, 'description', v_stage.description) END,
    'next_stage', CASE WHEN v_next.id IS NULL THEN NULL ELSE jsonb_build_object('rank', v_next.rank, 'name', v_next.name,
       'requirements', public.criteria_report(_uid, v_next.criteria)) END,
    'stages', (SELECT COALESCE(jsonb_agg(jsonb_build_object('rank', s.rank, 'name', s.name) ORDER BY s.rank), '[]')
               FROM public.career_stages s WHERE s.track_id = v_track.id),
    'skills', (SELECT COALESCE(jsonb_agg(jsonb_build_object('slug', s.slug, 'name', s.name,
                 'score', public.skill_score(_uid, s.slug)) ORDER BY s.sort_order), '[]') FROM public.skills s),
    'counts', jsonb_build_object(
       'courses_completed', (SELECT count(*) FROM public.enrollments WHERE user_id = _uid AND completed),
       'courses_started', (SELECT count(*) FROM public.enrollments WHERE user_id = _uid AND NOT completed),
       'labs_completed', (SELECT count(DISTINCT lab_id) FROM public.lab_sessions WHERE user_id = _uid AND status = 'completed'),
       'quizzes_passed', (SELECT count(DISTINCT quiz_id) FROM public.quiz_attempts WHERE user_id = _uid AND passed),
       'badges', (SELECT count(*) FROM public.user_badges WHERE user_id = _uid),
       'certifications', (SELECT count(*) FROM public.certificates WHERE user_id = _uid)),
    'badges', (SELECT COALESCE(jsonb_agg(jsonb_build_object('title', b.title, 'description', b.description, 'icon', b.icon,
                 'earned_at', ub.earned_at) ORDER BY ub.earned_at DESC), '[]')
               FROM public.user_badges ub JOIN public.badges b ON b.id = ub.badge_id WHERE ub.user_id = _uid),
    'certifications', (SELECT COALESCE(jsonb_agg(jsonb_build_object('title', COALESCE(ct.title, c.title, 'Attestation'), 'number', x.certificate_number,
                 'issued_at', x.issued_at) ORDER BY x.issued_at DESC), '[]')
               FROM public.certificates x LEFT JOIN public.certifications ct ON ct.id = x.certification_id
               LEFT JOIN public.courses c ON c.id = x.course_id WHERE x.user_id = _uid)
  );
  RETURN res;
END $$;

CREATE OR REPLACE FUNCTION public.my_career() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  res := public.career_summary(auth.uid());
  res := res || jsonb_build_object('history', (SELECT COALESCE(jsonb_agg(h), '[]') FROM (
      SELECT event, xp, ref_type, created_at FROM public.xp_transactions WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 20) h));
  RETURN res;
END $$;

-- ---------- Profil public & communauté (respecte la visibilité choisie) ----------
CREATE OR REPLACE FUNCTION public.get_public_career(_handle text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; s jsonb; vis jsonb; res jsonb;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE lower(handle) = lower(_handle) AND is_public AND is_active;
  IF p.user_id IS NULL THEN RETURN NULL; END IF;
  vis := p.visibility; s := public.career_summary(p.user_id);
  res := jsonb_build_object('handle', p.handle, 'full_name', p.full_name, 'avatar_url', p.avatar_url,
    'headline', p.headline, 'bio', p.bio, 'member_since', p.created_at,
    'level', jsonb_build_object('rank', s->'level'->'rank', 'name', s->'level'->'name'),
    'stage', s->'stage', 'track', s->'track');
  IF COALESCE((vis->>'xp')::boolean, true) THEN res := jsonb_set(res, '{level,xp}', s->'level'->'xp'); END IF;
  IF COALESCE((vis->>'skills')::boolean, true) THEN res := res || jsonb_build_object('skills', s->'skills'); END IF;
  IF COALESCE((vis->>'badges')::boolean, true) THEN res := res || jsonb_build_object('badges', s->'badges'); END IF;
  IF COALESCE((vis->>'certifications')::boolean, true) THEN res := res || jsonb_build_object('certifications', s->'certifications'); END IF;
  res := res || jsonb_build_object('counts', jsonb_strip_nulls(jsonb_build_object(
    'courses_completed', CASE WHEN COALESCE((vis->>'courses')::boolean, true) THEN s->'counts'->'courses_completed' END,
    'labs_completed', CASE WHEN COALESCE((vis->>'labs')::boolean, true) THEN s->'counts'->'labs_completed' END,
    'badges', CASE WHEN COALESCE((vis->>'badges')::boolean, true) THEN s->'counts'->'badges' END,
    'certifications', CASE WHEN COALESCE((vis->>'certifications')::boolean, true) THEN s->'counts'->'certifications' END)));
  RETURN res;
END $$;

CREATE OR REPLACE FUNCTION public.community_leaderboard(
  _limit integer DEFAULT 50, _min_level integer DEFAULT NULL, _skill text DEFAULT NULL,
  _min_skill integer DEFAULT 0, _track text DEFAULT NULL, _order text DEFAULT 'xp')
RETURNS TABLE (rank bigint, handle text, full_name text, avatar_url text, level integer, level_name text,
               total_xp integer, stage_name text, badges_count bigint, skill_score integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT row_number() OVER (ORDER BY
           CASE _order WHEN 'level' THEN p.level WHEN 'badges' THEN b.n::int WHEN 'skill' THEN COALESCE(public.skill_score(p.user_id, _skill), 0) ELSE p.total_xp END DESC,
           p.total_xp DESC, p.created_at) AS rank,
         p.handle, p.full_name, p.avatar_url, p.level, lv.name,
         CASE WHEN COALESCE((p.visibility->>'xp')::boolean, true) THEN p.total_xp END,
         st.name, b.n,
         CASE WHEN _skill IS NULL THEN NULL ELSE public.skill_score(p.user_id, _skill) END
  FROM public.profiles p
  LEFT JOIN public.levels lv ON lv.rank = p.level
  LEFT JOIN public.career_profiles cp ON cp.user_id = p.user_id
  LEFT JOIN public.career_tracks t ON t.id = cp.track_id
  LEFT JOIN public.career_stages st ON st.track_id = cp.track_id AND st.rank = cp.stage_rank
  LEFT JOIN LATERAL (SELECT count(*) AS n FROM public.user_badges ub WHERE ub.user_id = p.user_id
                     AND COALESCE((p.visibility->>'badges')::boolean, true)) b ON true
  WHERE p.is_public AND p.is_active
    AND (_min_level IS NULL OR p.level >= _min_level)
    AND (_track IS NULL OR t.slug = _track)
    AND (_skill IS NULL OR public.skill_score(p.user_id, _skill) >= _min_skill)
  ORDER BY 1
  LIMIT LEAST(_limit, 200)
$$;

CREATE OR REPLACE FUNCTION public.verify_certificate(_number text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('valid', true, 'number', x.certificate_number, 'issued_at', x.issued_at,
           'title', COALESCE(ct.title, c.title, 'Attestation'), 'holder', p.full_name)
  FROM public.certificates x JOIN public.profiles p ON p.user_id = x.user_id
  LEFT JOIN public.certifications ct ON ct.id = x.certification_id LEFT JOIN public.courses c ON c.id = x.course_id
  WHERE x.certificate_number = _number
$$;

-- ---------- Administration ----------
CREATE OR REPLACE FUNCTION public.admin_list_users() RETURNS TABLE (
  user_id uuid, email text, full_name text, handle text, is_active boolean, level integer, total_xp integer,
  roles text[], enrolled bigint, completed bigint, labs_done bigint, premium boolean, created_at timestamptz, last_activity date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  RETURN QUERY
  SELECT p.user_id, u.email::text, p.full_name, p.handle, p.is_active, p.level, p.total_xp,
    COALESCE((SELECT array_agg(r.role::text) FROM public.user_roles r WHERE r.user_id = p.user_id), '{}'),
    (SELECT count(*) FROM public.enrollments e WHERE e.user_id = p.user_id),
    (SELECT count(*) FROM public.enrollments e WHERE e.user_id = p.user_id AND e.completed),
    (SELECT count(DISTINCT s.lab_id) FROM public.lab_sessions s WHERE s.user_id = p.user_id AND s.status = 'completed'),
    public.has_active_subscription(p.user_id), p.created_at, p.last_activity_date
  FROM public.profiles p JOIN auth.users u ON u.id = p.user_id ORDER BY p.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_user_active(_uid uuid, _active boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  IF _uid = auth.uid() AND NOT _active THEN RAISE EXCEPTION 'Vous ne pouvez pas vous désactiver vous-même'; END IF;
  UPDATE public.profiles SET is_active = _active WHERE user_id = _uid;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_uid uuid, _role public.app_role, _enabled boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role) ON CONFLICT DO NOTHING;
  ELSE
    IF _role = 'admin' AND _uid = auth.uid() THEN RAISE EXCEPTION 'Vous ne pouvez pas retirer votre propre rôle admin'; END IF;
    DELETE FROM public.user_roles WHERE user_id = _uid AND role = _role;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_grant_premium(_uid uuid, _days integer, _plan text DEFAULT 'premium') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  IF _days <= 0 THEN
    UPDATE public.subscriptions SET status = 'canceled' WHERE user_id = _uid AND status IN ('active','trialing');
  ELSE
    INSERT INTO public.subscriptions (user_id, plan_key, status, provider, current_period_end)
    VALUES (_uid, _plan, 'active', 'manual', now() + make_interval(days => _days));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_user_career(_uid uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  RETURN public.career_summary(_uid) || jsonb_build_object('history', (SELECT COALESCE(jsonb_agg(h), '[]') FROM (
    SELECT event, xp, ref_type, created_at FROM public.xp_transactions WHERE user_id = _uid ORDER BY created_at DESC LIMIT 20) h));
END $$;

CREATE OR REPLACE FUNCTION public.admin_stats() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb; v_users int; v_enr int; v_done int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  SELECT count(*) INTO v_users FROM public.profiles;
  SELECT count(*), count(*) FILTER (WHERE completed) INTO v_enr, v_done FROM public.enrollments;
  res := jsonb_build_object(
    'users', v_users,
    'active_users_30d', (SELECT count(DISTINCT user_id) FROM public.xp_transactions WHERE created_at > now() - interval '30 days'),
    'courses', (SELECT count(*) FROM public.courses),
    'published_courses', (SELECT count(*) FROM public.courses WHERE status = 'published'),
    'labs', (SELECT count(*) FROM public.labs),
    'published_labs', (SELECT count(*) FROM public.labs WHERE status = 'published'),
    'enrollments', v_enr,
    'completion_rate', CASE WHEN v_enr = 0 THEN 0 ELSE round(v_done * 100.0 / v_enr) END,
    'avg_progress', COALESCE((SELECT round(avg(progress)) FROM public.enrollments), 0),
    'premium_users', (SELECT count(DISTINCT user_id) FROM public.subscriptions WHERE status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end > now())),
    'levels', (SELECT COALESCE(jsonb_agg(jsonb_build_object('rank', l.rank, 'name', l.name,
                 'users', (SELECT count(*) FROM public.profiles p WHERE p.level = l.rank)) ORDER BY l.rank), '[]') FROM public.levels l),
    'signups', (SELECT COALESCE(jsonb_agg(jsonb_build_object('month', m, 'count', n) ORDER BY m), '[]')
                FROM (SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') m, count(*) n FROM public.profiles
                      WHERE created_at > now() - interval '12 months' GROUP BY 1) s),
    'top_courses', (SELECT COALESCE(jsonb_agg(t), '[]') FROM (
        SELECT c.title, count(e.*) AS students, count(e.*) FILTER (WHERE e.completed) AS completed
        FROM public.courses c LEFT JOIN public.enrollments e ON e.course_id = c.id GROUP BY c.id ORDER BY students DESC LIMIT 5) t),
    'top_labs', (SELECT COALESCE(jsonb_agg(t), '[]') FROM (
        SELECT l.title, count(s.*) AS runs, count(s.*) FILTER (WHERE s.status = 'completed') AS completions
        FROM public.labs l LEFT JOIN public.lab_sessions s ON s.lab_id = l.id GROUP BY l.id ORDER BY runs DESC LIMIT 5) t),
    'recent_activity', (SELECT COALESCE(jsonb_agg(a), '[]') FROM (
        SELECT p.full_name, x.event, x.xp, x.created_at FROM public.xp_transactions x
        JOIN public.profiles p ON p.user_id = x.user_id ORDER BY x.created_at DESC LIMIT 10) a));
  RETURN res;
END $$;

-- ---------- Droits d'exécution ----------
-- Fonctions internes : jamais appelables depuis le client
REVOKE ALL ON FUNCTION public.award_xp(uuid, text, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_skills(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.evaluate_awards(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_career(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_lesson(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.career_summary(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.criteria_met(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.criteria_report(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.skill_score(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, integer, text, text), public.apply_skills(uuid, text, uuid),
  public.evaluate_awards(uuid), public.refresh_career(uuid), public.finish_lesson(uuid, uuid) TO service_role;
-- API publique pour utilisateurs connectés
REVOKE ALL ON FUNCTION public.complete_lesson(uuid), public.enroll_course(uuid), public.submit_quiz(uuid, jsonb),
  public.start_lab(uuid), public.reveal_lab_solution(uuid), public.finish_lab(uuid, integer),
  public.set_career_track(uuid), public.get_recommendations(integer), public.my_career(),
  public.admin_list_users(), public.admin_set_user_active(uuid, boolean),
  public.admin_set_user_role(uuid, public.app_role, boolean), public.admin_grant_premium(uuid, integer, text),
  public.admin_stats(), public.admin_user_career(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_lesson(uuid), public.enroll_course(uuid), public.submit_quiz(uuid, jsonb),
  public.start_lab(uuid), public.reveal_lab_solution(uuid), public.finish_lab(uuid, integer),
  public.set_career_track(uuid), public.get_recommendations(integer), public.my_career(),
  public.admin_list_users(), public.admin_set_user_active(uuid, boolean),
  public.admin_set_user_role(uuid, public.app_role, boolean), public.admin_grant_premium(uuid, integer, text),
  public.admin_stats(), public.admin_user_career(uuid) TO authenticated;
-- Lecture publique
GRANT EXECUTE ON FUNCTION public.get_public_career(text), public.community_leaderboard(integer, integer, text, integer, text, text),
  public.verify_certificate(text) TO anon, authenticated;
