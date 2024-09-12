import StoredMountpoint from '../../schemas/mountpoint.schema'
import { generateFlake } from '../../utils/generate.utils'
import Portal from '../portal'
import IMountpoint from './defs'

export type LoadType = 'Id' | 'Name' | 'Room' | 'Portal'

export default class Mountpoint {
	public name: string
	public room: string
	public id: number
	public portalId: string
	public janusId: number
	public createdAt: number
	public receivedAt: number
	public janusIp: string
	public audioport: number
	public audiortcpport: number
	public videoport: number
	public videortcpport: number

	public load = (type: LoadType, loadArg: any) => new Promise<Mountpoint>(async (resolve, reject) => {
		let searchObj
		switch (type) {
			case 'Id':  {
				searchObj = {'info.id': loadArg}
				break
			}
			case 'Name': {
				searchObj = {'info.name': loadArg}
				break
			}
			case 'Room': {
				searchObj = {'info.room': loadArg}
				break
			}
			case 'Portal': {
				searchObj = {'info.portalId': loadArg}
			}
		}

		try {
			const doc = await StoredMountpoint.findOne(searchObj)
			if (!doc) throw new Error('Mountpoint Not Found')

			this.setup(doc)

			resolve(this)
		} catch (error) {
			reject(error)
		}
	})

	public create = (portal: Portal) => new Promise<Mountpoint>(async (resolve, reject) => {
		try {
			const json: IMountpoint = {
				info: {
					id: generateFlake(),
					name: `portalGateway-${portal.room}`,
					room: portal.room,
					portalId: portal.id,
					janusId: -1,

					createdAt: Date.now(),
					receivedAt: portal.recievedAt
				},
				stream: {
					janusIp: '0.0.0.0',
					audioport: 0,
					audiortcpport: 0,
					videoport: 0,
					videortcpport: 0
				}
			}

			const stored = new StoredMountpoint(json)
			await stored.save()

			this.setup(json)

			resolve(this)
		} catch (error) {
			reject(error)
		}
	})

	public destroy = (error?: string) => new Promise(async (resolve, reject) => {
		try {
			await StoredMountpoint.deleteOne({
				'info.id': this.id
			})

			resolve()
		} catch (error) {
			reject(error)
		}
	})

	public updateStreamInfo = (
		janusId: number,
		janusIp: string,
		audioport: number,
		audiortcpport: number,
		videoport: number,
		videortcpport: number
	) =>
		new Promise<Mountpoint>(async (resolve, reject) => {
			try {
				await StoredMountpoint.updateOne({
					'info.id': this.id
				},
				{
					$set: {
						'info.janusId': janusId,
						'stream.janusIp': janusIp,
						'stream.audioport': audioport,
						'stream.audiortcpport': audiortcpport,
						'stream.videoport': videoport,
						'stream.videortcpport': videortcpport
					}
				})

				this.janusId = janusId
				this.janusIp = janusIp
				this.audioport = audioport
				this.audiortcpport = audiortcpport
				this.videoport = videoport
				this.videortcpport = videortcpport

				resolve(this)
			} catch (error) {
				reject(error)
			}
		}
	)

	public setup = (json: IMountpoint) => {
		this.id = json.info.id
		this.name = json.info.name
		this.room = json.info.room
		this.portalId = json.info.portalId
		this.janusId = json.info.janusId

		this.createdAt = json.info.createdAt
		this.receivedAt = json.info.receivedAt

		this.janusIp = json.stream.janusIp
		this.audioport = json.stream.audioport
		this.audiortcpport = json.stream.audiortcpport
		this.videoport = json.stream.videoport
		this.videortcpport = json.stream.videortcpport
	}
}
