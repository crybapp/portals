import express from 'express'

import PortalRequest from '../models/request/defs'

import Services from '../services/ServiceManager.service'
import authenticate from '../server/middleware/authenticate.middleware'

const app = express()

app.post('/create', authenticate, async (req, res) => {
	const { roomId } = req.body
	const positionInQueue = await Services.queueService.queueNewPortalRequest(roomId)

	res.send(positionInQueue)
})

app.delete('/:id', authenticate, (req, res) => {
	const { id: portalId } = req.params
	Services.portalManager.closePortal(portalId)

	res.sendStatus(200)
})

export default app
