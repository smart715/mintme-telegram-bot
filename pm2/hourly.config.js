/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'coingecko',
            script: 'npm',
            args: 'run cli -- run-fetch-token-worker --name=coin-gecko',
            autorestart: true,
            restart_delay: 3600000,
        },
        {
            name: 'cmc',
            script: 'npm',
            args: 'run cli -- run-fetch-token-worker --name=coinmarketcap',
            autorestart: true,
            restart_delay: 3600000,
        },
        {
            name: 'dextools',
            script: 'npm',
            args: 'run cli -- run-fetch-token-worker --name=dex-tools',
            autorestart: true,
            restart_delay: 3600000,
        },
    ],
}
