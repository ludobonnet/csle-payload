# csle.fr

Blog magazine voyage, tourisme, culture et lifestyle, tenu à quatre mains depuis 2008.
Next.js 15 + Payload CMS 3 (admin sur `/admin`), PostgreSQL 17, médias sur Cloudflare R2.

## Démarrer en local

Prérequis : Node 24, pnpm 10, Docker (pour Postgres uniquement).

```bash
# Base de travail (copie de référence du contenu)
docker start csle-pg-dev   # ou, la première fois :
# docker run -d --name csle-pg-dev --restart unless-stopped \
#   -e POSTGRES_USER=csle -e POSTGRES_PASSWORD=csle -e POSTGRES_DB=csle \
#   -p 127.0.0.1:55433:5432 -v csle_pg17_data:/var/lib/postgresql/data postgres:17

cp .env.example .env       # puis renseigner PAYLOAD_SECRET
pnpm install
pnpm payload migrate       # schéma à jour (aucun « push » automatique)
pnpm dev                   # http://localhost:3010
```

Sans variables `R2_*`, les médias sont lus et écrits dans `public/media` (non versionné).

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm dev` | Serveur de dev (port 3010) |
| `pnpm build` | Build de prod `standalone` — n'a pas besoin de la base |
| `pnpm payload migrate:create <nom>` | Nouvelle migration après une modification de schéma |
| `pnpm payload migrate` | Appliquer les migrations |
| `pnpm generate:types` / `pnpm generate:importmap` | Après modification de schéma / de composants admin |
| `pnpm test:int` | Tests d'intégration et des convertisseurs de migration |
| `pnpm test:e2e` | Parcours publics (Playwright, sur la base de dev) |
| `pnpm lint` / `npx tsc --noEmit` | Qualité |

## Migration WordPress

Les scripts de `scripts/migrate/` ont importé le WordPress d'origine (multisite, tables `wp_5_*`).
Le contenu de référence est désormais la base Postgres ; WordPress ne sert plus qu'à rejouer
une étape si besoin (`docker compose up -d db` dans `../wp`, puis `pnpm migrate:wp`).

## Déploiement

VPS LSAN, sans Docker : Node + systemd + Cloudflare Tunnel. Plan et état d'avancement :
[`docs/deploiement-vps.md`](docs/deploiement-vps.md).
