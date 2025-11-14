#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

function cmd(command: string): string {
  try {
    return execSync(command, { stdio: 'pipe', encoding: 'utf-8' }).trim();
  } catch (error) {
    return 'ERROR';
  }
}

function checkVersion(command: string, minVersion: string): HealthCheck {
  const version = cmd(command);
  const name = command.split(' ')[0];

  if (version === 'ERROR') {
    return {
      name,
      status: 'error',
      message: `${name} not found`,
    };
  }

  return {
    name,
    status: 'ok',
    message: version,
  };
}

function checkEnvVar(varName: string, required: boolean = true): HealthCheck {
  const value = process.env[varName];

  if (!value) {
    return {
      name: varName,
      status: required ? 'error' : 'warning',
      message: required ? 'Required but not set' : 'Optional, not set',
    };
  }

  // 민감한 정보는 마스킹
  const maskedValue =
    varName.includes('KEY') || varName.includes('TOKEN') || varName.includes('SECRET')
      ? '***' + value.slice(-4)
      : value.slice(0, 20) + (value.length > 20 ? '...' : '');

  return {
    name: varName,
    status: 'ok',
    message: maskedValue,
  };
}

function checkFile(filePath: string): HealthCheck {
  const name = path.basename(filePath);

  if (!existsSync(filePath)) {
    return {
      name,
      status: 'warning',
      message: 'File not found',
    };
  }

  return {
    name,
    status: 'ok',
    message: 'File exists',
  };
}

function checkDatabase(): HealthCheck {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return {
      name: 'Database',
      status: 'error',
      message: 'DATABASE_URL not set',
    };
  }

  try {
    // PostgreSQL 연결 테스트
    const result = cmd(`psql "${dbUrl}" -c "SELECT version();" -t`);

    if (result === 'ERROR') {
      return {
        name: 'Database',
        status: 'error',
        message: 'Cannot connect to database',
      };
    }

    return {
      name: 'Database',
      status: 'ok',
      message: 'Connected successfully',
      details: result.slice(0, 50) + '...',
    };
  } catch (error) {
    return {
      name: 'Database',
      status: 'error',
      message: 'Connection failed',
      details: error,
    };
  }
}

function printResults(checks: HealthCheck[]) {
  console.log('\n🎯 ZZIK LIVE System Health Check\n');
  console.log('='.repeat(60));

  const groups = {
    '💻 System': [] as HealthCheck[],
    '🔧 Environment': [] as HealthCheck[],
    '📁 Files': [] as HealthCheck[],
    '🗓️ Services': [] as HealthCheck[],
  };

  checks.forEach((check) => {
    if (['node', 'npm', 'docker', 'psql'].includes(check.name)) {
      groups['💻 System'].push(check);
    } else if (check.name.includes('_')) {
      groups['🔧 Environment'].push(check);
    } else if (check.name.includes('.')) {
      groups['📁 Files'].push(check);
    } else {
      groups['🗓️ Services'].push(check);
    }
  });

  for (const [groupName, groupChecks] of Object.entries(groups)) {
    if (groupChecks.length === 0) continue;

    console.log(`\n${groupName}`);
    console.log('-'.repeat(40));

    groupChecks.forEach((check) => {
      const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️ ' : '❌';
      console.log(`  ${icon} ${check.name.padEnd(20)} ${check.message}`);
      if (check.details) {
        console.log(`     ${JSON.stringify(check.details).slice(0, 50)}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));

  const errorCount = checks.filter((c) => c.status === 'error').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;

  if (errorCount > 0) {
    console.log(`\n❌ ${errorCount} error(s) found. Please fix before proceeding.`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n⚠️  ${warningCount} warning(s) found. System may work with limitations.`);
  } else {
    console.log(`\n✅ All systems operational!`);
  }
}

// Run health checks
const checks: HealthCheck[] = [
  // System checks
  checkVersion('node -v', '20.0.0'),
  checkVersion('npm -v', '10.0.0'),
  checkVersion('docker -v', '20.0.0'),
  checkVersion('psql --version', '14.0'),

  // Environment variables
  checkEnvVar('NODE_ENV', false),
  checkEnvVar('DATABASE_URL', true),
  checkEnvVar('NEXT_PUBLIC_APP_URL', true),
  checkEnvVar('NEXT_PUBLIC_MAPBOX_TOKEN', true),
  checkEnvVar('SESSION_SECRET', false),
  checkEnvVar('EMAIL_FROM', false),

  // Configuration files
  checkFile('.env'),
  checkFile('package.json'),
  checkFile('tsconfig.json'),
  checkFile('next.config.ts'),
  checkFile('prisma/schema.prisma'),

  // Database connection
  checkDatabase(),
];

printResults(checks);

export {};
