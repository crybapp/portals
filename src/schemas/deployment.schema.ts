import { Schema, model } from 'mongoose'

import { IStoredDeployment } from '../models/deployment/defs'

const DeploymentSchema = new Schema({
    info: {
        id: String,
        deployedAt: Number,

        status: String,

        server: String,
        provider: String
    },
    data: {
        name: String
    }
})

const StoredDeployment = model<IStoredDeployment>('Deployment', DeploymentSchema)
export default StoredDeployment
