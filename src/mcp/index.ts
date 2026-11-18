import { mcpPlugin } from '@payloadcms/plugin-mcp'

import { mcpTools } from './tools'

// Serveur MCP de csle.fr : POST /api/mcp, authentifié par clé API (admin › MCP › API Keys).
// Chaque clé agit avec les droits de son propriétaire et n'expose que les outils cochés.
// Aucun outil générique d'écriture ni de suppression : l'écriture passe par les outils
// maison (src/mcp/tools.ts), qui n'enregistrent que des brouillons.
export const csleMcp = mcpPlugin({
  mcp: {
    tools: mcpTools,
    serverOptions: {
      serverInfo: { name: 'csle.fr', version: '1.0.0' },
      instructions: [
        'Rédaction pour csle.fr, blog personnel en français.',
        "Écrire le corps des articles en Markdown ; le titre n'est pas répété dans le corps.",
        "Tout enregistrement est un brouillon : la publication et la programmation se font dans l'admin Payload, par l'auteur.",
        'Avant de créer un article, chercher les doublons avec search_posts et classer avec list_taxonomies.',
        'Avant update_post_draft, lire l’article avec get_post et repasser son updatedAt.',
      ].join('\n'),
    },
  },
})
