// PM2 process manifest for the Motopsyai backend.
// Run from the project root on the server:
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup        (then run the printed command once as root)

module.exports = {
  apps: [
    {
      name: 'motopsyai-backend',
      cwd: './backend',
      script: 'server.js',
      // node-cron + Express + MySQL pool need a single long-lived process.
      // Don't fork into multiple instances or the cron will fire N times.
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        // PORT is read by the backend; keep at 4000 unless you also change
        // the nginx upstream block in deploy/nginx-additional.conf.
        PORT: 4000,
      },
      // PM2 keeps stdout/stderr in ~/.pm2/logs by default. Override if you
      // want them inside the Plesk subscription tree.
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
