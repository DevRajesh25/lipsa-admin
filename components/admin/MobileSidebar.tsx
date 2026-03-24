'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, Store, LogOut, Menu, X,
  FolderTree, RotateCcw, Tag, Image, DollarSign, BarChart3, Settings, Video 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, countKey: null },
  { href: '/admin/vendors', label: 'Vendors', icon: Store, countKey: 'pendingVendors' },
  { href: '/admin/products', label: 'Products', icon: Package, countKey: 'pendingProducts' },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, countKey: null },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, countKey: 'pendingOrders' },
  { href: '/admin/returns', label: 'Returns', icon: RotateCcw, countKey: 'pendingReturns' },
  { href: '/admin/users', label: 'Users', icon: Users, countKey: null },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag, countKey: null },
  { href: '/admin/banners', label: 'Banners', icon: Image, countKey: null },
  { href: '/admin/influencer-videos', label: 'Influencer Videos', icon: Video, countKey: 'pendingVideos' },
  { href: '/admin/payouts', label: 'Payouts', icon: DollarSign, countKey: 'pendingPayouts' },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, countKey: null },
  { href: '/admin/settings', label: 'Settings', icon: Settings, countKey: null },
];

interface PendingCounts {
  pendingVendors: number;
  pendingProducts: number;
  pendingOrders: number;
  pendingReturns: number;
  pendingPayouts: number;
  pendingVideos: number;
}

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<PendingCounts>({
    pendingVendors: 0,
    pendingProducts: 0,
    pendingOrders: 0,
    pendingReturns: 0,
    pendingPayouts: 0,
    pendingVideos: 0,
  });

  useEffect(() => {
    fetchPendingCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCounts = async () => {
    try {
      // Fetch pending vendors
      const vendorsQuery = query(collection(db, 'vendors'), where('status', '==', 'pending'));
      const vendorsSnapshot = await getDocs(vendorsQuery);
      
      // Fetch pending products
      const productsQuery = query(collection(db, 'products'), where('status', '==', 'pending'));
      const productsSnapshot = await getDocs(productsQuery);
      
      // Fetch pending orders
      const ordersQuery = query(collection(db, 'orders'), where('orderStatus', '==', 'pending'));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Fetch pending returns
      const returnsQuery = query(collection(db, 'returns'), where('status', '==', 'pending'));
      const returnsSnapshot = await getDocs(returnsQuery);
      
      // Fetch pending payouts
      const payoutsQuery = query(collection(db, 'payoutRequests'), where('status', '==', 'pending'));
      const payoutsSnapshot = await getDocs(payoutsQuery);
      
      // Fetch pending influencer videos
      const videosQuery = query(collection(db, 'influencerVideos'), where('status', '==', 'pending'));
      const videosSnapshot = await getDocs(videosQuery);

      setCounts({
        pendingVendors: vendorsSnapshot.size,
        pendingProducts: productsSnapshot.size,
        pendingOrders: ordersSnapshot.size,
        pendingReturns: returnsSnapshot.size,
        pendingPayouts: payoutsSnapshot.size,
        pendingVideos: videosSnapshot.size,
      });
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-linear-to-r from-purple-500 to-blue-500 text-white rounded-xl shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed top-0 left-0 w-64 bg-linear-to-b from-gray-50 to-white min-h-screen p-6 flex flex-col z-40 shadow-2xl"
          >
            <div className="mb-10 mt-12">
              <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-sm text-gray-500 mt-1">Multi-Vendor Marketplace</p>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto pr-3 scrollbar-thin">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const count = item.countKey ? counts[item.countKey as keyof PendingCounts] : 0;
                
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                        isActive
                          ? 'bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'
                          : 'text-gray-600 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium flex-1">{item.label}</span>
                      {count > 0 && (
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          isActive 
                            ? 'bg-white text-purple-600' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 font-medium shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
