import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type isAuthenticated = (args: AccessArgs<User>) => boolean

// Seul un compte de la collection `users` compte comme connecté. Les clés MCP
// (`payload-mcp-api-keys`) sont aussi une collection d'authentification : elles ne
// doivent jamais ouvrir l'API REST/GraphQL ni l'admin (défense en profondeur ; Payload
// 3.94 les exclut déjà de l'authentification générale).
export const isUserAccount = (user: unknown): boolean =>
  Boolean(user) && (user as { collection?: string }).collection === 'users'

export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return isUserAccount(user)
}
