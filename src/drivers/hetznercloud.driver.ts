import Portal from '../models/portal'

import { createClient, fetchCredentials } from '../config/providers/hetznercloud.config'
import { closePortal } from './portal.driver'

const { project_id: projectId } = fetchCredentials() || { project_id: null },
	zoneId = process.env.HETZNER_ZONE_ID || 'nbg1',
	serverType = process.env.HETZNER_SERVER_TYPE || 'cx11'

export const openPortalInstance = async (portal: Portal) => {
	const client = createClient()
	if (!client) throw new Error('The Hetzner Cloud driver configuration is incorrect. This may be due to improper ENV variables, please check')

	const portalName = `portal-${portal.id}`

	try {

		await client.servers.build(portalName)
			.serverType(serverType)
			.location(zoneId)
			.image(process.env.HETZNER_IMAGE_ID)
			.create()

		await portal.updateStatus('starting')
		console.log(`opened portal with name ${portalName}`)

	} catch (error) {
		closePortal(portal.id)

		console.error('error while opening portal', error)
	}
}

export const closePortalInstance = async (portal: Portal) => {
	const client = createClient()
	if (!client) throw new Error('The Hetzner Cloud driver configuration is incorrect. This may be due to improper ENV variables, please check')

	const portalName = `portal-${portal.id}`

	try {
		const servers = await client.servers.list({ name: portalName }),
			server = servers.servers.find(({ name }) => name === portalName)

		if (server && server.id)
			await server.delete()
		else
			throw new Error('portal doesn\'t exist')

		console.log(`closed portal with name ${portalName}`)
	} catch (error) {
		console.error('error while closing portal', error.response ? error.response.body : error)
	}
}
