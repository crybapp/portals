import express from 'express'

import authenticate from '../server/middleware/authenticate.middleware'
import Services from '../services/serviceManager.service'
import Portal from '../models/portal'

const app = express()

app.post('/create', authenticate, async (req, res) => {
	const { roomId } = req.body

	const portal = await new Portal().loadByRoomID(roomId)
	if (portal)
		return res.sendStatus(202)

	const positionInQueue = await Services.queueService.queueNewPortalRequest(roomId)
	res.status(200).send({ 
		currentPositionInQueue: positionInQueue, 
		currentQueueLength: positionInQueue, 
		dequeuedLength: 0  
	})
})

app.delete('/:id', authenticate, async (req, res) => {
	const { id: portalId } = req.params
	await Services.portalManager.closePortal(portalId)

	res.sendStatus(200)
})

export default app
