import express from 'express'

import PortalRequest from '../models/request/defs'

import { closePortal } from '../drivers/portal.driver'
import authenticate from '../server/middleware/authenticate.middleware'
import { pushQueue } from '../services/queue.service'

const app = express()

app.post('/create', authenticate, (req, res) => {
	const { roomId } = req.body, request: PortalRequest = { roomId, recievedAt: Date.now() }
	pushQueue(request)

	res.send(request)
})

app.delete('/:id', authenticate, (req, res) => {
	const { id: portalId } = req.params
	closePortal(portalId)

	res.sendStatus(200)
})

export default app
