import { Document } from 'mongoose'

export default interface IMountpoint {
    info: {
        name: string
        room: string
        id: number
        portalId: number

        createdAt: number
        receivedAt: number
    }
    stream: {
        audioport: number
        videoport: number
    }
}

export interface IStoredMountpoint extends IMountpoint, Document {}