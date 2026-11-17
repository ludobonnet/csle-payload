-- Base et rôles de csle.fr sur le Postgres partagé du VPS LSAN.
-- Modèle identique à LSAN (runbook §3.4–3.5) :
--   csle_owner : propriétaire de la base et du schéma, utilisé UNIQUEMENT par la CI pour les migrations
--   csle_app   : runtime du site et de l'admin, DML seul, aucun DDL
--
-- Exécution (superutilisateur, mots de passe générés sur le serveur) :
--   ops/vps-setup.sh, qui préfixe sur l'entrée standard `\set owner_pwd …` et `\set app_pwd …`
--   (pas de fichier temporaire, pas de mot de passe dans la liste des processus)
--
-- ⚠️ À jouer AVANT toute migration ou restauration : ALTER DEFAULT PRIVILEGES ne couvre
--    que les tables créées après lui (constaté côté LSAN, erreur 42501 sinon).

CREATE ROLE csle_owner LOGIN PASSWORD :'owner_pwd';
CREATE ROLE csle_app   LOGIN PASSWORD :'app_pwd';
CREATE DATABASE csle OWNER csle_owner;

-- Des rôles distincts n'isolent pas les bases : CONNECT est accordé à PUBLIC par défaut
REVOKE CONNECT ON DATABASE csle FROM PUBLIC;
GRANT  CONNECT ON DATABASE csle TO csle_owner, csle_app;

\connect csle

-- Depuis PG 15, public appartient à pg_database_owner : le propriétaire doit pouvoir y créer
ALTER SCHEMA public OWNER TO csle_owner;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO csle_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO csle_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO csle_app;
ALTER DEFAULT PRIVILEGES FOR ROLE csle_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO csle_app;
ALTER DEFAULT PRIVILEGES FOR ROLE csle_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO csle_app;

-- Contrôle attendu, à relancer après coup sur l'ensemble du serveur (matrice diagonale) :
--   SELECT r.rolname, d.datname, has_database_privilege(r.rolname, d.datname, 'CONNECT')
--   FROM pg_roles r CROSS JOIN pg_database d
--   WHERE r.rolcanlogin AND r.rolname NOT LIKE 'pg\_%' AND r.rolname <> 'postgres'
--     AND d.datname IN ('lsan', 'lsan_pp', 'umami', 'csle');
