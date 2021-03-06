import { model, Schema } from 'mongoose'
import { IStoredMountpoint } from '../models/mountpoint/defs'

const ModelSchema = new Schema({
		info: {
				name: String,
				room: String,
				id: Number,
				portalId: Number,
				janusId: Number,
				janusIp: String,

				createdAt: Number,
				receivedAt: Number
		},
		stream: {
				audioport: Number,
				videoport: Number
		}
})

const StoredMountpoint = model<IStoredMountpoint>('Mountpoint', ModelSchema)
export default StoredMountpoint
