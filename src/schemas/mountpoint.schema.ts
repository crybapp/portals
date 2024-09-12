import { model, Schema } from 'mongoose'
import { IStoredMountpoint } from '../models/mountpoint/defs'

const ModelSchema = new Schema({
		info: {
				name: String,
				room: String,
				id: Number,
				portalId: String,
				janusId: Number,

				createdAt: Number,
				receivedAt: Number
		},
		stream: {
				janusIp: String,
				audioport: Number,
				audiortcpport: Number,
				videoport: Number,
				videortcpport: Number,
		}
})

const StoredMountpoint = model<IStoredMountpoint>('Mountpoint', ModelSchema)
export default StoredMountpoint
