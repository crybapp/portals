import { CoreV1Api, V1Node, V1Pod } from '@kubernetes/client-node'

import Portal from '../models/portal'

import { createClient } from '../config/providers/kubernetes.config'
import { IPortalDriver } from './IPortalDriver'

type Nodemap = {
	[key in string]: number
}

export class KubernetesDriver implements IPortalDriver {
	public driverName = "kubernetes"

	private getNodemap = (nodes: V1Node[]) => {
		const map: Nodemap = {}
	
		nodes.forEach(node =>
			map[node.metadata.name] ? map[node.metadata.name] += 1 : map[node.metadata.name] = 1
		)

		nodes.forEach(({ metadata: { name } }) => {
			if (map[name] >= parseInt(process.env.PORTAL_NODE_LIMIT))
				delete map[name]
		})
	
		return map
	}
	
	public isSpaceAvailable = async () => !!(await this.fetchAvailableNode())
	
	public fetchAvailableNode = (client?: CoreV1Api) => new Promise<V1Node>(async (resolve, reject) => {
		if (!client) client = createClient()
		if (!client) throw new Error('The Kubernetes driver configuration is incorrect. This may be due to improper ENV variables, please check')
	
		try {
			const { body: nodes } = await client.listNode()
	
			const nodeMap = this.getNodemap(nodes.items)
			if (Object.keys(nodeMap).length === 0)
				resolve(null)
	
			const recommendedNodeName = Object.keys(nodeMap).reduce((a, b) =>
				nodeMap[a] < nodeMap[b] ? a : b
			), recommendedNode = nodes.items.find(node =>
				node.metadata.name === recommendedNodeName
			)
	
			resolve(recommendedNode)
		} catch (error) {
			reject(error)
		}
	})
	
	public createPortal = (portal: Portal) => new Promise(async (resolve, reject) => {
		const client = createClient()
		if (!client) throw new Error('The Kubernetes driver configuration is incorrect. This may be due to improper ENV variables, please check')
	
		const name = `portal-${portal.id}`
	
		try {
			const _pod = {
				apiVersion: 'v1',
				kind: 'Pod',
				metadata: {
					name,
					labels: {
						name,
						kind: 'portal'
					},
					namespace: 'portals'
				},
				spec: {
					volumes: [{
						name: 'dshm',
						emptyDir: {
							medium: 'Memory'
						}
					}],
					containers: [
						{
							name,
							image: process.env.K8S_PORTAL_IMAGE_REGISTRY_URL,
							resources: {
								limits: {
									cpu: process.env.K8S_PORTAL_CPU_LIMIT,
									memory: process.env.K8S_PORTAL_MEMORY_LIMIT
								},
								requests: {
									cpu: process.env.K8S_PORTAL_CPU_REQUESTED,
									memory: process.env.K8S_PORTAL_MEMORY_REQUESTED
								}
							},
							volumeMounts: [{
								mountPath: '/dev/shm',
								name: 'dshm'
							}],
							imagePullPolicy: 'Always',
							envFrom: [{
								secretRef: { name: process.env.K8S_PORTAL_ENV_SECRET }
							}],
							ports: [{ containerPort: 80 }],
							args: ['--portalId', portal.id]
						}
					],
					imagePullSecrets: [{ name: process.env.K8S_PORTAL_IMAGE_PULL_SECRET }]
				}
			} as V1Pod, { body: pod } = await client.createNamespacedPod('portals', _pod)
	
			console.log(`opened portal with name ${pod.metadata.name} in namespace ${pod.metadata.namespace}`)
			resolve()
		} catch (error) {
			reject(error)
			console.error('error while opening portal', error.response ? error.response.body : error)
		}
	})
	
	public destroyPortal = async (portal: Portal) => {
		const client = createClient()
		if (!client) throw new Error('The Kubernetes driver is incorrect. This may be due to improper ENV variables, please try again')
	
		const podName = `portal-${portal.id}`
	
		try {
			const { body: status } = await client.deleteNamespacedPod(podName, 'portals')
	
			console.log(`closed portal with name ${podName}`)
		} catch (error) {
			console.error('error while closing portal', error.response ? error.response.body : error)
		}
	}
	
}
