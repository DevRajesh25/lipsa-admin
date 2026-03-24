/**
 * Run this in your browser console while logged into your app
 * This will create an admin user document for the current user
 */

// Import Firebase functions (assuming they're available globally)
// If not, you'll need to run this from within your app's context

async function createAdminUser() {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    console.log('🔥 Creating admin user document...');
    console.log('User UID:', user.uid);
    console.log('Email:', user.email);

    // Create admin user document
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName || 'Admin User',
      email: user.email,
      role: 'admin',
      isBlocked: false,
      createdAt: new Date(),
    });

    console.log('✅ Admin user created successfully!');
    console.log('You can now use admin features.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Run the function
createAdminUser();