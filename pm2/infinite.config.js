/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'token-holding-bsc',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker  --blockchain=BSC',
            autorestart: true,
        },
        {
            name: 'token-holding-eth',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker  --blockchain=ETH',
            autorestart: true,
        },
        {
            name: 'token-holding-cro',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker  --blockchain=CRO',
            autorestart: true,
        },
        {
            name: 'token-holding-matic',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker  --blockchain=MATIC',
            autorestart: true,
        },
        {
            name: 'token-holding-sol',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker  --blockchain=SOL',
            autorestart: true,
        },
        {
            name: 'explorer-search-api',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=explorer-search-api-worker',
            autorestart: true,
        },
        {
            name: 'check-token-worker',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=check-token-worker',
            autorestart: true,
        },
        {
            name: 'token-transactions-fetcher-bsc',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-transactions-fetcher --blockchain=BSC',
            autorestart: true,
        },
        {
            name: 'token-transactions-fetcher-eth',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-transactions-fetcher --blockchain=ETH',
            autorestart: true,
        },
        {
            name: 'token-transactions-fetcher-cro',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-transactions-fetcher --blockchain=CRO',
            autorestart: true,
        },
        {
            name: 'token-transactions-fetcher-matic',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-transactions-fetcher --blockchain=MATIC',
            autorestart: true,
        },
        {
            name: 'token-transactions-fetcher-sol',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-transactions-fetcher --blockchain=SOL',
            autorestart: true,
        },
        {
            name: 'enqueue-tokens-worker',
            script: 'npm',
            args: 'run cli -- run-enqueue-tokens-worker',
            autorestart: true,
        },
        {
            name: 'run-last-token-tx-date-fetcher',
            script: 'npm',
            args: 'run cli -- run-last-token-tx-date-fetcher',
            autorestart: true,
        },
    ],
}
