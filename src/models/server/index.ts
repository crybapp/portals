import Portal, { PortalResolvable } from '../portal'

import IServer from './defs'
import StoredServer from '../../schemas/server.schema'

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

            if(this.portal) {
                const portalId = extractPortalId(this.portal),
                        portal = await new Portal().load(portalId)

                portal.updateStatus('closed')
            }

            resolve()
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
