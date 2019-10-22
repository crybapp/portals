import express from 'express'

import Portal from '../models/portal'
import PortalRequest from '../models/request/defs'

import authenticate from '../server/middleware/authenticate.middleware'

const app = express()

app.post('/create', authenticate, async (req, res) => {
    const { roomId } = req.body, request: PortalRequest = { roomId, recievedAt: Date.now() }

    try {
        const portal = await new Portal().create(request)

        res.send(portal)
    } catch(error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.delete('/:id', authenticate, async (req, res) => {
    const { id: portalId } = req.params
    console.log('recieved request to close portal', portalId)

    try {
        const portal = await new Portal().load(portalId)
        await portal.destroy()

        res.sendStatus(200)
    } catch(error) {
        console.error(error)
        res.sendStatus(500)
    }
})

export default app
