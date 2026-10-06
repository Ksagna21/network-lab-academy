-- GÉNÉRÉ par scripts/seed/gen_seed.py — ne pas éditer à la main.
-- Contenu de démonstration SKJ Academy (cours, quiz, labs).

INSERT INTO public.labs (id, slug, title, description, technology, engine, engine_ref, difficulty, required_level, duration_minutes, objectives, topology, instructions, xp_reward, access, status, category_id)
VALUES ('ab818598-65b3-5e7c-8d8f-95bee0dc4396', 'cisco-interface-basics', 'Configurer une interface de routeur', 'Nommez un routeur, donnez une adresse IP à son interface, activez-la et vérifiez la liaison avec un voisin.', 'cisco', 'cisco-sim', 'cisco-interface-basics', 'beginner', 1, 15,
  ARRAY['Nommer le routeur « R1 »','Décrire l''interface : LIEN-VERS-R2','Configurer Gi0/0 en 10.0.0.1/24 et l''activer','Joindre R2 (10.0.0.2) avec un ping','Enregistrer la configuration (write memory)']::text[], '{"devices": [{"id": "R1", "type": "router", "hostname": "Router", "x": 25, "y": 50}, {"id": "R2", "type": "router", "hostname": "R2", "x": 75, "y": 50}], "links": [{"a": "R1:Gi0/0", "b": "R2:Gi0/0"}]}'::jsonb, 'Le routeur **R1** vient d''être installé : il s''appelle encore `Router` et son interface est désactivée. Il est relié à **R2**, déjà configuré avec l''adresse `10.0.0.2`.

Passez en mode privilégié avec `enable`, puis en configuration globale avec `configure terminal`.

Nommez le routeur `R1`, puis configurez l''interface `GigabitEthernet0/0` : description `LIEN-VERS-R2`, adresse `10.0.0.1` avec le masque `255.255.255.0`, puis activez-la avec `no shutdown`.

Revenez en mode privilégié (`end`), testez la liaison avec `ping 10.0.0.2`, puis enregistrez avec `write memory`.', 100, 'free', 'published',
  (SELECT id FROM public.categories WHERE slug = 'cisco'));
