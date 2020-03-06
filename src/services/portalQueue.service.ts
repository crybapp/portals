import { Redis } from 'ioredis'
import client, { createRedisClient } from '../config/redis.config'
import IPortalRequest, { IQueueMovementEvent } from '../models/queue/defs'
import { generateFlake } from '../utils/generate.utils'
import sleep from '../utils/sleep.utils'

type AvailabilityFunc = () => Promise<boolean>
type PortalCreationFunc = (PortalRequest: IPortalRequest) => Promise<unknown>
type QueueMovementEvent = (MovementEvent: IQueueMovementEvent) => Promise<unknown>

export class QueueService  {
	private queueChannel: string
	private availabilityFn: AvailabilityFunc
	private portalCreateFn: PortalCreationFunc
	
	private blockingClient: Redis
	private shouldClose: boolean = false
	
	private queueMovementEvents: Array<QueueMovementEvent> = []
	private lastQueueMovementLength: number = 0
	private dequeuedRoomsSinceLastMovement: Array<string> = []
	private timeOfLastMovement: number = 0

	constructor(
		portalCreateFn: PortalCreationFunc,
		availabilityFn?: AvailabilityFunc
	) {
		this.queueChannel = `portalQueue-${generateFlake()}`
		this.blockingClient = createRedisClient()
		this.availabilityFn = availabilityFn
		this.portalCreateFn = portalCreateFn
	}

	/**
	 * registerQueueMovementEvent adds a callback that gets called when the
	 * Queue Movement event gets fired, every 15s.
	 * @param movementFunc A function to define how movement events are triggered.
	 */
	public registerQueueMovementEvent(movementFunc: QueueMovementEvent) {
		this.queueMovementEvents.push(movementFunc)
	}

	/**
	 * queueNewPortalRequest will add a new request to this queue.
	 * @param roomId The ID of the room this portal belongs to.
	 */
	public queueNewPortalRequest = (roomId: string): Promise<number> => {
		const portalRequest: IPortalRequest = {
			roomId,
			receivedAt: Date.now()
		}
		console.log(`queueing new portal request: ${portalRequest}`)
		return client.rpush(this.queueChannel, JSON.stringify(portalRequest))
	}

	public start = async () => {
		while (!this.shouldClose) {
			await this.waitForAvailability()
			if (this.shouldClose)
				return

			const requestedPortal = await this.getNextPortalRequest()
			this.dequeuedRoomsSinceLastMovement.push(requestedPortal.roomId)

			console.log(`Creating new portal: ${requestedPortal}`)
			this.portalCreateFn(requestedPortal).catch(error => {
				console.error(`Error creating portal: ${error}`)
			})
			if(Date.now() - this.timeOfLastMovement > 15000) {
				this.triggerQueueMovementEvent()
			}
		}
	}

	public close = async () => {
		this.availabilityFn = null
		this.shouldClose = true
		this.blockingClient.quit()
	}

	private createQueueMovementEvent = () => new Promise<IQueueMovementEvent>(async (resolve) => {
		console.log("Starting new queue movement event.")
		const fullQueueString: Promise<string[]> = client.lrange(this.queueChannel, 0, -1)
		let queueLength: Promise<number> = this.getQueueLength()

		const fullQueueObject: Array<IPortalRequest> = JSON.parse("[" + await fullQueueString + "]")
		const roomIdArray: string[] = fullQueueObject.map(x => x.roomId)
		
		const movementEvent: IQueueMovementEvent  = {
			lastMovementLength: this.lastQueueMovementLength,
			currentQueueLength: await queueLength,
			dequeuedRoomIds: this.dequeuedRoomsSinceLastMovement,
			roomIdsInQueue: roomIdArray
		}

		this.dequeuedRoomsSinceLastMovement = []
		this.lastQueueMovementLength = await queueLength

		console.log(`Resolving movement event with: ${movementEvent}`)
		resolve(movementEvent)
	})

	private triggerQueueMovementEvent = async () => {
		const movementDetails = await this.createQueueMovementEvent()
		this.timeOfLastMovement = Date.now()
		this.queueMovementEvents.forEach(value => {
			value(movementDetails)
		})
	}

	/**
	 * getQueueLength returns the current length of the queue
	 */
	private getQueueLength = () => client.llen(this.queueChannel)

	/**
	 * getNextPortalRequest will return the next Portal request in the queue
	 * if there are no items in the queue, getNextPortalRequest will wait till there are.
	 */
	private getNextPortalRequest = () => new Promise<IPortalRequest>(async resolve => {
		const redisResponse = await this.blockingClient.send_command('BLPOP', this.queueChannel, 0)
		const queuedRequest: IPortalRequest = JSON.parse(redisResponse[1])
		resolve(queuedRequest)
	})

	/**
	 * Wait for availability will wait until availabilityFn returns true
	 */
	private waitForAvailability = () => new Promise(async (resolve, reject) =>{
		let available = false
		while (!available) {
			if(!this.availabilityFn) {
				available = true
				continue
			}

			const isAvailable = await this.availabilityFn()
		
			if (isAvailable === true) {
				available = true
				continue
			}
			
			await sleep(500)
		}

		resolve()
	})
}
