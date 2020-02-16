import { Server } from 'ws'

import Portal from '../../models/portal'

import { createRedisClient } from '../../config/redis.config'
import IWSEvent from './defs'
import handleMessage, { routeMessage } from './handlers'

const sub = createRedisClient()

export default (wss: Server) => {
	sub.on('message', (channel, data) => {
		console.log('recieved message on channel', channel, 'data', data)

		let json: IWSEvent
		const clients = Array.from(wss.clients)

		try {
			json = JSON.parse(data.toString())
		} catch (error) {
			return console.error(error)
		}

		routeMessage(json, clients)
	}).subscribe('portals')

	wss.on('connection', socket => {
		console.log('socket open')

		socket.on('message', data => {
			let json: IWSEvent

			try {
				json = JSON.parse(data.toString())
			} catch (error) {
				return console.error(error)
			}

			handleMessage(json, socket)
		})

		socket.on('close', async () => {

			const id = socket['id'], type = socket['type']
			if (!id)
				return console.log('unknown socket closed')

			console.log('socket closed', id, type)

			if (type === 'portal')
				try {
					const portal = await new Portal().load(id)
					portal.updateStatus('closed')
				} catch (error) { } // Fails when it was deleted, so can be ignored
		})
	})
}
