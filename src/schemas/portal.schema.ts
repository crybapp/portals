import { model, Schema } from 'mongoose'

import { IStoredPortal } from '../models/portal/defs'

const ModelSchema = new Schema({
	info: {
		id: String,
		createdAt: Number,
		recievedAt: Number,

		room: String,
		status: String
	},
	data: {
		serverId: String
	}
})

const StoredPortal = model<IStoredPortal>('Portal', ModelSchema)
export default StoredPortal
