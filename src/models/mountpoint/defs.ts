import { Document } from 'mongoose'

export default interface IMountpoint {
		info: {
				name: string
				room: string
				id: number
				portalId: string
				janusId: number

				createdAt: number
				receivedAt: number
		}
		stream: {
				janusIp: string
				audioport: number
				audiortcpport: number
				videoport: number
				videortcpport: number
		}
}

export interface IStoredMountpoint extends IMountpoint, Document {}
