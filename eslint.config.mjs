import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import localPrivacy from './eslint-local-rules/local-privacy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      'local-privacy': localPrivacy
    },
    rules: {
      'local-privacy/no-raw-geo-logs': 'error',
      'local-privacy/no-pii-logs': 'error'
    }
  }
];

export default eslintConfig;