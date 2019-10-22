import Portal, { PortalResolvable } from '../portal'

import IServer from './defs'
import StoredServer from '../../schemas/server.schema'

import StoredPortal from '../../schemas/portal.schema'

import client from '../../config/redis.config'
import { generateFlake } from '../../utils/generate.utils'
import { extractPortalId } from '../../utils/helpers.utils'

export default class Server {
    id: string
    connectedAt: number

    portal: PortalResolvable

    constructor(json?: IServer) {
        if(!json) return

        this.setup(json)
    }

    load = (id: string) => new Promise<Server>(async (resolve, reject) => {
        try {
            const doc = await StoredServer.findOne({ 'info.id': id })
            if(!doc) return reject('ServerNotFound')

            this.setup(doc)

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    create = () => new Promise<Server>(async (resolve, reject) => {
        try {
            const id = generateFlake(),
                    json: IServer = {
                        info: {
                            id,
                            connectedAt: Date.now()
                        }
                    }

            const stored = new StoredServer(json)
            await stored.save()

            client.sadd('servers', id)

            this.setup(json)

            const portalDoc = await StoredPortal.findOne({ 'info.server': { $exists: false } })
            if(portalDoc) {
                const portal = new Portal(portalDoc)
                this.assign(portal)
            }

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    destroy = () => new Promise(async (resolve, reject) => {
        try {
            await StoredServer.deleteOne({
                'info.id': this.id
            })

            client.srem('servers', this.id)

            if(this.portal)
                await this.unassign()

            resolve()
        } catch(error) {
            reject(error)
        }
    })

    assign = (portal: PortalResolvable) => new Promise<Server>(async (resolve, reject) => {
        if(this.portal) return reject('PortalAlreadyAssigned')

        const portalId = extractPortalId(portal)

        try {

            await StoredServer.updateOne({
                'info.id': this.id
            }, {
                $set: {
                    'info.portal': extractPortalId(portal)
                }
            })

            await StoredPortal.updateOne({
                'info.id': portalId
            }, {
                $set: {
                    'info.server': this.id
                }
            })

            if(typeof portal !== 'string')
                portal.updateStatus('open')

            this.portal = portal

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    unassign = () => new Promise<Server>(async (resolve, reject) => {
        if(!this.portal) return reject('NoPortalAssigned')

        const portalId = extractPortalId(this.portal)
        
        try {
            await StoredServer.updateOne({
                'info.id': this.id
            }, {
                $unset: {
                    'info.portal': ''
                }
            })

            await StoredPortal.updateOne({
                'info.id': portalId
            }, {
                $unset: {
                    'info.server': ''
                }
            })

            let portal: Portal
            if(typeof this.portal === 'string')
                portal = await new Portal().load(portalId)
            else
                portal = this.portal

            if(portal)
                portal.updateStatus('in-queue')

            delete this.portal

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    setup = (json: IServer) => {
        this.id = json.info.id
        this.connectedAt = json.info.connectedAt

        this.portal = json.info.portal
    }
}
