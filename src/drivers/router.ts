import {
    openServerInstance as openGCloudServerInstance,
    openServerInstance as closeGCloudServerInstance
} from './gcloud.driver'

import {
    openServerInstance as openK8SServerInstance,
    openServerInstance as closeK8SServerInstance
} from './kubernetes.driver'

export type Driver = 'gcloud' | 'kubernetes' | 'example' | null

export const fetchCurrentDriver = () => null as Driver

export const openServerInstance = async () => {
    const driver = await fetchCurrentDriver()
    console.log('using driver', driver, 'to open server')

    switch(driver) {
        case 'gcloud':
            openGCloudServerInstance()
            break
        case 'kubernetes':
            openK8SServerInstance()
            break
        default:
            console.log('driver not found')
            break
    }
}

export const closeServerInstance = async () => {
    const driver = await fetchCurrentDriver()
    console.log('using driver', driver, 'to close server')

    switch(driver) {
        case 'gcloud':
            closeGCloudServerInstance()
            break
        case 'kubernetes':
            closeK8SServerInstance()
            break
        default:
            console.log('driver not found')
            break
    }
}
