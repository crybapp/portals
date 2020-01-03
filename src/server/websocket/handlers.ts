import WebSocket from 'ws'
import { verify } from 'jsonwebtoken'

import Portal from '../../models/portal'

import WSEvent, { ClientType } from './defs'

const ACCEPTABLE_CLIENT_TYPES: ClientType[] = ['portal'],
	isClientWithIdAndType = (id: string, type: ClientType) => (client: WebSocket) => client['id'] === id && client['type'] === type

/**
 * Message incoming from Portal over WS
 */
const handleMessage = async (message: WSEvent, socket: WebSocket) => {
	const { op, d, t } = message,
		clientId = socket['id'],
		clientType = socket['type']

	console.log(`recieved message from ${clientType} (${clientId || 'unknown'}) over ws`, op, t)

	if (op === 2) {
		try {
			const { token, type } = d, { id } = verify(token, process.env.PORTAL_KEY) as { id: string }
			if (ACCEPTABLE_CLIENT_TYPES.indexOf(type) === -1) return socket.close(1013)

			socket['id'] = id
			socket['type'] = type

			if (type === 'portal') {
				const portal = await new Portal().load(id)
				await portal.updateStatus('open')
			}

			console.log('recieved auth from', type, id)
		} catch (error) {
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
	const { op, d, t } = message, { t: targetId } = d
	console.log('recieved internal portal message to be routed to portal with id', targetId, JSON.stringify(message))

	const target = clients.find(isClientWithIdAndType(targetId, 'portal'))
	if (!target) return console.log('target not found for internal message to portal; aborting')

	target.send(JSON.stringify({ op, d: { ...d, t: undefined }, t }))
}
