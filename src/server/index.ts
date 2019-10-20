require('dotenv').config()

import { createServer } from 'http'

import express, { json } from 'express'
import morgan from 'morgan'
import { Server } from 'ws'

import { connect } from 'mongoose'

import routes from './routes'
import websocket from './websocket'

import { verify_env } from '../utils/verifications.utils'

verify_env('API_URL', 'API_KEY', 'PORTAL_KEY', 'MONGO_URI')

const app = express()
const server = createServer(app)
const wss = new Server({ server })

connect(process.env.MONGO_URI, { useNewUrlParser: true })

app.use(json())
app.use(morgan('dev'))

routes(app)
websocket(wss)

export default server
