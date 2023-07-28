import { ContactMethod } from '../core'
import config from 'config'

export { Database } from './orm'
export { default as logger, Loggable } from './logger'
export * from './regexp'
export * from './blockchains'
export * from './constants'
export { TokenNamesGenerator } from './TokenNamesGenerator'

export {
    findContractAddress,
} from'./blockchain'

export {
    getHrefFromTagString,
    getHrefValuesFromTagString,
} from './domParser'

export function parseContactMethod(channel: string): ContactMethod|undefined {
    if (channel.includes('@')) {
        return ContactMethod.EMAIL
    } else if (channel.includes('twitter.com')) {
        return ContactMethod.TWITTER
    } else if (channel.includes('t.me')) {
        return ContactMethod.TELEGRAM
    }

    return undefined
}

export function getMaxAttemptsPerMethod(method: ContactMethod): number {
    switch(method) {
        case ContactMethod.EMAIL:
            return config.get('contact_email_max_attempts')
        case ContactMethod.TWITTER:
            return config.get('contact_twitter_max_attempts')
        case ContactMethod.TELEGRAM:
            return config.get('contact_telegram_max_attempts')
        default:
            return 0
    }
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
