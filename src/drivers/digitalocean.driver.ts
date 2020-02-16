import Portal from '../models/portal'

import { createClient } from '../config/providers/digitalocean.config'
import { IPortalDriver } from './IPortalDriver'

export class DigitalOceanDriver implements IPortalDriver {
	public driverName = 'digitalocean'

	public createPortal = (portal: Portal) => new Promise(async (resolve, reject) => {
		const client = createClient(),
			name = `portal-${portal.id}`
		if (!client) throw new Error('The DigitalOcean driver configuration is incorrect. This may be due to improper ENV variables, please check')

		try {
			await client.droplet.createDroplet({
				name,
				region: process.env.DO_REGION || 'nyc3',
				size: process.env.DO_SIZE || 's-1vcpu-1gb',
				image: process.env.DO_IMAGE,
				backups: false,
				ipv6: true,
				tags: [name]
			})

			await portal.updateStatus('starting')

			console.log(`opened portal with name ${name}`)
			resolve()
		} catch (error) {
			reject(error)
			console.error('error while opening portal', error)
		}
	})

	public destroyPortal = async (portal: Portal) => {
		const client = createClient(),
			name = `portal-${portal.id}`
		if (!client) throw new Error('The DigitalOcean driver configuration is incorrect. This may be due to improper ENV variables, please check')

		try {
			const droplets = await client.droplet.listDroplets({ tag_name: name }),
				droplet = droplets.data.droplets.find(_droplet => _droplet.name === name)

			if (droplet && droplet.id)
				await client.droplet.deleteDroplet({ droplet_id: droplet.id })
			else
				throw new Error('portal doesn\'t exist')

			console.log(`closed portal with name ${name}`)
		} catch (error) {
			console.error('error while closing portal', error.response ? error.response.body : error)
		}
	}

	public isSpaceAvailable = () => new Promise<boolean>(resolve => {
		resolve(true)
	})
}
