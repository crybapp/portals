import { Schema, model } from 'mongoose'

import { IStoredPortal } from '../models/portal/defs'

const PortalSchema = new Schema({
    info: {
        id: String,
        createdAt: Number,
        recievedAt: Number,

        room: String,
        server: String,
        
        status: String
    }
})

const StoredPortal = model<IStoredPortal>('Portal', PortalSchema)
export default StoredPortal
