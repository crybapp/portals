import Portal from '../models/portal'

import { createClient, fetchCredentials } from '../config/providers/gcloud.config'
import { closePortal } from './portal.driver'

const { project_id: projectId } = fetchCredentials() || { project_id: null },
	zoneId = process.env.GOOGLE_ZONE_ID || 'us-east1-b',
	baseUrl = `https://www.googleapis.com/compute/v1/projects/${projectId}/zones/${zoneId}/`

export const openPortalInstance = async (portal: Portal) => {
	const client = createClient()
	if (!client) throw new Error('The Google Cloud driver configuration is incorrect. This may be due to improper ENV variables, please check')

	const portalName = `portal-${portal.id}`

	try {
		const instanceTemplate = `https://www.googleapis.com/compute/v1/projects/${projectId}/global/instanceTemplates/portal-template`

		// Create a VM under the template 'portal-template' with the name 'portal-{id}'
		await client.request({
			url: `${baseUrl}instances?sourceInstanceTemplate=${instanceTemplate}`,
			method: 'POST',
			data: {
				name: portalName
			}
		})

		await portal.updateStatus('starting')

		console.log(`opened portal with name ${portalName}`)
	} catch (error) {
		closePortal(portal.id)

		console.error('error while opening portal', error)
	}
}

export const closePortalInstance = async (portal: Portal) => {
	const client = createClient()
	if (!client) throw new Error('The Google Cloud driver configuration is incorrect. This may be due to improper ENV variables, please check')

	const portalName = `portal-${portal.id}`

	try {
		await client.request({
			url: `${baseUrl}instances/${portalName}`,
			method: 'DELETE'
		})

		console.log(`closed portal with name ${portalName}`)
	} catch (error) {
		console.error('error while closing portal', error.response ? error.response.body : error)
	}
}
