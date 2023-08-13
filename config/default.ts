import { Blockchain } from '../src/utils'

export default {
    //Database config
    'db_host': '{{ db_host }}',
    'db_user': '{{ db_user }}',
    'db_password': '{{ db_password }}',
    'db_name': '{{ db_name }}',

    //CMC
    'coinmarketcap_api_key': '0da9b092-fee6-4c91-875a-e93fbb6b78e0',

    // telegram configs
    'telegram_max_accounts': 1,
    'telegram_messages_delay_in_seconds': 30,
    'telegram_account_max_day_messages': 30,
    'telegram_unique_messages_per_account': 3,

    // enqueue tokens worker
    'contact_email_max_attempts': 4,
    'contact_twitter_max_attempts': 2,
    'contact_telegram_max_attempts': 1,
    'contact_frequency_in_seconds': 60 * 60 * 24 * 7, // 7 days

    'server_ip': '{{ server_ip }}',

    explorerApiKeys: {
        [Blockchain.BSC]: 'M7KD3A8FB4137CMQZ7VV3C696V6WYHD6UE',
        [Blockchain.ETH]: 'XSYS3JRES31D8P4ZY261FNA5VWTWNZ5XVQ',
        [Blockchain.CRO]: 'N97BBK59XJ5DK9B8AN87NPEH2DYKBGKHTA',
    },
}
