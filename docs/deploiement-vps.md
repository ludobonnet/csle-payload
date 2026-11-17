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
| Base | Base **`csle`** sur le Postgres 17 partagé ; rôles `csle_owner` (migrations) et `csle_app` (runtime, DML seul, pool max 5) |
| Schéma | **Migrations uniquement** (`src/migrations`, `push: false`), en dev comme en prod |
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
- [ ] **Supprimer la route `/next/seed`** et `src/endpoints/seed` (seed du template : vide les collections).
- [x] Site public entièrement dynamique (build sans base).
- [ ] Restes du template : logo Payload dans l'en-tête, titres « Payload Website Template », image OG par défaut, page 404 en anglais.
- [ ] 404 des URLs à plusieurs segments (`/a/b`) : 404 brute de Next, sans layout (deux layouts racines). Ajouter un catch-all `[slug]/[...rest]` qui appelle `notFound()`.
- [ ] Pages `cgu` et `partenaires` : reprise dans la collection `pages`.
- [ ] Redirections pour les 2 articles vides (vers leur catégorie).
- [ ] SEO : catégories dans le sitemap, méta, contrôle des URLs `/{slug}` contre la liste WordPress.
- [ ] Images : `quality={100}` et `sizes` jusqu'à 3 840 px dans `ImageMedia` → poids excessif.
- [ ] (Option) `@payloadcms/email-resend` depuis `csle@send.bonnet.pro` pour la réinitialisation de mot de passe.
- [ ] Nettoyage : `docker-compose.yml` (Mongo), `Dockerfile`, `CLAUDE.md` (ImageKit/Vercel), `README.md` du template.
- [ ] Workflow GitHub Actions `deploy.yml` (voir contraintes ci-dessous).

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

## Lot 2 — Infra (sur le VPS)

- [ ] Zone `csle.fr` dans le compte Cloudflare (**prérequis**, à la charge de Ludo).
- [ ] Users `csle-front` (nologin) et `csle-deploy` ; `/srv/csle/front/{releases,cache}` avec les droits du runbook §2.2.
- [ ] Postgres : `CREATE DATABASE csle OWNER csle_owner`, rôle `csle_app` (DML), `REVOKE CONNECT ON DATABASE csle FROM PUBLIC`, matrice CONNECT diagonale revérifiée (runbook §3.4).
- [ ] `/etc/csle/front.env` ; unit `csle-front.service` durcie (modèle runbook §5.3, `ReadWritePaths=/srv/csle/front`).
- [ ] Bucket R2 `csle-media` + domaine `images.csle.fr` + jeton dédié ; copie de `public/media` (905 Mo, 9 613 fichiers) avec `rclone`, noms conservés, à la racine du bucket.
- [ ] Tunnel : hostnames `csle.fr`, `www.csle.fr` → `http://localhost:3005` ; redirection apex/www ; Access sur `csle.fr/admin*` (Ludo, Sandrine).
- [ ] Sauvegarde quotidienne de `csle` + test de restauration.

## Lot 3 — Bascule

- [ ] `pg_dump` de la **base locale** → restauration dans `csle` sur le VPS ; `payload migrate:status` doit montrer la migration initiale appliquée.
- [ ] Recette via le tunnel (articles, catégories, images R2, admin, recherche, upload d'une image depuis l'admin).
- [ ] DNS `csle.fr` → tunnel. Suivi Search Console (404).
- [ ] Archivage puis suppression de `sources/wp` et de la base Neon.
