import WebSocket from 'ws'
import { verify } from 'jsonwebtoken'

import client from '../../config/redis.config'

import WSEvent, { ClientType } from './defs'
import { generateFlake } from '../../utils/generate.utils'

const ACCEPTABLE_CLIENT_TYPES: ClientType[] = ['server'],
        isClientWithIdAndType = (id: string, type: ClientType) => (client: WebSocket) => client['id'] === id && client['type'] === type

/**
 * Message incoming from Portal over WS
 */
const handleMessage = async (message: WSEvent, socket: WebSocket) => {
    const { op, d, t } = message,
            clientId = socket['id'],
            clientType = socket['type']
            
    console.log(`recieved ${JSON.stringify(d)} from ${clientType || 'unknown'} (${clientId || 'unknown'}) over ws`, op, t)

    if(op === 2) {
        try {
            const { token, type } = d,
                    payload = verify(token, process.env.PORTAL_KEY)

            if(!payload) return socket.close(1013)
            if(ACCEPTABLE_CLIENT_TYPES.indexOf(type) === -1) return socket.close(1013)

            socket['type'] = type

            if(type === 'server') {
                const id = generateFlake()
                socket.send(JSON.stringify({ op: 10, d: { id } }))

                client.lpush('servers', id)

                socket['id'] = id
                console.log('recieved auth from', type, id)
            } else return socket.close(1013)
        } catch(error) {
            socket.close(1013)
            console.error('authentication error', error)
        }
    }
}

export default handleMessage

/**
 * Message incoming from API or Portals for Portal
 */
export const routeMessage = async (message: WSEvent, clients: WebSocket[]) => {
    // const { op, d, t } = message, { t: targetId } = d
    // console.log('recieved internal portal message to be routed to portal with id', targetId, JSON.stringify(message))

    // const target = clients.find(isClientWithIdAndType(targetId, 'portal'))
    // if(!target) return console.log('target not found for internal message to portal; aborting')

    // target.send(JSON.stringify({ op, d: { ...d, t: undefined }, t }))
}
