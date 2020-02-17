import Mountpoint from '../models/mountpoint'
import Portal from '../models/portal'
import PortalRequest from '../models/request/defs'

import { IPortalDriver } from '../drivers/IPortalDriver'
import { createJanusStreamingMountpoint, destroyJanusStramingMountpoint } from '../drivers/janus.driver'

export class PortalManager {
	private driverMap = new Map<string, IPortalDriver>()
	private selectedDriver: IPortalDriver

	public registerDriver = (driver: IPortalDriver) => {
		this.driverMap.set(driver.driverName, driver)
	}

	public getCurrentAvailabilityFn = () => {
		if (!this.selectedDriver)
			this.selectedDriver = this.getDriverFromEnv()

		return this.selectedDriver.isSpaceAvailable
	}

	public createPortal = (request: PortalRequest) => new Promise<Portal>(async (resolve, reject) => {
		if (!this.selectedDriver)
			this.selectedDriver = this.getDriverFromEnv()

		try {
			const portal = await new Portal().create(request)
			if (process.env.ENABLE_JANUS === 'true') {
				const mountpoint = await new Mountpoint().create(portal)
				createJanusStreamingMountpoint(mountpoint)
			}

			this.selectedDriver.createPortal(portal)
				.catch(() => this.closePortal(portal.id))

			resolve(portal)
		} catch (error) {
			reject(error)
		}
	})

	public closePortal = (portalId: string) => new Promise(async (resolve, reject) => {
		if (!this.selectedDriver)
			this.selectedDriver = this.getDriverFromEnv()

		try {
			const portal = await new Portal().load(portalId)
			await portal.destroy()

			if (process.env.ENABLE_JANUS === 'true') {
				const mountpoint = await new Mountpoint().load('Portal', portalId)
				destroyJanusStramingMountpoint(mountpoint)
				await mountpoint.destroy()
			}

			this.selectedDriver.destroyPortal(portal)

			console.log('closing portal with status', portal.status)
			resolve()
		} catch (error) {
			reject(error)
		}
	})

	private getDriverFromEnv = (): IPortalDriver => {
		return this.driverMap.get(process.env.DRIVER.toLowerCase())
	}
}
