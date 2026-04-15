// PM2 config. Chạy: pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "minhtho-api",
      cwd: "/opt/minhtho/server",
      script: "server.js",
      instances: 1,           // 2GB RAM — 1 instance đủ; nâng lên "max" khi VPS mạnh hơn
      exec_mode: "fork",
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        SERVE_CLIENT: "true",
        PORT: 5000,
      },
      error_file: "/var/log/pm2/minhtho-error.log",
      out_file: "/var/log/pm2/minhtho-out.log",
      merge_logs: true,
      time: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
