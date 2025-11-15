# Security Audit Report - Round 5
**Date**: Sat Nov 15 01:25:34 UTC 2025
**Auditor**: Automated Security Scanner

## Executive Summary
- **NPM Vulnerabilities**: 8
  - Critical: 0
  - High: 0
  - Moderate: 8
  - Low: 0
- **Hardcoded Secrets**: 2 potential issues
- **Unsafe Patterns**: 0 occurrences
- **Auth-Protected Routes**: 4 routes

## Detailed Findings

### 1. Dependency Vulnerabilities
```json
{
  "@vitest/mocker": {
    "name": "@vitest/mocker",
    "severity": "moderate",
    "isDirect": false,
    "via": [
      "vite"
    ],
    "effects": [
      "vitest"
    ],
    "range": "<=3.0.0-beta.4",
    "nodes": [
      "node_modules/@vitest/mocker"
    ],
    "fixAvailable": {
      "name": "vitest",
      "version": "4.0.9",
      "isSemVerMajor": true
    }
  },
  "@vitest/ui": {
    "name": "@vitest/ui",
    "severity": "moderate",
    "isDirect": true,
    "via": [
      "vitest"
    ],
    "effects": [
      "vitest"
    ],
    "range": "<=0.0.122 || 0.31.0 - 2.2.0-beta.2",
    "nodes": [
      "node_modules/@vitest/ui"
    ],
    "fixAvailable": {
      "name": "@vitest/ui",
      "version": "4.0.9",
      "isSemVerMajor": true
    }
  },
  "depcheck": {
    "name": "depcheck",
    "severity": "moderate",
    "isDirect": true,
    "via": [
      "js-yaml"
    ],
    "effects": [],
    "range": "0.0.1 || >=0.5.9",
    "nodes": [
      "node_modules/depcheck"
    ],
    "fixAvailable": {
      "name": "depcheck",
      "version": "0.4.7",
      "isSemVerMajor": true
    }
  },
  "esbuild": {
    "name": "esbuild",
    "severity": "moderate",
    "isDirect": false,
    "via": [
      {
        "source": 1102341,
        "name": "esbuild",
        "dependency": "esbuild",
        "title": "esbuild enables any website to send any requests to the development server and read the response",
        "url": "https://github.com/advisories/GHSA-67mh-4wv8-2f99",
        "severity": "moderate",
        "cwe": [
          "CWE-346"
        ],
        "cvss": {
          "score": 5.3,
          "vectorString": "CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N"
        },
        "range": "<=0.24.2"
      }
    ],
    "effects": [
      "vite"
    ],
    "range": "<=0.24.2",
    "nodes": [
      "node_modules/esbuild"
    ],
    "fixAvailable": {
      "name": "vitest",
      "version": "4.0.9",
      "isSemVerMajor": true
    }
  },
  "js-yaml": {
    "name": "js-yaml",
    "severity": "moderate",
    "isDirect": false,
    "via": [
      {
        "source": 1109754,
        "name": "js-yaml",
        "dependency": "js-yaml",
        "title": "js-yaml has prototype pollution in merge (<<)",
        "url": "https://github.com/advisories/GHSA-mh29-5h37-fv8m",
        "severity": "moderate",
        "cwe": [
          "CWE-1321"
        ],
        "cvss": {
          "score": 5.3,
          "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N"
        },
        "range": "<4.1.1"
      }
    ],
    "effects": [
      "depcheck"
    ],
    "range": "<4.1.1",
    "nodes": [
      "node_modules/depcheck/node_modules/js-yaml"
    ],
    "fixAvailable": {
      "name": "depcheck",
      "version": "0.4.7",
      "isSemVerMajor": true
    }
  },
  "vite": {
    "name": "vite",
    "severity": "moderate",
    "isDirect": false,
    "via": [
      "esbuild"
    ],
    "effects": [
      "@vitest/mocker",
      "vite-node",
      "vitest"
    ],
    "range": "0.11.0 - 6.1.6",
    "nodes": [
      "node_modules/vite"
    ],
    "fixAvailable": {
      "name": "vitest",
      "version": "4.0.9",
      "isSemVerMajor": true
    }
  },
  "vite-node": {
    "name": "vite-node",
    "severity": "moderate",
    "isDirect": false,
    "via": [
      "vite"
    ],
    "effects": [
      "vitest"
    ],
    "range": "<=2.2.0-beta.2",
    "nodes": [
      "node_modules/vite-node"
    ],
    "fixAvailable": {
      "name": "vitest",
      "version": "4.0.9",
      "isSemVerMajor": true
    }
  },
  "vitest": {
    "name": "vitest",
    "severity": "moderate",
    "isDirect": true,
    "via": [
      "@vitest/mocker",
      "@vitest/ui",
      "vite",
      "vite-node"
    ],
    "effects": [
      "@vitest/ui"
    ],
    "range": "0.0.1 - 0.0.12 || 0.0.29 - 0.0.122 || 0.3.3 - 3.0.0-beta.4 || 4.0.0-beta.1 - 4.0.0-beta.14",
    "nodes": [
      "node_modules/vitest"
    ],
    "fixAvailable": {
      "name": "vitest",
      "version": "4.0.9",
      "isSemVerMajor": true
    }
  }
}
```

