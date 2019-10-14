import { GoogleAuth } from 'google-auth-library'

export const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)

const scopes = 'https://www.googleapis.com/auth/cloud-platform',
        auth = new GoogleAuth({ scopes }),
        client = auth.fromJSON(credentials)

export default client