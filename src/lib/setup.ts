import { createInitialAdmin } from '@/lib/init-admin';

async function main() {
  console.log('Setting up initial admin user...');
  await createInitialAdmin();
  console.log('Setup complete!');
}

main()
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
