import Portal from '../models/portal'

import { createClient } from '../config/providers/digitalocean.config'
import { closePortal } from './portal.driver'

export const openPortalInstance = async (portal: Portal) => {
    const client = createClient(),
            name = `portal-${portal.id}`
    if(!client) throw 'The DigitalOcean driver configuration is incorrect. This may be due to improper ENV variables, please check'

    try {
        await client.droplet.createDroplet({
            name,
            region: process.env.DO_REGION || 'nyc3',
            size: process.env.DO_SIZE || 's-1vcpu-1gb',
            image: process.env.DO_IMAGE,
            backups: false,
            ipv6: true,
            tags: [name]
        })

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
    if(!client) throw 'The DigitalOcean driver configuration is incorrect. This may be due to improper ENV variables, please check'

    try {
        const droplets = await client.droplet.listDroplets({tag_name: name})
        const droplet = droplets.data.droplets.find(droplet => droplet.name === name)

        if (droplet && droplet.id) {
            await client.droplet.deleteDroplet({ droplet_id: droplet.id })
        } else throw new Error('portal doesn\'t exist')

        console.log(`closed portal with name ${name}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}
