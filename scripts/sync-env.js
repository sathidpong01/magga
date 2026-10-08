const { execFileSync } = require('node:child_process');
const { parse } = require('dotenv');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '../.env.local');

if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found!');
  process.exit(1);
}

// Read and parse environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = parse(envContent);
const vercelCli = require.resolve('vercel/dist/index.js');

// Sync each environment variable to Vercel
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    try {
      console.log(`Syncing ${key}...`);
      execFileSync(process.execPath, [vercelCli, 'env', 'add', key, 'production,preview,development', `--value=${value}`], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch {
      console.error(`Failed to sync ${key}. Check the Vercel CLI output above.`);
    }
  }
});

console.log('Environment variables synced to Vercel!');
