import StoredMountpoint from '../../schemas/mountpoint.schema'
import { generateFlake } from '../../utils/generate.utils'
import Portal from '../portal'
import IMountpoint from './defs'

export type LoadType = 'Id' | 'Name' | 'Room' | 'Portal'

export default class Mountpoint {
	public name: string
	public room: string
	public id: number
	public portalId: number
	public janusId: number
	public janusIp: string
	public createdAt: number
	public receivedAt: number
	public audioport: number
	public videoport: number

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
					portalId: +portal.id,
					janusId: -1,
					janusIp: '0.0.0.0',

					createdAt: Date.now(),
					receivedAt: portal.recievedAt
				},
				stream: {
					audioport: 0,
					videoport: 0
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

	public updateStreamInfo = (janusId: number, janusIp: string, audioport: number, videoport: number) =>
		new Promise<Mountpoint>(async (resolve, reject) => {
			try {
				console.log(janusId)
				await StoredMountpoint.updateOne({
					'info.id': this.id
				},
				{
					$set:{
						'info.janusId':janusId,
						'info.janusIp': janusIp,
						'stream.audioport':audioport,
						'stream.videoport':videoport
					}
				})

				this.audioport = audioport
				this.videoport = videoport

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
		this.janusIp = json.info.janusIp

		this.createdAt = json.info.createdAt
		this.receivedAt = json.info.receivedAt

		this.audioport = json.stream.audioport
		this.videoport = json.stream.videoport
	}

}
