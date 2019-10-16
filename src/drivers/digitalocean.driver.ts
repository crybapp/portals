import Portal from '../models/portal'
import test from '../config/providers/digitalocean.config'
import { closePortal } from './portal.driver'
import { DigitalOcean } from 'dots-wrapper';

const myApiToken = 'c5380bb188bd8dace0c1e76fad3213e8d6e9dae973b3220874e847d1036e2c9e';
const digitalOcean = new DigitalOcean(myApiToken);

export function testFunction() {
    digitalOcean.Account.get().subscribe(
        account => console.log(account),
        err => console.log(err.message),
        () => console.log("complete")
    )
}

export const openPortalInstance = async (portal: Portal) => {
    const name = `portal-${portal.id}`

    try {
        // Create the server using the API & Provider of your choice
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
        // Destroy the server using the id of the server you stored when creating the server

        console.log(`closed portal with name ${name}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}