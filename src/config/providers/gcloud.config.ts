import { GoogleAuth } from 'google-auth-library'

export const fetchCredentials = () => {
	let credentials: any = process.env.GOOGLE_APPLICATION_CREDENTIALS
	if (!credentials) return null

	try {
		credentials = JSON.parse(credentials)
	} catch (error) {
		return null
	}

	return credentials
}

export const createClient = () => {
	const credentials = fetchCredentials()
	if (!credentials) return null

	const scopes = 'https://www.googleapis.com/auth/cloud-platform',
		auth = new GoogleAuth({ scopes }),
		client = auth.fromJSON(credentials)

	return client
}
