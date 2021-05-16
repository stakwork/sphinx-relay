

export enum scopes {
    PERSONAL = 'personal', // manage contacts
    BOTS = 'bots',
    SATS = 'sats', // anything that could cost sats
    TRIBE_ADMIN = 'tribe_admin',
    MEME = 'meme'
}

export const routes = {
    [scopes.PERSONAL]: [
        '/profile'
    ],
}

export function allowedJwtRoutes(jwt, path): boolean {
    const ok = jwt.scopes.find(sc=>{
        routes[sc] && routes[sc].includes(path)
    })
    return ok ? true : false
}