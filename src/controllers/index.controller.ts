import express from 'express'

import authenticate from '../server/middleware/authenticate.middleware'
import Services from '../services/serviceManager.service'

const app = express()

app.post('/create', authenticate, async (req, res) => {
	const { roomId } = req.body,
		positionInQueue = await Services.queueService.queueNewPortalRequest(roomId)

	res.send(positionInQueue)
})

app.delete('/:id', authenticate, (req, res) => {
	const { id: portalId } = req.params
	Services.portalManager.closePortal(portalId)

	res.sendStatus(200)
})

export default app
