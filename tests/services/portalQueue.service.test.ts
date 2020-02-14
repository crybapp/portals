process.env.REDIS_URI = 'redis://127.0.0.1:6379'
process.env.UNIT_TESTING = 'true'
import { QueueService } from '../../src/services/portalQueue.service'
import * as chai from 'chai'
import 'mocha'
import client from '../../src/config/redis.config'
import PortalRequest from '../../src/models/request/defs'
import IPortal from '../../src/models/portal/defs'


const queueService = new QueueService((PortalRequest) => new Promise<IPortal>((resolve) => {
    resolve(null)
}))

describe('queueNewPortalRequest', () => {
    it('Should return position in queue', async () => {
        client.del(queueService["queueChannel"])

        return queueService.queueNewPortalRequest('123')
            .then(result => {
                chai.expect(result).equals(1)
            }
        )
    })
    it('Key should exist in redis', () => {
        client.del(queueService["queueChannel"])
        
        return queueService.queueNewPortalRequest('123')
            .then(async () => {
                const result = await client.lpop(queueService["queueChannel"])
                const portalResult: PortalRequest = JSON.parse(result)
                chai.expect(portalResult.roomId).equals('123')
            })
    })
    it('Keys should retain order', async () => {
        client.del(queueService["queueChannel"])

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
    })
})

describe('getQueueLength', () => {
    it('length: 1', async () => {
        client.del(queueService["queueChannel"])
        queueService.queueNewPortalRequest('1')
        const length = await queueService["getQueueLength"]()
        chai.expect(length).equals(1)
    })
    it('length: 10', async () => {
        client.del(queueService["queueChannel"])
        for(let i = 0; i < 10; i ++) {
            queueService.queueNewPortalRequest(i.toString())
        }

        const length = await queueService["getQueueLength"]()
        chai.expect(length).equals(10)
    })
    it('length: 100', async () => {
        client.del(queueService["queueChannel"])
        for(let i = 0; i < 100; i ++) {
            queueService.queueNewPortalRequest(i.toString())
        }

        const length = await queueService["getQueueLength"]()
        chai.expect(length).equals(100)
    })
    it.skip('length: 100000', async () => {
        client.del(queueService["queueChannel"])
        for(let i = 0; i < 100000; i ++) {
            queueService.queueNewPortalRequest(i.toString())
        }

        const length = await queueService["getQueueLength"]()
        chai.expect(length).equals(100000)
    })
})

describe('getNextPortalRequest', () => {
    it('1 queued portal', async () => {
        client.del(queueService["queueChannel"])
        queueService.queueNewPortalRequest('123')
        const receivedRequest = await queueService["getNextPortalRequest"]()

        chai.expect(receivedRequest.roomId).equals('123')
    })
    it('10 queued portals', async () => {
        client.del(queueService["queueChannel"])
        for(let i = 0; i < 10; i++) {
            queueService.queueNewPortalRequest(i.toString())
        }
        for(let i = 0; i < 10; i++) {
            const receivedRequest = await queueService["getNextPortalRequest"]()
            chai.expect(receivedRequest.roomId).equals(i.toString())
        }
    })
    it('Queue after 500ms', async () => {
        client.del(queueService["queueChannel"])
        const startTime = Date.now()
        queueService["getNextPortalRequest"]()
            .then((result) => {
                chai.expect(Date.now() - startTime).gte(500)
                chai.expect(result.roomId).equals('123')
            })
        setTimeout(() => {
            queueService.queueNewPortalRequest('123')
        }, 500)
    })
})