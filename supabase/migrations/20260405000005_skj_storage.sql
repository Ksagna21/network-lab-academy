-- Buckets Storage : avatars (écriture dans son propre dossier) et médias de cours (staff)
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE NOTICE 'storage schema absent : migration ignorée';
    RETURN;
  END IF;
  INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true), ('course-media', 'course-media', true)
  ON CONFLICT (id) DO NOTHING;

  EXECUTE $p$CREATE POLICY "Avatars readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars')$p$;
  EXECUTE $p$CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)$p$;
  EXECUTE $p$CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)$p$;
  EXECUTE $p$CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)$p$;
  EXECUTE $p$CREATE POLICY "Course media readable" ON storage.objects FOR SELECT USING (bucket_id = 'course-media')$p$;
  EXECUTE $p$CREATE POLICY "Staff manage course media" ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'course-media' AND public.is_staff(auth.uid()))
    WITH CHECK (bucket_id = 'course-media' AND public.is_staff(auth.uid()))$p$;
END $$;
