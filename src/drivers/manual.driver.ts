import Portal from '../models/portal'
import { IPortalDriver } from './IPortalDriver'

export default class ManualDriver implements IPortalDriver {
	public driverName = 'manual'

	private manualLogHeaders = [
		'--- IMPORTANT ---',
		'You\'re using the manual driver, which is intended for development.',
	]
	private manualLogFooters = [
		'------'
	]

	public createPortal = (portal: Portal) => new Promise(async (resolve, reject) => {
		const name = `portal-${portal.id}`

		try {
			console.log([
				...this.manualLogHeaders,
				'When starting @cryb/portal, use one of the following commands:',
				`yarn docker:dev --portalId ${portal.id}`,
				'OR',
				`npm run docker:dev --portalId ${portal.id}`,
				...this.manualLogFooters
			].join('\n'))
			await portal.updateStatus('starting')

			console.log(`opened portal with name ${name}`)
			resolve()
		} catch (error) {
			reject(error)
			console.error('error while opening portal', error)
		}
	})

	public destroyPortal = async (portal: Portal) => {
		const name = `portal-${portal.id}`

		try {
			console.log([
				...this.manualLogHeaders,
				`The Docker container running @cryb/portal with the portal id of ${portal.id} should now be terminated.`,
				...this.manualLogFooters
			].join('\n'))

			console.log(`closed portal with name ${name}`)
		} catch (error) {
			console.error('error while closing portal', error.response ? error.response.body : error)
		}
	}

	public isSpaceAvailable = () => new Promise<boolean>(resolve => {
		resolve(true)
	})
}
