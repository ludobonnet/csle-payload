# Déploiement de csle.fr sur le VPS LSAN

> Plan arrêté le 2026-11-17. Référence infra : `LSAN/Sources/lsan-monorepo-develop/docs/runbook-installation-vps-lsan.md`
> (variante native : Node 24 + systemd + Cloudflare Tunnel, sans Docker). csle y est un **locataire isolé** :
> ni code, ni base, ni user, ni jeton partagés avec LSAN — seuls le serveur Postgres, `cloudflared` et la machine sont communs.

## Décisions

| Sujet | Décision |
|---|---|
| Stack | Next.js 15 + Payload CMS 3 (admin sur `/admin`, même process) — plus de WordPress ni de PHP |
| Environnements | **Prod seule** (pas de préprod) |
| Runtime | Node 24 (NodeSource, celui du VPS), service systemd `csle-front`, user `csle-front` (nologin) |
| Port | `127.0.0.1:3005` (3000–3004 pris par LSAN) |
| Arborescence | `/srv/csle/front/{releases/<sha>,current,cache}` |
| Déploiement | GitHub Actions (`ludobonnet/csle-payload`) → `next build` standalone → rsync → symlink `current` → restart |
| User de déploiement | **`csle-deploy`** dédié (clé SSH propre, sudoers limité à `systemctl restart csle-front`) — pas le `deploy` de LSAN |
| Base | Base **`csle`** sur le Postgres 17 partagé ; **rôle unique `csle`, propriétaire de cette seule base** (pool max 5). `REVOKE CONNECT … FROM PUBLIC` : ni LSAN ne voit `csle`, ni `csle` ne voit LSAN |
| Schéma | **Migrations uniquement** (`src/migrations`, `push: false`) ; en prod, appliquées **au démarrage du service** (`prodMigrations`) — la CI n'a aucun accès à la base, d'où le rôle propriétaire |
| Médias | Bucket R2 **`csle-media`** (jeton dédié), domaine `images.csle.fr`, via `@payloadcms/storage-s3` (`src/plugins/mediaStorage.ts`) |
| Ingress | Tunnel Cloudflare : `csle.fr` + `www.csle.fr` → `localhost:3005` ; **Cloudflare Access sur `/admin*`** (OTP e-mail) |
| Secrets | `/etc/csle/front.env` (640 root:csle-front) |
| Sauvegardes | `pg_dump` chiffré de `csle` → R2, rôle dédié, test de restauration avant bascule |

## Données : la base locale est la référence

Constat du 2026-11-17 : Neon contenait bien les articles, catégories, tags et médias, mais **aucune image dans le
corps des articles** (le convertisseur jetait les `<img>`), pas de brouillons, et des shortcodes non convertis.

Corrigé dans les scripts de migration, puis articles rejoués sur une **copie locale de Neon** :

| | WordPress | Base locale (référence) |
|---|---|---|
| Articles publiés | 547 | 545 (2 vides dans WP : ID 271, 517) |
| Brouillons | 38 | 30 (8 vides) |
| Images dans les corps | 336 articles | 344 articles, 1 624 blocs média (galeries comprises) |
| Images non reprises | — | 33, toutes hébergées ailleurs (Amazon, blogs disparus, trackers) |
| Shortcodes résiduels | — | 0 |
| Médias / catégories / tags | 2 134 / 18 / 877 | 2 099 / 18 / 877 |

- **Neon est figé** (plus aucune écriture). Dump d'origine : `sources/backup-neon/neon-2026-11-17.dump`.
- Base de travail : Postgres 17 local en Docker (`csle-pg-dev`, `127.0.0.1:55433`, volume `csle_pg17_data`).
- C'est **elle** qu'on restaurera sur le VPS (Lot 3), pas Neon.
- Rejouer les articles : `pnpm tsx scripts/migrate/reset-posts.ts && pnpm migrate:wp` (WordPress local requis :
  `docker compose up -d db` dans `sources/wp`). Rapport détaillé : `scripts/migrate/conversion-report.json`.
- La base locale a été alignée sur la migration initiale (colonne `media.prefix` + entrée `payload_migrations`) ;
  schéma vérifié identique à celui produit par `payload migrate` sur une base vide.

## Lot 1 — Code

