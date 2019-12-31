import Docker from 'dockerode'

export const getServerPath = () => {
	if (typeof process.env.DOCKER_SOCK !== 'undefined')
		return { socketPath: process.env.DOCKER_SOCK }
	else if (typeof process.env.DOCKER_HOST !== 'undefined' && typeof process.env.DOCKER_PORT !== 'undefined')
		return { host: process.env.DOCKER_HOST, port: process.env.DOCKER_PORT }
	else return null
}

export const createClient = () => {
	const server = getServerPath()
	if (!server) return null

	return new Docker(server)
}
