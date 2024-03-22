/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'blockchain-watcher-bsc',
            script: 'npm',
            args: 'run cli -- run-blockchain-watcher  --blockchain=BSC',
            autorestart: true,
        },
        {
            name: 'blockchain-watcher-eth',
            script: 'npm',
            args: 'run cli -- run-blockchain-watcher  --blockchain=ETH',
            autorestart: true,
        },
        {
            name: 'blockchain-watcher-cro',
            script: 'npm',
            args: 'run cli -- run-blockchain-watcher  --blockchain=CRO',
            autorestart: true,
        },
        {
            name: 'blockchain-watcher-matic',
            script: 'npm',
            args: 'run cli -- run-blockchain-watcher  --blockchain=MATIC',
            autorestart: true,
        },
        {
            name: 'token-holding-sol',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker  --blockchain=SOL',
            autorestart: true,
        },
        {
            name: 'check-token-worker-bsc',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=check-token-worker --blockchain=BSC',
            autorestart: true,
        },
        {
            name: 'check-token-worker-eth',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=check-token-worker --blockchain=ETH',
            autorestart: true,
        },
        {
            name: 'check-token-worker-cro',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=check-token-worker --blockchain=CRO',
            autorestart: true,
        },
        {
            name: 'check-token-worker-matic',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=check-token-worker --blockchain=MATIC',
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
