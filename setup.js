#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 TURBOREPO FLASHFUSION TEMPLATE SETUP');
console.log('=====================================');

// Check if we're in a new project setup
const isNewProject = process.argv.includes('--new-project');

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Build all packages
console.log('\n🏗️ Building all packages...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ All packages built successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Setup environment file if it doesn't exist
if (!fs.existsSync('.env.local')) {
  console.log('\n📝 Setting up environment file...');
  fs.copyFileSync('.env.example', '.env.local');
  console.log('✅ .env.local created from template');
  console.log('⚠️  Please update .env.local with your actual values');
}

// Initialize git if this is a new project
if (isNewProject && !fs.existsSync('.git')) {
  console.log('\n🔧 Initializing git repository...');
  try {
    execSync('git init', { stdio: 'inherit' });
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Initial commit: FlashFusion TurboRepo Template"', { stdio: 'inherit' });
    console.log('✅ Git repository initialized');
  } catch (error) {
    console.log('⚠️  Git initialization skipped:', error.message);
  }
}

console.log('\n✅ SETUP COMPLETE!');
console.log('🎯 NEXT STEPS:');
console.log('1. 🚀 npm run dev - Start development');
console.log('2. 🌐 Open http://localhost:3000 in your browser');
console.log('3. 📝 Update .env.local with your API keys');
console.log('4. 📱 npm run restore-state - Restore development session');
console.log('5. 🔧 turbo gen workspace --name=my-app --type=app - Add new workspace');

console.log('\n📚 RESOURCES:');
console.log('• README.md - Complete documentation');
console.log('• knowledge-base/ - AI patterns and best practices');
console.log('• .env.example - Environment variables template');

console.log('\n🎉 Happy coding with FlashFusion TurboRepo!');
