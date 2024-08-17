import Portal from '../models/portal'

import { createClient } from '../config/providers/docker.config'
import { IPortalDriver } from './IPortalDriver'

export default class DockerDriver implements IPortalDriver {
	public driverName = 'docker'
	public testAvailable = false;

	public createPortal = (portal: Portal) => new Promise(async (resolve, reject) => {
		const client = createClient(),
			name = `portal-${portal.id}`

		if (!client)
			throw new Error('The Docker driver configuration is incorrect. This may be due to improper ENV variables, please check')

		try {
			const container = await client.createContainer({
				name,
				hostname: name,
				image: process.env.DOCKER_IMAGE || 'cryb/portal',
				hostConfig: {
					autoRemove: true,
					networkMode: process.env.DOCKER_NETWORK || 'bridge',
					shmSize: parseInt(process.env.DOCKER_SHM_SIZE || '1024') * 1048576
				},
				cmd: ['--portalId', portal.id]
			})
			await container.start()

			await portal.updateStatus('starting').catch(error => {
				console.error(`Error updating portal status: ${error}`)
			})

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
		if (!client) throw new Error('The Docker driver configuration is incorrect. This may be due to improper ENV variables, please check')

		try {
			const containers = await client.listContainers()
			const contData = containers.find(container => container.Names[0] === `/${name}`)
			if (contData && contData.Id) {
				const container = await client.getContainer(contData.Id)
				container.remove({ force: true })
			} else throw new Error('portal doesn\'t exist')

			console.log(`closed portal with name ${name}`)
		} catch (error) {
			console.error('error while closing portal', error.response ? error.response.body : error)
		}
	}

	public isSpaceAvailable = () => new Promise<boolean>((resolve, reject) => {
		resolve(true)
	})
}
