#!/usr/bin/env node

/**
 * Firestore Security Rules Deployment Script
 * Multi-Vendor Ecommerce Marketplace
 * 
 * This script helps deploy the production-grade security rules safely
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Firestore Security Rules Deployment');
console.log('=====================================\n');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.error('❌ Firebase CLI not found. Please install it first:');
  console.error('npm install -g firebase-tools');
  process.exit(1);
}

// Check if firestore.rules file exists
const rulesPath = path.join(__dirname, 'firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error('❌ firestore.rules file not found');
  process.exit(1);
}

console.log('✅ firestore.rules file found');

// Read and validate rules file
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
if (!rulesContent.includes('rules_version = \'2\'')) {
  console.error('❌ Invalid rules format - missing rules_version');
  process.exit(1);
}

console.log('✅ Rules file format is valid');

// Check if user is logged in to Firebase
try {
  execSync('firebase projects:list', { stdio: 'ignore' });
  console.log('✅ Firebase authentication verified');
} catch (error) {
  console.error('❌ Not logged in to Firebase. Please run:');
  console.error('firebase login');
  process.exit(1);
}

// Get current project
let currentProject;
try {
  const projectInfo = execSync('firebase use', { encoding: 'utf8' });
  const match = projectInfo.match(/Currently using project (.+)/);
  currentProject = match ? match[1] : 'unknown';
  console.log(`✅ Current Firebase project: ${currentProject}`);
} catch (error) {
  console.error('❌ No Firebase project selected. Please run:');
  console.error('firebase use <project-id>');
  process.exit(1);
}

console.log('\n🚀 Deploying Security Rules...\n');

// Backup current rules (optional)
try {
  console.log('📦 Creating backup of current rules...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `firestore-rules-backup-${timestamp}.txt`;
  
  try {
    execSync(`firebase firestore:rules:get > ${backupFile}`, { stdio: 'inherit' });
    console.log(`✅ Backup created: ${backupFile}`);
  } catch (backupError) {
    console.log('⚠️  Could not create backup (rules might not exist yet)');
  }
} catch (error) {
  console.log('⚠️  Backup creation failed, continuing with deployment...');
}

// Deploy the rules
try {
  console.log('\n🔄 Deploying new security rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('\n✅ Security rules deployed successfully!');
} catch (error) {
  console.error('\n❌ Deployment failed!');
  console.error('Please check the error messages above and fix any issues.');
  process.exit(1);
}

console.log('\n🎉 Deployment Complete!');
console.log('======================\n');

console.log('Next Steps:');
console.log('1. 🧪 Test the rules with different user roles');
console.log('2. 🔍 Monitor Firebase Console for any rule violations');
console.log('3. 📊 Check Firebase usage to monitor rule performance');
console.log('4. 🚀 Your marketplace is now secured with production-grade rules!');

console.log('\n📚 Documentation:');
console.log('- Security rules details: FIRESTORE_SECURITY_RULES.md');
console.log('- Firebase Console: https://console.firebase.google.com/');

console.log('\n⚠️  Important Reminders:');
console.log('- Blocked users cannot perform any operations');
console.log('- Only approved vendors can create products');
console.log('- Admins have full control over all data');
console.log('- Test thoroughly before going live!');