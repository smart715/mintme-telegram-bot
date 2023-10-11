export default {
    'environment': process.env.NODE_ENV,

    //Database config
    'db_host': 'localhost',
    'db_user': 'root',
    'db_password': 'root',
    'db_name': 'marketing_bot',

    // Email to send daily statistic.
    // This email receives notifications about broken workers or not available messages/accounts
    'email_daily_statistic': 'example@mail.com',

    // Coinmarketcap worker settings
    cmcWorker: {
        'apiKey': '0da9b092-fee6-4c91-875a-e93fbb6b78e0',
        'requestOffset': 5000,
        'requestLimit': 5000,
    },

    // coinlore worker settings
    'coinlore_request_batch_size': 100,

    'bitquery_api_key': 'BQYrOBkyfMSCQ6CJChTBQDQbRQhRbXS8',
    'tokensinsight_api_key': '65851ffff61d47fe9d600c6c69ef87e6',

    // telegram configs
    'telegram_max_accounts_simultaneous': 2,
    'telegram_messages_delay_in_seconds': 15,
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
    'contact_telegram_max_attempts': 2,
    'contact_frequency_in_seconds': 60 * 60 * 24 * 14, // 14 days

    'flaresolverr_server_url': 'http://localhost:8191/v1',

    explorerApiKeys: {
        'BSC': 'M7KD3A8FB4137CMQZ7VV3C696V6WYHD6UE',
        'ETH': 'XSYS3JRES31D8P4ZY261FNA5VWTWNZ5XVQ',
        'CRO': 'N97BBK59XJ5DK9B8AN87NPEH2DYKBGKHTA',
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
