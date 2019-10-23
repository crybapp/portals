import { PortalResolvable } from '../models/portal'
import { ServerResolvable } from '../models/server'

export const extractPortalId = (portal: PortalResolvable) => portal ? (typeof portal === 'string' ? portal : portal.id) : null
export const extractServerId = (server: ServerResolvable) => server ? (typeof server === 'string' ? server : server.id) : null