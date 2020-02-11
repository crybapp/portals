import Portal from '../models/portal'
import PortalRequest from '../models/request/defs'

import Mountpoint from '../models/mountpoint'
import { checkNextQueueItem } from '../services/queue.service'
import { createJanusStreamingMountpoint, destroyJanusStramingMountpoint } from './janus.driver'
import { closePortalInstance, openPortalInstance } from './router'

export const createPortal = (request: PortalRequest) => new Promise<Portal>(async (resolve, reject) => {
		try {
			const portal = await new Portal().create(request)
			if(process.env.ENABLE_JANUS === 'true') {
				const mountpoint = await new Mountpoint().create(portal)
				createJanusStreamingMountpoint(mountpoint)
			}
			
			openPortalInstance(portal)

			resolve(portal)
		} catch (error) {
			reject(error)
		}
})

export const closePortal = (portalId: string) => new Promise(async (resolve, reject) => {
	try {
		const portal = await new Portal().load(portalId)
		await portal.destroy()
		
		if(process.env.ENABLE_JANUS === 'true') {
			const mountpoint = await new Mountpoint().load('Portal', portalId)
			destroyJanusStramingMountpoint(mountpoint)
			await mountpoint.destroy()
		}

		closePortalInstance(portal)

		if (portal.status === 'open')
			checkNextQueueItem()

		console.log('closing portal with status', portal.status)

		resolve()
	} catch (error) {
		reject(error)
	}
})
