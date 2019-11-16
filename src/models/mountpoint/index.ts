import IMountpoint from './defs'
import StoredMountpoint from '../../schemas/mountpoint.schema'
import Portal from '../portal'
import { generateFlake } from '../../utils/generate.utils'

export type LoadType = 'Id' | 'Name' | 'Room' | 'Portal'

export default class Mountpoint {
    name: string
    room: string
    id: number
    portalId: number
    janusId: number
    createdAt: number
    receivedAt: number
    audioport: number
    videoport: number

    load = (type: LoadType, loadArg: any) => new Promise<Mountpoint>(async (resolve, reject) => {
        var searchObj
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
            if(!doc) throw 'Mountpoint Not Found'

            this.setup(doc)

            resolve(this)
        } catch (error) {
            reject(error)
        }
    })

    create = (portal: Portal) => new Promise<Mountpoint>(async (resolve, reject) => {
        try {
            const json: IMountpoint = {
                info: {
                    id: generateFlake(),
                    name: `portalGateway-${portal.room}`,
                    room: portal.room,
                    portalId: +portal.id,
                    janusId: -1,
    
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
        } catch(error) {
            reject(error)
        }
    })

    destroy = (error?: string) => new Promise(async (resolve, reject) => {
        try {
            await StoredMountpoint.deleteOne({
                'info.id': this.id
            })

            resolve()
        } catch (error) {
            reject(error)
        }
    })

    updateStreamInfo = (janusId: number, audioport: number, videoport: number) => new Promise<Mountpoint>(async (resolve, reject) => {
        try {
            console.log(janusId)
            await StoredMountpoint.updateOne({
                'info.id': this.id
            },
            {
                $set:{
                    'info.janusId':janusId,
                    'stream.audioport':audioport,
                    'stream.videoport':videoport
                }
            })

            this.audioport = audioport
            this.videoport = videoport

            resolve(this)
        } catch(error) {
            reject(error)
        }
    })

    setup = (json: IMountpoint) => {
        this.id = json.info.id
        this.name = json.info.name
        this.room = json.info.room
        this.portalId = json.info.portalId
        this.janusId = json.info.janusId

        this.createdAt = json.info.createdAt
        this.receivedAt = json.info.receivedAt

        this.audioport = json.stream.audioport
        this.videoport = json.stream.videoport 
    }

}