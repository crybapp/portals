import Portal from '../models/portal'

export interface IPortalDriver {
	driverName: string
	isSpaceAvailable(): Promise<boolean>
	createPortal(portalToCreate: Portal): Promise<unknown>
	destroyPortal(portalToDestroy: Portal)
}
