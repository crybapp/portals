import { Client } from 'hcloud-js'

export const fetchCredentials = () => {
	let credentials: any = process.env.HETZNER_API_KEY
	if (!credentials) return null

	return credentials
}

export const createClient = () => {
	const credentials = fetchCredentials()
	if (!credentials) return null

	return new Client(credentials)
}
