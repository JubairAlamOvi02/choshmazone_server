module.exports = {
  apps: [
    {
      name: 'choshmazone-backend',
      script: './src/index.js',
      cwd: './server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
