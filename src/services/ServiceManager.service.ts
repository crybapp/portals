import { PortalManager } from './portalManager.service'
import { QueueService } from './portalQueue.service'

import { DigitalOceanDriver } from '../drivers/digitalocean.driver'
import { DockerDriver } from '../drivers/docker.driver'
import { GCloudDriver } from '../drivers/gcloud.driver'
import { HetznerCloudDriver } from '../drivers/hetznercloud.driver'
import { KubernetesDriver } from '../drivers/kubernetes.driver'
import { ManualDriver } from '../drivers/manual.driver'

const portalManager = new PortalManager()

portalManager.registerDriver(new DigitalOceanDriver())
portalManager.registerDriver(new DockerDriver())
portalManager.registerDriver(new GCloudDriver())
portalManager.registerDriver(new HetznerCloudDriver())
portalManager.registerDriver(new KubernetesDriver())
portalManager.registerDriver(new ManualDriver())

const queueService = new QueueService(portalManager.createPortal, portalManager.getCurrentAvailabilityFn())
queueService.start()

export default {
	portalManager,
	queueService
}
