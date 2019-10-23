import axios from 'axios'
import { sign } from 'jsonwebtoken'

import Server, { ServerResolvable } from '../server'

import PortalRequest from '../request/defs'

import IPortal from './defs'
import StoredPortal from '../../schemas/portal.schema'

import config from '../../config/defaults'
import StoredServer from '../../schemas/server.schema'

import { openServerInstance } from '../../drivers/router'

import { generateFlake } from '../../utils/generate.utils'
import { extractServerId } from '../../utils/helpers.utils'
import { createPubSubClient } from '../../config/redis.config'

const pub = createPubSubClient()

export type PortalStatus = 'open' | 'starting' | 'in-queue' | 'closed' | 'error'
export type PortalResolvable = Portal | string

export default class Portal {
    id: string
    createdAt: number
    recievedAt: number

    room: string
    server?: ServerResolvable
    
    status: PortalStatus

    constructor(json?: IPortal) {
        if(!json) return

        this.setup(json)
    }

    load = (id: string) => new Promise<Portal>(async (resolve, reject) => {
        try {
            const doc = await StoredPortal.findOne({ 'info.id': id })
            if(!doc) throw 'PortalNotFound'

            this.setup(doc)

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    create = (request: PortalRequest) => new Promise<Portal>(async (resolve, reject) => {
        try {
            const { roomId, recievedAt } = request

            const json: IPortal = {
                info: {
                    id: generateFlake(),
                    createdAt: Date.now(),
                    recievedAt,

                    room: roomId,
                    status: 'in-queue'
                }
            }

            const stored = new StoredPortal(json)
            await stored.save()

            this.setup(json)
            
            const serverDoc = await StoredServer.findOne({ 'info.portal': { $exists: false } })
            if(serverDoc) {
                const server = new Server(serverDoc)
                console.log('Assigning portal to server', server.id)
                await server.assign(this)
            } else if(config.dynamic_vms_enabled)
                openServerInstance()
            else console.log('Could not assign portal to server')

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    destroy = (error?: string) => new Promise(async (resolve, reject) => {
        try {
            if(this.server) {
                const serverId = extractServerId(this.server)

                let server: Server
                if(typeof this.server === 'string')
                    server = await new Server().load(serverId)
                else
                    server = this.server

                await server.unassign()
            }

            await StoredPortal.deleteOne({
                'info.id': this.id
            })

            const { id } = this, message = { op: 0, d: { id }, t: 'PORTAL_DESTROY' }
            pub.publish('portals', JSON.stringify(message))

            resolve()
        } catch(error) {
            reject(error)
        }
    })

    updateStatus = async (status: PortalStatus) => new Promise<Portal>(async (resolve, reject) => {
        try {
            await StoredPortal.updateOne({
                'info.id': this.id
            }, {
                $set: {
                    'info.status': status
                }
            })

            /**
             * Update API on status of portal
             */
            await axios.put(`${process.env.API_URL}/internal/portal`, { id: this.id, status }, {
                headers: {
                    authorization: `Valve ${sign({}, process.env.API_KEY)}`
                }
            })

            this.status = status

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    setup = (json: IPortal) => {
        this.id = json.info.id
        this.createdAt = json.info.createdAt
        this.recievedAt = json.info.recievedAt

        this.room = json.info.room
        this.status = json.info.status

        this.server = json.info.server
    }
}
