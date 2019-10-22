import { createClient, fetchCredentials } from '../config/providers/gcloud.config'

const { project_id: projectId } = fetchCredentials() || { project_id: null },
        zoneId = 'us-east1-b',
        baseUrl = `https://www.googleapis.com/compute/v1/projects/${projectId}/zones/${zoneId}/`

export const openServerInstance = async () => {
    const client = createClient()
    if(!client) throw 'The Google Cloud driver is incorrect. This may be due to improper ENV variables, please try again'

    try {
        const instanceTemplate = `https://www.googleapis.com/compute/v1/projects/${projectId}/global/instanceTemplates/portal-template`
        
        // Create a VM under the template 'portal-template' with the name 'portal-{id}'
        await client.request({
            url: `${baseUrl}instances?sourceInstanceTemplate=${instanceTemplate}`,
            method: 'POST',
            data: {
                name: `server-${Date.now()}`
            }
        })

        console.log('opened server using gcloud.driver')
    } catch(error) {
        console.error('error while opening portal', error)
    }
}

export const closeServerInstance = async () => {
    const client = createClient()
    if(!client) throw 'The Google Cloud driver is incorrect. This may be due to improper ENV variables, please try again'

    try {
        // await client.request({
        //     url: `${baseUrl}instances/${portalName}`,
        //     method: 'DELETE'
        // })

        console.log('closed server using gcloud.driver')
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}
