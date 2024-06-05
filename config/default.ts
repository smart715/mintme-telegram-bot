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
        'requestOffset': 1,
        'requestLimit': 5000,
        'maxSimultaneousAccounts': 1,
        'maxPerCycle': 5,
        'commentFrequency': 60,
        'maxCommentsPerDay': 3,
        'maxCommentsPerCoin': 1,
        'maxCycleContinousFail': 2,
        'continousFailsDelays': [
            1,
            6,
            12,
            24,
            48,
            96,
            168,
        ], //In Hour(s)
        'currentCategoryTargetId' : '6051a82566fc1b42617d6dc6', //e.g: memes id is 6051a82566fc1b42617d6dc6
    },

    // coinlore worker settings
    'coinlore_request_batch_size': 100,

    // exclude blockchains from getFirstFromQueue
    'excluded_blockchains': [ 'BSC' ],

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

    'failure_count_delays': [
        1,
        3,
        7,
        14,
        21,
        28,
    ],

    blockchainRpcHost: {
        'BSC': 'https://bsc-dataseed1.binance.org/',
        'ETH': 'https://ethereum-rpc.publicnode.com/',
        'CRO': 'https://evm.cronos.org/',
        'MATIC': 'https://1rpc.io/matic',
        'ARB': 'https://arbitrum.blockpi.network/v1/rpc/public',
        'AVAX': 'https://avalanche.drpc.org',
        'BASE': 'https://base-rpc.publicnode.com',
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
