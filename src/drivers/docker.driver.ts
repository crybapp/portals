import Portal from '../models/portal'

import { createClient } from '../config/providers/docker.config'
import { closePortal } from './portal.driver'

export const openPortalInstance = async (portal: Portal) => {
    const client = createClient(),
            name = `portal-${portal.id}`
    if(!client) throw 'The Docker driver configuration is incorrect. This may be due to improper ENV variables, please check'

    try {
        const container = await client.createContainer({
            name,
            hostname: name,
            image: process.env.DOCKER_IMAGE || 'cryb/portal',
            autoRemove: true,
            networkMode: 'bridge',
        })
        await container.start()

        await portal.updateStatus('starting')

        console.log(`opened portal with name ${name}`)
    } catch(error) {
        closePortal(portal.id)

        console.error('error while opening portal', error)
    }
}

export const closePortalInstance = async (portal: Portal) => {
    const client = createClient(),
            name = `portal-${portal.id}`
    if(!client) throw 'The Docker driver configuration is incorrect. This may be due to improper ENV variables, please check'

    try {
        const containers = await client.listContainers()
        const contData = containers.find(container => container.Names[0] === `/${name}`)
        if (contData && contData.Id) {
            const container = await client.getContainer(contData.Id)
            container.remove({ force: true })
        } else throw new Error('portal doesn\'t exist')

        console.log(`closed portal with name ${name}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}
