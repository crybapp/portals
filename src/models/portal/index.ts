import axios from 'axios'
import { sign } from 'jsonwebtoken'

import PortalRequest from '../request/defs'

import IPortal from './defs'
import StoredPortal from '../../schemas/portal.schema'

import { generateFlake } from '../../utils/generate.utils'
import { createPubSubClient } from '../../config/redis.config'

const pub = createPubSubClient()

export type PortalStatus = 'connected' | 'starting' | 'in-queue' | 'waiting' | 'closed' | 'error'
export type PortalResolvable = Portal | string

export default class Portal {
    id: string
    createdAt: number
    recievedAt: number

    room: string
    server?: string
    
    status: PortalStatus

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
                    status: 'starting'
                }
            }

            const stored = new StoredPortal(json)
            await stored.save()

            this.setup(json)

            /**
             * Inform API of new portal with room id
             */
            await axios.post(`${process.env.API_URL}/internal/portal`, { id: this.id, roomId }, {
                headers: {
                    authorization: `Valve ${sign({}, process.env.API_KEY)}`
                }
            })

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    destroy = (error?: string) => new Promise(async (resolve, reject) => {
        try {
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
