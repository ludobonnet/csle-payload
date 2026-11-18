import type { Access } from 'payload'

import { isUserAccount } from './authenticated'

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (isUserAccount(user)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
