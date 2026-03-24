/**
 * Quick script to create admin user in Firestore
 * Run: node create-admin.js YOUR_EMAIL@example.com
 */

const https = require('https');

const USER_UID = '6UEfM5O4WNgUBWKSw38hsdVtaah1';
const USER_EMAIL = process.argv[2] || 'admin@example.com';
const USER_NAME = 'Admin User';
const PROJECT_ID = 'lipsa-aec23';

console.log('🔥 Creating admin user in Firestore...');
console.log('User UID:', USER_UID);
console.log('Email:', USER_EMAIL);

const data = JSON.stringify({
  fields: {
    name: { stringValue: USER_NAME },
    email: { stringValue: USER_EMAIL },
    role: { stringValue: 'admin' },
    isBlocked: { booleanValue: false },
    createdAt: { timestampValue: new Date().toISOString() }
  }
});

const options = {
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?documentId=${USER_UID}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Admin user created successfully!');
      console.log(`\nDocument created at: users/${USER_UID}`);
      console.log('\n🎉 You can now login with your credentials!');
    } else {
      console.error('❌ Error creating user:', res.statusCode);
      console.error('Response:', responseData);
      console.log('\n⚠️ You may need to create the user manually in Firebase Console');
      console.log('Go to: https://console.firebase.google.com/project/lipsa-aec23/firestore');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n📝 Manual Setup Required:');
  console.log('1. Go to: https://console.firebase.google.com/project/lipsa-aec23/firestore');
  console.log('2. Create document in "users" collection');
  console.log(`3. Document ID: ${USER_UID}`);
  console.log('4. Add fields:');
  console.log('   - name (string): "Admin User"');
  console.log(`   - email (string): "${USER_EMAIL}"`);
  console.log('   - role (string): "admin"');
  console.log('   - isBlocked (boolean): false');
  console.log('   - createdAt (timestamp): current time');
});

req.write(data);
req.end();
