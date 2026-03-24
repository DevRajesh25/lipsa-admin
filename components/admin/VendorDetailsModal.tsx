'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vendor, Product } from '@/types';
import { X, Store, Mail, Phone, Calendar, Package, ShoppingCart, TrendingUp, Clock } from 'lucide-react';

interface VendorDetailsModalProps {
  isOpen: boolean;
  vendorId: string | null;
  onClose: () => void;
}

interface VendorStats {
  totalProducts: number;
  totalOrders: number;
  recentProducts: Product[];
}

export default function VendorDetailsModal({ isOpen, vendorId, onClose }: VendorDetailsModalProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && vendorId) {
      fetchVendorDetails();
    }
  }, [isOpen, vendorId]);

  const fetchVendorDetails = async () => {
    if (!vendorId) return;
    
    setLoading(true);
    try {
      // Fetch vendor details
      const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
      if (vendorDoc.exists()) {
        const vendorData = {
          id: vendorDoc.id,
          ...vendorDoc.data(),
          createdAt: vendorDoc.data().createdAt?.toDate() || new Date(),
        } as Vendor;
        setVendor(vendorData);

        // Fetch vendor statistics
        await fetchVendorStats(vendorId);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorStats = async (vendorId: string) => {
    try {
      // Get total products count
      const productsQuery = query(collection(db, 'products'), where('vendorId', '==', vendorId));
      const productsCount = await getCountFromServer(productsQuery);

      // Get total orders count
      const ordersQuery = query(collection(db, 'orders'), where('vendorId', '==', vendorId));
      const ordersCount = await getCountFromServer(ordersQuery);

      // Get recent products (last 5)
      const recentProductsSnapshot = await getDocs(
        query(
          collection(db, 'products'),
          where('vendorId', '==', vendorId)
        )
      );

      const recentProducts = recentProductsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5) as Product[];

      setStats({
        totalProducts: productsCount.data().count,
        totalOrders: ordersCount.data().count,
        recentProducts,
      });
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        recentProducts: [],
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
      suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Vendor Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vendor details...</p>
          </div>
        ) : vendor ? (
          <div className="p-6 space-y-6">
            {/* Section 1: Vendor Profile */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-purple-600" />
                Vendor Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor Name</label>
                    <p className="text-lg font-semibold text-gray-900">{vendor.name}</p>
                  </div>
                  {vendor.storeName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Store Name</label>
                      <p className="text-lg font-semibold text-gray-900">{vendor.storeName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(vendor.status)}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{vendor.email}</p>
                    </div>
                  </div>
                  {vendor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900">{vendor.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Join Date</label>
                      <p className="text-gray-900">{formatDate(vendor.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Vendor Statistics */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Vendor Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
                  <p className="text-sm text-gray-600">Total Products</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor((Date.now() - vendor.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-sm text-gray-600">Days Active</p>
                </div>
              </div>
            </div>

            {/* Section 3: Recent Products */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Recent Products
              </h3>
              {stats?.recentProducts && stats.recentProducts.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">
                          Added {formatDate(product.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{product.price}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'approved' ? 'bg-green-100 text-green-700' :
                          product.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No products found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Vendor not found</p>
          </div>
        )}
      </div>
    </div>
  );
}