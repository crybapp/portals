// Import the API you wish to use
import { createClient } from '../config/providers/example.config'
import { registerDeployment, deregisterDeployment } from './utils/register.utils.driver'

export const openServerInstance = async () => {
    const client = createClient()

    try {
        // Create the server using the API & Provider of your choice
        const { name } = await registerDeployment('example')
        await client.createServer(name)

        console.log(`opened portal using example.driver`)
    } catch(error) {
        console.error('error while opening portal', error)
    }
}

export const closeServerInstance = async (name: string) => {
    const client = createClient()

    try {
        // Destroy the server using the id of the server you stored when creating the server
        await deregisterDeployment(name)
        await client.destroyServer(name)

        console.log(`closed portal using example.driver`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}
