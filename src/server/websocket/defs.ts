export type ClientType = 'server'

export default interface WSEvent {
    op: number
    d: any
    t?: string
    s?: number
}
