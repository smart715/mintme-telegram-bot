/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'token-holding-eth',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker --blockchain=ETH',
            autorestart: true,
        },
        {
            name: 'token-holding-bsc',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker --blockchain=BSC',
            autorestart: true,
        },
        {
            name: 'token-holding-cro',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker --blockchain=CRO',
            autorestart: true,
        },
        {
            name: 'explorer-search-api-eth',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=explorer-search-api-worker --blockchain=ETH',
            autorestart: true,
        },
        {
            name: 'explorer-search-api-bsc',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=explorer-search-api-worker --blockchain=BSC',
            autorestart: true,
        },
        {
            name: 'explorer-search-api-cro',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=explorer-search-api-worker --blockchain=CRO',
            autorestart: true,
        },
        {
            name: 'check-token-worker-eth',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=check-token-worker --blockchain=ETH',
            autorestart: true,
        },
        {
            name: 'check-token-worker-bsc',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=check-token-worker --blockchain=BSC',
            autorestart: true,
        },
        {
            name: 'check-token-worker-cro',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=check-token-worker --blockchain=CRO',
            autorestart: true,
        },
        {
            name: 'token-transactions-fetcher-eth',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --token-transactions-fetcher --blockchain=ETH',
            autorestart: true,
        },
        {
            name: 'token-transactions-fetcher-bsc',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --token-transactions-fetcher --blockchain=BSC',
            autorestart: true,
        },
        {
            name: 'token-transactions-fetcher-cro',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --token-transactions-fetcher --blockchain=CRO',
            autorestart: true,
        },
    ],
}
