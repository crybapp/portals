import Portal from '../models/portal'

import { closePortal } from './portal.driver'

const manualLogHeaders = [
    '--- IMPORTANT ---',
    'You\'re using the manual driver, which is intended for development.',
], manualLogFooters = [
    '------'
]

export const openPortalInstance = async (portal: Portal) => {
    const name = `portal-${portal.id}`

    try {
        console.log([
            ...manualLogHeaders,
            'When starting @cryb/portal, use one of the following commands:',
            `yarn docker:dev --portalId ${portal.id}`,
            'OR',
            `npm run docker:dev --portalId ${portal.id}`,
            ...manualLogFooters
        ].join('\n'))
        await portal.updateStatus('starting')

        console.log(`opened portal with name ${name}`)
    } catch(error) {
        closePortal(portal.id)

        console.error('error while opening portal', error)
    }
}

export const closePortalInstance = async (portal: Portal) => {
    const name = `portal-${portal.id}`

    try {
        console.log([
            ...manualLogHeaders,
            `The Docker container running @cryb/portal with the portal id of ${portal.id} should now be terminated.`,
            ...manualLogFooters
        ].join('\n'))

        console.log(`closed portal with name ${name}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}