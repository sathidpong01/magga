const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '../.env.local');
const envExamplePath = path.join(__dirname, '../.env.example');

if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found!');
  process.exit(1);
}

// Read and parse environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Sync each environment variable to Vercel
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    try {
      console.log(`Syncing ${key}...`);
      execSync(`vercel env add ${key} --value="${value}" --environment=production,preview,development`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch (error) {
      console.error(`Failed to sync ${key}:`, error.message);
    }
  }
});

console.log('Environment variables synced to Vercel!');
