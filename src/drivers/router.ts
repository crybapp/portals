import Portal from '../models/portal'

import {
    openPortalInstance as openGCloudPortalInstance,
    closePortalInstance as closeGCloudPortalInstance
} from './gcloud.driver'

import {
    openPortalInstance as openK8SPortalInstance,
    closePortalInstance as closeK8SPortalInstance
} from './kubernetes.driver'

type Driver = 'gcloud' | 'kubernetes'

const fetchCurrentDriver = () => 'kubernetes' as Driver

export const openPortalInstance = async (portal: Portal) => {
    const driver = await fetchCurrentDriver()
    console.log('using driver', driver, 'to open portal with id', portal.id)

    switch(driver) {
        case 'gcloud':
            openGCloudPortalInstance(portal)
            break
        case 'kubernetes':
            openK8SPortalInstance(portal)
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
        case 'kubernetes':
            closeK8SPortalInstance(portal)
            break
    }
}