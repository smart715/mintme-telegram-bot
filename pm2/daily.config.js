module.exports = {
  apps: [
    {
      name: 'daily-apps',
      script: './pm2/daily_script.sh',
      autorestart: false, // Prevent automatic restart,
      cron_restart: '0 0 * * *',
    },
  ],
}
