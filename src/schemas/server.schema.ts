import { Schema, model } from 'mongoose'

import { IStoredServer } from '../models/server/defs'

const ServerSchema = new Schema({
    info: {
        id: String,
        connectedAt: Number,

        portal: String
    }
})

const StoredServer = model<IStoredServer>('Server', ServerSchema)
export default StoredServer
