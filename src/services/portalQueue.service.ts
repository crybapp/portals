import client, { createRedisClient } from '../config/redis.config'

import PortalRequest from '../models/request/defs'

import { fetchAvailableNode } from '../drivers/kubernetes.driver'
import { createPortal } from '../drivers/portal.driver'
import { fetchCurrentDriver } from '../drivers/router'

/**
 * AvailabilityFunc should be implemented in each driver.
 * It should block until a portal is able to be created
 */
type AvailabilityFunc = () => Promise<boolean>

const QUEUE_CHANNEL: string = 'portal_queue'
const blockingClient = createRedisClient()

/**
 * getQueueLength returns the current length of the queue
 */
const getQueueLength = () => client.llen(QUEUE_CHANNEL)

/**
 * getNextPortalRequest will return the next Portal request in the queue 
 * if there are no items in the queue, getNextPortalRequest will wait till there are.
 */
const getNextPortalRequest = () => new Promise<PortalRequest>(async (resolve, reject) => {
    try {
        const queuedRequest: PortalRequest = await blockingClient.blpop(QUEUE_CHANNEL)[1]
        resolve(queuedRequest)
    } catch(error) {
        reject(error)
    }
})

export const queueNewPortalRequest = (roomId: string): Promise<Number> => {
    const portalRequest: PortalRequest = { 
        roomId, 
        receivedAt: Date.now()
    }
    return client.rpush(QUEUE_CHANNEL, JSON.stringify(portalRequest))
}

export const startQueueService = async (available?: AvailabilityFunc) => {
    while(true) {
        if(!await available())
            await setTimeout(() => true, 500)

        const portalRequest = await getNextPortalRequest()
        await createPortal(portalRequest)
    }
} 