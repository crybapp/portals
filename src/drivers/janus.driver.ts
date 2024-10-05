/*
 * TODO:
 * generalize error handling
 */
import axios, { AxiosResponse } from 'axios'
import Mountpoint from '../models/mountpoint'

const JANUS_URL = process.env.JANUS_URL || `http://${process.env.JANUS_HOSTNAME}:${process.env.JANUS_PORT}`
const JANUS_STREAMING_IP = process.env.JANUS_STREAMING_IP || process.env.JANUS_HOSTNAME
const JANUS_ADMIN_KEY = process.env.JANUS_STREAMING_ADMIN_KEY

const createSessionRequestBody = (transactionId, options) => {
	return {
		janus: 'create',
		transaction: transactionId
	}
}

const createHandleRequestBody = (transactionId, options) => {
	return {
		janus: 'attach',
		plugin: 'janus.plugin.streaming',
		transaction: transactionId
	}
}

const createMountpointRequestBody = (transactionId, options) => {
	return {
		janus: 'message',
		transaction: transactionId,
		body: {
			request: 'create',
			admin_key: JANUS_ADMIN_KEY,
			type: 'rtp',
			is_private: true,
			threads: 1,
			playoutdelay_ext: true,
			media: [
				{
					type: 'audio',
					mid: '101',
					port: 0,
					rtcpport: 0,
					codec: 'opus',
					pt: 101,
					rtpmap: 'opus/48000/2',
					fmtp: 'sprop-stereo=1'
				},
				{
					type: 'video',
					mid: '100',
					port: 0,
					rtcpport: 0,
					codec: 'vp8',
					pt: 100,
					rtpmap: 'VP8/90000'
				}
			]
		}
	}
}

const deleteMountpointRequestBody = (transactionId, options) => {
	if (!options.Id)
		return

	return {
		janus: 'message',
		transaction: transactionId,
		body: {
			request: 'destroy',
			id: options.Id
		}
	}
}

const getRandomString = (length: number) => {
	return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1)
}

const checkAndHandleError =body => new Promise(async (resolve, reject) => {
	const hasPluginError = body?.plugindata?.data?.error,
		hasBodyError = body?.error

	if (!hasBodyError && !hasPluginError)
		resolve()

	reject(hasBodyError ?? hasPluginError)
})

const sendJanusRequest = (url: string, bodyFunction: (transactionId: string, options?: any) => void, options?: any) =>
	new Promise<AxiosResponse>(async (resolve, reject) => {
		const transactionId = getRandomString(32)
		try {
			const axiosResponse = await axios.post(url, bodyFunction(transactionId, options))

			if (axiosResponse?.data?.transaction !== transactionId)
				reject('transactionId doesn\'t match. possible Corruption or MitM attack.')

			await checkAndHandleError(axiosResponse.data)
			resolve(axiosResponse)
		} catch (error) {
			console.error(error)
			reject(error)
		}
	}
)

const createJanusSession = (url: string) => new Promise<string>(async (resolve, reject) => {
	try {
		const janusResponse = await sendJanusRequest(url, createSessionRequestBody),
			janusSessionId: string = janusResponse?.data?.data?.id

		resolve(janusSessionId)
	} catch (error) {
		console.error(error)
		reject(error)
	}
})

const createJanusStreamingHandle = (url: string, sessionId: string) => new Promise<string>(async (resolve, reject) => {
	try {
		const janusResponse = await sendJanusRequest(url + sessionId, createHandleRequestBody),
			janusStreamingHandleId: string = janusResponse?.data?.data?.id

		resolve(janusStreamingHandleId)
	} catch (error) {
		console.error(error)
		reject(error)
	}
})

export const createJanusStreamingMountpoint = (mountpoint: Mountpoint) => new Promise(async (resolve, reject) => {
	try {
		const janusUrl = `${JANUS_URL}/janus/`,
			janusSessionId = await createJanusSession(janusUrl),
			janusHandleId = await createJanusStreamingHandle(janusUrl, janusSessionId)

		const janusResponse = await sendJanusRequest(
			janusUrl + `${janusSessionId}/${janusHandleId}`,
			createMountpointRequestBody
		)

		const streamInfo = janusResponse?.data?.plugindata?.data?.stream

		if (process.env.NODE_ENV === 'development')
			console.log(streamInfo)

		await mountpoint.updateStreamInfo(
			+streamInfo?.id,
			JANUS_STREAMING_IP,
			+streamInfo?.ports[0].port,
			+streamInfo?.ports[0].rtcp_port,
			+streamInfo?.ports[1].port,
			+streamInfo?.ports[1].rtcp_port
		)
		resolve()
	} catch (error) {
		console.error(error)
		reject(error)
	}
})

export const destroyJanusStramingMountpoint = (mountpoint: Mountpoint) => new Promise(async (resolve, reject) => {
	try {
		const janusUrl = `${JANUS_URL}/janus/`,
			janusSessionId = await createJanusSession(janusUrl),
			janusHandleId = await createJanusStreamingHandle(janusUrl, janusSessionId)

		if (mountpoint.janusId < 0)
			resolve()

		await sendJanusRequest(
			janusUrl + `${janusSessionId}/${janusHandleId}`,
			deleteMountpointRequestBody,
			{Id: mountpoint.janusId})

		resolve()
	} catch (error) {
		console.error(error)
		reject(error)
	}
})
