import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseEnvFile(path) {
  const values = {};
  if (!existsSync(path)) return values;

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?(VITE_API_BASE_URL|VITE_USE_MOCK)\s*=\s*(.*?)\s*$/);
    if (!match) continue;

    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    values[match[1]] = value;
  }
  return values;
}

// Production-specific files override generic local files, matching Vite precedence.
const env = Object.assign(
  {},
  parseEnvFile(resolve('.env')),
  parseEnvFile(resolve('.env.local')),
  parseEnvFile(resolve('.env.production')),
  parseEnvFile(resolve('.env.production.local')),
  process.env,
);

const errors = [];
const apiBase = (env.VITE_API_BASE_URL ?? '').trim();

if (!apiBase) {
  errors.push('VITE_API_BASE_URL is required for a production build.');
} else {
  try {
    const url = new URL(apiBase);
    const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
    if (url.protocol !== 'https:') errors.push('VITE_API_BASE_URL must use HTTPS.');
    if (localHosts.has(url.hostname) || url.hostname.endsWith('.localhost')) {
      errors.push('VITE_API_BASE_URL must not point to localhost.');
    }
    if (url.username || url.password || url.search || url.hash) {
      errors.push('VITE_API_BASE_URL must not contain credentials, query parameters, or a fragment.');
    }
  } catch {
    errors.push('VITE_API_BASE_URL must be a valid absolute URL.');
  }
}

if (typeof env.VITE_USE_MOCK !== 'string' || env.VITE_USE_MOCK.trim().toLowerCase() !== 'false') {
  errors.push('VITE_USE_MOCK must be explicitly set to false for production.');
}

if (errors.length) {
  console.error('Production build configuration is invalid:');
  for (const error of errors) console.error('- ' + error);
  process.exit(1);
}

console.log('Production frontend configuration validated (HTTPS API, mock disabled).');
