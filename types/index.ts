export type UserRole = 'admin' | 'vendor' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  storeName?: string;
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'suspended';
  totalProducts: number;
  totalOrders?: number;
  totalRevenue?: number;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  vendorId: string;
  vendorName: string;
  categoryId: string;
  price: number;
  stock: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  slug: string;
  productCount: number;
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  vendors: string[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: Date;
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refundAmount: number;
  createdAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: Date;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  position: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PayoutRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestDate: Date;
  processedDate?: Date;
}

export interface Settings {
  commissionPercentage: number;
}

// Platform Settings Types
export interface PlatformSettings {
  currency: string;
  taxRate: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  maintenanceMode: boolean;
  vendorRegistrationEnabled: boolean;
  productApprovalRequired: boolean;
}

export interface CommissionSettings {
  commissionPercentage: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  orderNotifications: boolean;
  payoutNotifications: boolean;
}

export interface InfluencerVideo {
  id: string;
  videoUrl: string;
  productId: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadDate: Date;
  createdAt: Date;
}

export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  activeVendors: number;
  totalProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  platformCommission: number;
}

// Analytics specific types
export interface AnalyticsStats extends DashboardStats {
  avgOrderValue: number;
  newCustomersThisMonth: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface CategoryAnalytics {
  name: string;
  value: number;
  revenue: number;
  productCount: number;
}

export interface VendorAnalytics {
  id: string;
  name: string;
  revenue: number;
  commission: number;
  orders: number;
  products: number;
}

export interface TopProduct {
  id: string;
  name: string;
  vendorName: string;
  categoryName: string;
  sales: number;
  revenue: number;
}

// Razorpay Configuration Types
export interface RazorpaySettings {
  keyId: string;
  keySecret: string;
  isActive: boolean;
  updatedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  vendorId: string;
  type: 'approved' | 'rejected' | 'payout' | 'return';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
