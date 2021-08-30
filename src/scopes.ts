export enum scopes {
  PERSONAL = 'personal', // manage contacts
  BOTS = 'bots',
  SATS = 'sats', // anything that could cost sats
  TRIBE_ADMIN = 'tribe_admin',
  MEME = 'meme',
}

export const routes = {
  [scopes.PERSONAL]: ['/profile', '/public_pic', '/refresh_jwt'],
}

export function allowedJwtRoutes(jwt, path): boolean {
  const scopes = jwt.scope.split(',')
  let ok = false
  scopes.forEach((sc) => {
    if (routes[sc] && routes[sc].includes(path)) ok = true
  })
  return ok
}
