import Portal from '../models/portal'

import gcloud, { credentials } from '../config/providers/gcloud.config'
import { closePortal } from './portal.driver'

const { project_id: projectId } = credentials,
        zoneId = 'us-east1-b',
        baseUrl = `https://www.googleapis.com/compute/v1/projects/${projectId}/zones/${zoneId}/`

export const openPortalInstance = async (portal: Portal) => {
    const portalName = `portal-${portal.id}`

    try {
        const instanceTemplate = `https://www.googleapis.com/compute/v1/projects/${projectId}/global/instanceTemplates/portal-template`
        
        // Create a VM under the template 'portal-template' with the name 'portal-{id}'
        await gcloud.request({
            url: `${baseUrl}instances?sourceInstanceTemplate=${instanceTemplate}`,
            method: 'POST',
            data: {
                name: portalName
            }
        })

        await portal.updateStatus('starting')

        console.log(`opened portal with name ${portalName}`)
    } catch(error) {
        closePortal(portal.id)

        console.error('error while opening portal', error)
    }
}

export const closePortalInstance = async (portal: Portal) => {
    const portalName = `portal-${portal.id}`

    try {
        await gcloud.request({
            url: `${baseUrl}instances/${portalName}`,
            method: 'DELETE'
        })

        console.log(`closed portal with name ${portalName}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}