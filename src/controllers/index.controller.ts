import express from 'express'

import authenticate from '../server/middleware/authenticate.middleware'
import Services from '../services/serviceManager.service'
import Portal from '../models/portal'

const app = express()

app.post('/create', authenticate, async (req, res) => {
	const { roomId } = req.body

	const portal = await new Portal().loadByRoomID(roomId)
	if(portal) {
		res.sendStatus(202)
		return
	}
	
	const positionInQueue = await Services.queueService.queueNewPortalRequest(roomId)
	res.status(200).send({queuePosition: positionInQueue})
})

app.delete('/:id', authenticate, (req, res) => {
	const { id: portalId } = req.params
	Services.portalManager.closePortal(portalId)

	res.sendStatus(200)
})

export default app
