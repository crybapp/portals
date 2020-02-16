import Portal from "../models/portal";

export interface IPortalDriver {
    driverName: string
    isSpaceAvailable(): Promise<Boolean>
    createPortal(portalToCreate: Portal): Promise<unknown>
    destroyPortal(portalToDestroy: Portal)
}