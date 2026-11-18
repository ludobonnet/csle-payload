# Serveur MCP de csle.fr

Permet à Claude (Claude Desktop) de chercher, lire et rédiger des articles **en brouillon**.
La publication et la programmation restent manuelles, dans l'admin Payload.

- Adresse : `https://csle.fr/api/mcp` (POST, Streamable HTTP), plugin officiel `@payloadcms/plugin-mcp`.
- Authentification : clé API Payload (`Authorization: Bearer <clé>`). La clé agit avec les droits de son propriétaire.
- Code : `src/mcp/` (outils maison), branché dans `src/plugins/index.ts`.

## Outils

| Outil | Rôle |
|---|---|
| `search_posts` | Recherche par titre/slug (brouillons compris), réponse courte |
| `get_post` | Article complet en Markdown + `updatedAt` + nombre de blocs image/vidéo |
| `create_post_draft` | Crée un brouillon depuis du Markdown |
| `update_post_draft` | Enregistre un brouillon ; exige `expectedUpdatedAt` ; refuse de réécrire le corps d'un article contenant images/vidéos intégrées |
| `list_taxonomies` | Catégories + recherche de tags (`tagQuery`) |
| `import_image` | Importe une image https publique dans la médiathèque (15 Mo max, adresses internes refusées) |

Aucun outil générique d'écriture ou de suppression n'est exposé. Un article publié modifié par le MCP reste
en ligne tel quel : la modification est un brouillon, à publier depuis l'admin.

Markdown accepté : intertitres `##`/`###`/`####`, **gras**, *italique*, liens, `>` citations, listes, `---`.
Les blocs image (`mediaBlock`) et vidéo (`embed`) n'ont pas d'équivalent Markdown.

## Créer une clé

1. Admin › **MCP › API Keys** › Create new.
2. Libellé (ex. « Claude Desktop »), cocher **Enable API Key**, copier la clé générée.
3. Dans **Tools**, cocher les 6 outils (aucun n'est actif par défaut). Ne rien cocher d'autre.
4. Enregistrer. Une clé se désactive ou se supprime au même endroit.

## Brancher Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "csle": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://csle.fr/api/mcp", "--header", "Authorization:${CSLE_MCP_AUTH}"],
      "env": { "CSLE_MCP_AUTH": "Bearer COLLER_LA_CLÉ_ICI" }
    }
  }
}
```

Redémarrer Claude Desktop. (La valeur passe par `env` car `mcp-remote` gère mal les espaces dans `args`.)

## Évolution possible

Connecteur claude.ai (web, mobile) : demande un serveur OAuth 2.1, à brancher via l'option `overrideAuth`
du plugin, sur le modèle des connecteurs LSAN.
