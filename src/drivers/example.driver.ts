// Import the API you wish to use
import { createClient } from '../config/providers/example.config'

export const openServerInstance = async () => {
    const client = createClient()

    try {
        // Create the server using the API & Provider of your choice
        await client.createServer()

        console.log(`opened portal using example.driver`)
    } catch(error) {
        console.error('error while opening portal', error)
    }
}

export const closeServerInstance = async () => {
    const client = createClient()

    try {
        // Destroy the server using the id of the server you stored when creating the server
        await client.destroyServer()

        console.log(`closed portal using example.driver`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}
