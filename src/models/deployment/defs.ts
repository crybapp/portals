import { Document } from 'mongoose'

import { Driver } from '../../drivers/router'

export type DeploymentStatus = 'ready' | 'in-use' | 'creating'

export default interface IDeployment {
    info: {
        id: string
        deployedAt: number

        status: DeploymentStatus

        server?: string
        provider: Driver
    }
    data: {
        name: string
    }
}

export interface IStoredDeployment extends IDeployment, Document {}
