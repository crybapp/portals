/*
 * TODO:
 * Refactor requests to check transaction implicitly
 * generalize error handling
 */
import axios, { AxiosResponse } from 'axios'
import Mountpoint from '../models/mountpoint'

const JANUS_SESSION_MISSING = 458
const JANUS_HANDLE_MISSING = 459

const url = `${process.env.JANUS_URL}/janus`
const admin_key = `${process.env.JANUS_STREAMING_ADMIN_KEY}`

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
            admin_key: admin_key,
            type: "rtp",
            video: true,
            audio: true,
            videoopt: 100,
            audioopt: 111,
            videortpmap: "H264/90000",
            audiortpmap: "opus/48000/2",
            videoport: 0,
            audioport: 0
        }
    }
}

const createMountpointDeleteRequest = (transactionId, options) => {
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

let janusSessionId: number
let janusStreamingHandleId: number

const getRandomString = (length: number) => {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

const checkAndHandleError = (body) => new Promise(async (resolve, reject) => {
    if(!body.error && !body.plugindata.data.error)
        resolve()

    if(body.error.code == JANUS_SESSION_MISSING) {
        try {
            await createJanusSession()
            if(janusStreamingHandleId)
                await createJanusStreamingHandle()

            resolve()
        } catch(error) {
            reject(error)
        }
    }

    if(body.error.code == JANUS_HANDLE_MISSING) {
        try {
            await createJanusStreamingHandle()
            resolve()
        } catch(error) {
            reject(error)
        }
    }

    reject(body.error)
})

const sendJanusRequest = (url: string, bodyFunction: (transactionId: string, options?: any) => void, options?: any)  =>  new Promise<AxiosResponse>(async (resolve, reject) => {
    var transactionId = getRandomString(32)
    try {
        const axiosResponse = await axios.post(url, bodyFunction(transactionId, options))

        if(axiosResponse.data.transaction != transactionId)
            reject("transactionId doesn't match. possible Corruption or MitM attack.")

        await checkAndHandleError(axiosResponse.data)
        resolve(axiosResponse)
    } catch (error) {
        reject(error)
    }
})

//TODO: End on error.
//This keeps our sessionId active so that we may continue to use it to generate requests.
const keepJanusSessionAlive = async () => {
    axios.get(url + `${janusSessionId}`)
        .then(keepJanusSessionAlive)
}

const createJanusSession = () => new Promise(async (resolve, reject) => {
    try{
        const janusResponse = await sendJanusRequest(url, createSessionRequestBody)

        janusSessionId = +janusResponse.data.data.id
        keepJanusSessionAlive() 
        resolve()
    } catch(error) {
        reject(error)
    }
})

const createJanusStreamingHandle = () => new Promise(async (resolve, reject) => {
    try {
        const janusResponse = await sendJanusRequest(url + `/${janusSessionId}`, createHandleRequestBody)

        janusStreamingHandleId = +janusResponse.data.data.id
        resolve()
    } catch(error) {
        reject(error)
    }
})

export const createJanusStreamingMountpoint = (mountpoint: Mountpoint) => new Promise(async (resolve, reject) => {
    try{
        if(!janusSessionId) {
            await createJanusSession()
            await createJanusStreamingHandle()
        }

        const janusResponse = await sendJanusRequest(url + `/${janusSessionId}/${janusStreamingHandleId}`, createMountpointRequestBody)
        const streamInfo = janusResponse.data.plugindata.data.streaming

        await mountpoint.updateStreamInfo(+streamInfo.audioport, +streamInfo.videoport)
        resolve()
    }
    catch(error) {
        reject(error)
    }
})

export const destroyJanusStramingMountpoint = (mountpoint: Mountpoint) => new Promise(async (resolve, reject) => {
    try {
        if(!janusSessionId) {
            await createJanusSession()
            await createJanusStreamingHandle()
        }

        await sendJanusRequest(url + `/${janusSessionId}/${janusStreamingHandleId}`, createMountpointRequestBody, {Id: mountpoint.id})
        resolve()
    } catch (error) {
        reject(error)
    }
})
