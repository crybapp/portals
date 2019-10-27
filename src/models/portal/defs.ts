import { Document } from 'mongoose'

import { PortalStatus } from '.'

export default interface IPortal {
    info: {
        id: string
        createdAt: number
        recievedAt: number

        room: string
        server?: string

        status: PortalStatus
    }
}

export interface IStoredPortal extends IPortal, Document {}
