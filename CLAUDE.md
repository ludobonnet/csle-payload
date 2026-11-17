# CLAUDE.md - Projet CSLE.fr

## Contexte projet

Blog magazine csle.fr (voyage, tourisme, culture, lifestyle), à quatre mains depuis 2008 : 545 articles publiés.
Migré de Next.js 12 + WordPress headless vers **Next.js 15 + Payload CMS 3**, pour être hébergé sans PHP
sur le VPS LSAN. Plan et état d'avancement : `docs/deploiement-vps.md`.

## Stack technique

- **Framework** : Next.js 15 (App Router) + React 19
- **CMS** : Payload CMS 3.73
- **Base de données** : PostgreSQL 17 — dev : conteneur `csle-pg-dev` (`127.0.0.1:55433`), qui porte le contenu de référence ; prod : base `csle` sur le Postgres partagé du VPS LSAN. Neon est figé, ne plus l'utiliser.
- **Schéma** : migrations uniquement (`src/migrations`, `push: false`)
- **Médias** : Cloudflare R2 (`images.csle.fr`) via `@payloadcms/storage-s3` ; disque `public/media` en dev
- **Hébergement** : VPS LSAN, Node 24 + systemd + Cloudflare Tunnel, build `standalone`, sans Docker
- **Rendu** : site public entièrement dynamique (`force-dynamic` dans le layout) — le build ne touche pas la base
- **Langage** : TypeScript strict, ESM (`"type": "module"`)
- **Package manager** : pnpm
- **Styling** : Tailwind CSS 4 (personnalisation poussee, pas de template generique)
- **Rich text** : Lexical (`@payloadcms/richtext-lexical`)
- **UI** : Radix UI, Lucide React ; polices Playfair Display (titres) + Inter (texte) via next/font
- **Tests** : Vitest (integration) + Playwright (e2e)

### Plugins Payload actifs

`plugin-seo`, `plugin-search`, `plugin-form-builder`, `plugin-nested-docs`, `plugin-redirects`, `live-preview-react`, `admin-bar`

## Structure des donnees

### Collections Payload

| Slug         | Description                                      |
| ------------ | ------------------------------------------------ |
| `pages`      | Pages du site (SEO, hero, layout blocks)         |
| `posts`      | Articles (545 publiés, 30 brouillons)            |
| `media`      | Images (R2 en prod, disque en dev)               |
| `categories` | Taxonomie des articles (~10 categories actives)  |
| `users`      | Authentification (3 auteurs : admin, Ludo, Sandrine) |

### Globals

- `header` : Navigation principale (max 6 liens)
- `footer` : Navigation pied de page

### Blocks disponibles

Archive, Banner, CallToAction, Code, Content, Form, Media, RelatedPosts

### Donnees source (WordPress MariaDB)

- Prefixe tables : `wp_5_`
- Medias locaux : `/Users/ludobonnet/Projets/csle/sources/wp/wordpress/wp-content/blogs.dir/5/files`
- 3 auteurs (IDs: 1=admin, 6=Ludo, 7=Sandrine)

## SEO - CRITIQUE

Les URLs existantes doivent etre preservees exactement pour le referencement :

- Articles : `csle.fr/{slug}` (racine)
- Categories : `csle.fr/{slug}` (racine)

Articles et categories partagent le meme niveau d'URL. Le routing doit gerer cette ambiguite (verifier d'abord si c'est une categorie, sinon article).

## Direction artistique & Design

### Identite

CSLE est un blog magazine lifestyle/culture cree par un duo. Thematiques : tourisme, musique, food, culture, lifestyle. Ton editorial : curieux, passionne, un peu decale.

### Principes de design

- **Pas de design "IA generique"** : eviter les gradients bleu-violet, les cartes arrondies partout, les mises en page previsibles
- **Etre creatif et audacieux** : typographies expressives, compositions asymetriques, contrastes forts
- **S'inspirer des magazines** : editorial, grilles cassees, hierarchie visuelle forte, beaux blancs tournants
- **Moderne mais chaleureux** : pas froid ni corporate, doit respirer la passion et la curiosite

### Inspirations visuelles

- Magazines lifestyle : Kinfolk, Monocle, Cereal
- Blogs creatifs : The Coveteur, It's Nice That
- Touch : legerement retro-moderne, textures subtiles, imperfections assumees

### Typographie

- Duo de fontes avec caractere (serif editoriale + sans moderne, ou inverse)
- Titres expressifs, grands, qui prennent l'espace
- Hierarchie claire mais pas ennuyeuse

### Couleurs

- Eviter les palettes froides corporate
- Privilegier des couleurs chaudes ou des associations inattendues
- Pouvoir jouer avec des accents vifs (rappel culture/musique)

### Mise en page

- Grilles dynamiques, pas tout aligne sagement
- Images grandes, immersives
- Espaces blancs genereux
- Effets subtils au scroll (mais pas overdose de parallax)

### A eviter absolument

- Hero sections avec gradient mesh IA
- Cards identiques en grille 3x3 parfaite
- Boutons pill avec gradient
- Illustrations "corporate Memphis"
- Tout ce qui ressemble a un template Tailwind UI sorti de la boite

