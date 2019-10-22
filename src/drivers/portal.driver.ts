import Portal from '../models/portal'
import PortalRequest from '../models/request/defs'

import { openPortalInstance, closePortalInstance } from './router'

export const createPortal = (request: PortalRequest) => new Promise<Portal>(async (resolve, reject) => {
    try {
        const portal = await new Portal().create(request)
        openPortalInstance(portal)
        
        resolve(portal)
    } catch(error) {
        reject(error)
    }
})

export const closePortal = (portalId: string) => new Promise(async (resolve, reject) => {
    try {
        const portal = await new Portal().load(portalId)
        await portal.destroy()
        
        closePortalInstance(portal)

        // if(portal.status === 'connected')
        //     checkNextQueueItem()

        console.log('closing portal with status', portal.status)

        resolve()
    } catch(error) {
        reject(error)
    }
})
