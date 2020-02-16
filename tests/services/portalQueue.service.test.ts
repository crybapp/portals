process.env.REDIS_URI = 'redis://127.0.0.1:6379'
process.env.UNIT_TESTING = 'true'
import { QueueService } from '../../src/services/PortalQueue.service'
import * as chai from 'chai'
import 'mocha'
import client from '../../src/config/redis.config'
import PortalRequest from '../../src/models/request/defs'
import IPortal from '../../src/models/portal/defs'

const emptyCreationFunc = (portalRequest: PortalRequest) => new Promise<IPortal>((resolve) => {
    resolve(null)
})

describe('queueNewPortalRequest', () => {
    it('Should return position in queue', async () => {
        const queueService = new QueueService(emptyCreationFunc)

        return queueService.queueNewPortalRequest('123')
            .then(result => {
                chai.expect(result).equals(1)
                client.del(queueService["queueChannel"])
            }
        )
    })
    it('Key should exist in redis', () => {
        const queueService = new QueueService(emptyCreationFunc)
        
        return queueService.queueNewPortalRequest('123')
            .then(async () => {
                const result = await client.lpop(queueService["queueChannel"])
                const portalResult: PortalRequest = JSON.parse(result)
                chai.expect(portalResult.roomId).equals('123')
                client.del(queueService["queueChannel"])
            })
    })
    it('Keys should retain order', async () => {
        const queueService = new QueueService(emptyCreationFunc)

        for(let i = 0; i < 10; i++) {
            queueService.queueNewPortalRequest(i.toString())
        }
        const redisList = await client.lrange(queueService["queueChannel"], 0, 9)
        let lastDate = new Date(0)
        redisList.forEach((value, index) => {
            const requestObject = JSON.parse(value) as PortalRequest
            chai.expect(requestObject.roomId).equals(index.toString())
            chai.expect(requestObject.receivedAt).gte(lastDate.getTime())
            lastDate = new Date(requestObject.receivedAt)
        })

        client.del(queueService["queueChannel"])
    })
})

describe('getQueueLength', () => {
    it('length: 1', async () => {
        const queueService = new QueueService(emptyCreationFunc)
        
        queueService.queueNewPortalRequest('1')
        const length = await queueService["getQueueLength"]()

        chai.expect(length).equals(1)
        client.del(queueService["queueChannel"])
    })
    it('length: 10', async () => {
        const queueService = new QueueService(emptyCreationFunc)

        for(let i = 0; i < 10; i ++) {
            queueService.queueNewPortalRequest(i.toString())
        }

        const length = await queueService["getQueueLength"]()
        chai.expect(length).equals(10)
        client.del(queueService["queueChannel"])
    })
    it('length: 100', async () => {
        const queueService = new QueueService(emptyCreationFunc)

        for(let i = 0; i < 100; i ++) {
            queueService.queueNewPortalRequest(i.toString())
        }

        const length = await queueService["getQueueLength"]()
        chai.expect(length).equals(100)
        client.del(queueService["queueChannel"])
    })
    it.skip('length: 100000', async () => {
        const queueService = new QueueService(emptyCreationFunc)
        
        for(let i = 0; i < 100000; i ++) {
            queueService.queueNewPortalRequest(i.toString())
        }

        const length = await queueService["getQueueLength"]()
        chai.expect(length).equals(100000)
        client.del(queueService["queueChannel"])
    })
})

describe('getNextPortalRequest', () => {
    it('1 queued portal', async () => {
        const queueService = new QueueService(emptyCreationFunc)
        queueService.queueNewPortalRequest('123')
        const receivedRequest = await queueService["getNextPortalRequest"]()

        chai.expect(receivedRequest.roomId).equals('123')
        client.del(queueService["queueChannel"])
    })
    it('10 queued portals', async () => {
        const queueService = new QueueService(emptyCreationFunc)
        
        for(let i = 0; i < 10; i++) {
            queueService.queueNewPortalRequest(i.toString())
        }
        for(let i = 0; i < 10; i++) {
            const receivedRequest = await queueService["getNextPortalRequest"]()
            chai.expect(receivedRequest.roomId).equals(i.toString())
        }

        client.del(queueService["queueChannel"])
    })
    it('Queue after 500ms', async () => {
        const queueService = new QueueService(emptyCreationFunc)

        const startTime = Date.now()
        queueService["getNextPortalRequest"]()
            .then((result) => {
                chai.expect(Date.now() - startTime).gte(500)
                chai.expect(result.roomId).equals('123')
                client.del(queueService["queueChannel"])
            })
        setTimeout(() => {
            queueService.queueNewPortalRequest('123')
        }, 500)
    })
})

describe('waitUntilAvailable', () => {
    it('Wait for 500ms', async () => {
        let availabilityFn = () => new Promise<Boolean>(async (resolve) =>{
            setTimeout(() => resolve(true), 500)
        })
        
        const queueService = new QueueService(emptyCreationFunc, availabilityFn)
        const startTime = Date.now()
        await queueService["waitForAvailability"]()
        chai.expect(Date.now() - startTime).gte(500)
        client.del(queueService["queueChannel"])
    })
})

describe('start', () => {
    const availabilityFn = () => new Promise<Boolean>(async (resolve) => {
        resolve(true)
    })

    it('start handles queue item', () => {
        const queueService = new QueueService(
            (request: PortalRequest) => new Promise(async (resolve) => {
                chai.expect(request.roomId).equals('123')
                resolve(true)
                queueService.close()
            }), availabilityFn
        )

        queueService.start()
        queueService.queueNewPortalRequest('123')
    })
})