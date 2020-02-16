import Portal from '../models/portal'

import { createClient } from '../config/providers/hetznercloud.config'
import { IPortalDriver } from './IPortalDriver'

export default class HetznerCloudDriver implements IPortalDriver {
	public driverName = 'hetznercloud'
	private zoneId = process.env.HETZNER_ZONE_ID || 'nbg1'
	private serverType = process.env.HETZNER_SERVER_TYPE || 'cx11'

	public createPortal = (portal: Portal) => new Promise(async (resolve, reject) => {
		const client = createClient()
		if (!client)
			throw new Error('The Hetzner Cloud driver configuration is incorrect. This may be due to improper ENV variables, please check')

		const portalName = `portal-${portal.id}`

		try {

			await client.servers.build(portalName)
				.serverType(this.serverType)
				.location(this.zoneId)
				.image(process.env.HETZNER_IMAGE_ID)
				.create()

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

	public isSpaceAvailable = () => new Promise<boolean>(resolve => {
		resolve(true)
	})
}
