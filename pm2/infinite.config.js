/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'token-holding',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-holdings-worker',
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
            name: 'token-transactions-fetcher',
            script: 'npm',
            args: 'run cli -- run-explorer-worker --name=token-transactions-fetcher',
            autorestart: true,
        },
    ],
}
