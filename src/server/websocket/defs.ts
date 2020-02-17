export type ClientType = 'portal'

export default interface IWSEvent {
	op: number
	d: any
	t?: string
	s?: number
}
