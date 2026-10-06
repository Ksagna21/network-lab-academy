-- =====================================================================
-- SKJ Academy v2 — Phase D : données de référence (modifiables via l'admin)
-- =====================================================================

INSERT INTO public.levels (rank, key, name, min_xp, description, color) VALUES
  (1, 'beginner',     'Beginner',     0,    'Premiers pas dans les réseaux et les systèmes', '#94a3b8'),
  (2, 'foundation',   'Foundation',   300,  'Les bases sont acquises',                       '#22c55e'),
  (3, 'junior',       'Junior',       800,  'Capable de réaliser des tâches guidées',        '#06b6d4'),
  (4, 'intermediate', 'Intermediate', 1600, 'Autonome sur les technologies courantes',       '#3b82f6'),
  (5, 'advanced',     'Advanced',     2800, 'Maîtrise des architectures et du dépannage',    '#8b5cf6'),
  (6, 'senior',       'Senior',       4500, 'Référent technique',                            '#f59e0b'),
  (7, 'expert',       'Expert',       7000, 'Expertise reconnue',                            '#ef4444');

INSERT INTO public.xp_rules (event, xp, label, description) VALUES
  ('lesson_completed',       20,  'Leçon terminée',      'Attribué une fois par leçon'),
  ('course_completed',       100, 'Cours terminé',       'Valeur par défaut (surchargée par xp_reward du cours)'),
  ('quiz_passed',            50,  'Quiz réussi',         'Attribué une fois par quiz'),
  ('lab_completed',          150, 'Lab terminé',         'Labs débutant / intermédiaire (surchargé par xp_reward du lab)'),
  ('lab_advanced_completed', 300, 'Lab avancé réussi',   'Labs avancé / expert (surchargé par xp_reward du lab)'),
  ('certification',          500, 'Certification',       'Valeur par défaut (surchargée par la certification)'),
  ('badge_earned',           0,   'Badge obtenu',        'Valeur par défaut (surchargée par le badge)');

INSERT INTO public.categories (slug, name, description, icon, color, sort_order) VALUES
  ('networking', 'Networking', 'TCP/IP, VLAN, routage, MPLS, QoS, VPN',      'network', '#3b82f6', 1),
  ('cisco',      'Cisco',      'IOS / IOS-XE, switching, routage, CCNA/CCNP', 'router',  '#0ea5e9', 2),
  ('juniper',    'Juniper',    'Junos, routage, EVPN',                        'server',  '#22c55e', 3),
  ('arista',     'Arista',     'EOS, data center, EVPN',                      'layers',  '#f97316', 4),
  ('linux',      'Linux',      'CLI, administration, services, réseau',       'terminal','#eab308', 5),
  ('voip',       'VoIP',       'SIP, RTP, Asterisk, FreePBX, SBC',            'phone',   '#a855f7', 6),
  ('security',   'Security',   'Hardening, firewalls, monitoring, SOC',       'shield',  '#ef4444', 7);

INSERT INTO public.skills (slug, name, category_id, target_points, sort_order)
SELECT s.slug, s.name, (SELECT id FROM public.categories WHERE slug = s.cat), 600, s.ord FROM (VALUES
  ('networking', 'Networking', 'networking', 1), ('routing', 'Routing', 'networking', 2),
  ('switching', 'Switching', 'networking', 3), ('cisco', 'Cisco', 'cisco', 4),
  ('juniper', 'Juniper', 'juniper', 5), ('arista', 'Arista', 'arista', 6),
  ('linux', 'Linux', 'linux', 7), ('voip', 'VoIP', 'voip', 8), ('security', 'Security', 'security', 9)
) AS s(slug, name, cat, ord);

INSERT INTO public.plans (key, name, price_cents, billing_interval, features) VALUES
  ('free',    'Free',    0,    'month', '["Cours et labs gratuits","Progression, XP et badges","Profil carrière"]'),
  ('premium', 'Premium', 1900, 'month', '["Tous les cours premium","Tous les labs premium","Certifications","Support prioritaire"]');

INSERT INTO public.app_settings (key, value) VALUES
  ('site', '{"name":"SKJ Academy","tagline":"Learn. Practice. Build your Network Career.","support_email":"support@skj-academy.local"}');

-- ---------- Badges ----------
INSERT INTO public.badges (slug, title, description, icon, criteria, xp_reward) VALUES
  ('first-steps',        'First Steps',          'Premier cours terminé',                    'rocket',  '{"type":"courses_count","min":1}', 50),
  ('lab-rookie',         'Lab Rookie',           'Premier lab réussi',                       'flask',   '{"type":"labs_count","min":1}', 50),
  ('quiz-master',        'Quiz Master',          '5 quiz réussis',                           'brain',   '{"type":"quizzes_count","min":5}', 100),
  ('linux-fundamentals', 'Linux Fundamentals',   'Cours Linux Fundamentals terminé',         'terminal','{"type":"course","slug":"linux-fundamentals"}', 100),
  ('linux-administrator','Linux Administrator',  'Fondamentaux + administration serveur',    'server',  '{"all":[{"type":"course","slug":"linux-fundamentals"},{"type":"course","slug":"linux-server-admin"}]}', 200),
  ('cisco-fundamentals', 'Cisco Fundamentals',   'Cours Cisco IOS Fundamentals terminé',     'router',  '{"type":"course","slug":"cisco-ios-fundamentals"}', 100),
  ('routing-specialist', 'Routing Specialist',   'Compétence Routing ≥ 60 %',                'route',   '{"type":"skill","slug":"routing","min":60}', 200),
  ('ospf-practitioner',  'OSPF Practitioner',    'Cours OSPF terminé',                       'network', '{"type":"course","slug":"ospf-fundamentals"}', 100),
  ('voip-fundamentals',  'VoIP Fundamentals',    'Cours VoIP & SIP terminé',                 'phone',   '{"type":"course","slug":"voip-fundamentals-sip"}', 100),
  ('network-troubleshooter','Network Troubleshooter','3 labs réussis',                       'wrench',  '{"type":"labs_count","min":3}', 150),
  ('security-aware',     'Security Aware',       'Cours Security Fundamentals terminé',      'shield',  '{"type":"course","slug":"security-fundamentals"}', 100),
  ('level-4',            'Intermediate Club',    'Niveau 4 atteint',                         'star',    '{"type":"level","min":4}', 150),
  ('skj-network-engineer','SKJ Network Engineer','Parcours Network Engineer validé',         'award',   '{"all":[{"type":"course","slug":"network-fundamentals"},{"type":"course","slug":"cisco-ios-fundamentals"},{"type":"course","slug":"ospf-fundamentals"},{"type":"labs_count","min":3},{"type":"skill","slug":"networking","min":50}]}', 300);

-- ---------- Certifications ----------
INSERT INTO public.certifications (slug, title, description, criteria, xp_reward) VALUES
  ('cert-linux-fundamentals', 'SKJ Certified — Linux Fundamentals', 'Maîtrise des bases de Linux (cours + quiz).',
   '{"all":[{"type":"course","slug":"linux-fundamentals"},{"type":"skill","slug":"linux","min":30}]}', 300),
  ('cert-network-fundamentals', 'SKJ Certified — Network Fundamentals', 'Maîtrise des fondamentaux réseau (TCP/IP, VLAN, adressage).',
   '{"all":[{"type":"course","slug":"network-fundamentals"},{"type":"course","slug":"vlan-switching"}]}', 300),
  ('cert-voip-fundamentals', 'SKJ Certified — VoIP Fundamentals', 'Maîtrise des bases SIP / RTP.',
   '{"all":[{"type":"course","slug":"voip-fundamentals-sip"},{"type":"skill","slug":"voip","min":30}]}', 300),
  ('cert-network-engineer', 'SKJ Certified — Network Engineer', 'Certification de parcours : réseaux, routage et pratique.',
   '{"all":[{"type":"level","min":4},{"type":"skill","slug":"networking","min":60},{"type":"skill","slug":"routing","min":40},{"type":"labs_count","min":3}]}', 800);

-- ---------- Parcours de carrière ----------
INSERT INTO public.career_tracks (slug, name, description, sort_order) VALUES
  ('network-engineer',  'Network Engineer',     'Du débutant à l''expert réseau',               1),
  ('linux-sysadmin',    'Linux Sysadmin',       'Administration de serveurs Linux',             2),
  ('voip-engineer',     'VoIP Engineer',        'Téléphonie IP, SIP et IPBX',                   3);

INSERT INTO public.career_stages (track_id, rank, name, description, criteria)
SELECT t.id, s.rank, s.name, s.description, s.criteria::jsonb
FROM public.career_tracks t JOIN (VALUES
  ('network-engineer', 1, 'Beginner',                'Découverte des réseaux', '{}'),
  ('network-engineer', 2, 'Foundation',              'Fondamentaux acquis', '{"type":"course","slug":"network-fundamentals"}'),
  ('network-engineer', 3, 'Junior Network Engineer', 'Premières configurations en autonomie', '{"all":[{"type":"courses_count","min":3},{"type":"skill","slug":"networking","min":30}]}'),
  ('network-engineer', 4, 'Network Engineer',        'Switching, routage et pratique en lab', '{"all":[{"type":"skill","slug":"networking","min":50},{"type":"skill","slug":"routing","min":30},{"type":"skill","slug":"switching","min":30},{"type":"labs_count","min":2}]}'),
  ('network-engineer', 5, 'Senior Network Engineer', 'Conception et dépannage avancés', '{"all":[{"type":"skill","slug":"networking","min":70},{"type":"skill","slug":"routing","min":60},{"type":"skill","slug":"switching","min":50},{"type":"labs_count","min":5},{"type":"level","min":5}]}'),
  ('network-engineer', 6, 'Network Specialist',      'Spécialiste multi-constructeurs', '{"all":[{"type":"skill","slug":"networking","min":85},{"type":"skill","slug":"routing","min":80},{"type":"skill","slug":"cisco","min":60},{"type":"labs_count","min":8},{"type":"level","min":6}]}'),
  ('network-engineer', 7, 'Network Expert',          'Expertise reconnue', '{"all":[{"type":"skill","slug":"networking","min":95},{"type":"skill","slug":"routing","min":90},{"type":"skill","slug":"security","min":60},{"type":"level","min":7}]}'),
  ('linux-sysadmin', 1, 'Beginner',            'Découverte de Linux', '{}'),
  ('linux-sysadmin', 2, 'Linux User',          'À l''aise avec la CLI', '{"type":"course","slug":"linux-fundamentals"}'),
  ('linux-sysadmin', 3, 'Junior Sysadmin',     'Administration de base', '{"all":[{"type":"skill","slug":"linux","min":40},{"type":"courses_count","min":2}]}'),
  ('linux-sysadmin', 4, 'Linux Administrator', 'Administration serveur autonome', '{"all":[{"type":"skill","slug":"linux","min":60},{"type":"course","slug":"linux-server-admin"},{"type":"labs_count","min":2}]}'),
  ('linux-sysadmin', 5, 'Senior Sysadmin',     'Production, sécurité et automatisation', '{"all":[{"type":"skill","slug":"linux","min":80},{"type":"skill","slug":"security","min":40},{"type":"level","min":5}]}'),
  ('linux-sysadmin', 6, 'Linux Expert',        'Expertise systèmes', '{"all":[{"type":"skill","slug":"linux","min":95},{"type":"level","min":7}]}'),
  ('voip-engineer', 1, 'Beginner',             'Découverte de la VoIP', '{}'),
  ('voip-engineer', 2, 'VoIP Foundation',      'Bases SIP / RTP', '{"type":"course","slug":"voip-fundamentals-sip"}'),
  ('voip-engineer', 3, 'Junior VoIP Engineer', 'Premiers déploiements IPBX', '{"all":[{"type":"skill","slug":"voip","min":40},{"type":"skill","slug":"networking","min":20}]}'),
  ('voip-engineer', 4, 'VoIP Engineer',        'IPBX et dépannage SIP', '{"all":[{"type":"skill","slug":"voip","min":65},{"type":"labs_count","min":2}]}'),
  ('voip-engineer', 5, 'Senior VoIP Engineer', 'SBC, trunking, QoS', '{"all":[{"type":"skill","slug":"voip","min":85},{"type":"skill","slug":"networking","min":50},{"type":"level","min":5}]}'),
  ('voip-engineer', 6, 'VoIP Architect',       'Architecture téléphonie', '{"all":[{"type":"skill","slug":"voip","min":95},{"type":"level","min":6}]}')
) AS s(track, rank, name, description, criteria) ON s.track = t.slug;
