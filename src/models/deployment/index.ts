import IDeployment, { DeploymentStatus } from './defs'
import StoredDeployment from '../../schemas/deployment.schema'

import Server, { ServerResolvable } from '../server'

import { Driver } from '../../drivers/router'
import { generateFlake } from '../../utils/generate.utils'
import { extractServerId } from '../../utils/helpers.utils'

export type DeploymentResolvable = Deployment | string

export default class Deployment {
    id: string
    deployedAt: number

    status: DeploymentStatus

    server?: ServerResolvable
    provider: Driver

    name: string

    constructor(json?: IDeployment) {
        if(!json) return

        this.setup(json)
    }

    load = (id: string) => new Promise<Deployment>(async (resolve, reject) => {
        try {
            const doc = await StoredDeployment.findOne({ 'info.id': id })
            if(!doc) throw 'DeploymentNotFound'

            this.setup(doc)

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    findByName = (name: string) => new Promise<Deployment>(async (resolve, reject) => {
        try {
            const doc = await StoredDeployment.findOne({ 'data.name': name })
            if(!doc) throw 'DeploymentNotFound'

            this.setup(doc)

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    create = (name: string, provider: Driver) => new Promise<Deployment>(async (resolve, reject) => {
        try {
            const json: IDeployment = {
                info: {
                    id: generateFlake(),
                    deployedAt: Date.now(),

                    status: 'creating',

                    provider
                },
                data: {
                    name
                }
            }

            const stored = new StoredDeployment()
            await stored.save()

            this.setup(json)

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    destroy = () => new Promise(async (resolve, reject) => {
        try {
            if(this.server) {
                let server: Server

                if(typeof this.server === 'string')
                    server = await new Server().load(this.server)
                else
                    server = this.server

                await server.destroy()
            }

            await StoredDeployment.deleteOne({
                'info.id': this.id
            })

            resolve()
        } catch(error) {
            reject(error)
        }
    })
    
    assignServer = (server: ServerResolvable) => new Promise<Deployment>(async (resolve, reject) => {
        try {
            await StoredDeployment.updateOne({
                'info.id': this.id
            }, {
                'info.server': extractServerId(server)
            })

            this.server = server

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    updateStatus = (status: DeploymentStatus) => new Promise<Deployment>(async (resolve, reject) => {
        try {
            await StoredDeployment.updateOne({
                'info.id': this.id
            }, {
                'info.status': status
            })

            this.status = status

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    setup = (json: IDeployment) => {
        this.id = json.info.id
        this.deployedAt = json.info.deployedAt

        this.status = json.info.status
 
        if(json.info.server) this.server = json.info.server
        this.provider = json.info.provider

        this.name = json.data.name
    }
}