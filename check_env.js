const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

console.log('--- Checking Environment Variables ---');
console.log('Target file:', envPath);

if (!fs.existsSync(envPath)) {
    console.error('❌ ERROR: .env.local file NOT found at this path!');
    process.exit(1);
}

try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('✅ File found. Size:', content.length, 'bytes');
    
    // Check for BOM (Byte Order Mark)
    if (content.charCodeAt(0) === 0xFEFF) {
        console.log('⚠️ WARNING: File has UTF-8 BOM. This might cause issues with some parsers.');
    }

    const lines = content.split(/\r?\n/);
    console.log('Total lines:', lines.length);

    let foundId = false;
    let foundSecret = false;

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Skip comments
        if (trimmed.startsWith('#') || trimmed === '') return;

        if (trimmed.startsWith('GOOGLE_CLIENT_ID')) {
            foundId = true;
            console.log(`✅ Found GOOGLE_CLIENT_ID at line ${index + 1}`);
            const parts = trimmed.split('=');
            if (parts.length < 2 || parts[1].trim() === '') {
                console.log('   ⚠️ Value seems empty or invalid');
            } else {
                console.log('   Value starts with:', parts[1].trim().substring(0, 5) + '...');
            }
        }
        if (trimmed.startsWith('GOOGLE_CLIENT_SECRET')) {
            foundSecret = true;
            console.log(`✅ Found GOOGLE_CLIENT_SECRET at line ${index + 1}`);
        }
    });

    console.log('--------------------------------------');
    if (foundId && foundSecret) {
        console.log('🎉 SUCCESS: Both Google keys appear to be present in the file.');
        console.log('If Next.js still complains, try restarting the terminal/command prompt entirely.');
    } else {
        console.error('❌ FAILURE: Missing keys in .env.local');
        if (!foundId) console.error('   - GOOGLE_CLIENT_ID is missing');
        if (!foundSecret) console.error('   - GOOGLE_CLIENT_SECRET is missing');
    }

} catch (err) {
    console.error('❌ Error reading file:', err.message);
}
