import axios from 'axios'
import { sign } from 'jsonwebtoken'

import PortalRequest from '../queue/defs'

import StoredPortal from '../../schemas/portal.schema'
import IPortal from './defs'

import { createRedisClient } from '../../config/redis.config'
import { generateFlake } from '../../utils/generate.utils'
import Mountpoint from '../mountpoint'

const pub = createRedisClient()

export type PortalStatus = 'waiting' | 'requested' | 'in-queue' | 'creating' | 'starting' | 'open' | 'closed' | 'error'

export default class Portal {
		public id: string
		public createdAt: number
		public recievedAt: number

		public serverId: string

		public status: PortalStatus

		public room: string

		public load = (id: string) => new Promise<Portal>(async (resolve, reject) => {
				try {
						const doc = await StoredPortal.findOne({ 'info.id': id })
						if (!doc)
							throw new Error('PortalNotFound')

						this.setup(doc)

						resolve(this)
				} catch (error) {
						reject(error)
				}
		})

		public loadByRoomID = (roomId: string) => new Promise<Portal>(async (resolve, reject) => {
				try {
						const doc = await StoredPortal.findOne({ 'info.room': roomId })
						if (!doc)
							resolve(null)

						this.setup(doc)

						resolve(this)
				} catch(error) {
						reject(error)
				}
		})

		public create = (request: PortalRequest) => new Promise<Portal>(async (resolve, reject) => {
				try {
						const { roomId, receivedAt: recievedAt } = request

						const json: IPortal = {
								info: {
										id: generateFlake(),
										createdAt: Date.now(),
										recievedAt,

										room: roomId,
										status: 'creating'
								},
								data: {}
						}

						const stored = new StoredPortal(json)
						await stored.save()

						this.setup(json)

						/*
             			 * Inform API of new portal with room id
             			 */
						await axios.post(`${process.env.API_URL}/internal/portal`, { id: this.id, roomId }, {
								headers: {
										authorization: `Valve ${sign({}, process.env.API_KEY)}`
								}
						})

						resolve(this)
				} catch (error) {
						reject(error)
				}
		})

		public destroy = (error?: string) => new Promise(async (resolve, reject) => {
				try {
						await StoredPortal.deleteOne({
								'info.id': this.id
						})

						const { id } = this, message = { op: 0, d: { id }, t: 'PORTAL_DESTROY' }
						pub.publish('portals', JSON.stringify(message))

						resolve()
				} catch (error) {
						reject(error)
				}
		})

		public updateStatus = async (status: PortalStatus) => new Promise<Portal>(async (resolve, reject) => {
				try {
						await StoredPortal.updateOne({
								'info.id': this.id
						}, {
								$set: {
										'info.status': status
								}
						})

						let janusId = -1
						let janusIp = '0.0.0.0'

						if (status === 'open' && process.env.ENABLE_JANUS === 'true') {
								const mountpoint = await new Mountpoint().load('Portal', this.id)
								janusId = mountpoint.janusId
								janusIp = mountpoint.janusIp

						}

						/*
						 * Update API on status of portal
						 */
						await axios.put(`${process.env.API_URL}/internal/portal`, { id: this.id, status, janusId, janusIp }, {
								headers: {
										authorization: `Valve ${sign({}, process.env.API_KEY)}`
								}
						})

						this.status = status

						resolve(this)
				} catch (error) {
						reject(error)
				}
		})

		public updateServerId = (serverId: string) => new Promise<Portal>(async (resolve, reject) => {
				try {
						await StoredPortal.updateOne({
								'info.id': this.id
						}, {
								$set: {
										'data.serverId': serverId
								}
						})

						this.serverId = serverId

						resolve(this)
				} catch (error) {
						reject(error)
				}
		})

		public setup = (json: IPortal) => {
				this.id = json.info.id
				this.createdAt = json.info.createdAt
				this.recievedAt = json.info.recievedAt

				this.room = json.info.room
				this.status = json.info.status

				if (json.data)
						if (json.data.serverId)
								this.serverId = json.data.serverId
		}
}