INSERT INTO public.lab_private (lab_id, solution) VALUES ('ab818598-65b3-5e7c-8d8f-95bee0dc4396', '# R1
hostname R1
interface GigabitEthernet0/0
description LIEN-VERS-R2
ip address 10.0.0.1 255.255.255.0
no shutdown
end
write memory');
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT 'ab818598-65b3-5e7c-8d8f-95bee0dc4396', id, 100 FROM public.skills WHERE slug = 'cisco';
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT 'ab818598-65b3-5e7c-8d8f-95bee0dc4396', id, 50 FROM public.skills WHERE slug = 'networking';
INSERT INTO public.labs (id, slug, title, description, technology, engine, engine_ref, difficulty, required_level, duration_minutes, objectives, topology, instructions, xp_reward, access, status, category_id)
VALUES ('75dab431-3219-561b-b278-b23a8efb9c93', 'cisco-static-routing', 'Routage statique entre deux routeurs', 'Reliez deux réseaux locaux à travers deux routeurs en configurant les interfaces et les routes statiques aller et retour.', 'cisco', 'cisco-sim', 'cisco-static-routing', 'intermediate', 1, 30,
  ARRAY['R1 : Gi0/0 en 192.168.1.1/24 et Gi0/1 en 10.0.0.1/30, interfaces actives','R2 : Gi0/0 en 10.0.0.2/30 et Gi0/1 en 192.168.2.1/24, interfaces actives','R1 : route statique vers 192.168.2.0/24','R2 : route statique vers 192.168.1.0/24','PC1 joint PC2 (192.168.2.10)']::text[], '{"devices": [{"id": "PC1", "type": "pc", "hostname": "PC1", "x": 8, "y": 50}, {"id": "R1", "type": "router", "hostname": "R1", "x": 34, "y": 50}, {"id": "R2", "type": "router", "hostname": "R2", "x": 66, "y": 50}, {"id": "PC2", "type": "pc", "hostname": "PC2", "x": 92, "y": 50}], "links": [{"a": "PC1:Fa0", "b": "R1:Gi0/0"}, {"a": "R1:Gi0/1", "b": "R2:Gi0/0"}, {"a": "R2:Gi0/1", "b": "PC2:Fa0"}]}'::jsonb, 'Deux sites doivent communiquer : **PC1** (`192.168.1.10`) derrière **R1**, et **PC2** (`192.168.2.10`) derrière **R2**. Les postes sont déjà configurés avec leur passerelle.

Plan d''adressage : R1 `Gi0/0` = `192.168.1.1/24` (LAN 1), R1 `Gi0/1` = `10.0.0.1/30` (liaison), R2 `Gi0/0` = `10.0.0.2/30` (liaison), R2 `Gi0/1` = `192.168.2.1/24` (LAN 2). Pensez à activer chaque interface.

Ajoutez sur chaque routeur une route statique vers le LAN distant, avec `ip route <réseau> <masque> <prochain saut>`.

Testez avec `ping 192.168.2.10` depuis PC1. Si le ping échoue, observez la table de routage avec `show ip route` sur chaque routeur.', 250, 'free', 'published',
  (SELECT id FROM public.categories WHERE slug = 'cisco'));
INSERT INTO public.lab_private (lab_id, solution) VALUES ('75dab431-3219-561b-b278-b23a8efb9c93', '# R1
interface GigabitEthernet0/0
ip address 192.168.1.1 255.255.255.0
no shutdown
interface GigabitEthernet0/1
ip address 10.0.0.1 255.255.255.252
no shutdown
exit
ip route 192.168.2.0 255.255.255.0 10.0.0.2
# R2
interface GigabitEthernet0/0
ip address 10.0.0.2 255.255.255.252
no shutdown
interface GigabitEthernet0/1
ip address 192.168.2.1 255.255.255.0
no shutdown
exit
ip route 192.168.1.0 255.255.255.0 10.0.0.1');
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT '75dab431-3219-561b-b278-b23a8efb9c93', id, 150 FROM public.skills WHERE slug = 'routing';
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT '75dab431-3219-561b-b278-b23a8efb9c93', id, 100 FROM public.skills WHERE slug = 'cisco';
INSERT INTO public.labs (id, slug, title, description, technology, engine, engine_ref, difficulty, required_level, duration_minutes, objectives, topology, instructions, xp_reward, access, status, category_id)
VALUES ('ca5c4237-b4ec-531a-9cb8-b1d9b68929c4', 'cisco-vlan-trunk', 'VLAN et trunk entre deux switchs', 'Isolez deux services sur les mêmes switchs avec des VLAN, puis reliez les switchs par un lien trunk 802.1Q.', 'cisco', 'cisco-sim', 'cisco-vlan-trunk', 'intermediate', 1, 25,
  ARRAY['SW1 : créer les VLAN 10 (COMPTA) et 20 (RH)','SW2 : créer les VLAN 10 (COMPTA) et 20 (RH)','SW1 : Fa0/1 en accès VLAN 10, Fa0/2 en accès VLAN 20','SW2 : Fa0/1 en accès VLAN 10, Fa0/2 en accès VLAN 20','Trunk Fa0/24 actif des deux côtés, VLAN 10 et 20 autorisés','SW2 : même configuration trunk sur Fa0/24','PC1 joint PC2 (VLAN 10, à travers le trunk)','PC3 joint PC4 (VLAN 20, à travers le trunk)','PC1 ne joint pas PC3 (VLAN différents)']::text[], '{"devices": [{"id": "PC1", "type": "pc", "hostname": "PC1", "x": 10, "y": 22}, {"id": "PC3", "type": "pc", "hostname": "PC3", "x": 10, "y": 78}, {"id": "SW1", "type": "switch", "hostname": "SW1", "x": 36, "y": 50}, {"id": "SW2", "type": "switch", "hostname": "SW2", "x": 64, "y": 50}, {"id": "PC2", "type": "pc", "hostname": "PC2", "x": 90, "y": 22}, {"id": "PC4", "type": "pc", "hostname": "PC4", "x": 90, "y": 78}], "links": [{"a": "PC1:Fa0", "b": "SW1:Fa0/1"}, {"a": "PC3:Fa0", "b": "SW1:Fa0/2"}, {"a": "SW1:Fa0/24", "b": "SW2:Fa0/24"}, {"a": "PC2:Fa0", "b": "SW2:Fa0/1"}, {"a": "PC4:Fa0", "b": "SW2:Fa0/2"}]}'::jsonb, 'Deux services partagent les mêmes switchs : la **Comptabilité** (VLAN 10, `COMPTA`) avec PC1 et PC2, et les **RH** (VLAN 20, `RH`) avec PC3 et PC4. Tous les postes sont dans le même sous-réseau `192.168.1.0/24`.

Créez les VLAN 10 et 20 sur **SW1 et SW2**, puis affectez les ports : `Fa0/1` en VLAN 10 et `Fa0/2` en VLAN 20 sur chaque switch (`switchport mode access`, `switchport access vlan ...`).

Le lien entre les switchs (`Fa0/24`) est désactivé. Réactivez-le des deux côtés et passez-le en trunk autorisant les VLAN 10 et 20.

Depuis les postes, vérifiez : PC1 doit joindre PC2, PC3 doit joindre PC4, mais PC1 ne doit **pas** joindre PC3. Utilisez `show vlan brief` et `show interfaces trunk`.', 200, 'free', 'published',
  (SELECT id FROM public.categories WHERE slug = 'cisco'));
INSERT INTO public.lab_private (lab_id, solution) VALUES ('ca5c4237-b4ec-531a-9cb8-b1d9b68929c4', '# SW1
vlan 10
name COMPTA
vlan 20
name RH
interface FastEthernet0/1
switchport mode access
switchport access vlan 10
interface FastEthernet0/2
switchport mode access
switchport access vlan 20
interface FastEthernet0/24
no shutdown
switchport mode trunk
switchport trunk allowed vlan 10,20
# SW2
vlan 10
name COMPTA
vlan 20
name RH
interface FastEthernet0/1
switchport mode access
switchport access vlan 10
interface FastEthernet0/2
switchport mode access
switchport access vlan 20
interface FastEthernet0/24
no shutdown
switchport mode trunk
switchport trunk allowed vlan 10,20');
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT 'ca5c4237-b4ec-531a-9cb8-b1d9b68929c4', id, 150 FROM public.skills WHERE slug = 'switching';
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT 'ca5c4237-b4ec-531a-9cb8-b1d9b68929c4', id, 100 FROM public.skills WHERE slug = 'cisco';
INSERT INTO public.labs (id, slug, title, description, technology, engine, engine_ref, difficulty, required_level, duration_minutes, objectives, topology, instructions, xp_reward, access, status, category_id)
VALUES ('4a995523-83d8-56bc-bd9c-975943f91f3e', 'ip-addressing', 'Configurer l''adressage IP', 'Apprenez à configurer une interface réseau avec une adresse IP statique.', 'linux', 'linux-sim', 'ip-addressing', 'beginner', 1, 20,
  ARRAY['Configurer l''adressage IP']::text[], '{}'::jsonb, NULL, 150, 'free', 'published',
  (SELECT id FROM public.categories WHERE slug = 'linux'));
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT '4a995523-83d8-56bc-bd9c-975943f91f3e', id, 100 FROM public.skills WHERE slug = 'linux';
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT '4a995523-83d8-56bc-bd9c-975943f91f3e', id, 50 FROM public.skills WHERE slug = 'networking';
INSERT INTO public.labs (id, slug, title, description, technology, engine, engine_ref, difficulty, required_level, duration_minutes, objectives, topology, instructions, xp_reward, access, status, category_id)
VALUES ('78e383f0-940e-59f5-8f0f-d4905e6fcf18', 'ospf-config', 'Configurer OSPF entre routeurs', 'Mettez en place le routage OSPF entre deux routeurs Cisco.', 'networking', 'linux-sim', 'ospf-config', 'intermediate', 2, 30,
  ARRAY['Configurer OSPF entre routeurs']::text[], '{}'::jsonb, NULL, 250, 'free', 'published',
  (SELECT id FROM public.categories WHERE slug = 'networking'));
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT '78e383f0-940e-59f5-8f0f-d4905e6fcf18', id, 150 FROM public.skills WHERE slug = 'routing';
INSERT INTO public.labs (id, slug, title, description, technology, engine, engine_ref, difficulty, required_level, duration_minutes, objectives, topology, instructions, xp_reward, access, status, category_id)
VALUES ('bd283561-0ae8-5a46-ae0a-49e7fb608604', 'sip-troubleshoot', 'Dépanner l''enregistrement SIP', 'Diagnostiquez et résolvez un problème d''enregistrement SIP sur un IPBX Asterisk.', 'voip', 'linux-sim', 'sip-troubleshoot', 'advanced', 2, 40,
  ARRAY['Dépanner l''enregistrement SIP']::text[], '{}'::jsonb, NULL, 300, 'free', 'published',
  (SELECT id FROM public.categories WHERE slug = 'voip'));
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT 'bd283561-0ae8-5a46-ae0a-49e7fb608604', id, 150 FROM public.skills WHERE slug = 'voip';
INSERT INTO public.labs (id, slug, title, description, technology, engine, engine_ref, difficulty, required_level, duration_minutes, objectives, topology, instructions, xp_reward, access, status, category_id)
VALUES ('3f70e8a6-a765-5aab-90ba-8b2a67bd3f2b', 'network-outage', 'Diagnostiquer une panne réseau', 'Un serveur web est inaccessible. Suivez une méthodologie de dépannage structurée.', 'networking', 'linux-sim', 'network-outage', 'intermediate', 1, 30,
  ARRAY['Diagnostiquer une panne réseau']::text[], '{}'::jsonb, NULL, 200, 'free', 'published',
  (SELECT id FROM public.categories WHERE slug = 'networking'));
INSERT INTO public.lab_skills (lab_id, skill_id, points) SELECT '3f70e8a6-a765-5aab-90ba-8b2a67bd3f2b', id, 150 FROM public.skills WHERE slug = 'networking';

INSERT INTO public.labs (id, slug, title, description, technology, engine, difficulty, required_level, duration_minutes, objectives, instructions, xp_reward, access, status, category_id, score_max, pass_score)
VALUES ('ec4eecc4-fd9c-5372-a97b-3b29112dcce5', 'ospf-multi-area', 'OSPF Multi-Area', 'Configurer OSPF sur trois routeurs répartis sur deux areas et diagnostiquer une adjacence.', 'cisco', 'external', 'intermediate', 3, 45,
  ARRAY['Configurer OSPF','Créer plusieurs areas','Vérifier les adjacences','Diagnostiquer un problème OSPF']::text[],
  'Brouillon : topologie R1—R2—R3. R2 est ABR entre area 0 et area 1. Nécessite un moteur d''exécution externe (images IOSv).', 250, 'premium', 'draft',
  (SELECT id FROM public.categories WHERE slug = 'cisco'), 100, 70);
INSERT INTO public.lab_nodes (id, lab_id, name, node_type, vendor, os_image, x, y, sort_order) VALUES ('3ea92191-f187-5ddb-908f-159c6ea81533', 'ec4eecc4-fd9c-5372-a97b-3b29112dcce5', 'R1', 'router', 'cisco', 'IOSv 15.9', 100, 150, 0);
INSERT INTO public.lab_nodes (id, lab_id, name, node_type, vendor, os_image, x, y, sort_order) VALUES ('cdbf3682-2f4b-5769-a79c-3db6d1dcf14f', 'ec4eecc4-fd9c-5372-a97b-3b29112dcce5', 'R2', 'router', 'cisco', 'IOSv 15.9', 300, 150, 1);
INSERT INTO public.lab_nodes (id, lab_id, name, node_type, vendor, os_image, x, y, sort_order) VALUES ('be54e81b-9225-5c00-adcc-f0843d03ef1b', 'ec4eecc4-fd9c-5372-a97b-3b29112dcce5', 'R3', 'router', 'cisco', 'IOSv 15.9', 500, 150, 2);
INSERT INTO public.lab_links (lab_id, node_a, if_a, node_b, if_b) VALUES ('ec4eecc4-fd9c-5372-a97b-3b29112dcce5', '3ea92191-f187-5ddb-908f-159c6ea81533', 'Gi0/0', 'cdbf3682-2f4b-5769-a79c-3db6d1dcf14f', 'Gi0/0');
INSERT INTO public.lab_links (lab_id, node_a, if_a, node_b, if_b) VALUES ('ec4eecc4-fd9c-5372-a97b-3b29112dcce5', 'cdbf3682-2f4b-5769-a79c-3db6d1dcf14f', 'Gi0/1', 'be54e81b-9225-5c00-adcc-f0843d03ef1b', 'Gi0/0');

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('58f58cf0-9583-5fa5-a296-a090a45f30c2', 'linux-fundamentals', 'Linux Fundamentals', 'Prenez en main Linux : arborescence, ligne de commande, fichiers, permissions et utilisateurs.', 'linux', 'débutant', '4h', 240,
  'published', 'free', 200, 1, ARRAY['Naviguer dans l''arborescence Linux','Manipuler fichiers et dossiers en CLI','Comprendre les permissions rwx','Gérer utilisateurs et groupes']::text[], ARRAY['Aucun prérequis']::text[], 0, (SELECT id FROM public.categories WHERE slug = 'linux'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '58f58cf0-9583-5fa5-a296-a090a45f30c2', id, 300 FROM public.skills WHERE slug = 'linux';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('524f5af6-df75-51e1-b038-aa118a6feba4', '58f58cf0-9583-5fa5-a296-a090a45f30c2', 'Quiz — Linux Fundamentals', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('2c22a6f0-3aa9-5ef4-8f17-2d359c51c9d0', '524f5af6-df75-51e1-b038-aa118a6feba4', 'single', 'Quelle commande affiche le répertoire courant ?', '[{"id": "a", "text": "pwd"}, {"id": "b", "text": "cd"}, {"id": "c", "text": "ls"}, {"id": "d", "text": "whoami"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('2c22a6f0-3aa9-5ef4-8f17-2d359c51c9d0', '["a"]'::jsonb, '`pwd` (print working directory) affiche le chemin courant.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('0220de8a-0454-5e9c-bf8f-4498c26c365c', '524f5af6-df75-51e1-b038-aa118a6feba4', 'single', 'Que signifie le mode 750 sur un fichier ?', '[{"id": "a", "text": "rwx pour le propriétaire, r-x pour le groupe, aucun droit pour les autres"}, {"id": "b", "text": "rwx pour tous"}, {"id": "c", "text": "rw- pour le propriétaire, r-- pour le groupe, r-- pour les autres"}, {"id": "d", "text": "r-x pour tous"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('0220de8a-0454-5e9c-bf8f-4498c26c365c', '["a"]'::jsonb, '7 = rwx, 5 = r-x, 0 = ---.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('2442d4a0-74c1-56e2-b4fd-a1addcbb49c7', '524f5af6-df75-51e1-b038-aa118a6feba4', 'single', 'Dans quel dossier trouve-t-on généralement les fichiers de configuration ?', '[{"id": "a", "text": "/etc"}, {"id": "b", "text": "/var"}, {"id": "c", "text": "/dev"}, {"id": "d", "text": "/tmp"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('2442d4a0-74c1-56e2-b4fd-a1addcbb49c7', '["a"]'::jsonb, '`/etc` contient la configuration système.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('3a82037b-91a5-5697-a9bb-792d7fb8f3da', '524f5af6-df75-51e1-b038-aa118a6feba4', 'multiple', 'Quels fichiers contiennent des informations de comptes ? (plusieurs réponses)', '[{"id": "a", "text": "/etc/passwd"}, {"id": "b", "text": "/etc/shadow"}, {"id": "c", "text": "/etc/hosts"}, {"id": "d", "text": "/etc/group"}]'::jsonb, 3);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('3a82037b-91a5-5697-a9bb-792d7fb8f3da', '["a", "b", "d"]'::jsonb, 'passwd, shadow et group concernent comptes et groupes ; hosts concerne la résolution de noms.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('3fdf42b0-341a-5cd1-8348-30914f79a1a1', '58f58cf0-9583-5fa5-a296-a090a45f30c2', 'Premiers pas', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('ac9020e3-3d6f-5da6-8c49-3931e5f3ea9f', '3fdf42b0-341a-5cd1-8348-30914f79a1a1', 'Qu''est-ce que Linux ?', 'text', '10 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('ac9020e3-3d6f-5da6-8c49-3931e5f3ea9f', '## Linux en bref
**Linux** est un *noyau* (kernel) libre créé par Linus Torvalds en 1991. Une **distribution** (Ubuntu, Debian, Rocky Linux…) assemble ce noyau avec des outils GNU, un gestionnaire de paquets et une configuration par défaut.

### Pourquoi apprendre Linux ?
- Il fait tourner la majorité des serveurs, des équipements réseau (routeurs, pare-feu, SBC) et des conteneurs.
- Presque tout s''administre en **ligne de commande** : c''est rapide, scriptable et reproductible.

### Familles de distributions
| Famille | Exemples | Gestionnaire de paquets |
|---|---|---|
| Debian | Debian, Ubuntu | `apt` |
| Red Hat | RHEL, Rocky, AlmaLinux | `dnf` |

> Dans SKJ Academy, les labs utilisent Ubuntu/Debian et Rocky Linux.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('44db201b-8fd4-54b1-931b-c82571e943cb', '3fdf42b0-341a-5cd1-8348-30914f79a1a1', 'L''arborescence du système', 'text', '15 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('44db201b-8fd4-54b1-931b-c82571e943cb', '## Le Filesystem Hierarchy Standard
Sous Linux, **tout est fichier** et tout part de la racine `/`.

| Dossier | Contenu |
|---|---|
| `/etc` | fichiers de configuration |
| `/home` | dossiers personnels des utilisateurs |
| `/var` | données variables : logs (`/var/log`), caches, bases |
| `/usr` | programmes et bibliothèques installés |
| `/bin`, `/sbin` | commandes essentielles |
| `/tmp` | fichiers temporaires |
| `/dev` | périphériques (disques, terminaux) |

```bash
pwd          # où suis-je ?
ls -l /etc   # lister un dossier en détail
```');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('023a8fe3-e0bf-5e9c-8496-81dafbb288e4', '3fdf42b0-341a-5cd1-8348-30914f79a1a1', 'Naviguer et manipuler les fichiers', 'text', '20 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('023a8fe3-e0bf-5e9c-8496-81dafbb288e4', '## Commandes essentielles
```bash
cd /var/log           # changer de dossier
cd ~                  # retour au dossier personnel
ls -la                # tout lister, fichiers cachés inclus
mkdir -p projet/src   # créer une arborescence
cp fichier.txt copie.txt
mv copie.txt /tmp/    # déplacer / renommer
rm -r vieux_dossier   # supprimer récursivement (attention !)
cat /etc/os-release   # afficher un fichier
less /var/log/syslog  # lire page par page (q pour quitter)
```
### Astuces
- `Tab` complète les noms, `↑` rappelle l''historique, `Ctrl+C` interrompt.
- `man ls` ouvre le manuel d''une commande ; `commande --help` donne un résumé.
- **Il n''y a pas de corbeille en CLI** : `rm` est définitif.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('ed4ba6d4-87e4-5b6d-8627-faa296890c89', '3fdf42b0-341a-5cd1-8348-30914f79a1a1', 'Lab : adressage IP sous Linux', 'lab', '20 min', 3, false, NULL, (SELECT id FROM public.labs WHERE slug = 'ip-addressing'));
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('282ccf33-277b-5e7a-9bf3-aa2b37e194bd', '58f58cf0-9583-5fa5-a296-a090a45f30c2', 'Permissions et utilisateurs', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('41ba59f0-ab69-523b-a093-fddbe1632752', '282ccf33-277b-5e7a-9bf3-aa2b37e194bd', 'Les permissions rwx', 'text', '20 min', 0, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('41ba59f0-ab69-523b-a093-fddbe1632752', '## Lire `ls -l`
```text
-rwxr-xr-- 1 alice dev 1204 Mar 3 10:12 deploy.sh
```
- Premier caractère : type (`-` fichier, `d` dossier).
- Puis trois blocs : **propriétaire** (rwx), **groupe** (r-x), **autres** (r--).

| Lettre | Fichier | Dossier |
|---|---|---|
| `r` (4) | lire | lister le contenu |
| `w` (2) | modifier | créer / supprimer dedans |
| `x` (1) | exécuter | traverser (`cd`) |

### Modifier
```bash
chmod 750 deploy.sh      # rwx r-x ---
chmod u+x,g-w script.sh  # notation symbolique
chown alice:dev deploy.sh
```
`750` = 7 (4+2+1) pour le propriétaire, 5 (4+1) pour le groupe, 0 pour les autres.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('7d50833f-ca21-5397-829b-2ccce11526ad', '282ccf33-277b-5e7a-9bf3-aa2b37e194bd', 'Utilisateurs et groupes', 'text', '15 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('7d50833f-ca21-5397-829b-2ccce11526ad', '## Gérer les comptes
```bash
id                       # mon UID, GID, groupes
sudo useradd -m -s /bin/bash bob
sudo passwd bob
sudo usermod -aG sudo bob   # ajouter au groupe sudo (Debian/Ubuntu)
sudo groupadd dev
sudo userdel -r bob      # supprimer le compte et son home
```
### Fichiers clés
- `/etc/passwd` : comptes (nom, UID, shell…) — **pas** de mot de passe.
- `/etc/shadow` : empreintes des mots de passe (lecture réservée à root).
- `/etc/group` : groupes.

**sudo** exécute une commande avec les droits root après authentification : préférez-le à une session root permanente.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('0f1d8a0f-576a-5ad3-a6ef-c71ad8ad8d8b', '282ccf33-277b-5e7a-9bf3-aa2b37e194bd', 'Quiz : Linux Fundamentals', 'quiz', '5 min', 2, false, '524f5af6-df75-51e1-b038-aa118a6feba4', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('538f5f06-4b0b-550c-9516-f23ff4b64f33', 'linux-server-admin', 'Linux Server Administration', 'Administrez un serveur Linux : processus, systemd, SSH sécurisé, pare-feu et scripts Bash.', 'linux', 'intermédiaire', '6h', 360,
  'published', 'premium', 300, 2, ARRAY['Superviser processus et services','Écrire et diagnostiquer des unités systemd','Sécuriser SSH','Configurer un pare-feu','Automatiser avec Bash']::text[], ARRAY['Linux Fundamentals']::text[], 1, (SELECT id FROM public.categories WHERE slug = 'linux'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '538f5f06-4b0b-550c-9516-f23ff4b64f33', id, 300 FROM public.skills WHERE slug = 'linux';
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '538f5f06-4b0b-550c-9516-f23ff4b64f33', id, 100 FROM public.skills WHERE slug = 'security';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('4149f4c8-cdb5-59f8-9512-5413d2a4c52d', '538f5f06-4b0b-550c-9516-f23ff4b64f33', 'Quiz — Linux Server Administration', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('84819f2b-6295-5ad3-be4c-a3feca8d767a', '4149f4c8-cdb5-59f8-9512-5413d2a4c52d', 'single', 'Quel signal demande à un processus de s''arrêter proprement ?', '[{"id": "a", "text": "SIGTERM (15)"}, {"id": "b", "text": "SIGKILL (9)"}, {"id": "c", "text": "SIGSTOP"}, {"id": "d", "text": "SIGHUP uniquement"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('84819f2b-6295-5ad3-be4c-a3feca8d767a', '["a"]'::jsonb, 'SIGTERM laisse le processus se terminer proprement ; SIGKILL est brutal.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('129d576a-d391-54b3-8fe2-c2297a0fa684', '4149f4c8-cdb5-59f8-9512-5413d2a4c52d', 'single', 'Quelle commande affiche les ports TCP/UDP en écoute avec les processus ?', '[{"id": "a", "text": "ss -tulpn"}, {"id": "b", "text": "ip route"}, {"id": "c", "text": "ping"}, {"id": "d", "text": "df -h"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('129d576a-d391-54b3-8fe2-c2297a0fa684', '["a"]'::jsonb, '`ss -tulpn` liste les sockets en écoute.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('e3f04cb8-1aeb-547c-918c-4f7084ed5520', '4149f4c8-cdb5-59f8-9512-5413d2a4c52d', 'single', 'Après avoir modifié un fichier d''unité systemd, que faut-il exécuter ?', '[{"id": "a", "text": "systemctl daemon-reload"}, {"id": "b", "text": "reboot obligatoire"}, {"id": "c", "text": "ufw reload"}, {"id": "d", "text": "ssh-keygen"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('e3f04cb8-1aeb-547c-918c-4f7084ed5520', '["a"]'::jsonb, '`daemon-reload` relit les unités.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('0876cd48-3dab-5c8f-abfe-5bba01e34c8f', '4149f4c8-cdb5-59f8-9512-5413d2a4c52d', 'multiple', 'Quelles pratiques durcissent SSH ? (plusieurs réponses)', '[{"id": "a", "text": "Désactiver PasswordAuthentication"}, {"id": "b", "text": "Interdire PermitRootLogin"}, {"id": "c", "text": "Autoriser tous les mots de passe"}, {"id": "d", "text": "Utiliser des clés ed25519"}]'::jsonb, 3);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('0876cd48-3dab-5c8f-abfe-5bba01e34c8f', '["a", "b", "d"]'::jsonb, 'Clés + pas de root + pas de mot de passe réduisent fortement les attaques par force brute.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('eeb47adc-83c3-5d21-978c-55f0bca9c960', '538f5f06-4b0b-550c-9516-f23ff4b64f33', 'Processus et services', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('7ce984db-e276-5534-ba82-59822d896b80', 'eeb47adc-83c3-5d21-978c-55f0bca9c960', 'Processus et signaux', 'text', '15 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('7ce984db-e276-5534-ba82-59822d896b80', '## Voir et contrôler les processus
```bash
ps aux | grep nginx   # lister
top                   # vue dynamique (htop si installé)
kill -15 1234         # SIGTERM : arrêt propre
kill -9 1234          # SIGKILL : arrêt forcé (dernier recours)
```
Chaque processus a un **PID** et un parent (**PPID**). Un processus `Z` (zombie) a terminé mais son parent n''a pas lu son code retour.

### Priorités
`nice -n 10 commande` lance avec une priorité plus faible ; `renice` modifie un processus existant.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('4c5eca52-510f-5688-bb1c-f33a9745b75b', 'eeb47adc-83c3-5d21-978c-55f0bca9c960', 'systemd : gérer les services', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('4c5eca52-510f-5688-bb1c-f33a9745b75b', '## systemctl
```bash
systemctl status ssh
sudo systemctl enable --now nginx   # démarrer + activer au boot
sudo systemctl restart nginx
journalctl -u nginx --since "1 hour ago"
```
### Unité minimale
```ini
# /etc/systemd/system/monapp.service
[Unit]
Description=Mon application
After=network-online.target

[Service]
ExecStart=/usr/local/bin/monapp
Restart=on-failure
User=monapp

[Install]
WantedBy=multi-user.target
```
Après modification : `sudo systemctl daemon-reload`.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('0d6f070d-bbcf-54b4-b520-c5e1ef456bf9', '538f5f06-4b0b-550c-9516-f23ff4b64f33', 'Réseau, accès et automatisation', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('05515989-950d-590e-aa2d-91e5e170b711', '0d6f070d-bbcf-54b4-b520-c5e1ef456bf9', 'Réseau sous Linux', 'text', '20 min', 0, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('05515989-950d-590e-aa2d-91e5e170b711', '## Outils modernes (`iproute2`)
```bash
ip addr show            # adresses
ip route                # table de routage
ip link set eth0 up
ss -tulpn               # ports en écoute + processus
ping -c 4 1.1.1.1
dig example.com +short  # résolution DNS
```
La configuration persistante dépend de la distribution : **netplan** (Ubuntu), **NetworkManager** (RHEL/Rocky), `/etc/network/interfaces` (Debian classique).');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('5ff47699-ee7f-526d-bf0c-93d585ad7d36', '0d6f070d-bbcf-54b4-b520-c5e1ef456bf9', 'SSH : accès sécurisé', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('5ff47699-ee7f-526d-bf0c-93d585ad7d36', '## Authentification par clé
```bash
ssh-keygen -t ed25519
ssh-copy-id user@serveur
```
### Durcir `/etc/ssh/sshd_config`
```text
PermitRootLogin no
PasswordAuthentication no
AllowUsers alice bob
```
Puis `sudo sshd -t` (test de syntaxe) et `sudo systemctl reload ssh`.

> **Gardez une session ouverte** pendant que vous testez la nouvelle configuration dans un second terminal, pour ne pas vous enfermer dehors.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('a0ba3f27-5172-56ea-804f-0d3721df1592', '0d6f070d-bbcf-54b4-b520-c5e1ef456bf9', 'Pare-feu : ufw et nftables', 'text', '20 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('a0ba3f27-5172-56ea-804f-0d3721df1592', '## Politique par défaut : tout refuser en entrée
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow from 10.0.0.0/24 to any port 5432
sudo ufw enable
sudo ufw status verbose
```
`ufw` est une surcouche simple de **nftables** (successeur d''iptables). Sur RHEL/Rocky, l''équivalent est **firewalld** (`firewall-cmd --add-service=https --permanent`).');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('416f7f86-6780-5acd-a401-aaedd160086f', '0d6f070d-bbcf-54b4-b520-c5e1ef456bf9', 'Bash : premiers scripts', 'text', '25 min', 3, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('416f7f86-6780-5acd-a401-aaedd160086f', '## Un script robuste
```bash
#!/usr/bin/env bash
set -euo pipefail

DISK_LIMIT=90
usage=$(df / --output=pcent | tail -1 | tr -dc ''0-9'')

if (( usage > DISK_LIMIT )); then
  echo "ALERTE: disque à ${usage}%" >&2
  exit 1
fi
echo "OK: disque à ${usage}%"
```
- `set -euo pipefail` : arrêt à la première erreur, variables non définies interdites.
- `"$variable"` : toujours entre guillemets.
- `chmod +x script.sh` puis `./script.sh`.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('1616a529-82d4-58e1-a7db-913c72a697ee', '0d6f070d-bbcf-54b4-b520-c5e1ef456bf9', 'Quiz : administration serveur', 'quiz', '5 min', 4, false, '4149f4c8-cdb5-59f8-9512-5413d2a4c52d', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('73b22f2f-7086-58c7-9853-77f53d05e87a', 'network-fundamentals', 'Network Fundamentals', 'Modèles OSI et TCP/IP, adressage IPv4, subnetting, IPv6 et outils de diagnostic.', 'networking', 'débutant', '5h', 300,
  'published', 'free', 200, 1, ARRAY['Distinguer OSI et TCP/IP','Calculer un sous-réseau','Lire une adresse IPv6','Diagnostiquer avec ping et traceroute']::text[], ARRAY['Aucun prérequis']::text[], 2, (SELECT id FROM public.categories WHERE slug = 'networking'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '73b22f2f-7086-58c7-9853-77f53d05e87a', id, 300 FROM public.skills WHERE slug = 'networking';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('8d331fd4-9c62-5590-a05d-91f8866f403b', '73b22f2f-7086-58c7-9853-77f53d05e87a', 'Quiz — Network Fundamentals', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('2969f953-6c69-5689-a662-9127e70967f2', '8d331fd4-9c62-5590-a05d-91f8866f403b', 'single', 'Combien d''hôtes utilisables dans un réseau /26 ?', '[{"id": "a", "text": "62"}, {"id": "b", "text": "64"}, {"id": "c", "text": "30"}, {"id": "d", "text": "126"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('2969f953-6c69-5689-a662-9127e70967f2', '["a"]'::jsonb, '2⁶ − 2 = 62.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('1707aa89-ebd9-53b5-86d1-370e7b22e7bf', '8d331fd4-9c62-5590-a05d-91f8866f403b', 'single', 'À quelle couche OSI travaille un routeur ?', '[{"id": "a", "text": "Couche 3 (Réseau)"}, {"id": "b", "text": "Couche 2 (Liaison)"}, {"id": "c", "text": "Couche 4 (Transport)"}, {"id": "d", "text": "Couche 1 (Physique)"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('1707aa89-ebd9-53b5-86d1-370e7b22e7bf', '["a"]'::jsonb, 'Le routage s''appuie sur les adresses IP, couche 3.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('bbf93651-27e8-5a50-897a-64198310f084', '8d331fd4-9c62-5590-a05d-91f8866f403b', 'multiple', 'Quelles adresses sont privées (RFC 1918) ? (plusieurs réponses)', '[{"id": "a", "text": "10.4.5.6"}, {"id": "b", "text": "172.20.1.1"}, {"id": "c", "text": "192.168.1.1"}, {"id": "d", "text": "8.8.8.8"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('bbf93651-27e8-5a50-897a-64198310f084', '["a", "b", "c"]'::jsonb, '8.8.8.8 est une adresse publique.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('417557c3-49ca-5ab3-91c3-d88140b86f4f', '8d331fd4-9c62-5590-a05d-91f8866f403b', 'single', 'Quel protocole résout une IPv4 en adresse MAC ?', '[{"id": "a", "text": "ARP"}, {"id": "b", "text": "DNS"}, {"id": "c", "text": "DHCP"}, {"id": "d", "text": "ICMP"}]'::jsonb, 3);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('417557c3-49ca-5ab3-91c3-d88140b86f4f', '["a"]'::jsonb, 'ARP fait le lien IP → MAC sur le LAN.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('cad7dd82-99d1-53dd-8ade-7225344da6b2', '73b22f2f-7086-58c7-9853-77f53d05e87a', 'Les modèles réseau', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('7110c3c8-6d86-54cd-9d71-f0ae4e87c67d', 'cad7dd82-99d1-53dd-8ade-7225344da6b2', 'Modèles OSI et TCP/IP', 'text', '20 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('7110c3c8-6d86-54cd-9d71-f0ae4e87c67d', '## Les 7 couches OSI
| # | Couche | Exemple | PDU |
|---|---|---|---|
| 7 | Application | HTTP, DNS, SIP | données |
| 6 | Présentation | TLS, encodage | données |
| 5 | Session | sessions | données |
| 4 | Transport | TCP, UDP | segment / datagramme |
| 3 | Réseau | IP, ICMP | paquet |
| 2 | Liaison | Ethernet, 802.1Q | trame |
| 1 | Physique | câble, fibre, Wi-Fi | bits |

Le modèle **TCP/IP** regroupe cela en 4 couches : Application, Transport, Internet, Accès réseau.

> Astuce de dépannage : partez de la couche 1 (câble, lien) et remontez.

**TCP** : fiable, orienté connexion (handshake SYN / SYN-ACK / ACK). **UDP** : sans connexion, léger — utilisé par la voix (RTP) et le DNS.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('fd1bf76c-9815-57be-973f-c842905317b9', 'cad7dd82-99d1-53dd-8ade-7225344da6b2', 'Adressage IPv4 et masques', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('fd1bf76c-9815-57be-973f-c842905317b9', '## Une adresse IPv4 = 32 bits
`192.168.10.37` est écrite en 4 octets. Le **masque** sépare la partie réseau de la partie hôte :
`255.255.255.0` = `/24` (24 bits réseau).

### Plages privées (RFC 1918)
- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`

### Adresses spéciales
- **Adresse réseau** : tous les bits hôte à 0 (ex. `192.168.10.0`).
- **Broadcast** : tous les bits hôte à 1 (ex. `192.168.10.255`).
- `127.0.0.1` : boucle locale ; `169.254.0.0/16` : auto-adressage (échec DHCP).');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('2c94b8a8-d0ac-5953-a0db-f44f044fedad', 'cad7dd82-99d1-53dd-8ade-7225344da6b2', 'Subnetting pas à pas', 'text', '30 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('2c94b8a8-d0ac-5953-a0db-f44f044fedad', '## Découper `192.168.10.0/24` en 4 sous-réseaux
Il faut 2 bits supplémentaires (2² = 4) → **/26**.

- Taille d''un bloc : 2⁽³²⁻²⁶⁾ = **64** adresses (62 hôtes utilisables).
- Sous-réseaux :

| Réseau | Plage hôtes | Broadcast |
|---|---|---|
| 192.168.10.0/26 | .1 – .62 | .63 |
| 192.168.10.64/26 | .65 – .126 | .127 |
| 192.168.10.128/26 | .129 – .190 | .191 |
| 192.168.10.192/26 | .193 – .254 | .255 |

**Formule** : hôtes utilisables = 2ⁿ − 2, où *n* est le nombre de bits hôte.

Exercice : combien de sous-réseaux /28 dans un /24 ? (Réponse : 16, de 14 hôtes chacun.)');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('2d1bde9b-9304-55a5-b9c0-c99b67716833', '73b22f2f-7086-58c7-9853-77f53d05e87a', 'IPv6 et diagnostic', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('89046cbc-4c32-5908-a978-972e95a7efda', '2d1bde9b-9304-55a5-b9c0-c99b67716833', 'Introduction à IPv6', 'text', '15 min', 0, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('89046cbc-4c32-5908-a978-972e95a7efda', '## 128 bits en hexadécimal
`2001:0db8:0000:0000:0000:0000:0000:0001` s''abrège `2001:db8::1` (les zéros de tête disparaissent, **un seul** `::` est permis).

- Préfixe de site typique : `/48`, sous-réseau LAN : `/64`.
- **Link-local** : `fe80::/10`, toujours présent sur une interface.
- Plus de broadcast : on utilise multicast et **NDP** (Neighbor Discovery) à la place d''ARP.
- Adresse de documentation : `2001:db8::/32`.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('50e90f42-0193-5086-8e93-b2256139dce7', '2d1bde9b-9304-55a5-b9c0-c99b67716833', 'ARP, ICMP et diagnostic', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('50e90f42-0193-5086-8e93-b2256139dce7', '## Outils
```bash
ping 192.168.10.1        # ICMP echo : joignabilité
traceroute 8.8.8.8       # chemin saut par saut (tracert sous Windows)
arp -a                   # table ARP : IP -> MAC
```
**ARP** résout une adresse IP en adresse MAC sur le LAN. **ICMP** transporte erreurs et tests (echo, TTL exceeded, destination unreachable).

### Méthode
1. Ping de sa propre IP → pile OK ?
2. Ping de la passerelle → LAN OK ?
3. Ping d''une IP externe → routage OK ?
4. Ping d''un nom → DNS OK ?');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('1275f339-fa09-57fb-8e40-6a55bd7e6f26', '2d1bde9b-9304-55a5-b9c0-c99b67716833', 'Lab : diagnostiquer une panne réseau', 'lab', '25 min', 2, false, NULL, (SELECT id FROM public.labs WHERE slug = 'network-outage'));
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('1b989641-f47f-5e9b-a330-5651b817623f', '2d1bde9b-9304-55a5-b9c0-c99b67716833', 'Quiz : Network Fundamentals', 'quiz', '5 min', 3, false, '8d331fd4-9c62-5590-a05d-91f8866f403b', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('dcff06b3-d7bc-5475-b608-70ba3f3656aa', 'vlan-switching', 'Switching, VLAN et Trunking', 'Comprenez le fonctionnement d''un switch, segmentez avec les VLAN, reliez avec des trunks 802.1Q et évitez les boucles avec STP.', 'networking', 'débutant', '4h', 240,
  'published', 'free', 250, 1, ARRAY['Expliquer l''apprentissage MAC','Créer et affecter des VLAN','Configurer un trunk 802.1Q','Décrire le rôle de STP']::text[], ARRAY['Network Fundamentals']::text[], 3, (SELECT id FROM public.categories WHERE slug = 'networking'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT 'dcff06b3-d7bc-5475-b608-70ba3f3656aa', id, 300 FROM public.skills WHERE slug = 'switching';
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT 'dcff06b3-d7bc-5475-b608-70ba3f3656aa', id, 100 FROM public.skills WHERE slug = 'networking';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('6bc19923-c70c-5675-85bf-698dc79206f2', 'dcff06b3-d7bc-5475-b608-70ba3f3656aa', 'Quiz — Switching, VLAN et Trunking', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('371e73e6-d056-5bb3-b9b1-3412ec3371c6', '6bc19923-c70c-5675-85bf-698dc79206f2', 'single', 'Que fait un switch d''une trame dont l''adresse MAC destination est inconnue ?', '[{"id": "a", "text": "Il la diffuse sur tous les ports du VLAN (flooding)"}, {"id": "b", "text": "Il la supprime"}, {"id": "c", "text": "Il la renvoie à l''émetteur"}, {"id": "d", "text": "Il la route via IP"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('371e73e6-d056-5bb3-b9b1-3412ec3371c6', '["a"]'::jsonb, 'Destination inconnue → flooding dans le VLAN.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('43935171-caec-5c2e-ac64-1436f920b118', '6bc19923-c70c-5675-85bf-698dc79206f2', 'single', 'Quelle norme définit le tagging VLAN ?', '[{"id": "a", "text": "802.1Q"}, {"id": "b", "text": "802.3"}, {"id": "c", "text": "802.11"}, {"id": "d", "text": "802.1X"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('43935171-caec-5c2e-ac64-1436f920b118', '["a"]'::jsonb, '802.1Q ajoute un tag de 4 octets.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('77e4168a-bfc0-57be-93f1-089aba93ff93', '6bc19923-c70c-5675-85bf-698dc79206f2', 'single', 'Comment faire communiquer deux VLAN ?', '[{"id": "a", "text": "Avec un équipement de couche 3"}, {"id": "b", "text": "Avec un câble croisé"}, {"id": "c", "text": "En élargissant le masque du switch"}, {"id": "d", "text": "Impossible"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('77e4168a-bfc0-57be-93f1-089aba93ff93', '["a"]'::jsonb, 'Il faut un routage inter-VLAN.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('2dc81bf1-0815-534c-b56c-8be6df1a3a78', '6bc19923-c70c-5675-85bf-698dc79206f2', 'single', 'Quel est le rôle de STP ?', '[{"id": "a", "text": "Empêcher les boucles de couche 2"}, {"id": "b", "text": "Chiffrer les trames"}, {"id": "c", "text": "Attribuer les adresses IP"}, {"id": "d", "text": "Router les VLAN"}]'::jsonb, 3);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('2dc81bf1-0815-534c-b56c-8be6df1a3a78', '["a"]'::jsonb, 'STP bloque les liens redondants pour éviter les boucles.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('a3964ccf-1d25-5dd8-83a2-17540d8f84eb', 'dcff06b3-d7bc-5475-b608-70ba3f3656aa', 'Concepts', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('38c45078-f642-5bc6-982d-2a2985e8442a', 'a3964ccf-1d25-5dd8-83a2-17540d8f84eb', 'Le switch Ethernet', 'text', '15 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('38c45078-f642-5bc6-982d-2a2985e8442a', '## Apprentissage et commutation
Un switch maintient une **table d''adresses MAC** (CAM) : il apprend l''adresse source de chaque trame reçue et l''associe au port d''entrée.

- Destination connue → trame envoyée sur **un seul port** (unicast).
- Destination inconnue ou broadcast → **flooding** sur tous les ports du VLAN.

```text
Switch# show mac address-table
```
Un switch sépare les **domaines de collision** (un par port) mais pas les **domaines de broadcast** : c''est le rôle des VLAN et des routeurs.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('f9a904e8-48aa-52f1-adbb-e7ebbc322220', 'a3964ccf-1d25-5dd8-83a2-17540d8f84eb', 'VLAN et 802.1Q', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('f9a904e8-48aa-52f1-adbb-e7ebbc322220', '## Segmenter logiquement
Un **VLAN** est un domaine de broadcast distinct sur un même switch. Avantages : sécurité, performances, organisation.

- **Port d''accès** : appartient à un seul VLAN, trames non étiquetées.
- **Port trunk** : transporte plusieurs VLAN, trames **étiquetées 802.1Q** (tag de 4 octets contenant l''ID VLAN, 1–4094).
- **VLAN natif** : VLAN non étiqueté sur un trunk (par défaut le 1 — à changer par sécurité).

```text
Switch(config)# vlan 10
Switch(config-vlan)# name COMPTA
Switch(config)# interface fa0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
```');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('87bb2faa-1a3f-5b3f-ad38-7d23c7736f38', 'a3964ccf-1d25-5dd8-83a2-17540d8f84eb', 'Trunks entre switchs', 'text', '15 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('87bb2faa-1a3f-5b3f-ad38-7d23c7736f38', '## Configuration d''un trunk
```text
Switch(config)# interface gi0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk allowed vlan 10,20
Switch(config-if)# switchport trunk native vlan 99
Switch# show interfaces trunk
```
Deux VLAN différents ne communiquent qu''à travers un **routeur** (ou switch L3) : *router-on-a-stick* ou SVI.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('bda26fd1-f7a2-5b3b-8c0d-97d996a073a0', 'dcff06b3-d7bc-5475-b608-70ba3f3656aa', 'Pratique et boucles', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('82b07ceb-f7c2-5d6f-8296-22101a4a00f8', 'bda26fd1-f7a2-5b3b-8c0d-97d996a073a0', 'Spanning Tree (STP)', 'text', '20 min', 0, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('82b07ceb-f7c2-5d6f-8296-22101a4a00f8', '## Éviter les boucles de couche 2
Sans protection, une boucle provoque des **tempêtes de broadcast** : le réseau s''effondre en quelques secondes (pas de TTL en couche 2).

**STP** (802.1D) élit un **root bridge** (plus petit Bridge ID = priorité + MAC) puis bloque les liens redondants. Rôles : *root port*, *designated port*, *alternate/blocked*.

- **RSTP** (802.1w) converge en quelques secondes : à privilégier.
- **PortFast** sur les ports d''accès, avec **BPDU Guard** pour les protéger.

```text
Switch# show spanning-tree vlan 10
```');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('b751f679-14ac-5733-ae33-6f88634a4788', 'bda26fd1-f7a2-5b3b-8c0d-97d996a073a0', 'Lab : VLAN et trunk', 'lab', '25 min', 1, false, NULL, (SELECT id FROM public.labs WHERE slug = 'cisco-vlan-trunk'));
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('78dc5131-6a56-5ba8-a948-07981caff204', 'bda26fd1-f7a2-5b3b-8c0d-97d996a073a0', 'Quiz : switching', 'quiz', '5 min', 2, false, '6bc19923-c70c-5675-85bf-698dc79206f2', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('1f91cb97-90fa-5e7f-ab62-bab8dd454dd5', 'cisco-ios-fundamentals', 'Cisco IOS Fundamentals', 'Prenez en main la CLI Cisco IOS : modes, configuration de base, interfaces et commandes de vérification.', 'cisco', 'débutant', '4h', 240,
  'published', 'free', 250, 1, ARRAY['Naviguer entre les modes IOS','Configurer nom, mots de passe et interfaces','Vérifier avec les commandes show','Sauvegarder la configuration']::text[], ARRAY['Network Fundamentals (recommandé)']::text[], 4, (SELECT id FROM public.categories WHERE slug = 'cisco'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '1f91cb97-90fa-5e7f-ab62-bab8dd454dd5', id, 300 FROM public.skills WHERE slug = 'cisco';
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '1f91cb97-90fa-5e7f-ab62-bab8dd454dd5', id, 100 FROM public.skills WHERE slug = 'networking';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('2ee1a499-fb48-5cfd-995d-9d12a652d249', '1f91cb97-90fa-5e7f-ab62-bab8dd454dd5', 'Quiz — Cisco IOS Fundamentals', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('ff13819f-1c70-5258-9ff8-5bdd70991a22', '2ee1a499-fb48-5cfd-995d-9d12a652d249', 'single', 'Quelle commande permet de passer en mode privilégié ?', '[{"id": "a", "text": "enable"}, {"id": "b", "text": "configure terminal"}, {"id": "c", "text": "login"}, {"id": "d", "text": "exit"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('ff13819f-1c70-5258-9ff8-5bdd70991a22', '["a"]'::jsonb, '`enable` donne accès au mode `#`.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('180e3cf9-ca80-53bd-b058-7b1166281f2d', '2ee1a499-fb48-5cfd-995d-9d12a652d249', 'single', 'Une interface affiche « administratively down ». Que manque-t-il ?', '[{"id": "a", "text": "no shutdown"}, {"id": "b", "text": "ip address"}, {"id": "c", "text": "hostname"}, {"id": "d", "text": "enable secret"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('180e3cf9-ca80-53bd-b058-7b1166281f2d', '["a"]'::jsonb, 'L''interface a été désactivée : `no shutdown` l''active.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('00227786-c15e-5794-8518-540f2ef1dced', '2ee1a499-fb48-5cfd-995d-9d12a652d249', 'single', 'Où est stockée la configuration qui survit au redémarrage ?', '[{"id": "a", "text": "startup-config (NVRAM)"}, {"id": "b", "text": "running-config"}, {"id": "c", "text": "flash uniquement"}, {"id": "d", "text": "ROMMON"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('00227786-c15e-5794-8518-540f2ef1dced', '["a"]'::jsonb, 'startup-config est chargée au démarrage.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('13643df0-8cb8-56e1-97b3-ca7f91899817', '2ee1a499-fb48-5cfd-995d-9d12a652d249', 'single', 'Quelle commande résume l''état de toutes les interfaces IP ?', '[{"id": "a", "text": "show ip interface brief"}, {"id": "b", "text": "show version"}, {"id": "c", "text": "show clock"}, {"id": "d", "text": "show arp"}]'::jsonb, 3);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('13643df0-8cb8-56e1-97b3-ca7f91899817', '["a"]'::jsonb, 'C''est la commande de vérification de base.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('d5699baf-c423-563e-8c83-af49746a111b', '1f91cb97-90fa-5e7f-ab62-bab8dd454dd5', 'La CLI IOS', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('0fe26af1-436f-5dfb-91e8-e2eae64b5117', 'd5699baf-c423-563e-8c83-af49746a111b', 'Modes et navigation', 'text', '15 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('0fe26af1-436f-5dfb-91e8-e2eae64b5117', '## Les modes IOS
| Mode | Invite | Accès |
|---|---|---|
| User EXEC | `Router>` | par défaut |
| Privileged EXEC | `Router#` | `enable` |
| Global config | `Router(config)#` | `configure terminal` |
| Interface config | `Router(config-if)#` | `interface gi0/0` |

- `?` affiche l''aide contextuelle ; `Tab` complète ; les commandes peuvent être abrégées (`conf t`).
- `exit` remonte d''un niveau, `end` ou `Ctrl+Z` revient en mode privilégié.
- Préfixer par `no` annule une commande (`no shutdown`).');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('845d5e84-015f-5999-9d82-e819ed89bd4f', 'd5699baf-c423-563e-8c83-af49746a111b', 'Configuration de base', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('845d5e84-015f-5999-9d82-e819ed89bd4f', '## Les premières commandes
```text
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# enable secret MotDePasseFort!
R1(config)# service password-encryption
R1(config)# banner motd #Acces reserve#
R1(config)# line vty 0 4
R1(config-line)# password cisco123
R1(config-line)# login
R1(config-line)# exit
R1(config)# end
R1# copy running-config startup-config
```
- `running-config` : configuration active (RAM). `startup-config` : sauvegardée (NVRAM).
- **Toujours** `copy running-config startup-config` (ou `write memory`) après modification.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('e394a719-0f23-58de-bd86-1a747ab4b234', 'd5699baf-c423-563e-8c83-af49746a111b', 'Interfaces et adressage', 'text', '20 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('e394a719-0f23-58de-bd86-1a747ab4b234', '## Configurer une interface routée
```text
R1(config)# interface gigabitEthernet 0/0
R1(config-if)# description LAN-Compta
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# no shutdown
```
Une interface de routeur est **désactivée par défaut** : `no shutdown` est indispensable.

### Vérifier
```text
R1# show ip interface brief
R1# show interfaces gi0/0
R1# show running-config
R1# ping 192.168.10.2
```
Lecture de `show ip interface brief` : *Status* = couche 1, *Protocol* = couche 2. `up/up` est l''état sain ; `administratively down` signifie qu''il manque `no shutdown`.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('b85ebc44-e8d7-5813-b744-ffe84d064df8', '1f91cb97-90fa-5e7f-ab62-bab8dd454dd5', 'Pratique', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('13e67ee4-27fd-5bf5-acfe-ca1643b6493f', 'b85ebc44-e8d7-5813-b744-ffe84d064df8', 'Lab : configurer une interface', 'lab', '15 min', 0, false, NULL, (SELECT id FROM public.labs WHERE slug = 'cisco-interface-basics'));
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('b7f29f58-425f-563d-bf39-1f3ce0830673', 'b85ebc44-e8d7-5813-b744-ffe84d064df8', 'Quiz : Cisco IOS', 'quiz', '5 min', 1, false, '2ee1a499-fb48-5cfd-995d-9d12a652d249', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('3fbe0509-69e5-53f7-89eb-1696b755174b', 'ospf-fundamentals', 'Routing & OSPF Fundamentals', 'Du routage statique à OSPF : fonctionnement link-state, voisinages, areas, configuration et dépannage.', 'networking', 'intermédiaire', '5h', 300,
  'published', 'free', 300, 2, ARRAY['Configurer des routes statiques','Expliquer le fonctionnement d''OSPF','Distinguer DR/BDR et areas','Dépanner une adjacence OSPF']::text[], ARRAY['Cisco IOS Fundamentals','Network Fundamentals']::text[], 5, (SELECT id FROM public.categories WHERE slug = 'networking'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '3fbe0509-69e5-53f7-89eb-1696b755174b', id, 300 FROM public.skills WHERE slug = 'routing';
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '3fbe0509-69e5-53f7-89eb-1696b755174b', id, 100 FROM public.skills WHERE slug = 'networking';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('2b5621e3-e479-5b63-92cb-b23a79e72381', '3fbe0509-69e5-53f7-89eb-1696b755174b', 'Quiz — Routing & OSPF Fundamentals', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('9e43db77-e50d-5b12-8cae-e1b006c0d860', '2b5621e3-e479-5b63-92cb-b23a79e72381', 'single', 'Quelle area est le backbone OSPF ?', '[{"id": "a", "text": "Area 0"}, {"id": "b", "text": "Area 1"}, {"id": "c", "text": "Area 100"}, {"id": "d", "text": "Aucune"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('9e43db77-e50d-5b12-8cae-e1b006c0d860', '["a"]'::jsonb, 'Toutes les areas doivent se raccorder à l''area 0.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('652b833b-c43e-572b-a1d3-729dbff2f49f', '2b5621e3-e479-5b63-92cb-b23a79e72381', 'single', 'Quelle route est choisie entre 10.0.0.0/8 et 10.1.0.0/16 pour 10.1.2.3 ?', '[{"id": "a", "text": "10.1.0.0/16"}, {"id": "b", "text": "10.0.0.0/8"}, {"id": "c", "text": "La plus récente"}, {"id": "d", "text": "Au hasard"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('652b833b-c43e-572b-a1d3-729dbff2f49f', '["a"]'::jsonb, 'Le plus long préfixe gagne.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('a4a6ccee-ccb6-531b-b3b5-1dcc834e7e6d', '2b5621e3-e479-5b63-92cb-b23a79e72381', 'multiple', 'Quels paramètres doivent correspondre pour former une adjacence ? (plusieurs réponses)', '[{"id": "a", "text": "Area"}, {"id": "b", "text": "Timers Hello/Dead"}, {"id": "c", "text": "Sous-réseau"}, {"id": "d", "text": "Hostname"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('a4a6ccee-ccb6-531b-b3b5-1dcc834e7e6d', '["a", "b", "c"]'::jsonb, 'Le hostname n''a aucune influence.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('3eb2b17f-7973-5e23-9c76-5b49434aa30c', '2b5621e3-e479-5b63-92cb-b23a79e72381', 'single', 'Quelle est la distance administrative d''OSPF ?', '[{"id": "a", "text": "110"}, {"id": "b", "text": "1"}, {"id": "c", "text": "90"}, {"id": "d", "text": "120"}]'::jsonb, 3);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('3eb2b17f-7973-5e23-9c76-5b49434aa30c', '["a"]'::jsonb, 'OSPF = 110.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('f915e3a1-ad4d-531c-a4a4-70f2df6b9ebc', '3fbe0509-69e5-53f7-89eb-1696b755174b', 'Routage statique', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('6be5f266-2ad1-568b-83fd-8227dbcd348a', 'f915e3a1-ad4d-531c-a4a4-70f2df6b9ebc', 'Table de routage et routes statiques', 'text', '20 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('6be5f266-2ad1-568b-83fd-8227dbcd348a', '## Comment un routeur décide
Il choisit la route **la plus spécifique** (plus long préfixe) dans sa table ; à préfixe égal, la plus faible **distance administrative** (AD) l''emporte.

| Source | AD |
|---|---|
| Connected | 0 |
| Static | 1 |
| OSPF | 110 |
| RIP | 120 |

```text
R1(config)# ip route 192.168.20.0 255.255.255.0 10.0.0.2
R1(config)# ip route 0.0.0.0 0.0.0.0 10.0.0.2   ! route par défaut
R1# show ip route
```
Les routes statiques sont simples et prévisibles mais **ne s''adaptent pas aux pannes** : d''où le routage dynamique.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('b84e37c7-16f3-5e87-85a6-c93c455dd5eb', 'f915e3a1-ad4d-531c-a4a4-70f2df6b9ebc', 'Lab : routage statique', 'lab', '30 min', 1, false, NULL, (SELECT id FROM public.labs WHERE slug = 'cisco-static-routing'));
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('95ff86f4-da6f-5b17-9042-629bd2e78c7e', '3fbe0509-69e5-53f7-89eb-1696b755174b', 'OSPF', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('3c4d0097-e211-5c11-8566-b6dc5c67d7ec', '95ff86f4-da6f-5b17-9042-629bd2e78c7e', 'OSPF : principes link-state', 'text', '25 min', 0, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('3c4d0097-e211-5c11-8566-b6dc5c67d7ec', '## Comment fonctionne OSPF
OSPF est un protocole **link-state** : chaque routeur diffuse l''état de ses liens (**LSA**), construit la même base topologique (**LSDB**) et calcule le plus court chemin avec **Dijkstra (SPF)**.

- Métrique = **coût**, dérivé de la bande passante (référence 100 Mb/s par défaut).
- Multicast `224.0.0.5` (tous les routeurs OSPF) et `224.0.0.6` (DR/BDR).
- Convergence rapide, supporte VLSM et CIDR.

### Étapes d''une adjacence
`Down → Init → 2-Way → ExStart → Exchange → Loading → Full`');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('659c9b70-f82f-51a8-9e2b-6f5de3f93f80', '95ff86f4-da6f-5b17-9042-629bd2e78c7e', 'Voisinages, DR/BDR et areas', 'text', '25 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('659c9b70-f82f-51a8-9e2b-6f5de3f93f80', '## Conditions pour devenir voisin
Même **area**, même **sous-réseau**, mêmes timers **Hello/Dead** (10 s / 40 s en broadcast), même type d''authentification, Router-ID unique.

### DR / BDR
Sur un segment multi-accès (Ethernet), un **DR** et un **BDR** sont élus (priorité la plus haute, puis Router-ID) pour limiter le nombre d''adjacences.

### Areas
- **Area 0** (backbone) : toutes les autres areas s''y raccordent.
- Les **ABR** relient plusieurs areas ; ils résument les routes.
- Le découpage réduit la taille de la LSDB et isole les pannes.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('d32abaa3-2ab8-535f-99fc-759a5bd4b878', '95ff86f4-da6f-5b17-9042-629bd2e78c7e', 'Configurer OSPF', 'text', '20 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('d32abaa3-2ab8-535f-99fc-759a5bd4b878', '## Configuration de base
```text
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.0.0.0 0.0.0.3 area 0
R1(config-router)# network 192.168.10.0 0.0.0.255 area 0
R1(config-router)# passive-interface gi0/1   ! pas de Hello vers les LAN
```
Ou directement sur l''interface : `ip ospf 1 area 0`.

### Vérifier
```text
R1# show ip ospf neighbor
R1# show ip route ospf
R1# show ip ospf interface brief
```');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('684c2515-3419-5690-bb85-5c1a36e5ccdc', '95ff86f4-da6f-5b17-9042-629bd2e78c7e', 'Lab : configurer OSPF', 'lab', '30 min', 3, false, NULL, (SELECT id FROM public.labs WHERE slug = 'ospf-config'));
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('86a3c5aa-119e-5a48-8c3d-58e3293ad7fc', '95ff86f4-da6f-5b17-9042-629bd2e78c7e', 'Quiz : routage et OSPF', 'quiz', '5 min', 4, false, '2b5621e3-e479-5b63-92cb-b23a79e72381', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('9fb82b5e-ac35-576c-9693-6fcf5fbdb863', 'voip-fundamentals-sip', 'VoIP Fundamentals : SIP, SDP et RTP', 'Comprenez l''architecture de la téléphonie sur IP : signalisation SIP, négociation SDP, flux média RTP et dépannage.', 'voip', 'débutant', '4h40', 280,
  'published', 'free', 250, 1, ARRAY['Décrire l''architecture d''un système VoIP','Lire un échange SIP INVITE','Interpréter un SDP','Comprendre RTP et les codecs','Dépanner un enregistrement SIP']::text[], ARRAY['Network Fundamentals (recommandé)']::text[], 6, (SELECT id FROM public.categories WHERE slug = 'voip'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '9fb82b5e-ac35-576c-9693-6fcf5fbdb863', id, 300 FROM public.skills WHERE slug = 'voip';
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '9fb82b5e-ac35-576c-9693-6fcf5fbdb863', id, 50 FROM public.skills WHERE slug = 'networking';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('01c45bbf-6598-598f-8d76-832b359828c0', '9fb82b5e-ac35-576c-9693-6fcf5fbdb863', 'Quiz — VoIP Fundamentals : SIP, SDP et RTP', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('1c3e44fc-66f7-586c-b35d-1d8896205f5f', '01c45bbf-6598-598f-8d76-832b359828c0', 'single', 'Quel code SIP signifie « Ringing » ?', '[{"id": "a", "text": "180"}, {"id": "b", "text": "200"}, {"id": "c", "text": "404"}, {"id": "d", "text": "486"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('1c3e44fc-66f7-586c-b35d-1d8896205f5f', '["a"]'::jsonb, '180 Ringing : le destinataire est alerté.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('691ef3ad-f3e2-59c0-921b-ae2e6a048c3d', '01c45bbf-6598-598f-8d76-832b359828c0', 'single', 'Quel protocole transporte la voix ?', '[{"id": "a", "text": "RTP"}, {"id": "b", "text": "SIP"}, {"id": "c", "text": "SDP"}, {"id": "d", "text": "RTCP uniquement"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('691ef3ad-f3e2-59c0-921b-ae2e6a048c3d', '["a"]'::jsonb, 'SIP signale, RTP transporte le média.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('d2e54377-7fd0-5751-b2fc-b4e688a6034f', '01c45bbf-6598-598f-8d76-832b359828c0', 'single', 'Symptôme : l''appel s''établit mais sans audio derrière un NAT. Cause probable ?', '[{"id": "a", "text": "IP privée annoncée dans le SDP / RTP bloqué"}, {"id": "b", "text": "Mot de passe SIP erroné"}, {"id": "c", "text": "Mauvais codec 100 % du temps"}, {"id": "d", "text": "DNS en panne"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('d2e54377-7fd0-5751-b2fc-b4e688a6034f', '["a"]'::jsonb, 'Le média ne trouve pas son chemin : NAT ou ports RTP.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('1bad4954-de7f-5f20-8c0f-bcd77f7c8cdb', '01c45bbf-6598-598f-8d76-832b359828c0', 'multiple', 'Quels éléments dégradent la qualité de la voix ? (plusieurs réponses)', '[{"id": "a", "text": "Perte de paquets"}, {"id": "b", "text": "Gigue élevée"}, {"id": "c", "text": "Latence élevée"}, {"id": "d", "text": "Marquage DSCP EF"}]'::jsonb, 3);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('1bad4954-de7f-5f20-8c0f-bcd77f7c8cdb', '["a", "b", "c"]'::jsonb, 'DSCP EF améliore la voix en la priorisant.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('e22d09b7-7bd0-5c22-bc32-c63f747781c8', '9fb82b5e-ac35-576c-9693-6fcf5fbdb863', 'Architecture et signalisation', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('d39ba8ee-a404-5d3d-a8c2-002bec7ca844', 'e22d09b7-7bd0-5c22-bc32-c63f747781c8', 'Architecture VoIP', 'text', '15 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('d39ba8ee-a404-5d3d-a8c2-002bec7ca844', '## Les acteurs
- **Terminal** (softphone, téléphone IP) : *User Agent* (UA).
- **Registrar / Proxy** : enregistre les UA et route les appels (rôle souvent tenu par l''**IPBX**, ex. Asterisk).
- **SBC** (Session Border Controller) : frontière entre réseau interne et opérateur (sécurité, normalisation SIP, NAT).
- **Trunk SIP** : lien vers l''opérateur pour joindre le réseau téléphonique public.

Deux plans distincts :
1. **Signalisation** (SIP, TCP/UDP 5060, TLS 5061) : établir, modifier, terminer l''appel.
2. **Média** (RTP, UDP dans une plage dynamique, ex. 10000–20000) : la voix elle-même.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('c56874b9-ea87-501b-82fe-89c2608dee87', 'e22d09b7-7bd0-5c22-bc32-c63f747781c8', 'SIP : requêtes et réponses', 'text', '25 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('c56874b9-ea87-501b-82fe-89c2608dee87', '## Un protocole texte proche de HTTP
### Méthodes courantes
`REGISTER` (s''enregistrer), `INVITE` (initier un appel), `ACK`, `BYE` (raccrocher), `CANCEL`, `OPTIONS` (test de vie).

### Codes de réponse
| Classe | Sens | Exemples |
|---|---|---|
| 1xx | provisoire | 100 Trying, 180 Ringing |
| 2xx | succès | 200 OK |
| 3xx | redirection | 302 Moved Temporarily |
| 4xx | erreur client | 401/407 Unauthorized, 404 Not Found, 486 Busy Here |
| 5xx | erreur serveur | 503 Service Unavailable |
| 6xx | échec global | 603 Decline |

### Appel nominal
```text
A  -- INVITE -->  B
A  <-- 100 Trying / 180 Ringing --  B
A  <-- 200 OK --  B
A  -- ACK -->  B        (média RTP établi)
...
A  -- BYE -->  B ;  A <-- 200 OK -- B
```');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('e1440d1a-e24e-5e48-a6e3-8dd4fc31770e', 'e22d09b7-7bd0-5c22-bc32-c63f747781c8', 'SDP : négocier le média', 'text', '20 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('e1440d1a-e24e-5e48-a6e3-8dd4fc31770e', '## Offer / Answer
Le corps du `INVITE` contient un **SDP** décrivant le média proposé :
```text
v=0
o=alice 2890844526 2890844526 IN IP4 192.0.2.10
s=Call
c=IN IP4 192.0.2.10
t=0 0
m=audio 49170 RTP/AVP 0 8 101
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000
```
- `c=` : adresse IP où envoyer le RTP. `m=audio 49170` : port.
- Liste de **codecs** par ordre de préférence ; le 200 OK contient la réponse avec le codec retenu.

> Problème classique : derrière un NAT, le SDP annonce une IP privée → **audio à sens unique ou absent**.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('a93e04ce-520e-5e10-a3b1-f3cfc2b21429', '9fb82b5e-ac35-576c-9693-6fcf5fbdb863', 'Média et dépannage', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('3d2e5488-b106-56fd-9dd4-2bf56ea2f317', 'a93e04ce-520e-5e10-a3b1-f3cfc2b21429', 'RTP, codecs et qualité', 'text', '20 min', 0, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('3d2e5488-b106-56fd-9dd4-2bf56ea2f317', '## Transport de la voix
**RTP** (sur UDP) transporte des paquets toutes les 20 ms typiquement ; **RTCP** remonte des statistiques.

| Codec | Débit | Remarque |
|---|---|---|
| G.711 (PCMU/PCMA) | 64 kb/s | qualité « téléphone », peu de CPU |
| G.729 | 8 kb/s | compressé, licence |
| Opus | 6–510 kb/s | moderne, adaptatif |

### Qualité
- **Latence** < 150 ms (sens unique) ; **gigue** < 30 ms ; **perte** < 1 %.
- Marquage **QoS DSCP EF (46)** pour la voix, priorité en file LLQ.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('46d91db1-2efd-5941-81c7-ef7e11ee1d49', 'a93e04ce-520e-5e10-a3b1-f3cfc2b21429', 'Dépanner SIP', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('46d91db1-2efd-5941-81c7-ef7e11ee1d49', '## Méthode
1. **Enregistrement** : `REGISTER` reçoit-il 200 OK ? Sinon 401 (identifiants), 403 (refusé), timeout (réseau/pare-feu/port).
2. **Appel** : `INVITE` → 404 (numéro inconnu), 486 (occupé), 488 (codec incompatible).
3. **Média** : appel établi mais pas d''audio → NAT, ports RTP bloqués, mauvaise IP dans le SDP.

### Outils
```bash
sudo tcpdump -i any -n port 5060 -A
sngrep                 # visualisation interactive des dialogues SIP
asterisk -rx "pjsip show endpoints"
```');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('40fc34b1-5bfc-5fb4-8c8b-39467fab54e1', 'a93e04ce-520e-5e10-a3b1-f3cfc2b21429', 'Lab : dépanner un enregistrement SIP', 'lab', '35 min', 2, false, NULL, (SELECT id FROM public.labs WHERE slug = 'sip-troubleshoot'));
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('937c08a9-ca84-535c-aab0-3dd92dee7236', 'a93e04ce-520e-5e10-a3b1-f3cfc2b21429', 'Quiz : VoIP Fundamentals', 'quiz', '5 min', 3, false, '01c45bbf-6598-598f-8d76-832b359828c0', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('d7eea08a-e40f-546c-8f5c-855045951a36', 'asterisk-freepbx', 'Asterisk & FreePBX', 'Déployez un IPBX : architecture Asterisk, PJSIP, dialplan, FreePBX et trunk SIP vers un opérateur.', 'voip', 'intermédiaire', '6h', 360,
  'published', 'premium', 350, 2, ARRAY['Configurer des endpoints PJSIP','Écrire un dialplan','Administrer via FreePBX','Raccorder un trunk SIP']::text[], ARRAY['VoIP Fundamentals : SIP, SDP et RTP','Linux Fundamentals']::text[], 7, (SELECT id FROM public.categories WHERE slug = 'voip'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT 'd7eea08a-e40f-546c-8f5c-855045951a36', id, 300 FROM public.skills WHERE slug = 'voip';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('4d8c38d6-6d0f-5b44-b65a-22e608dd1bb8', 'd7eea08a-e40f-546c-8f5c-855045951a36', 'Quiz — Asterisk & FreePBX', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('12636651-a880-5d5d-bdb3-367a0a4bde1e', '4d8c38d6-6d0f-5b44-b65a-22e608dd1bb8', 'single', 'Quelle commande affiche les endpoints PJSIP ?', '[{"id": "a", "text": "pjsip show endpoints"}, {"id": "b", "text": "sip show peers"}, {"id": "c", "text": "core show uptime"}, {"id": "d", "text": "dialplan show"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('12636651-a880-5d5d-bdb3-367a0a4bde1e', '["a"]'::jsonb, '`sip show peers` concernait chan_sip, remplacé par PJSIP.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('7cce601d-5ff9-5b0b-80f4-52675aaa3f4d', '4d8c38d6-6d0f-5b44-b65a-22e608dd1bb8', 'single', 'Dans un dialplan, que représente ${EXTEN} ?', '[{"id": "a", "text": "Le numéro composé"}, {"id": "b", "text": "Le nom du contexte"}, {"id": "c", "text": "L''adresse IP"}, {"id": "d", "text": "Le codec"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('7cce601d-5ff9-5b0b-80f4-52675aaa3f4d', '["a"]'::jsonb, 'EXTEN contient l''extension appelée.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('3b14b958-524b-502c-b05f-a72a98ba5033', '4d8c38d6-6d0f-5b44-b65a-22e608dd1bb8', 'single', 'Quel fichier contient le dialplan ?', '[{"id": "a", "text": "extensions.conf"}, {"id": "b", "text": "pjsip.conf"}, {"id": "c", "text": "modules.conf"}, {"id": "d", "text": "rtp.conf"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('3b14b958-524b-502c-b05f-a72a98ba5033', '["a"]'::jsonb, 'Le dialplan est dans extensions.conf.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('de2ded88-ca70-5754-85b3-3435a6e3f57e', 'd7eea08a-e40f-546c-8f5c-855045951a36', 'Asterisk', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('544c7078-025c-5d2a-9d4a-75c475217bbb', 'de2ded88-ca70-5754-85b3-3435a6e3f57e', 'Architecture d''Asterisk', 'text', '15 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('544c7078-025c-5d2a-9d4a-75c475217bbb', '## Un PBX logiciel
Asterisk est un **IPBX open source** composé de modules : canaux (`chan_pjsip`), applications (`Dial`, `Playback`, `Voicemail`), ressources (musique d''attente, enregistrement).

- Configuration dans `/etc/asterisk/` : `pjsip.conf`, `extensions.conf`, `voicemail.conf`…
- CLI : `sudo asterisk -rvvv`, ou `asterisk -rx "core reload"`.
- **FreePBX** est une interface web qui génère ces fichiers (et gère trunks, routes, files d''attente).');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('59e2de5e-750d-548a-be05-87e1acdcbf92', 'de2ded88-ca70-5754-85b3-3435a6e3f57e', 'PJSIP : endpoints', 'text', '25 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('59e2de5e-750d-548a-be05-87e1acdcbf92', '## Un téléphone = 3 objets
```ini
; pjsip.conf
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0

[1001]
type=endpoint
context=internal
disallow=all
allow=ulaw,alaw
auth=1001
aors=1001

[1001]
type=auth
auth_type=userpass
username=1001
password=MotDePasseLong!

[1001]
type=aor
max_contacts=1
```
Vérifier : `pjsip show endpoints`, `pjsip show contacts`.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('1cda3479-e1c0-505b-b153-b04d4851f763', 'de2ded88-ca70-5754-85b3-3435a6e3f57e', 'Dialplan', 'text', '25 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('1cda3479-e1c0-505b-b153-b04d4851f763', '## Contextes, extensions, priorités
```ini
; extensions.conf
[internal]
exten => _10XX,1,NoOp(Appel interne vers ${EXTEN})
 same => n,Dial(PJSIP/${EXTEN},20)
 same => n,Voicemail(${EXTEN}@default,u)
 same => n,Hangup()
```
- `_10XX` : motif (X = chiffre 0–9) ; `${EXTEN}` : numéro composé.
- `Dial(PJSIP/1001,20)` : sonne 20 s.
- Un **contexte** isole les règles par origine (internal, from-trunk).');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('0d9f05a7-de9f-52e8-8b7c-e3de1546447c', 'd7eea08a-e40f-546c-8f5c-855045951a36', 'FreePBX et opérateur', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('2885ebe4-a74d-5649-822e-8c7ac0cc2c99', '0d9f05a7-de9f-52e8-8b7c-e3de1546447c', 'Trunk SIP vers un opérateur', 'text', '20 min', 0, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('2885ebe4-a74d-5649-822e-8c7ac0cc2c99', '## Paramètres typiques
- Serveur / proxy SIP de l''opérateur, authentification (user/mot de passe) **ou** par IP.
- **Codecs** : G.711 en priorité.
- Pare-feu : autoriser 5060/UDP (ou 5061/TLS) **depuis l''IP de l''opérateur uniquement** + plage RTP.
- Numérotation : normaliser en E.164 (`+33...`).

### Sécurité
Un PBX exposé sans filtrage est attaqué en quelques heures (fraude téléphonique). Utilisez **fail2ban**, des mots de passe longs, interdisez les appels sortants depuis les contextes entrants.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('d5ad361b-808d-5ac9-a56f-87ed5e650abd', '0d9f05a7-de9f-52e8-8b7c-e3de1546447c', 'Quiz : Asterisk', 'quiz', '5 min', 1, false, '4d8c38d6-6d0f-5b44-b65a-22e608dd1bb8', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('987ffd65-232a-5073-b00e-acb60c4a3077', 'security-fundamentals', 'Security Fundamentals', 'Les bases de la cybersécurité : triade CIA, authentification, pare-feu, durcissement et supervision.', 'security', 'débutant', '4h', 240,
  'published', 'free', 200, 1, ARRAY['Expliquer la triade CIA','Mettre en place une authentification robuste','Comprendre pare-feu et segmentation','Lire des journaux de sécurité']::text[], ARRAY['Aucun prérequis']::text[], 8, (SELECT id FROM public.categories WHERE slug = 'security'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '987ffd65-232a-5073-b00e-acb60c4a3077', id, 300 FROM public.skills WHERE slug = 'security';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('fea0e3eb-625d-5972-b9b8-95f8188570fb', '987ffd65-232a-5073-b00e-acb60c4a3077', 'Quiz — Security Fundamentals', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('a2d13d20-e725-580e-a07b-f52284ca8dd1', 'fea0e3eb-625d-5972-b9b8-95f8188570fb', 'single', 'Que protège l''intégrité ?', '[{"id": "a", "text": "L''information contre toute modification non autorisée"}, {"id": "b", "text": "L''accès au réseau"}, {"id": "c", "text": "La vitesse du service"}, {"id": "d", "text": "L''anonymat"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('a2d13d20-e725-580e-a07b-f52284ca8dd1', '["a"]'::jsonb, 'Intégrité = exactitude et non-altération.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('73277008-c9e9-5e65-ae2e-bb46e10f0abf', 'fea0e3eb-625d-5972-b9b8-95f8188570fb', 'single', 'Quel facteur MFA est le plus résistant au phishing ?', '[{"id": "a", "text": "Clé FIDO2"}, {"id": "b", "text": "SMS"}, {"id": "c", "text": "Question secrète"}, {"id": "d", "text": "Mot de passe long"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('73277008-c9e9-5e65-ae2e-bb46e10f0abf', '["a"]'::jsonb, 'FIDO2/WebAuthn lie l''authentification au domaine légitime.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('998cbec1-17c6-5c80-89f1-b693f54934c6', 'fea0e3eb-625d-5972-b9b8-95f8188570fb', 'single', 'Quelle politique par défaut pour un pare-feu ?', '[{"id": "a", "text": "Refuser puis autoriser le nécessaire"}, {"id": "b", "text": "Tout autoriser"}, {"id": "c", "text": "Autoriser sauf ports connus"}, {"id": "d", "text": "Aucune"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('998cbec1-17c6-5c80-89f1-b693f54934c6', '["a"]'::jsonb, 'Deny by default.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('09a88c7d-feec-5cd9-9e5c-40d5d6b4ba51', 'fea0e3eb-625d-5972-b9b8-95f8188570fb', 'multiple', 'Quelles mesures durcissent un serveur Linux ? (plusieurs réponses)', '[{"id": "a", "text": "Désactiver les services inutiles"}, {"id": "b", "text": "SSH par clé"}, {"id": "c", "text": "Mises à jour de sécurité"}, {"id": "d", "text": "Utiliser root au quotidien"}]'::jsonb, 3);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('09a88c7d-feec-5cd9-9e5c-40d5d6b4ba51', '["a", "b", "c"]'::jsonb, 'Utiliser root en permanence viole le moindre privilège.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('677c36cc-771e-5fce-86fb-602cc2693476', '987ffd65-232a-5073-b00e-acb60c4a3077', 'Principes', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('06791df4-4809-570a-a1f2-6f19f5e3681b', '677c36cc-771e-5fce-86fb-602cc2693476', 'La triade CIA et le risque', 'text', '15 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('06791df4-4809-570a-a1f2-6f19f5e3681b', '## Trois objectifs
- **Confidentialité** : seuls les autorisés accèdent à l''information (chiffrement, contrôle d''accès).
- **Intégrité** : l''information n''est pas altérée (hash, signatures).
- **Disponibilité** : le service fonctionne (redondance, sauvegardes, anti-DDoS).

**Risque = menace × vulnérabilité × impact.** On traite le risque : le réduire, l''accepter, le transférer (assurance) ou l''éviter.

Principes clés : **moindre privilège**, **défense en profondeur**, **zéro confiance**.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('86438c26-a5a6-560d-99e6-7a2965b4c786', '677c36cc-771e-5fce-86fb-602cc2693476', 'Authentification et MFA', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('86438c26-a5a6-560d-99e6-7a2965b4c786', '## Prouver qui l''on est
Trois familles de facteurs : **ce que je sais** (mot de passe), **ce que je possède** (clé FIDO2, application TOTP), **ce que je suis** (biométrie).

- Mots de passe : longs (passphrases), uniques, dans un gestionnaire.
- **MFA** : bloque la grande majorité des prises de compte. Préférez FIDO2/WebAuthn (résistant au phishing) à un SMS.
- Stockage côté serveur : **hash lent salé** (Argon2id, bcrypt) — jamais de mot de passe en clair.
- Entreprise : annuaire centralisé (LDAP/AD), **RADIUS / 802.1X** pour le réseau, SSO.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('9c16ce90-7e77-50e0-9d9d-bedcd8e2c0f6', '987ffd65-232a-5073-b00e-acb60c4a3077', 'Défense technique', 1);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('fe147767-9643-57e0-ab7a-e516fdc2a085', '9c16ce90-7e77-50e0-9d9d-bedcd8e2c0f6', 'Pare-feu et segmentation', 'text', '20 min', 0, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('fe147767-9643-57e0-ab7a-e516fdc2a085', '## Contrôler les flux
Un pare-feu applique des règles **par défaut : refuser**, puis autorise le strict nécessaire (IP source/destination, port, protocole). Les pare-feu *stateful* suivent les connexions.

### Segmentation
Séparer en **zones** : utilisateurs, serveurs, DMZ (services exposés), management. Les VLAN + ACL/pare-feu limitent la propagation d''une compromission.

```text
Internet -> [Pare-feu] -> DMZ (web)
                      -> LAN serveurs (BDD) : seul le web y accède, sur le port BDD
```');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('19cb6f91-0e34-5cf0-bc89-1cea24887931', '9c16ce90-7e77-50e0-9d9d-bedcd8e2c0f6', 'Durcissement Linux', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('19cb6f91-0e34-5cf0-bc89-1cea24887931', '## Checklist de base
- Mises à jour automatiques de sécurité (`unattended-upgrades`).
- SSH par clé, pas de root, `fail2ban`.
- Supprimer les services inutiles (`systemctl list-unit-files --state=enabled`).
- Pare-feu `deny incoming` par défaut.
- Permissions strictes ; `sudo` nominatif avec journalisation.
- Sauvegardes testées (règle **3-2-1**).
- Audit : `lynis audit system`.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('8c3cf347-8953-568d-8036-87ffb0202aa8', '9c16ce90-7e77-50e0-9d9d-bedcd8e2c0f6', 'Journaux et supervision', 'text', '15 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('8c3cf347-8953-568d-8036-87ffb0202aa8', '## Voir pour détecter
```bash
journalctl -u ssh --since today | grep "Failed password"
last -a | head
```
Centraliser les logs (syslog/Elastic/Wazuh) et alerter sur : échecs d''authentification répétés, nouveaux comptes, élévations de privilèges, flux sortants inhabituels.

Un **SOC** surveille ces signaux 24/7 : détection, qualification, réponse à incident (préparer → détecter → contenir → éradiquer → restaurer → retour d''expérience).');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('57dd6d58-f162-5765-ad18-92124d78cf90', '9c16ce90-7e77-50e0-9d9d-bedcd8e2c0f6', 'Quiz : Security Fundamentals', 'quiz', '5 min', 3, false, 'fea0e3eb-625d-5972-b9b8-95f8188570fb', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('41c317aa-24fa-516f-97a4-6d6456ba40e5', 'junos-fundamentals', 'Junos Fundamentals', 'Introduction à Junos : CLI à deux modes, modèle de configuration candidate/commit, configuration hiérarchique et routage de base.', 'juniper', 'intermédiaire', '3h', 180,
  'published', 'premium', 250, 3, ARRAY['Naviguer entre mode opérationnel et configuration','Utiliser candidate, commit et rollback','Lire la configuration hiérarchique','Configurer interfaces et routes']::text[], ARRAY['Cisco IOS Fundamentals','Network Fundamentals']::text[], 9, (SELECT id FROM public.categories WHERE slug = 'juniper'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '41c317aa-24fa-516f-97a4-6d6456ba40e5', id, 300 FROM public.skills WHERE slug = 'juniper';
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '41c317aa-24fa-516f-97a4-6d6456ba40e5', id, 50 FROM public.skills WHERE slug = 'routing';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('498c60b6-6e04-59c5-b0b8-3601200048ce', '41c317aa-24fa-516f-97a4-6d6456ba40e5', 'Quiz — Junos Fundamentals', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('9c53a2f8-c331-50eb-b3d7-3f7d864a5632', '498c60b6-6e04-59c5-b0b8-3601200048ce', 'single', 'Quelle commande applique la configuration candidate ?', '[{"id": "a", "text": "commit"}, {"id": "b", "text": "write memory"}, {"id": "c", "text": "apply"}, {"id": "d", "text": "save"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('9c53a2f8-c331-50eb-b3d7-3f7d864a5632', '["a"]'::jsonb, '`commit` active la candidate.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('86bcf5b0-df27-56b6-9925-2190c1bea82d', '498c60b6-6e04-59c5-b0b8-3601200048ce', 'single', 'Comment visualiser les différences avant de valider ?', '[{"id": "a", "text": "show | compare"}, {"id": "b", "text": "show diff"}, {"id": "c", "text": "compare run"}, {"id": "d", "text": "diff"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('86bcf5b0-df27-56b6-9925-2190c1bea82d', '["a"]'::jsonb, '`show | compare` affiche les modifications.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('7b8c6d88-d95c-5392-a3ec-cc3c34b30672', '498c60b6-6e04-59c5-b0b8-3601200048ce', 'single', 'Quelle commande annule automatiquement si l''on perd la main ?', '[{"id": "a", "text": "commit confirmed"}, {"id": "b", "text": "rollback 0"}, {"id": "c", "text": "commit check"}, {"id": "d", "text": "request restart"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('7b8c6d88-d95c-5392-a3ec-cc3c34b30672', '["a"]'::jsonb, 'commit confirmed attend une 2e validation.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('574fa7a1-8663-5140-b2ff-cfa924fdd350', '41c317aa-24fa-516f-97a4-6d6456ba40e5', 'Junos CLI', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('4d40207e-9c7f-554a-b9c1-7d3cb70bb700', '574fa7a1-8663-5140-b2ff-cfa924fdd350', 'Deux modes, une configuration candidate', 'text', '20 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('4d40207e-9c7f-554a-b9c1-7d3cb70bb700', '## Opérationnel vs configuration
- **Mode opérationnel** (`user@router>`) : `show`, `ping`, `monitor`.
- **Mode configuration** (`user@router#`) : tapez `configure`.

Contrairement à IOS, les changements ne sont **pas appliqués immédiatement** : ils vont dans une configuration **candidate**, activée par `commit`.

```text
[edit]
user@r1# set system host-name R1
user@r1# show | compare        # différences avec la config active
user@r1# commit confirmed 5    # annule automatiquement si non confirmé
user@r1# commit
user@r1# rollback 1            # revient à la version précédente
```
`commit confirmed` est un filet de sécurité précieux sur un équipement distant.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('ed208af7-1e84-575b-b069-d8a078d4bf89', '574fa7a1-8663-5140-b2ff-cfa924fdd350', 'Configuration hiérarchique', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('ed208af7-1e84-575b-b069-d8a078d4bf89', '## Arborescence
```text
interfaces {
    ge-0/0/0 {
        unit 0 {
            family inet {
                address 10.0.0.1/30;
            }
        }
    }
}
routing-options {
    static {
        route 192.168.20.0/24 next-hop 10.0.0.2;
    }
}
```
Équivalent en commandes `set` :
```text
set interfaces ge-0/0/0 unit 0 family inet address 10.0.0.1/30
set routing-options static route 192.168.20.0/24 next-hop 10.0.0.2
```
Vérifier : `show interfaces terse`, `show route`.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('ac903214-b550-599c-a44d-d8bb7df10493', '574fa7a1-8663-5140-b2ff-cfa924fdd350', 'OSPF sur Junos', 'text', '20 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('ac903214-b550-599c-a44d-d8bb7df10493', '## Configuration
```text
set protocols ospf area 0.0.0.0 interface ge-0/0/0.0
set protocols ospf area 0.0.0.0 interface lo0.0 passive
set routing-options router-id 1.1.1.1
```
Les areas s''écrivent en notation pointée (`0.0.0.0`). Vérification : `show ospf neighbor`, `show ospf interface`, `show route protocol ospf`.

Différence notable : sur Junos, l''IP se configure sur une **unit** logique (`ge-0/0/0.0`).');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('787644c3-6f90-5d33-945d-22d460b25ca6', '574fa7a1-8663-5140-b2ff-cfa924fdd350', 'Quiz : Junos', 'quiz', '5 min', 3, false, '498c60b6-6e04-59c5-b0b8-3601200048ce', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('a7c25172-cfb7-5ceb-9a59-9d89d6bb63c2', 'arista-eos-fundamentals', 'Arista EOS Fundamentals', 'Découvrez Arista EOS : CLI, architecture leaf-spine, eAPI et bases du data center.', 'arista', 'intermédiaire', '3h', 180,
  'published', 'premium', 250, 3, ARRAY['Utiliser la CLI EOS','Décrire une architecture leaf-spine','Utiliser eAPI pour automatiser','Comprendre le rôle d''EVPN/VXLAN']::text[], ARRAY['Cisco IOS Fundamentals']::text[], 10, (SELECT id FROM public.categories WHERE slug = 'arista'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT 'a7c25172-cfb7-5ceb-9a59-9d89d6bb63c2', id, 300 FROM public.skills WHERE slug = 'arista';
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT 'a7c25172-cfb7-5ceb-9a59-9d89d6bb63c2', id, 50 FROM public.skills WHERE slug = 'switching';
INSERT INTO public.quizzes (id, course_id, title, pass_score) VALUES ('e2d142a9-0020-557f-ab3b-6c466ed12ca1', 'a7c25172-cfb7-5ceb-9a59-9d89d6bb63c2', 'Quiz — Arista EOS Fundamentals', 70);
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('ff733766-bee7-5cda-a611-fee10e81b14a', 'e2d142a9-0020-557f-ab3b-6c466ed12ca1', 'single', 'Dans une architecture leaf-spine, à quoi se connecte chaque leaf ?', '[{"id": "a", "text": "À tous les spines"}, {"id": "b", "text": "À un seul spine"}, {"id": "c", "text": "Aux autres leafs uniquement"}, {"id": "d", "text": "Directement à Internet"}]'::jsonb, 0);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('ff733766-bee7-5cda-a611-fee10e81b14a', '["a"]'::jsonb, 'Chaque leaf a un lien vers chaque spine.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('9cbf03fa-faba-5bbe-92f2-bd520472589c', 'e2d142a9-0020-557f-ab3b-6c466ed12ca1', 'single', 'Quel protocole distribue MAC/IP dans l''overlay EVPN ?', '[{"id": "a", "text": "BGP"}, {"id": "b", "text": "STP"}, {"id": "c", "text": "OSPF uniquement"}, {"id": "d", "text": "RIP"}]'::jsonb, 1);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('9cbf03fa-faba-5bbe-92f2-bd520472589c', '["a"]'::jsonb, 'EVPN utilise MP-BGP.');
INSERT INTO public.questions (id, quiz_id, kind, prompt, options, sort_order) VALUES ('78b55a9e-9c5b-58bc-9a4d-283a98a34270', 'e2d142a9-0020-557f-ab3b-6c466ed12ca1', 'single', 'Sur quel système repose EOS ?', '[{"id": "a", "text": "Un noyau Linux"}, {"id": "b", "text": "BSD"}, {"id": "c", "text": "Windows"}, {"id": "d", "text": "FreeRTOS"}]'::jsonb, 2);
INSERT INTO public.question_answers (question_id, correct, explanation) VALUES ('78b55a9e-9c5b-58bc-9a4d-283a98a34270', '["a"]'::jsonb, 'EOS s''appuie sur Linux.');
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('be8fb202-f66b-5ae3-9709-19de3e7a2283', 'a7c25172-cfb7-5ceb-9a59-9d89d6bb63c2', 'EOS', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('c8ba8530-ac65-5946-a8ee-001bd87bc22e', 'be8fb202-f66b-5ae3-9709-19de3e7a2283', 'CLI EOS et Linux sous-jacent', 'text', '15 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('c8ba8530-ac65-5946-a8ee-001bd87bc22e', '## Une CLI familière
EOS ressemble à IOS : `enable`, `configure terminal`, `show running-config`, `show ip interface brief`.

Particularité : EOS tourne sur un **vrai noyau Linux**. Depuis la CLI, `bash` ouvre un shell Linux, ce qui permet d''utiliser des outils standard (tcpdump, scripts Python).

```text
switch> enable
switch# configure terminal
switch(config)# interface ethernet 1
switch(config-if-Et1)# no switchport
switch(config-if-Et1)# ip address 10.0.0.1/31
switch# show interfaces status
```');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('be8ac345-62a9-5946-a4f7-984ec9352c2d', 'be8fb202-f66b-5ae3-9709-19de3e7a2283', 'Leaf-spine et EVPN/VXLAN', 'text', '20 min', 1, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('be8ac345-62a9-5946-a4f7-984ec9352c2d', '## Architecture data center moderne
Chaque **leaf** (accès serveurs) se connecte à **tous les spines** : tout chemin entre deux serveurs fait le même nombre de sauts, avec routage **ECMP** (plusieurs chemins égaux).

- **Underlay** : réseau IP routé (souvent eBGP ou OSPF) entre leafs et spines.
- **Overlay** : **VXLAN** encapsule le trafic L2 dans UDP/IP (VNI sur 24 bits ≈ 16 M segments) ; **EVPN** (BGP) distribue les adresses MAC/IP.
- Avantage : pas de STP, extension de VLAN sans boucles, scalabilité horizontale.');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('58a73c63-be21-52c6-9e29-018d63555e38', 'be8fb202-f66b-5ae3-9709-19de3e7a2283', 'Automatisation avec eAPI', 'text', '15 min', 2, false, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('58a73c63-be21-52c6-9e29-018d63555e38', '## JSON-RPC sur HTTPS
```text
switch(config)# management api http-commands
switch(config-mgmt-api-http-cmds)# no shutdown
```
```python
import requests
r = requests.post("https://switch/command-api", json={
  "jsonrpc": "2.0", "method": "runCmds", "id": 1,
  "params": {"version": 1, "cmds": ["show version"], "format": "json"}},
  auth=("admin", "***"), verify=False)
print(r.json()["result"][0]["modelName"])
```
Retour structuré en JSON : fini le « screen scraping ».');
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('fe289218-6eb4-54c9-8858-3ec50d1531da', 'be8fb202-f66b-5ae3-9709-19de3e7a2283', 'Quiz : Arista EOS', 'quiz', '5 min', 3, false, 'e2d142a9-0020-557f-ab3b-6c466ed12ca1', NULL);

INSERT INTO public.courses (id, slug, title, description, category, level, duration, duration_minutes, status, access, xp_reward, required_level, objectives, prerequisites, sort_order, category_id, thumbnail)
VALUES ('021d15c5-d89c-5b76-9154-bc8c569b73ee', 'bgp-fundamentals', 'BGP Fundamentals', 'eBGP, iBGP, attributs de chemin et politiques de routage. (Brouillon à compléter depuis l''admin)', 'networking', 'avancé', '5h', 300,
  'draft', 'premium', 350, 4, ARRAY['Établir une session eBGP','Comprendre le choix du meilleur chemin']::text[], ARRAY['Routing & OSPF Fundamentals']::text[], 99, (SELECT id FROM public.categories WHERE slug = 'networking'), NULL);
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '021d15c5-d89c-5b76-9154-bc8c569b73ee', id, 300 FROM public.skills WHERE slug = 'routing';
INSERT INTO public.course_skills (course_id, skill_id, points) SELECT '021d15c5-d89c-5b76-9154-bc8c569b73ee', id, 100 FROM public.skills WHERE slug = 'networking';
INSERT INTO public.modules (id, course_id, title, sort_order) VALUES ('e8bd2536-75c7-5b6f-848c-1efe0686f386', '021d15c5-d89c-5b76-9154-bc8c569b73ee', 'Introduction', 0);
INSERT INTO public.lessons (id, module_id, title, type, duration, sort_order, is_preview, quiz_id, lab_id) VALUES ('4717c426-77ea-549c-8f8b-6d85c190276a', 'e8bd2536-75c7-5b6f-848c-1efe0686f386', 'Pourquoi BGP ?', 'text', '10 min', 0, true, NULL, NULL);
INSERT INTO public.lesson_contents (lesson_id, content) VALUES ('4717c426-77ea-549c-8f8b-6d85c190276a', '## Pourquoi BGP ?
BGP est le protocole de routage d''Internet entre systèmes autonomes (AS).

*Contenu à compléter.*');

