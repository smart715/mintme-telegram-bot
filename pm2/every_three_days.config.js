/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'every-three-days-apps',
            script: './pm2/script/every_three_days_script.sh',
            autorestart: false, // Prevent automatic restart,
            cron_restart: '0 0 */3 * *',
        },
    ],
}
