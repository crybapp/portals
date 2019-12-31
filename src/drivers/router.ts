import Portal from '../models/portal'

import {
	closePortalInstance as closeGCloudPortalInstance,
	openPortalInstance as openGCloudPortalInstance
} from './gcloud.driver'

import {
	closePortalInstance as closeK8SPortalInstance,
	openPortalInstance as openK8SPortalInstance
} from './kubernetes.driver'

import {
	closePortalInstance as closeDockerPortalInstance,
	openPortalInstance as openDockerPortalInstance
} from './docker.driver'

import {
	closePortalInstance as closeDOPortalInstance,
	openPortalInstance as openDOPortalInstance
} from './digitalocean.driver'

import {
	closePortalInstance as closeHCloudPortalInstance,
	openPortalInstance as openHCloudPortalInstance
} from './hetznercloud.driver'

import {
	closePortalInstance as closeManualPortalInstance,
	openPortalInstance as openManualPortalInstance
} from './manual.driver'

type Driver = 'docker' | 'digitalocean' | 'hetznercloud' | 'gcloud' | 'kubernetes' | 'manual'

export const fetchCurrentDriver = () => process.env.DRIVER || 'manual' as Driver

export const openPortalInstance = async (portal: Portal) => {
	const driver = await fetchCurrentDriver()
	console.log('using driver', driver, 'to open portal with id', portal.id)

	switch (driver) {
		case 'docker':
			openDockerPortalInstance(portal)
			break
		case 'digitalocean':
			openDOPortalInstance(portal)
			break
		case 'hetznercloud':
			openHCloudPortalInstance(portal)
			break
		case 'gcloud':
			openGCloudPortalInstance(portal)
			break
		case 'kubernetes':
			openK8SPortalInstance(portal)
			break
		case 'manual':
			openManualPortalInstance(portal)
			break
	}
}

export const closePortalInstance = async (portal: Portal) => {
	const driver = await fetchCurrentDriver()
	console.log('using driver', driver, 'to open portal with id', portal.id)

	switch (driver) {
		case 'docker':
			closeDockerPortalInstance(portal)
			break
		case 'digitalocean':
			closeDOPortalInstance(portal)
			break
		case 'hetznercloud':
			closeHCloudPortalInstance(portal)
			break
		case 'gcloud':
			closeGCloudPortalInstance(portal)
			break
		case 'kubernetes':
			closeK8SPortalInstance(portal)
			break
		case 'manual':
			closeManualPortalInstance(portal)
			break
	}
}
