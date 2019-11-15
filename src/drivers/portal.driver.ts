import Portal from '../models/portal'
import PortalRequest from '../models/request/defs'

import { checkNextQueueItem } from '../services/queue.service'
import { openPortalInstance, closePortalInstance } from './router'
import Mountpoint from '../models/mountpoint'
import { createJanusStreamingMountpoint, destroyJanusStramingMountpoint } from './janus.driver'


export const createPortal = (request: PortalRequest) => new Promise<Portal>(async (resolve, reject) => {
    try {
        const portal = await new Portal().create(request)
        const mountpoint = await new Mountpoint().create(portal)

        openPortalInstance(portal)
        createJanusStreamingMountpoint(mountpoint)

        resolve(portal)
    } catch(error) {
        reject(error)
    }
})

export const closePortal = (portalId: string) => new Promise(async (resolve, reject) => {
    try {
        const portal = await new Portal().load(portalId)
        const mountpoint = await new Mountpoint().load('Portal', portalId)
        await portal.destroy()
        await mountpoint.destroy()
        
        closePortalInstance(portal)
        destroyJanusStramingMountpoint(mountpoint)

        if(portal.status === 'open')
            checkNextQueueItem()

        console.log('closing portal with status', portal.status)

        resolve()
    } catch(error) {
        reject(error)
    }
})
