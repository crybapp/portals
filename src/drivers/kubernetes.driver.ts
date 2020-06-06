import { V1Pod } from '@kubernetes/client-node'

import Portal from '../models/portal'

import { createClient } from '../config/providers/kubernetes.config'
import { IPortalDriver } from './IPortalDriver'

export default class KubernetesDriver implements IPortalDriver {
	public driverName = 'kubernetes'
	private client = createClient()

	public fetchAvailableNode = () => new Promise<string>(async (resolve, reject) => {
		if (!this.client)
			throw new Error('The Kubernetes driver configuration is incorrect. This may be due to improper ENV variables, please check')

		try {
			const nodeMap = await this.getNodemap()
			if (nodeMap.size === 0)
				resolve(null)

			let currentNode
			nodeMap.forEach((value, key) => {
				if (!currentNode)
					currentNode = key
				if (value < nodeMap.get(currentNode))
					currentNode = key
			})

			console.log(currentNode)
			resolve(currentNode)
		} catch (error) {
			reject(error)
		}
	})

	public createPortal = (portal: Portal) => new Promise(async (resolve, reject) => {
		if (!this.client)
			throw new Error('The Kubernetes driver configuration is incorrect. This may be due to improper ENV variables, please check')

		const name = `portal-${portal.id}`
		const recommendedNode = await this.fetchAvailableNode()

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
					nodeName: recommendedNode,
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
			} as V1Pod, { body: pod } = await this.client.createNamespacedPod('portals', _pod)

			console.log(`opened portal with name ${pod.metadata.name} in namespace ${pod.metadata.namespace}`)
			resolve()
		} catch (error) {
			reject(error)
			console.error('error while opening portal', error.response ? error.response.body : error)
		}
	})

	public destroyPortal = async (portal: Portal) => {
		const client = createClient()
		if (!client)
			throw new Error('The Kubernetes driver is incorrect. This may be due to improper ENV variables, please try again')

		const podName = `portal-${portal.id}`

		try {
			const { body: status } = await client.deleteNamespacedPod(podName, 'portals')

			console.log(`closed portal with name ${podName}`)
		} catch (error) {
			console.error('error while closing portal', error.response ? error.response.body : error)
		}
	}

	public isSpaceAvailable = () => new Promise<boolean>(async resolve => {
		console.log("spaceAvailable called.")
		let availableNode
		
		try {
			availableNode = await this.fetchAvailableNode()
		} catch(error) {
			console.log(error)
			resolve(false)
		}
		
		console.log(availableNode)
		if (availableNode)
			resolve(true)
		else
			resolve(false)
	})

	private getNodemap = async () => {
		if (!this.client)
			throw new Error('The Kubernetes driver configuration is incorrect. This may be due to improper ENV variables, please check')

		const nodeMap = new Map<string, number>()
		const podsPromise = this.client.listNamespacedPod('portals', 'true')
		const { body: nodes } = await this.client.listNode()
	
		nodes.items.forEach(node => {
			nodeMap.set(node.metadata.name, 0)
		})
	
		const { body: pods } = await podsPromise
	
		pods.items.forEach(item => {
			const currentNodePods = nodeMap.get(item.spec.nodeName)
			nodeMap.set(item.spec.nodeName, currentNodePods + 1)
		})
	
		nodeMap.forEach((value, key) => {
			if(value >= parseInt(process.env.PORTAL_NODE_LIMIT)) {
				nodeMap.delete(key)
			}
		})
	
		console.log(nodeMap)
		return nodeMap
	}
}