### 2. Outdated Packages
```json
{
  "@types/node": {
    "current": "20.19.25",
    "wanted": "20.19.25",
    "latest": "24.10.1",
    "dependent": "webapp",
    "location": "/home/user/webapp/node_modules/@types/node"
  },
  "@types/react": {
    "current": "19.2.4",
    "wanted": "19.2.5",
    "latest": "19.2.5",
    "dependent": "webapp",
    "location": "/home/user/webapp/node_modules/@types/react"
  },
  "@vitest/ui": {
    "current": "2.1.9",
    "wanted": "2.1.9",
    "latest": "4.0.9",
    "dependent": "webapp",
    "location": "/home/user/webapp/node_modules/@vitest/ui"
  },
  "eslint-config-next": {
    "current": "16.0.2",
    "wanted": "16.0.2",
    "latest": "16.0.3",
    "dependent": "webapp",
    "location": "/home/user/webapp/node_modules/eslint-config-next"
  },
  "vitest": {
    "current": "2.1.9",
    "wanted": "2.1.9",
    "latest": "4.0.9",
    "dependent": "webapp",
    "location": "/home/user/webapp/node_modules/vitest"
  },
  "zod": {
    "current": "3.25.76",
    "wanted": "3.25.76",
    "latest": "4.1.12",
    "dependent": "webapp",
    "location": "/home/user/webapp/node_modules/zod"
  }
}
```

### 3. Security Headers
✅ Configured

### 4. OWASP Quick Check
- SQL Injection Risk Points: 0
- Crypto Implementations: 0
- Session Management Files: 3

## Recommendations

### High Priority
1. Upgrade vitest and related packages to fix esbuild vulnerability
2. Review and fix js-yaml vulnerability in depcheck
3. Add comprehensive security headers in next.config.ts
4. Implement CSRF protection for all POST/PUT/DELETE endpoints

### Medium Priority
1. Add rate limiting to all public API endpoints
2. Implement request validation middleware
3. Add security.txt file for responsible disclosure
4. Enable Content Security Policy (CSP)

### Low Priority
1. Add automated security testing to CI/CD
2. Implement dependency update automation (Dependabot/Renovate)
3. Add security linting rules to ESLint
4. Create security documentation

## Action Items
- [ ] Run `npm audit fix` for automatic fixes
- [ ] Manual review of remaining vulnerabilities
- [ ] Add security headers middleware
- [ ] Implement CSRF tokens
- [ ] Set up Snyk/Dependabot monitoring
- [ ] Create security incident response plan

