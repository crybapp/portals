import Portal from '../models/portal'

import { createClient, fetchCredentials } from '../config/providers/hetznercloud.config'
import { closePortal } from './portal.driver'

const { project_id: projectId } = fetchCredentials() || { project_id: null },
        zoneId = 'nbg1',
        serverType = 'cx11'

export const openPortalInstance = async (portal: Portal) => {
    const client = createClient()
    if(!client) throw 'The Hetzner Cloud driver is incorrect. This may be due to improper ENV variables, please try again'

    const portalName = `portal-${portal.id}`

    try {
        
        await client.servers.build(portalName)
                      .serverType(serverType)
                      .location(zoneId)
                      .image(9403290) // replace with your own custom snapshot
                      .create();
        
        
        await portal.updateStatus('starting')
        console.log(`opened portal with name ${portalName}`)

    } catch(error) {
        closePortal(portal.id)

        console.error('error while opening portal', error)
    }
}

export const closePortalInstance = async (portal: Portal) => {
    const client = createClient()
    if(!client) throw 'The Hetzner Cloud driver is incorrect. This may be due to improper ENV variables, please try again'

    const portalName = `portal-${portal.id}`

    try {
        const servers = await client.servers.list({name: portalName}); 
        const server = servers.servers.find(a => a.name === portalName);

        if(server && server.id) {
            await server.delete();
        } else throw new Error('portal doesn\'t exist');

        console.log(`closed portal with name ${portalName}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}
