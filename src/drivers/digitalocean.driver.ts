import Portal from '../models/portal'
import digitalOcean, { digitalOceanImageId } from '../config/providers/digitalocean.config'
import { closePortal } from './portal.driver'

export const openPortalInstance = async (portal: Portal) => {
    const name = `portal-${portal.id}`

    try {
        let dropletSpecs = {
            name:name,
            region:"nyc3",
            size:"s-1vcpu-1gb",
            image: digitalOceanImageId,
            backups:false,
            ipv6:true,
            tags: ["stream", portal.id]
        }

        digitalOcean.Droplet.create(dropletSpecs).subscribe(
            dropletInfo => async function() {
                console.log(dropletInfo)
                await portal.updateServerId(dropletInfo.id.toString())
            },
            err => console.log(err.message),
            () => console.log("CreateDropletComplete")
        )

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
        digitalOcean.Droplet.delete(portal.serverId).subscribe(
            () => console.log("DeleteDropletComplete")
        )

        console.log(`closed portal with name ${name}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}