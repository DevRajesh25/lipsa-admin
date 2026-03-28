import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc,
  Timestamp,
  orderBy,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardStats } from '@/types';

// Get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Use getCountFromServer for better performance
    const [
      usersSnapshot,
      vendorsSnapshot,
      activeVendorsSnapshot,
      productsSnapshot,
      pendingProductsSnapshot,
      ordersSnapshot,
      pendingOrdersSnapshot
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
      )
    ]);
    
    const totalUsers = usersSnapshot.data().count;
    const totalVendors = vendorsSnapshot.data().count;
    const activeVendors = activeVendorsSnapshot.data().count;
    const totalProducts = productsSnapshot.data().count;
    const pendingProducts = pendingProductsSnapshot.data().count;
    const totalOrders = ordersSnapshot.data().count;
    const pendingOrders = pendingOrdersSnapshot.data().count;
    
    // Get paid orders to calculate revenue
    const paidOrdersQuery = query(
      collection(db, 'orders'),
      where('paymentStatus', '==', 'paid')
    );
    const paidOrdersSnapshot = await getDocs(paidOrdersQuery);
    
    // Calculate total revenue from paid orders
    const totalRevenue = paidOrdersSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().totalAmount || 0);
    }, 0);
    
    // Get commission percentage from settings
    const commissionDoc = await getDoc(doc(db, 'settings', 'commission'));
    const commissionPercentage = commissionDoc.exists() 
      ? commissionDoc.data().commissionPercentage || 0 
      : 0;
    
    // Calculate platform commission
    const platformCommission = (totalRevenue * commissionPercentage) / 100;
    
    return {
      totalUsers,
      totalVendors,
      activeVendors,
      totalProducts,
      pendingProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      platformCommission,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
};

// Get monthly revenue data for charts
export const getMonthlyRevenue = async (months: number = 6) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    
    // Get ALL orders (not just delivered) to show revenue data
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(ordersQuery);
    
    // Initialize monthly data for the last N months
    const monthlyData: { [key: string]: number } = {};
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.createdAt?.toDate() || new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = data.totalAmount || 0;
      
      // Only count orders with actual amounts
      if (monthlyData.hasOwnProperty(monthKey) && amount > 0) {
        monthlyData[monthKey] += amount;
      }
    });
    
    // Convert to array format for charts
    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue: Number(revenue), // Ensure it's a number, not a Timestamp
    }));
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    return [];
  }
};

// Get orders growth data
export const getOrdersGrowth = async (months: number = 6) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(ordersQuery);
    
    // Initialize monthly data for the last N months
    const monthlyData: { [key: string]: number } = {};
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.createdAt?.toDate() || new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += 1;
      }
    });
    
    // Convert to array format for charts
    return Object.entries(monthlyData).map(([month, orders]) => ({
      month,
      orders,
    }));
  } catch (error) {
    console.error('Error fetching orders growth:', error);
    return [];
  }
};

// Get vendor performance data
export const getVendorPerformance = async (limit: number = 10) => {
  try {
    const vendorsQuery = query(
      collection(db, 'vendors'),
      where('status', '==', 'approved')
    );
    const vendorsSnapshot = await getDocs(vendorsQuery);
    
    if (vendorsSnapshot.empty) {
      return [];
    }
    
    const vendorPerformance = await Promise.all(
      vendorsSnapshot.docs.map(async (vendorDoc) => {
        const vendorData = vendorDoc.data();
        
        // Get vendor's delivered orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('vendorId', '==', vendorDoc.id),
          where('orderStatus', '==', 'delivered')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().totalAmount || 0);
        }, 0);
        
        const totalOrders = ordersSnapshot.size;
        
        return {
          vendorId: vendorDoc.id,
          vendorName: vendorData.name || vendorData.storeName || 'Unknown Vendor',
          totalRevenue,
          totalOrders,
        };
      })
    );
    
    // Sort by revenue and limit, filter out vendors with no revenue
    return vendorPerformance
      .filter(vendor => vendor.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching vendor performance:', error);
    return [];
  }
};

// Get category performance
export const getCategoryPerformance = async () => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    
    const categoryPerformance = await Promise.all(
      categoriesSnapshot.docs.map(async (categoryDoc) => {
        const categoryData = categoryDoc.data();
        
        // Count products in category
        const productsQuery = query(
          collection(db, 'products'),
          where('categoryId', '==', categoryDoc.id),
          where('status', '==', 'approved')
        );
        const productsSnapshot = await getDocs(productsQuery);
        
        return {
          categoryId: categoryDoc.id,
          categoryName: categoryData.name,
          productCount: productsSnapshot.size,
        };
      })
    );
    
    return categoryPerformance.sort((a, b) => b.productCount - a.productCount);
  } catch (error) {
    console.error('Error fetching category performance:', error);
    throw new Error('Failed to fetch category performance data');
  }
};
