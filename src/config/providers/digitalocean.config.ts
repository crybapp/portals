import { createApiClient } from 'dots-wrapper'

export const fetchCredentials = () => {
    let credentials: any = process.env.DO_API_TOKEN
    if(!credentials) return null

    return credentials
}

export const createClient = () => {
    const credentials = fetchCredentials()
    if(!credentials) return null

    return createApiClient({ token: credentials })
}
