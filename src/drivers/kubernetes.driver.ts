import { V1Pod, V1Node, CoreV1Api } from '@kubernetes/client-node'

import Portal from '../models/portal'

import { createClient } from '../config/providers/kubernetes.config'
import { closePortal } from './portal.driver'

type Nodemap = {
    [key in string]: number
}

const getNodemap = (nodes: V1Node[]) => {
    let map: Nodemap = {}

    nodes.forEach(node =>
        map[node.metadata.name] ? map[node.metadata.name] += 1 : map[node.metadata.name] = 1
    )

    /**
     * The limit for portals per node is 10.
     *
     * If there is a node with 10 or more portals,
     * delete it from the available pool.
     */
    nodes.forEach(({ metadata: { name } }) => {
        if(map[name] >= parseInt(process.env.PORTAL_NODE_LIMIT))
            delete map[name]
    })

    return map
}

export const isNodeAvailable = async () => !!(await fetchAvailableNode())

export const fetchAvailableNode = (client?: CoreV1Api) => new Promise<V1Node>(async (resolve, reject) => {
    if(!client) client = createClient()
    if(!client) throw 'The Kubernetes driver configuration is incorrect. This may be due to improper ENV variables, please check'

    try {
        const { body: nodes } = await client.listNode()

        const nodeMap = getNodemap(nodes.items)
        if(Object.keys(nodeMap).length === 0)
            resolve(null)

        const recommendedNodeName = Object.keys(nodeMap).reduce((a, b) =>
            nodeMap[a] < nodeMap[b] ? a : b
        ), recommendedNode = nodes.items.find(node =>
            node.metadata.name === recommendedNodeName
        )

        resolve(recommendedNode)
    } catch(error) {
        reject(error)
    }
})

export const openPortalInstance = async (portal: Portal) => {
    const client = createClient()
    if(!client) throw 'The Kubernetes driver configuration is incorrect. This may be due to improper ENV variables, please check'

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
    } catch(error) {
        closePortal(portal.id)

        console.error('error while opening portal', error.response ? error.response.body : error)
    }
}

export const closePortalInstance = async (portal: Portal) => {
    const client = createClient()
    if(!client) throw 'The Kubernetes driver is incorrect. This may be due to improper ENV variables, please try again'

    const podName = `portal-${portal.id}`

    try {
        const { body: status } = await client.deleteNamespacedPod(podName, 'portals')

        console.log(`closed portal with name ${podName} which has been running since ${new Date(status.status['startTime'])}`)
    } catch(error) {
        console.error('error while closing portal', error.response ? error.response.body : error)
    }
}
