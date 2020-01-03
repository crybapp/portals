import dotenv from 'dotenv'
dotenv.config()

import { createServer } from 'http'

import express, { json } from 'express'
import morgan from 'morgan'
import { Server } from 'ws'

import { connect } from 'mongoose'

import routes from './routes'
import websocket from './websocket'

import { verifyEnv } from '../utils/verifications.utils'

verifyEnv('API_URL', 'API_KEY', 'PORTAL_KEY', 'MONGO_URI')

const app = express()
const server = createServer(app)
const wss = new Server({ server })

connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(json())
app.use(morgan('dev'))

routes(app)
websocket(wss)

export default server
