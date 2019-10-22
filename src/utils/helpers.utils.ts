import { PortalResolvable } from '../models/portal'

export const extractPortalId = (portal: PortalResolvable) => portal ? (typeof portal === 'string' ? portal : portal.id) : null