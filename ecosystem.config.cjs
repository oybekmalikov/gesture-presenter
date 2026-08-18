module.exports = {
  apps: [
    {
      name: 'okmk-presenter-backend',
      cwd: './backend',
      script: './dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5050,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