- [x] Images des articles (blocs média), galeries `[gallery]` avec ou sans `ids`, légendes, brouillons, dates des brouillons.
- [x] Shortcodes restants : `[youtube]…[/youtube]`, `su_youtube` → embed ; `appbox` → lien store ; `videojs` → lien ; `polldaddy`, Windows Phone → supprimés.
- [x] Médias sur R2 : `@payloadcms/storage-s3`, activé seulement si les variables `R2_*` sont présentes, URLs `MEDIA_PUBLIC_BASE_URL/…`. **À tester sur le vrai bucket (Lot 2).**
- [x] `output: 'standalone'`, suppression des reliquats Vercel, pool Postgres borné, `push: false`.
- [x] Migration initiale `20261117_160648_initial`.
- [x] Sitemap des articles : URLs canoniques `/{slug}` (au lieu de `/posts/{slug}` redirigé).
- [x] Route `/next/seed`, seed et accueil admin du template supprimés.
- [x] Site public entièrement dynamique (build sans base).
- [x] Identité CSLE : logo typographique, titres « Titre - CSLE », méta OG (og:url corrigé), 404 en français.
- [x] 404 des URLs à plusieurs segments (`/a/b`) via `[slug]/[...rest]`.
- [ ] **Mentions légales** à réécrire (la page `cgu` de WordPress est celle de casentlete.fr : éditeur, hébergeur OVH, plateforme sport). `partenaires` (2 liens d'échange de 2012) : abandonnée sauf avis contraire.
- [x] Redirections des 2 articles vides vers `/humour` (`redirects.js`).
- [x] Sitemap : accueil, archive, catégories non vides (racine) ; recherche exclue.
- [ ] SEO : contrôler les URLs indexées de l'ancien site (Search Console) contre les slugs actuels ; décider du sort de « Non classé ».
- [x] Images : qualité 75, `sizes` réels, recadrage `object-cover` en mode fill (images déformées auparavant).
- [x] Vidéos : bloc `embed` branché dans le rendu RichText (les 198 vidéos étaient invisibles).
- [ ] (Option) `@payloadcms/email-resend` depuis `csle@send.bonnet.pro` pour la réinitialisation de mot de passe.
- [x] Nettoyage : `docker-compose.yml`, `Dockerfile` supprimés ; `README.md` et `CLAUDE.md` à jour.
- [x] Tests : convertisseurs inclus dans `pnpm test:int` (29), e2e des parcours publics (6).
- [x] Workflow `.github/workflows/deploy.yml` : contrôles (lint, typage, tests) → build sans base → rsync → `deploy.sh` → sonde. Fichiers serveur dans `ops/` (`csle-deploy.sh`, `csle-front.service`, `front.env.example`).
- [x] Migrations au démarrage vérifiées : base vide → schéma créé (67 tables) ; base existante → rien rejoué.

### Contraintes de build constatées

- **Le build ne touche pas la base** : tout le site public est rendu à la requête (`dynamic = 'force-dynamic'`
  dans `src/app/(frontend)/layout.tsx`). Vérifié : build réussi avec une base injoignable et sans `.env`.
  La CI n'a donc besoin ni de tunnel ni de secret de base ; seules `NEXT_PUBLIC_SERVER_URL` et
  `MEDIA_PUBLIC_BASE_URL` (figées dans le bundle) doivent être fournies au build.
  Les globals (en-tête, pied de page) restent en cache serveur, invalidé par tag à chaque modification.
- **Next copie `.env` dans `.next/standalone`** : l'artefact doit être construit sans `.env`, et le workflow doit
  supprimer `.next/standalone/.env*` avant rsync (garde-fou).
- `public/` et `.next/static` sont à copier dans l'artefact, **sauf `public/media`** (905 Mo, servi par R2).
- Artefact ≈ 100 Mo hors médias.
- `next/font` télécharge Playfair et Inter depuis Google au build : un échec réseau ponctuel fait échouer le build (vu une fois). Relancer, ou auto-héberger les polices (`next/font/local`).

## Lot 2 — Infra (sur le VPS)

- [ ] Zone `csle.fr` dans le compte Cloudflare (**prérequis**, à la charge de Ludo).
- [ ] Users `csle-front` (nologin) et `csle-deploy` ; `/srv/csle/front/{releases,cache}` avec les droits du runbook §2.2
      (`releases` : csle-deploy:csle-front 750 ; `cache` : csle-front 750). `ops/csle-deploy.sh` → `/srv/csle/deploy.sh` (csle-deploy, 750).
- [ ] Sudoers `/etc/sudoers.d/csle-deploy` : `csle-deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart csle-front` (valider avec `visudo -cf`).
- [ ] Clé SSH dédiée `csle-deploy` ; environnement GitHub `prod` : secrets `SSH_KEY`, `SSH_KNOWN_HOSTS`, `SSH_HOST`, variables `SITE_URL`, `MEDIA_PUBLIC_BASE_URL`.
- [ ] Postgres : `CREATE ROLE csle LOGIN …`, `CREATE DATABASE csle OWNER csle`, `REVOKE CONNECT ON DATABASE csle FROM PUBLIC`, `GRANT CONNECT … TO csle`, matrice CONNECT diagonale revérifiée (runbook §3.4).
- [ ] `/etc/csle/front.env` (d'après `ops/front.env.example`, 640 root:csle-front) ; unit `ops/csle-front.service` → `/etc/systemd/system/`.
- [ ] Bucket R2 `csle-media` + domaine `images.csle.fr` + jeton dédié ; copie de `public/media` (905 Mo, 9 613 fichiers) avec `rclone`, noms conservés, à la racine du bucket.
- [ ] Tunnel : hostnames `csle.fr`, `www.csle.fr` → `http://localhost:3005` ; redirection apex/www ; Access sur `csle.fr/admin*` (Ludo, Sandrine).
- [ ] Sauvegarde quotidienne de `csle` + test de restauration.

## Lot 3 — Bascule

- [ ] `pg_dump` de la **base locale** → restauration dans `csle` (propriétaire `csle`) sur le VPS **avant** le premier démarrage du service ; `payload_migrations` doit contenir la migration initiale (sinon le démarrage tenterait de recréer les tables).
- [ ] Recette via le tunnel (articles, catégories, images R2, admin, recherche, upload d'une image depuis l'admin).
- [ ] DNS `csle.fr` → tunnel. Suivi Search Console (404).
- [ ] Archivage puis suppression de `sources/wp` et de la base Neon.
