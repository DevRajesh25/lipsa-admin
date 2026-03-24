'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/types';
import TableSkeleton from '@/components/admin/TableSkeleton';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      
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
          
          return {
            id: docSnap.id,
            customerId: data.customerId || '',
            customerName,
            vendors: data.vendors || [],
            totalAmount: data.totalAmount || 0,
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
