'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AdminProtectedRoute(props: P) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          // Not logged in, redirect to login
          router.push('/login');
        } else if (!isAdmin) {
          // Logged in but not admin, redirect to home or show error
          router.push('/');
        }
      }
    }, [user, loading, isAdmin, router]);

    // Show loading state while checking auth
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Don't render component if not authenticated or not admin
    if (!user || !isAdmin) {
      return null;
    }

    return <Component {...props} />;
  };
}
