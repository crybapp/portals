import Portal from '../models/portal'

import {
    openPortalInstance as openGCloudPortalInstance,
    closePortalInstance as closeGCloudPortalInstance
} from './gcloud.driver'

import {
    openPortalInstance as openHCloudPortalInstance,
    closePortalInstance as closeHCloudPortalInstance
} from './hetznercloud.driver'

import {
    openPortalInstance as openK8SPortalInstance,
    closePortalInstance as closeK8SPortalInstance
} from './kubernetes.driver'

import {
    openPortalInstance as openDOPortalInstance,
    closePortalInstance as closeDOPortalInstance
} from './digitalocean.driver'

import {
    openPortalInstance as openManualPortalInstance,
    closePortalInstance as closeManualPortalInstance
} from './manual.driver'

type Driver = 'gcloud' | 'kubernetes' | 'hetznercloud' | 'digitalocean' | 'manual'

export const fetchCurrentDriver = () => 'manual' as Driver

export const openPortalInstance = async (portal: Portal) => {
    const driver = await fetchCurrentDriver()
    console.log('using driver', driver, 'to open portal with id', portal.id)

    switch(driver) {
        case 'gcloud':
            openGCloudPortalInstance(portal)
            break
        case 'hetznercloud':
            openHCloudPortalInstance(portal)
            break
        case 'kubernetes':
            openK8SPortalInstance(portal)
            break
        case 'digitalocean':
            openDOPortalInstance(portal)
            break
        case 'manual':
            openManualPortalInstance(portal)
            break
    }
}

export const closePortalInstance = async (portal: Portal) => {
    const driver = await fetchCurrentDriver()
    console.log('using driver', driver, 'to open portal with id', portal.id)

    switch(driver) {
        case 'gcloud':
            closeGCloudPortalInstance(portal)
            break
        case 'hetznercloud':
            closeHCloudPortalInstance(portal)
            break
        case 'kubernetes':
            closeK8SPortalInstance(portal)
            break
        case 'digitalocean':
            closeDOPortalInstance(portal)
            break
        case 'manual':
            closeManualPortalInstance(portal)
            break
    }
}
