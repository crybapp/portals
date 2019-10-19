export type ClientType = 'portal'

export default interface WSEvent {
    op: number
    d: any
    t?: string
    s?: number
}
