import { Server } from 'ws'

import Portal from '../../models/portal'

import WSEvent from './defs'
import { createPubSubClient } from '../../config/redis.config'
import handleMessage, { routeMessage } from './handlers'

const sub = createPubSubClient()

export default (wss: Server) => {
    sub.on('message', (channel, data) => {
        console.log('recieved message on channel', channel, 'data', data)
        
        let json: WSEvent,
                clients = Array.from(wss.clients)

        try {
            json = JSON.parse(data.toString())
        } catch(error) {
            return console.error(error)
        }

        routeMessage(json, clients)
    }).subscribe('portal')

    wss.on('connection', socket => {
        console.log('socket open')

        socket.on('message', data => {
            let json: WSEvent

            try {
                json = JSON.parse(data.toString())
            } catch(error) {
                return console.error(error)
            }

            handleMessage(json, socket)
        })

        socket.on('close', async () => {

            const id = socket['id'], type = socket['type']
            if(!id) return console.log('unknown socket closed')

            console.log('socket closed', id, type)

            if(type === 'portal') {
                const portal = await new Portal().load(id)
                portal.updateStatus('closed')
            }
        })
    })
}