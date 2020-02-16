import Portal from '../models/portal'

import { createClient, fetchCredentials } from '../config/providers/gcloud.config'
import { IPortalDriver } from './IPortalDriver'

export default class GCloudDriver implements IPortalDriver {
	public driverName = 'gcloud'
	private projectId = fetchCredentials() || null
	private zoneId = process.env.GOOGLE_ZONE_ID || 'us-east1-b'
	private baseUrl = `https://www.googleapis.com/compute/v1/projects/${this.projectId}/zones/${this.zoneId}/`

	public createPortal = (portal: Portal) => new Promise(async (resolve, reject) => {
		const client = createClient()
		if (!client) throw new Error('The Google Cloud driver configuration is incorrect. This may be due to improper ENV variables, please check')

		const portalName = `portal-${portal.id}`

		try {
			const instanceTemplate = `https://www.googleapis.com/compute/v1/projects/${this.projectId}/global/instanceTemplates/portal-template`

			// Create a VM under the template 'portal-template' with the name 'portal-{id}'
			await client.request({
				url: `${this.baseUrl}instances?sourceInstanceTemplate=${instanceTemplate}`,
				method: 'POST',
				data: {
					name: portalName
				}
			})

			await portal.updateStatus('starting')

			console.log(`opened portal with name ${portalName}`)
			resolve()
		} catch (error) {
			reject(error)
			console.error('error while opening portal', error)
		}
	})

	public destroyPortal = async (portal: Portal) => {
		const client = createClient()
		if (!client) throw new Error('The Google Cloud driver configuration is incorrect. This may be due to improper ENV variables, please check')

		const portalName = `portal-${portal.id}`

		try {
			await client.request({
				url: `${this.baseUrl}instances/${portalName}`,
				method: 'DELETE'
			})

			console.log(`closed portal with name ${portalName}`)
		} catch (error) {
			console.error('error while closing portal', error.response ? error.response.body : error)
		}
	}

	public isSpaceAvailable = () => new Promise<boolean>(resolve => {
		resolve(true)
	})
}
