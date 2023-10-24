/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'tg',
            script: 'npm',
            args: 'run cli -- run-telegram-worker',
            autorestart: true,
        },
        {
            name: 'twitter',
            script: 'npm',
            args: 'run cli -- run-twitter-worker',
            autorestart: true,
            restart_delay: 1800000,
        },
        {
            name: 'mailer',
            script: 'npm',
            args: 'run cli -- run-mailer-worker',
            autorestart: true,
        },
    ],
}
