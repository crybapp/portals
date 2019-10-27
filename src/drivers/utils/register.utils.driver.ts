import Deployment from '../../models/deployment'
import { Driver } from '../router'

import config from '../../config/defaults'
import wordPool from '../../config/words.config'
import { generateRandomInt } from '../../utils/generate.utils'

const generateRandomWord = (exclude: string[]) => wordPool.filter(word => exclude.indexOf(word) === -1)[generateRandomInt(0, wordPool.length - exclude.length)]

export const registerDeployment = async (provider: Driver) => {
    let words = []

    for(let i = 0; i < config.dynamic_vm_word_count; i++)
        words.push(generateRandomWord(words))

    try {
        const name = `cryb_portal-${words.join('-')}`,
            deployment = await new Deployment().create(name, provider)

        return deployment
    } catch(error) {
        console.error(error)
        return null
    }
}

export const deregisterDeployment = async (name: string) => {
    try {
        const deployment = await new Deployment().findByName(name)
        await deployment.destroy()

        return name
    } catch(error) {
        console.error(error)
        return null
    }
}
