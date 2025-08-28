#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 TURBOREPO FLASHFUSION AUTO SETUP');
console.log('=====================================');

// Install dependencies
console.log('\n📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

console.log('\n✅ SETUP COMPLETE!');
console.log('🎯 NEXT 5 STEPS:');
console.log('1. 🚀 npm run dev - Start development');
console.log('2. 🏗️ npm run build - Build all packages');  
console.log('3. 🧪 npm test - Run tests');
console.log('4. 📱 Add first app: turbo gen workspace --name=web --type=app');
console.log('5. 🔧 Add shared package: turbo gen workspace --name=ui --type=package');
