import { KubeConfig, CoreV1Api } from '@kubernetes/client-node'

export const createClient = () => {
    const config = new KubeConfig()

    if(process.env.NODE_ENV === 'production')
        config.loadFromCluster()
    else
        config.loadFromDefault()
    
    const api = config.makeApiClient(CoreV1Api)
    return api
}