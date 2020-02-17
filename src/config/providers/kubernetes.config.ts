import { CoreV1Api, KubeConfig } from '@kubernetes/client-node'

export const createClient = () => {
	const config = new KubeConfig()

	if (process.env.NODE_ENV === 'production')
		config.loadFromCluster()
	else
		config.loadFromDefault()

	return config.makeApiClient(CoreV1Api)
}
