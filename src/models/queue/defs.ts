export default interface IPortalRequest {
	roomId: string
	receivedAt: number
}

export interface IQueueMovementEvent {
	dequeuedRoomIds: Array<string>
	currentQueueLength: number
	lastMovementLength: number
	roomIdsInQueue: Array<string>
}
