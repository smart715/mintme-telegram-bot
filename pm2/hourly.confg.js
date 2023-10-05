/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'hourly-apps',
            script: './pm2/script/hourly_script.sh',
            autorestart: false, // Prevent automatic restart,
            cron_restart: '0 * * * *',
        },
    ],
}
