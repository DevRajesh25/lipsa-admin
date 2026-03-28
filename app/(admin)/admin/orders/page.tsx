'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types';
import TableSkeleton from '@/components/admin/TableSkeleton';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';
import { Eye, X } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      
      // Get settings for calculations
      const platformDoc = await getDoc(doc(db, 'settings', 'platform'));
      const commissionDoc = await getDoc(doc(db, 'settings', 'commission'));
      
      const taxRate = platformDoc.exists() ? platformDoc.data()?.taxRate || 18 : 18;
      const commissionPercentage = commissionDoc.exists() ? commissionDoc.data()?.commissionPercentage || 10 : 10;
      
      const ordersList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let customerName = 'Unknown';
          
          if (data.customerId) {
            const customerDoc = await getDoc(doc(db, 'users', data.customerId));
            if (customerDoc.exists()) {
              customerName = customerDoc.data().name || 'Unknown';
            }
          }
          
          // Calculate breakdown if not present
          let productPrice = data.productPrice || 0;
          let taxAmount = data.taxAmount || 0;
          let commissionAmount = data.commissionAmount || 0;
          let vendorEarnings = data.vendorEarnings || 0;
          let needsUpdate = false;
          
          // If breakdown is missing, calculate from total
          if (!productPrice && data.totalAmount > 0) {
            productPrice = Math.round(data.totalAmount / (1 + taxRate / 100));
            taxAmount = Math.round((productPrice * taxRate) / 100);
            commissionAmount = Math.round((productPrice * commissionPercentage) / 100);
            vendorEarnings = productPrice - commissionAmount;
            needsUpdate = true;
          }
          
          // Save to Firestore if calculated
          if (needsUpdate) {
            try {
              await updateDoc(doc(db, 'orders', docSnap.id), {
                productPrice,
                taxAmount,
                commissionAmount,
                vendorEarnings,
                updatedAt: new Date(),
              });
              console.log(`✅ Updated order ${docSnap.id.slice(0, 8)}... with breakdown`);
            } catch (error) {
              console.error(`Error updating order ${docSnap.id}:`, error);
            }
          }
          
          return {
            id: docSnap.id,
            customerId: data.customerId || '',
            customerName,
            vendors: data.vendors || [],
            totalAmount: data.totalAmount || 0,
            productPrice,
            taxAmount,
            commissionAmount,
            vendorEarnings,
            paymentStatus: data.paymentStatus || 'pending',
            orderStatus: data.orderStatus || 'pending',
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
      );

      setOrders(ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus: status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: status } : o));
      showToast(`Order status updated to ${status}`, 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Order Management" />
        <TableSkeleton rows={5} columns={7} />
      </div>
    );
  }

  return (
    <>
      <div>
        <TopBar title="Order Management" />
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vendors</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Paid</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{order.customerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.vendors.length} vendor(s)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.orderStatus === 'processing' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="group relative p-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            View Details
                          </span>
                        </button>
                        <select
                          value={order.orderStatus}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['orderStatus'])}
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-gray-900 bg-white font-medium transition-all"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-3xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Order Details</h3>
                  <p className="text-purple-100 text-sm">Complete payment breakdown</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Order ID Card */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-l-4 border-purple-500">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Order ID</p>
                <p className="font-mono text-sm font-bold text-gray-900">{selectedOrder.id}</p>
              </div>

              {/* Customer Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Customer Name</p>
                <p className="text-lg font-bold text-gray-900">{selectedOrder.customerName}</p>
              </div>

              {/* Payment Breakdown - Enhanced */}
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-purple-200 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Payment Breakdown</h4>
                </div>
                
                <div className="space-y-3">
                  {/* Product Price */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-gray-700">Product Price</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{(selectedOrder.productPrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-gray-700">Tax (18%)</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{(selectedOrder.taxAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Total Paid - Highlighted */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white uppercase tracking-wide">Total Paid</span>
                      <span className="text-2xl font-bold text-white">
                        ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t-2 border-dashed border-purple-300 my-3"></div>

                  {/* Commission */}
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Platform Commission</span>
                      <p className="text-xs text-gray-500">10% of product price</p>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      ₹{(selectedOrder.commissionAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Vendor Amount - Highlighted */}
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-md">
                    <div>
                      <span className="text-sm font-bold text-white uppercase tracking-wide">Vendor Receives</span>
                      <p className="text-xs text-green-100">After commission</p>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      ₹{(selectedOrder.vendorEarnings || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Payment Status</p>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                    selectedOrder.paymentStatus === 'paid' ? 'bg-green-500 text-white' :
                    selectedOrder.paymentStatus === 'failed' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {selectedOrder.paymentStatus.toUpperCase()}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Order Status</p>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                    selectedOrder.orderStatus === 'delivered' ? 'bg-green-500 text-white' :
                    selectedOrder.orderStatus === 'shipped' ? 'bg-blue-500 text-white' :
                    selectedOrder.orderStatus === 'processing' ? 'bg-purple-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {selectedOrder.orderStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Order Date */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Order Date & Time</p>
                <p className="text-sm font-bold text-gray-900">
                  {selectedOrder.createdAt.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 rounded-b-3xl p-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}
