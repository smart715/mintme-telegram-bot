export default {
    'environment': process.env.NODE_ENV,

    //Database config
    'db_host': process.env.DB_HOST,
    'db_user': process.env.DB_USER,
    'db_password': process.env.DB_PASS,
    'db_name': process.env.DB_NAME,

    // Email to send daily statistic.
    // This email receives notifications about broken workers or not available messages/accounts
    'email_daily_statistic': 'example@mail.com',

    // Coinmarketcap worker settings
    cmcWorker: {
        'apiKeys': [ '0da9b092-fee6-4c91-875a-e93fbb6b78e0', 'key2', 'key3' ], // Replace with actual API keys
        'requestOffset': 5000,
        'requestLimit': 5000,
    },

    // coinlore worker settings
    'coinlore_request_batch_size': 100,

    'bitquery_api_keys': [ 'BQYrOBkyfMSCQ6CJChTBQDQbRQhRbXS8', 'BQYzhsnLQfY4s85Gq2QooRcxKUqf9FW7', 'BQYlgCPtB9eCcIlHtdfsnty5o9zbRGTe' ],
    'tokensinsight_api_keys': [ '637ad09e1d294dfaa69036b6d4e9c526', '34cd797948c445aaa36ffe213199b8cf', 'key3' ], // Replace with actual API keys

    // telegram configs
    'telegram_max_accounts_simultaneous': 2,
    'telegram_messages_delay_in_seconds': 35,
    'telegram_account_max_day_messages': 40,
    'telegram_unique_messages_per_account': 3,
    'telegram_accounts_per_proxy': 2,
    'telegram_limit_logging_in_in_mins': 5,
    'telegram_max_sent_messages_per_cycle': 5,

    // twitter configs
    'twitter_max_accounts_simultaneous': 1,
    'twitter_dm_limit_daily': 300,
    'twitter_total_attempts_daily': 1000,
    'twitter_messages_delay_in_seconds': 40,
    'twitter_responses_checker_frequency_hours': 12,
    'twitter_css_unread_dot': 'r-l5o3uw',

    // enqueue tokens worker
    'contact_email_max_attempts': 4,
    'contact_twitter_max_attempts': 2,
    'contact_telegram_max_attempts': 3,
    'contact_frequency_different_channel_in_seconds': 60 * 60 * 24 * 7, // 7 days
    'contact_frequency_same_channel_in_seconds': 60 * 60 * 24 * 28, // 28 days
    'dm_not_enabled_time_limit_in_days': 30 * 3, // 3 months

    'flaresolverr_server_url': 'http://localhost:8191/v1',

    explorerApiKeys: {
        'BSC': [ 'M7KD3A8FB4137CMQZ7VV3C696V6WYHD6UE', 'key2', 'key3' ], // Replace with actual API keys
        'ETH': [ 'XSYS3JRES31D8P4ZY261FNA5VWTWNZ5XVQ', 'key2', 'key3' ], // Replace with actual API keys
        'CRO': [ 'N97BBK59XJ5DK9B8AN87NPEH2DYKBGKHTA', 'key2', 'key3' ], // Replace with actual API keys
        'MATIC': [ 'key1', 'key2', 'key3' ], // Replace with actual API keys
        'SOL': [ 'key1', 'key2', 'key3' ], // Replace with actual API keys
        'AVAX': [ 'key1', 'key2', 'key3' ], // Replace with actual API keys
        'ARB': [ 'key1', 'key2', 'key3' ], // Replace with actual API keys
    },

    blockchainRpcHost: {
        'BSC': 'https://bsc-dataseed1.binance.org/',
        'ETH': 'https://ethereum-rpc.publicnode.com/',
        'CRO': 'https://evm.cronos.org/',
        'MATIC': 'https://1rpc.io/matic',
        'ARB': 'https://arbitrum.blockpi.network/v1/rpc/public',
        'AVAX': 'https://avalanche.drpc.org',
    },

    mailer: {
        senderName: 'mintme tokens fetcher',
        senderEmail: 'mintme.token.fetcher@gmail.com',
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: 'aweihcdxiqxsjmck@ethereal.email',
            pass: 'QG2tmhS8KDhG9dD4Cy',
        },
    },
}
