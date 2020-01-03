/*
 * TODO:
 * generalize error handling
 */
import dns from 'dns'
import axios, { AxiosResponse } from 'axios'
import Mountpoint from '../models/mountpoint'

const JANUS_SESSION_MISSING = 458
const JANUS_HANDLE_MISSING = 459

const JANUS_HOSTNAME = process.env.JANUS_HOSTNAME
const JANUS_PORT = process.env.JANUS_PORT
const JANUS_ADMIN_KEY = process.env.JANUS_STREAMING_ADMIN_KEY

const createSessionRequestBody = (transactionId, options) => {
    return {
        janus: "create",
        transaction: transactionId
    }
}

const createHandleRequestBody = (transactionId, options) => {
    return {
        janus: "attach",
        plugin: "janus.plugin.streaming",
        transaction: transactionId
    }
}

const createMountpointRequestBody = (transactionId, options) => {
    return {
        janus: "message",
        transaction: transactionId,
        body: {
            request: "create",
            admin_key: JANUS_ADMIN_KEY,
            type: "rtp",
            video: true,
            audio: true,
            videopt: 100,
            audiopt: 111,
            videortpmap: "VP8/90000",
            audiortpmap: "opus/48000/2",
            videoport: 0,
            audioport: 0
        }
    }
}

const deleteMountpointRequestBody = (transactionId, options) => {
    if(!options.Id)
        return

    return {
        janus: "message",
        transaction: transactionId,
        body: {
            request: "destroy",
            id: options.Id
        }
    }
}

const getRandomString = (length: number) => {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

const checkAndHandleError = (body) => new Promise(async (resolve, reject) => {
    var hasPluginError = body?.plugindata?.data?.error
    var hasBodyError = body?.error
    if(!hasBodyError && !hasPluginError)
        resolve()
    
    reject(hasBodyError ?? hasPluginError)
})

const sendJanusRequest = (url: string, bodyFunction: (transactionId: string, options?: any) => void, options?: any)  =>  new Promise<AxiosResponse>(async (resolve, reject) => {
    var transactionId = getRandomString(32)
    try {
        const axiosResponse = await axios.post(url, bodyFunction(transactionId, options))

        if(axiosResponse?.data?.transaction != transactionId)
            reject("transactionId doesn't match. possible Corruption or MitM attack.")

        await checkAndHandleError(axiosResponse.data)
        resolve(axiosResponse)
    } catch (error) {
        console.error(error)
        reject(error)
    }
})

const createJanusSession = (url: string) => new Promise<string>(async (resolve, reject) => {
    try{
        const janusResponse = await sendJanusRequest(url, createSessionRequestBody)

        const janusSessionId: string = janusResponse?.data?.data?.id
        resolve(janusSessionId)
    } catch(error) {
        console.error(error)
        reject(error)
    }
})

const createJanusStreamingHandle = (url: string, sessionId: string) => new Promise<string>(async (resolve, reject) => {
    try {
        const janusResponse = await sendJanusRequest(url + sessionId, createHandleRequestBody)

        const janusStreamingHandleId: string = janusResponse?.data?.data?.id
        resolve(janusStreamingHandleId)
    } catch(error) {
        console.error(error)
        reject(error)
    }
})

export const createJanusStreamingMountpoint = (mountpoint: Mountpoint) => new Promise(async (resolve, reject) => {
    try{
        const janusUrl = `http://${JANUS_HOSTNAME}:${JANUS_PORT}/janus/`

        const janusSessionId = await createJanusSession(janusUrl)
        const janusHandleId = await createJanusStreamingHandle(janusUrl, janusSessionId)

        const janusResponse = await sendJanusRequest(janusUrl + `${janusSessionId}/${janusHandleId}`, createMountpointRequestBody)
        const streamInfo = janusResponse?.data?.plugindata?.data?.stream

        console.log(streamInfo)

        await mountpoint.updateStreamInfo(+streamInfo?.id, JANUS_HOSTNAME, +streamInfo?.audio_port, +streamInfo?.video_port)
        resolve()
    }
    catch(error) {
        console.error(error)
        reject(error) 
    }
})

export const destroyJanusStramingMountpoint = (mountpoint: Mountpoint) => new Promise(async (resolve, reject) => {
    try {
        const janusUrl = `http://${mountpoint.janusIp}:${JANUS_PORT}/janus/`

        const janusSessionId = await createJanusSession(janusUrl)
        const janusHandleId = await createJanusStreamingHandle(janusUrl, janusSessionId)

        if(mountpoint.janusId < 0) {
            resolve()
        }

        await sendJanusRequest(janusUrl + `${janusSessionId}/${janusHandleId}`, deleteMountpointRequestBody, {Id: mountpoint.janusId})
        resolve()
    } catch (error) {
        console.error(error)
        reject(error)
    }
})
