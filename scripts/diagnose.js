#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Diagnostic Script for "Class extends value undefined" Error
 * Run with: node diagnose.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing "Class extends value undefined" error...\n');

// Check 1: package.json
console.log('1️⃣ Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const zodVersion = packageJson.dependencies?.zod;
  
  if (!zodVersion) {
    console.log('   ⚠️  Zod not found in dependencies');
  } else if (zodVersion.includes('4.')) {
    console.log(`   ❌ PROBLEM FOUND: Zod version is ${zodVersion}`);
    console.log('   ❌ Zod v4 does not exist! Latest is 3.x');
    console.log('   💡 Fix: Change "zod": "^4.1.12" to "zod": "^3.23.8"');
  } else if (zodVersion.includes('3.')) {
    console.log(`   ✅ Zod version looks correct: ${zodVersion}`);
  } else {
    console.log(`   ⚠️  Unusual Zod version: ${zodVersion}`);
  }
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
}

// Check 2: node_modules
console.log('\n2️⃣ Checking node_modules...');
const zodPath = './node_modules/zod';
if (fs.existsSync(zodPath)) {
  try {
    const zodPackage = JSON.parse(fs.readFileSync(path.join(zodPath, 'package.json'), 'utf8'));
    console.log(`   ✅ Zod is installed: v${zodPackage.version}`);
    
    if (zodPackage.version.startsWith('4.')) {
      console.log('   ❌ PROBLEM: Zod v4 is installed (shouldn\'t exist!)');
      console.log('   💡 Fix: Delete node_modules and reinstall');
    }
  } catch (_error) {
    console.log(`   ⚠️  Zod folder exists but package.json is unreadable`);
  }
} else {
  console.log('   ❌ Zod is not installed in node_modules');
  console.log('   💡 Fix: Run "bun install" or "npm install"');
}

// Check 3: .env file
console.log('\n3️⃣ Checking .env file...');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const hasSupabaseUrl = envContent.includes('EXPO_PUBLIC_SUPABASE_URL=');
  const hasSupabaseKey = envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=');
  const hasBackendUrl = envContent.includes('EXPO_PUBLIC_RORK_API_BASE_URL=');
  
  console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} EXPO_PUBLIC_SUPABASE_URL`);
  console.log(`   ${hasSupabaseKey ? '✅' : '❌'} EXPO_PUBLIC_SUPABASE_ANON_KEY`);
  console.log(`   ${hasBackendUrl ? '✅' : '❌'} EXPO_PUBLIC_RORK_API_BASE_URL`);
  
  if (envContent.includes('your-tunnel-url')) {
    console.log('   ⚠️  Backend URL still has placeholder "your-tunnel-url"');
    console.log('   💡 Update with actual tunnel URL from server output');
  }
} else {
  console.log('   ❌ .env file not found');
  console.log('   💡 Create .env file with Supabase credentials');
}

// Check 4: Backend files
console.log('\n4️⃣ Checking backend files...');
const honoPath = './backend/hono.ts';
if (fs.existsSync(honoPath)) {
  const honoContent = fs.readFileSync(honoPath, 'utf8');
  if (honoContent.includes('from "hono/cors"')) {
    console.log('   ❌ PROBLEM: backend/hono.ts still imports from "hono/cors"');
    console.log('   💡 This import is broken in Hono v4');
  } else if (honoContent.includes('Access-Control-Allow-Origin')) {
    console.log('   ✅ CORS middleware looks correct');
  } else {
    console.log('   ⚠️  No CORS configuration found');
  }
} else {
  console.log('   ❌ backend/hono.ts not found');
}

// Check 5: Lock files
console.log('\n5️⃣ Checking lock files...');
const lockFiles = ['bun.lock', 'package-lock.json', 'yarn.lock'];
const foundLocks = lockFiles.filter(f => fs.existsSync(f));
if (foundLocks.length > 1) {
  console.log(`   ⚠️  Multiple lock files found: ${foundLocks.join(', ')}`);
  console.log('   💡 This can cause conflicts. Keep only one (bun.lock recommended)');
} else if (foundLocks.length === 1) {
  console.log(`   ✅ Using ${foundLocks[0]}`);
} else {
  console.log('   ⚠️  No lock file found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 SUMMARY & RECOMMENDED ACTIONS');
console.log('='.repeat(60));

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const zodVersion = packageJson.dependencies?.zod;

if (zodVersion && zodVersion.includes('4.')) {
  console.log('\n🚨 PRIMARY ISSUE: Invalid Zod version');
  console.log('\n📝 TO FIX:');
  console.log('   1. Edit package.json line 59');
  console.log('      Change: "zod": "^4.1.12"');
  console.log('      To:     "zod": "^3.23.8"');
  console.log('   2. Run: rm -rf node_modules && rm -f bun.lock');
  console.log('   3. Run: bun install');
  console.log('   4. Run: npx expo start -c');
} else if (!fs.existsSync('./node_modules/zod')) {
  console.log('\n⚠️  Dependencies not installed');
  console.log('\n📝 TO FIX:');
  console.log('   1. Run: bun install');
  console.log('   2. Run: npx expo start -c');
} else {
  console.log('\n✅ No obvious issues found');
  console.log('\n📝 TRY:');
  console.log('   1. Clear cache: npx expo start -c');
  console.log('   2. Check server logs for specific errors');
}

console.log('\n💡 For detailed instructions, see: URGENT_FIX_INSTRUCTIONS.md\n');
