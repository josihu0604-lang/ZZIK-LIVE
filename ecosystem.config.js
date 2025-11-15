// PM2 Ecosystem Configuration for ZZIK LIVE
// 개발 서버 자동 관리 및 재시작

module.exports = {
  apps: [
    {
      name: 'zzik-live-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 자동 재시작 설정
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // 오류 발생 시 재시작
      exp_backoff_restart_delay: 100,
      
      // 리스너
      listen_timeout: 10000,
      kill_timeout: 5000,
      
      // 로그 로테이션
      log_type: 'json',
    },
  ],
};
