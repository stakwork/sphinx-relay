export enum scopes {
  PERSONAL = 'personal', // manage contacts
  BOTS = 'bots',
  SATS = 'sats', // anything that could cost sats
  TRIBE_ADMIN = 'tribe_admin',
  MEME = 'meme',
}

export const routes: { [k: string]: string[] } = {
  [scopes.PERSONAL]: ['/profile', '/public_pic', '/refresh_jwt'],
  [scopes.BOTS]: ['/bots', '/bot', '/bot/*'],
}

export function allowedJwtRoutes(jwt, path): boolean {
  const scopes = jwt.scope.split(',')
  let ok = false
  scopes.forEach((sc) => {
    if (routes[sc]) {
      // convert to regex with wildcards
      let rs = routes[sc].map((r) => wildcardToRegExp(r))
      rs.forEach((r) => {
        if (path.match(r)) ok = true
      })
    }
  })
  return ok
}

function wildcardToRegExp(s) {
  return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$')
}

function regExpEscape(s) {
  return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
}
