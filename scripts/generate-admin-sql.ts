import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function generateSQL() {
  console.log('\n=== 🔐 Admin User SQL Generator for Turso Console ===\n');

  rl.question('Enter admin username (default: admin): ', (usernameInput) => {
    const username = usernameInput.trim() || 'admin';

    rl.question('Enter admin password: ', async (password) => {
      if (!password) {
        console.error('\n❌ Password cannot be empty!');
        rl.close();
        return;
      }

      console.log('\n⏳ Generating password hash...\n');
      const hashedPassword = await bcrypt.hash(password, 10);

      console.log('✅ SQL Statement ready! Copy and paste this into Turso Console:\n');
      console.log('═'.repeat(80));
      console.log(`
-- Delete existing admin user (if any)
DELETE FROM "User" WHERE username = '${username}';

-- Create new admin user with ADMIN role
INSERT INTO "User" (id, username, password, role, createdAt, updatedAt)
VALUES (
  '${generateCUID()}',
  '${username}',
  '${hashedPassword}',
  'admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verify the user was created
SELECT username, role, createdAt FROM "User" WHERE username = '${username}';
      `.trim());
      console.log('\n' + '═'.repeat(80));
      console.log('\n✅ Done! Your credentials:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log('\n📝 Note: After running this SQL in Turso Console, you can login with these credentials.\n');

      rl.close();
    });
  });
}

// Simple CUID generator (compatible with Prisma default)
function generateCUID(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}`;
}

generateSQL().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
