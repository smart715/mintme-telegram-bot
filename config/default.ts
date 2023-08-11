import { Blockchain } from '../src/utils'

export default {
    'coinmarketcap_api_key': '0da9b092-fee6-4c91-875a-e93fbb6b78e0',
    'bitquery_api_key': 'BQYrOBkyfMSCQ6CJChTBQDQbRQhRbXS8',

    // enqueue tokens worker
    'contact_email_max_attempts': 4,
    'contact_twitter_max_attempts': 4,
    'contact_telegram_max_attempts': 1,
    'contact_frequency_in_seconds': 60 * 60 * 24 * 7, // 7 days

    explorerApiKeys: {
        [Blockchain.BSC]: 'M7KD3A8FB4137CMQZ7VV3C696V6WYHD6UE',
        [Blockchain.ETH]: 'XSYS3JRES31D8P4ZY261FNA5VWTWNZ5XVQ',
        [Blockchain.CRO]: 'N97BBK59XJ5DK9B8AN87NPEH2DYKBGKHTA',
    },
}