## Commandes essentielles

```bash
pnpm dev                          # Serveur de dev
pnpm build                        # Build production
pnpm payload generate:types       # Regenerer les types apres modif de schema
pnpm payload generate:importmap   # Regenerer l'import map apres ajout/modif de composants
tsc --noEmit                      # Valider le TypeScript sans compiler
pnpm test                         # Tests integration + e2e
```

## Structure du projet

```
src/
├── access/           # Fonctions d'access control (authenticated, anyone, authenticatedOrPublished)
├── app/
│   ├── (frontend)/   # Routes frontend Next.js
│   └── (payload)/    # Routes admin Payload
├── blocks/           # Configurations des blocks de contenu
├── collections/      # Definitions des collections Payload
├── components/       # Composants React (admin + frontend)
│   └── ui/           # Composants UI reutilisables (Radix-based)
├── endpoints/        # Endpoints API custom
├── fields/           # Definitions de champs personnalises
├── Footer/           # Composant global Footer
├── Header/           # Composant global Header
├── heros/            # Variantes de sections hero
├── hooks/            # Hooks React et Payload
├── plugins/          # Configuration des plugins Payload
├── providers/        # Context providers React
├── search/           # Configuration du plugin search
├── utilities/        # Fonctions utilitaires partagees
└── payload.config.ts # Configuration principale Payload
```

## Conventions de code

- TypeScript strict, pas de `var`
- Imports de types avec `import type { ... }`
- Nommage collections Payload : PascalCase singulier (Article, Category, Author)
- Fichiers : kebab-case
- Composants React : Server Components par defaut, `'use client'` uniquement si besoin de state/effects/handlers
- Collections dans des fichiers separes dans `src/collections/`
- Access control dans `src/access/`
- Hooks dans `src/hooks/`

## Regles Payload - Securite (3 regles critiques)

### Regle 1 - Local API : `overrideAccess: false` obligatoire avec `user`

```typescript
// CORRECT
await payload.find({ collection: 'posts', user, overrideAccess: false })

// INCORRECT - access control contourne silencieusement
await payload.find({ collection: 'posts', user })
```

### Regle 2 - Transactions : TOUJOURS passer `req` dans les hooks

```typescript
// CORRECT - meme transaction
await req.payload.create({ collection: 'audit', data: { docId: doc.id }, req })

// INCORRECT - transaction separee, risque de corruption
await req.payload.create({ collection: 'audit', data: { docId: doc.id } })
```

### Regle 3 - Boucles infinies : utiliser `context`

```typescript
if (context.skipHooks) return
await req.payload.update({ ..., context: { skipHooks: true }, req })
```

## Regles Payload - Bonnes pratiques

- Lancer `pnpm payload generate:types` apres chaque modification de schema
- Lancer `pnpm payload generate:importmap` apres creation/modification de composants
- Valider avec `tsc --noEmit` apres modification de code
- Les roles sont sur la collection `users` avec `saveToJWT: true`
- S'assurer que les roles existent avant de modifier les access controls
- Patterns access existants dans `src/access/` : `authenticated`, `anyone`, `authenticatedOrPublished`
- Hooks : `beforeValidate` (formatage), `beforeChange` (logique metier), `afterChange` (effets de bord/revalidation), `afterRead` (champs calcules)
- Les collections Pages et Posts ont des hooks de revalidation Next.js (ISR)
- Chemins de composants relatifs a `importMap.baseDir`

## Documentation detaillee Payload

Pour les patterns Payload approfondis, consulter `.cursor/rules/` :

| Fichier | Sujet |
| ------- | ----- |
| `payload-overview.md` | Architecture et concepts fondamentaux |
| `security-critical.mdc` | Patterns de securite critiques |
| `collections.md` | Collections, auth, upload, versions, globals |
| `fields.md` | Types de champs, validation, blocks, tabs |
| `hooks.md` | Lifecycle hooks, context, revalidation |
| `access-control.md` | Access control collection/field/global, RBAC |
| `access-control-advanced.md` | Patterns avances (locale, time-based, factories) |
| `queries.md` | Local API, REST, GraphQL, operateurs |
| `endpoints.md` | Custom endpoints, params, CORS |
| `adapters.md` | PostgreSQL, transactions, storage, email |
| `components.md` | Composants custom, Server/Client, hooks React |
| `field-type-guards.md` | Type guards runtime pour les champs |
| `plugin-development.md` | Developpement de plugins |

Le fichier `AGENTS.md` a la racine contient une reference exhaustive avec exemples de code.

## Phases du projet

1. ✅ Setup Payload, collections, migration WordPress (images, vidéos, galeries, shortcodes)
2. ✅ Frontend magazine, identité CSLE, 404, redirections
3. 🟡 Préparation du déploiement (R2, standalone, migrations) — voir `docs/deploiement-vps.md`
4. ⬜ Infra VPS (base, systemd, tunnel, R2, sauvegardes)
5. ⬜ Bascule DNS
