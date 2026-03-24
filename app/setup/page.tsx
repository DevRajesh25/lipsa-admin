'use client';

import { useState } from 'react';
import { initializeCompleteDemo, createAdminUser } from '@/lib/setup/initializeFirebase';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@marketplace.com');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [adminName, setAdminName] = useState('Admin User');
  const router = useRouter();

  const handleQuickSetup = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await initializeCompleteDemo();
      setMessage('✅ Firebase initialized successfully! You can now login with the admin credentials.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(`❌ Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await createAdminUser(adminEmail, adminPassword, adminName);
      setMessage('✅ Admin user created successfully! You can now login.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(`❌ Failed to create admin: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Firebase Setup</h1>
          <p className="text-gray-600">Initialize your marketplace database</p>
        </div>

        {/* Quick Setup */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Setup</h2>
              <p className="text-gray-600 mb-4">
                Initialize Firebase with complete demo data including admin user, categories, vendors, products, and orders.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">This will create:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Admin user (admin@marketplace.com / Admin@123)</li>
                  <li>✓ 5 product categories</li>
                  <li>✓ 2 sample vendors</li>
                  <li>✓ 1 sample customer</li>
                  <li>✓ 2 sample products</li>
                  <li>✓ 1 sample order</li>
                </ul>
              </div>
              <button
                onClick={handleQuickSetup}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Run Quick Setup'}
              </button>
            </div>
          </div>
        </div>

        {/* Custom Admin Setup */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Admin Only</h2>
              <p className="text-gray-600 mb-6">
                Create just an admin user without demo data.
              </p>
              
              <form onSubmit={handleCreateAdminOnly} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Admin User'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Warning */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">⚠️ Important:</span> Make sure your Firebase credentials are properly configured in .env.local before running setup.
          </p>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
