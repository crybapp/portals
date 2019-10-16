import Portal from '../models/portal'
import digitalOcean from '../config/providers/digitalocean.config'
import { closePortal } from './portal.driver'

export function testFunction() {
    /* digitalOcean.Account.get().subscribe(
        account => console.log(account),
        err => console.log(err.message),
        () => console.log("complete")
    ) */

/*     let dropletSpecs = {
        name:"TestDropletFromCode1",
        region:"nyc3",
        size:"s-1vcpu-1gb",
        image:"ubuntu-16-04-x64",
        backups:false,
        ipv6:true,
        tags: ["stream"]
    }

    digitalOcean.Droplet.create(dropletSpecs).subscribe(
        dropletInfo => console.log(dropletInfo),
        err => console.log(err.message),
        () => console.log("complete")
    ) */
}

export const openPortalInstance = async (portal: Portal) => {
    const name = `portal-${portal.id}`

    try {
        let dropletSpecs = {
            name:name,
            region:"nyc3",
            size:"s-1vcpu-1gb",
            image:"ubuntu-16-04-x64",
            backups:false,
            ipv6:true,
            tags: ["stream"]
        }

        digitalOcean.Droplet.create(dropletSpecs).subscribe(
            dropletInfo => function() {
                console.log(dropletInfo)
                portal.serverId = dropletInfo.id.toString()
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
    const name = `portal-${portal.id}`, { serverId } = portal

    try {
        digitalOcean.Droplet.delete(+serverId).subscribe(
            dropletInfo => console.log(dropletInfo),
            err => console.log(err.message),
            () => console.log("DeleteDropletComplete")
        )

        console.log(`closed portal with name ${name}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}