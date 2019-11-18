/*
 * TODO:
 * Refactor requests to check transaction implicitly
 * generalize error handling
 */
import axios, { AxiosResponse } from 'axios'
import Mountpoint from '../models/mountpoint'

const JANUS_SESSION_MISSING = 458
const JANUS_HANDLE_MISSING = 459

const url = `${process.env.JANUS_URL}/janus/`
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

let janusSessionId: number
let janusStreamingHandleId: number

const getRandomString = (length: number) => {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

const checkAndHandleError = (body) => new Promise(async (resolve, reject) => {
    var hasPluginError = body?.plugindata?.data?.error
    var hasBodyError = body?.error
    if(!hasBodyError && !hasPluginError)
        resolve()

    if(hasBodyError) {
        var errorCode = hasBodyError?.code
        if(errorCode == JANUS_SESSION_MISSING) {
            try {
                await createJanusSession()
                if(janusStreamingHandleId)
                    await createJanusStreamingHandle()

                resolve()
            } catch(error) {
                reject(error)
            }
        }

        if(errorCode == JANUS_HANDLE_MISSING) {
            try {
                await createJanusStreamingHandle()
                resolve()
            } catch(error) {
                console.error(error)
                reject(error)
            }
        }
    }
    
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

const keepJanusSessionAlive = async () => {
    try {
        const axiosResponse = await axios.get(url + `${janusSessionId}`)
        if(axiosResponse.data?.error) {
            janusSessionId = null
            janusStreamingHandleId = null
            return
        }
        return keepJanusSessionAlive()
    } catch (error) {
        console.error("Couldn't communicate with janus. Session Terminated") 
    }
    
}

const createJanusSession = () => new Promise(async (resolve, reject) => {
    try{
        const janusResponse = await sendJanusRequest(url, createSessionRequestBody)

        janusSessionId = +janusResponse?.data?.data?.id
        keepJanusSessionAlive() 
        resolve()
    } catch(error) {
        console.error(error)
        reject(error)
    }
})

const createJanusStreamingHandle = () => new Promise(async (resolve, reject) => {
    try {
        const janusResponse = await sendJanusRequest(url + `${janusSessionId}`, createHandleRequestBody)

        janusStreamingHandleId = +janusResponse?.data?.data?.id
        resolve()
    } catch(error) {
        console.error(error)
        reject(error)
    }
})

export const createJanusStreamingMountpoint = (mountpoint: Mountpoint) => new Promise(async (resolve, reject) => {
    try{
        if(!janusSessionId) {
            await createJanusSession()
            await createJanusStreamingHandle()
        }

        const janusResponse = await sendJanusRequest(url + `${janusSessionId}/${janusStreamingHandleId}`, createMountpointRequestBody)
        const streamInfo = janusResponse?.data?.plugindata?.data?.stream

        console.log(streamInfo)

        await mountpoint.updateStreamInfo(+streamInfo?.id, +streamInfo?.audio_port, +streamInfo?.video_port)
        resolve()
    }
    catch(error) {
        console.error(error)
        reject(error)
    }
})

export const destroyJanusStramingMountpoint = (mountpoint: Mountpoint) => new Promise(async (resolve, reject) => {
    try {
        if(!janusSessionId) {
            await createJanusSession()
            await createJanusStreamingHandle()
        }

        if(mountpoint.janusId < 0) {
            resolve()
        }

        await sendJanusRequest(url + `${janusSessionId}/${janusStreamingHandleId}`, deleteMountpointRequestBody, {Id: mountpoint.janusId})
        resolve()
    } catch (error) {
        console.error(error)
        reject(error)
    }
})
