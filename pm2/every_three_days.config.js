/* eslint-disable no-undef */
module.exports = {
    apps: [
        {
            name: 'every-three-days-apps',
            script: './pm2/script/every_three_days_script.sh',
            autorestart: false, // Prevent automatic restart,
            cron_restart: '0 0 */3 * *',
        },
        {
            name: 'every-three-days-apps-2',
            script: './pm2/script/every_three_days_script_2.sh',
            autorestart: false, // Prevent automatic restart,
            cron_restart: '0 0 */3 * *',
        },
        {
            name: 'every-three-days-apps-3',
            script: './pm2/script/every_three_days_script_3.sh',
            autorestart: false, // Prevent automatic restart,
            cron_restart: '0 0 */3 * *',
        },
    ],
}
