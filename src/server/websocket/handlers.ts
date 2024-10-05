import { verify } from 'jsonwebtoken'
import WebSocket from 'ws'

import Portal from '../../models/portal'

import Mountpoint from '../../models/mountpoint'
import Services from '../../services/serviceManager.service'
import IWSEvent, { ClientType } from './defs'

const ACCEPTABLE_CLIENT_TYPES: ClientType[] = ['portal'],
	isClientWithIdAndType = (id: string, type: ClientType) => (client: WebSocket) =>
	client['id'] === id && client['type'] === type

/**
 * Message incoming from Portal over WS
 */
const handleMessage = async (message: IWSEvent, socket: WebSocket) => {
	const { op, d, t } = message,
			clientId = socket['id'],
			clientType = socket['type']

	console.log(`recieved message from ${clientType} (${clientId || 'unknown'}) over ws`, op, t)

	if (op === 2)
		try {
			console.log('Verifying Token')
			const { token, type } = d, { id } = verify(token, process.env.PORTAL_KEY) as { id: string }
			console.log('Checking Type')
			if (ACCEPTABLE_CLIENT_TYPES.indexOf(type) === -1) return socket.close(1013)
			console.log('Saving variables')

			socket['id'] = id
			socket['type'] = type

			if (type === 'portal') {
				const portal = await new Portal().load(id)

				const mountpoint = await new Mountpoint().load('Portal', id)

				if (mountpoint.audioport === 0 || mountpoint.videoport === 0) {
					Services.portalManager.closePortal(id)
					throw new Error(`Janus mountpoint for portal: ${id}, was not created successfully. Aborting.`)
				}

				socket.send(JSON.stringify(
					{
						op: 10,
						d: {
							janusAddress: mountpoint.janusIp,
							audioport: mountpoint.audioport,
							audiortcpport: mountpoint.audiortcpport,
							videoport: mountpoint.videoport,
							videortcpport: mountpoint.videortcpport
						}
					}
				))

				await portal.updateStatus('open')
			}

			console.log('recieved auth from', type, id)
		} catch (error) {
			socket.close(1013)
			console.error('authentication error', error)
		}
}
export default handleMessage

/**
 * Message incoming from API or Portals for Portal
 */
export const routeMessage = async (message: IWSEvent, clients: WebSocket[]) => {
	const { op, d, t } = message, { t: targetId } = d
	console.log('recieved internal portal message to be routed to portal with id', targetId, JSON.stringify(message))

	const target = clients.find(isClientWithIdAndType(targetId, 'portal'))
	if (!target) return console.log('target not found for internal message to portal; aborting')

	target.send(JSON.stringify({ op, d: { ...d, t: undefined }, t }))
}
