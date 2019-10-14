import client from '../config/redis.config'

import PortalRequest from '../models/request/defs'
import { createPortal } from '../drivers/portal.driver'
import { fetchAvailableNode } from '../drivers/kubernetes.driver'

/**
 * This method is responsible for fetching the queue length.
 */
const fetchQueueLength = () => client.llen('portal_queue')

/**
 * This method is responsible for fetching the next queue item that needs to be
 * handled.
 */
const fetchNextQueueItem = () => new Promise<PortalRequest>(async (resolve, reject) => {
    try {
        const queueItem: PortalRequest = await client.lrange('portal_queue', 0, 1)[0]
        if(!queueItem) return resolve()

        resolve(queueItem)
    } catch(error) {
        reject(error)
    }
})

/**
 * This method is responsible for pulling the first queue item, and then
 * returning the new length of the queue.
 *
 * It will first get the value of the item at the index given in the call,
 * if there is no value then it will fetch the queue length and then return.
 *
 * If there is a value at that index, then it will remove the value at that index
 * in the queue, and then return the length of the queue.
 */
const pullQueueItem = async (index: number = 0) => new Promise<number>(async (resolve, reject) => {
    try {
        const value = await client.lindex('portal_queue', index)
        if(!value) return resolve(await fetchQueueLength())

        const length = await client.lrem('portal_queue', index, value)
        resolve(length)
    } catch(error) {
        reject(error)
    }
})

/**
 * This method is called when a request is completed. It first checks if
 * there are any available Kubeernetes nodes for a new Portal to be deployed on.
 * If not, the function does not complete. It checks if there is any items in the queue.
 * If not, the function does not complete. If there is another queue item, it'll fetch
 * the queue item and them call the method responsible for handling that queue item.
 */
export const checkNextQueueItem = async () => {
    /**
     * If there are no available nodes, don't resume with creating a new queue item
     */
    if(!await fetchAvailableNode()) return

    const queueLength = await fetchQueueLength()
    if(queueLength === 0) return

    handleQueueItem(await fetchNextQueueItem(), true)
}

/**
 * This method is called when a request needs to be handled.
 * It is responsible for calling the service that creates a portal,
 * and then calling the method that checks the next queue item
 */
const handleQueueItem = async (request: PortalRequest, didPullFromQueue: boolean) => {
    if(didPullFromQueue) await pullQueueItem()
    await createPortal(request)

    checkNextQueueItem()
}

/**
 * This method handles when a new request is recieved by the API.
 *
 * It checks if there are any existing queue items. If there are,
 * then it pushes the new request to the queue. If not, then it
 * will deal with the request immediately.
 */
export const pushQueue = async (request: PortalRequest) => {
    const queueLength = await fetchQueueLength()

    if(queueLength === 0)
        handleQueueItem(request, false)
    else
        client.lpush('portal_queue', JSON.stringify(request))
}