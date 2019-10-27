import { Document } from 'mongoose'

export default interface IServer {
    info: {
        id: string
        connectedAt: number

        portal?: string
    }
}

export interface IStoredServer extends IServer, Document {}
