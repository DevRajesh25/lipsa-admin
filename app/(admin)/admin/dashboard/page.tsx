'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardStats } from '@/types';
import DashboardSkeleton from '@/components/admin/DashboardSkeleton';
import CommissionSettings from '@/components/admin/CommissionSettings';
import DashboardCard from '@/components/admin/DashboardCard';
import AnalyticsCard from '@/components/admin/AnalyticsCard';
import TopBar from '@/components/admin/TopBar';
import { Users, Store, Package, ShoppingCart, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import { getMonthlyRevenue, getOrdersGrowth, getVendorPerformance } from '@/lib/services/analyticsService';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [ordersGrowthData, setOrdersGrowthData] = useState<Array<{ month: string; orders: number }>>([]);
  const [vendorPerformanceData, setVendorPerformanceData] = useState<Array<{ vendorName: string; totalRevenue: number; totalOrders: number }>>([]);
  const [commissionPercentage, setCommissionPercentage] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch counts and commission settings in parallel for better performance
      const [
        usersSnap,
        totalVendorsSnap,
        activeVendorsSnap,
        productsSnap,
        pendingProductsSnap,
        ordersSnap,
        pendingOrdersSnap,
        paidOrdersSnap,
        commissionSnap
      ] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'vendors')),
        getCountFromServer(
          query(collection(db, 'vendors'), where('status', '==', 'approved'))
        ),
        getCountFromServer(collection(db, 'products')),
        getCountFromServer(
          query(collection(db, 'products'), where('status', '==', 'pending'))
        ),
        getCountFromServer(collection(db, 'orders')),
        getCountFromServer(
          query(collection(db, 'orders'), where('orderStatus', '==', 'pending'))
        ),
        getDocs(
          query(collection(db, 'orders'), where('paymentStatus', '==', 'paid'))
        ),
        getDoc(doc(db, 'settings', 'commission'))
      ]);

      // Extract counts
      const totalUsers = usersSnap.data().count;
      const totalVendors = totalVendorsSnap.data().count;
      const activeVendors = activeVendorsSnap.data().count;
      const totalProducts = productsSnap.data().count;
      const pendingProducts = pendingProductsSnap.data().count;
      const totalOrders = ordersSnap.data().count;
      const pendingOrders = pendingOrdersSnap.data().count;

      // Calculate total revenue from paid orders
      let totalRevenue = 0;
      paidOrdersSnap.forEach((doc) => {
        const order = doc.data();
        totalRevenue += order.totalAmount || 0;
      });

      // Fetch commission percentage from Firestore settings
      const commissionPercentage = commissionSnap.exists() 
        ? commissionSnap.data().commissionPercentage || 0 
        : 0;

      // Calculate platform commission
      const platformCommission = (totalRevenue * commissionPercentage) / 100;

      setCommissionPercentage(commissionPercentage);

      // Fetch analytics data in parallel
      const [monthlyRevenue, ordersGrowth, vendorPerformance] = await Promise.all([
        getMonthlyRevenue(6),
        getOrdersGrowth(6),
        getVendorPerformance(5)
      ]);

      // Format data for charts
      const formattedRevenueData = monthlyRevenue.map(item => ({
        month: formatMonthLabel(item.month),
        revenue: item.revenue
      }));

      const formattedOrdersData = ordersGrowth.map(item => ({
        month: formatMonthLabel(item.month),
        orders: item.orders
      }));

      const formattedVendorData = vendorPerformance.map(vendor => ({
        vendorName: vendor.vendorName || 'Unknown Vendor',
        totalRevenue: vendor.totalRevenue,
        totalOrders: vendor.totalOrders
      }));

      // Update state
      setRevenueData(formattedRevenueData);
      setOrdersGrowthData(formattedOrdersData);
      setVendorPerformanceData(formattedVendorData);

      setStats({
        totalUsers,
        totalVendors,
        activeVendors,
        totalProducts,
        pendingProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        platformCommission,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set fallback empty data
      setRevenueData([]);
      setOrdersGrowthData([]);
      setVendorPerformanceData([]);
      
      // Set fallback values for metrics
      setStats({
        totalUsers: 0,
        totalVendors: 0,
        activeVendors: 0,
        totalProducts: 0,
        pendingProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        platformCommission: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format month labels
  const formatMonthLabel = (monthString: string): string => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  if (loading) return <DashboardSkeleton />;

  // Show loading skeleton if stats are not loaded yet
  if (!stats) return <DashboardSkeleton />;

  return (
    <div>
      <TopBar title="Dashboard Overview" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-100 to-blue-200"
          change="+12.5%"
          changeType="positive"
          index={0}
        />
        <DashboardCard
          title="Total Vendors"
          value={stats?.totalVendors || 0}
          icon={Store}
          gradient="bg-gradient-to-br from-purple-100 to-purple-200"
          change="+8.2%"
          changeType="positive"
          index={1}
        />
        <DashboardCard
          title="Active Vendors"
          value={stats?.activeVendors || 0}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-green-100 to-green-200"
          change="+5.3%"
          changeType="positive"
          index={2}
        />
        <DashboardCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          gradient="bg-gradient-to-br from-pink-100 to-pink-200"
          change="+15.3%"
          changeType="positive"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardCard
          title="Pending Products"
          value={stats?.pendingProducts || 0}
          icon={Clock}
          gradient="bg-gradient-to-br from-yellow-100 to-yellow-200"
          index={4}
        />
        <DashboardCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-indigo-100 to-indigo-200"
          change="+23.1%"
          changeType="positive"
          index={5}
        />
        <DashboardCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          icon={Clock}
          gradient="bg-gradient-to-br from-orange-100 to-orange-200"
          index={6}
        />
        <DashboardCard
          title="Platform Commission"
          value={`₹${(stats?.platformCommission || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-100 to-emerald-200"
          change="+18.7%"
          changeType="positive"
          index={7}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <AnalyticsCard title="Total Revenue" className="lg:col-span-2">
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
              </span>
              <span className="flex items-center text-green-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4 mr-1" />
                +18.2%
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Compared to last month</p>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-62.5 text-gray-500">
              <p>No revenue data available</p>
            </div>
          )}
        </AnalyticsCard>

        <CommissionSettings />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AnalyticsCard title="Orders Growth">
          {ordersGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ordersGrowthData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-75 text-gray-500">
              <p>No orders data available</p>
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard title="Vendor Performance">
          {vendorPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis dataKey="vendorName" type="category" stroke="#9ca3af" style={{ fontSize: '12px' }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="totalRevenue" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-75 text-gray-500">
              <p>No vendor performance data available</p>
            </div>
          )}
        </AnalyticsCard>
      </div>
    </div>
  );
}
