import Redis from 'ioredis'

interface Sentinel {
    host: string
    port: number
}

const parseSentinels = (sentinels: string) =>
        sentinels.split(',').map(uri => ({
            host: uri.split(':')[1].replace('//', ''),
            port: parseInt(uri.split(':')[2])
        } as Sentinel)), // Parse sentinels from process env
        getOptions = () => { // Get Options Method
            return { sentinels: parseSentinels(process.env.REDIS_URI), name: 'mymaster' } as Redis.RedisOptions
        }

export const createPubSubClient = () => new Redis(getOptions())

export default new Redis(getOptions())
