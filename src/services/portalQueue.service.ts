import { Redis } from 'ioredis'
import client, { createRedisClient } from '../config/redis.config'
import PortalRequest from '../models/request/defs'
import IPortal from '../models/portal/defs'
import { generateFlake } from '../utils/generate.utils'



type AvailabilityFunc = () => Promise<Boolean>
type PortalCreationFunc = (PortalRequest) => Promise<unknown>

export class QueueService  {
    private queueChannel: string
    private blockingClient: Redis
    private availabilityFn: AvailabilityFunc
    private portalCreateFn: PortalCreationFunc
    private shouldClose: Boolean = false

    constructor(
        portalCreateFn: PortalCreationFunc,
        availabilityFn?: AvailabilityFunc
    ){
        this.queueChannel = `portalQueue-${generateFlake()}`
        this.blockingClient = createRedisClient()
        this.availabilityFn = availabilityFn
        this.portalCreateFn = portalCreateFn
    }

    /**
     * getQueueLength returns the current length of the queue
     */
    private getQueueLength = () => client.llen(this.queueChannel)

    /**
     * getNextPortalRequest will return the next Portal request in the queue 
     * if there are no items in the queue, getNextPortalRequest will wait till there are.
     */
    private getNextPortalRequest = () => new Promise<PortalRequest>(async (resolve, reject) => {
        const redisResponse = await this.blockingClient.send_command('BLPOP', this.queueChannel, 0)
        const queuedRequest: PortalRequest = JSON.parse(redisResponse[1])
        resolve(queuedRequest)
    })

    /**
     * Wait for availability will wait until availabilityFn returns true
     * @param availabilityFn the function to be called to check if something exists
     */
    private waitForAvailability = async () => {
        if(!this.availabilityFn || await this.availabilityFn())
            return

        await setTimeout(() => true, 500)
        this.waitForAvailability()
    }

    /**
     * queueNewPortalRequest will add a new request to this queue.
     * @param roomId The ID of the room this portal belongs to.
     */
    public queueNewPortalRequest = (roomId: string): Promise<Number> => {
        const portalRequest: PortalRequest = { 
            roomId, 
            receivedAt: Date.now()
        }
        return client.rpush(this.queueChannel, JSON.stringify(portalRequest))
    }

    public start = async () => {    
        while(!this.shouldClose) {
            await this.waitForAvailability()
            if(this.shouldClose)
                return

            const requestedPortal = this.getNextPortalRequest()
            this.portalCreateFn(requestedPortal)
        }
    }

    public close = async () => {
        this.availabilityFn = null
        this.shouldClose = true
        this.blockingClient.quit()
    }
}