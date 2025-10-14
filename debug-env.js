/* eslint-disable no-undef */
// Debug script to check environment variables
// Run with: node debug-env.js

console.log('=== Environment Variables Debug ===\n');

console.log('process.env.EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || 'MISSING');
console.log('process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING');
console.log('process.env.EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'MISSING');
console.log('process.env.SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING');

console.log('\n=== All EXPO_PUBLIC_ variables ===\n');
Object.keys(process.env)
  .filter(key => key.startsWith('EXPO_PUBLIC_'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key]);
  });

console.log('\n=== .env file check ===\n');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('✓ .env file exists at:', envPath);
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  console.log(`✓ .env file has ${lines.length} non-empty lines`);
  console.log('\nVariables defined in .env:');
  lines.forEach(line => {
    const [key] = line.split('=');
    console.log(`  - ${key}`);
  });
} else {
  console.log('✗ .env file NOT FOUND at:', envPath);
}

console.log('\n=== Recommendations ===\n');
console.log('1. Ensure .env file is in the project root (same directory as package.json)');
console.log('2. Restart Expo with cache clear: npx expo start -c');
console.log('3. If using Expo Go, environment variables are bundled at build time');
console.log('4. For development, consider using app.json extra config as fallback');
