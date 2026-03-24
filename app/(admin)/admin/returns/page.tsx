'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Return } from '@/types';
import { approveReturn, rejectReturn, processRefund } from '@/lib/services/returnService';
import TableSkeleton from '@/components/admin/TableSkeleton';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'returns'));
        const returnsList = await Promise.all(
          snapshot.docs.map(async (returnDoc) => {
            const returnData = returnDoc.data();

            // Fetch customer name if not present
            let customerName = returnData.customerName || 'Unknown Customer';
            if (!returnData.customerName && returnData.customerId) {
              try {
                const customerDoc = await getDoc(doc(db, 'users', returnData.customerId));
                if (customerDoc.exists()) {
                  const customerData = customerDoc.data();
                  customerName = customerData.name || customerData.email || 'Unknown Customer';
                }
              } catch (error) {
                console.error('Error fetching customer:', error);
              }
            }

            // Fetch product name if not present
            let productName = returnData.productName || 'Unknown Product';
            if (!returnData.productName && returnData.productId) {
              try {
                const productDoc = await getDoc(doc(db, 'products', returnData.productId));
                if (productDoc.exists()) {
                  const productData = productDoc.data();
                  productName = productData.name || 'Unknown Product';
                }
              } catch (error) {
                console.error('Error fetching product:', error);
              }
            }

            return {
              id: returnDoc.id,
              ...returnData,
              customerName,
              productName,
              createdAt: returnData.createdAt?.toDate() || new Date(),
            };
          })
        ) as Return[];

        setReturns(returnsList);
      } catch (error) {
        console.error('Error fetching returns:', error);
        showToast('Failed to load returns', 'error');
      } finally {
        setLoading(false);
      }
    };

  const updateStatus = async (id: string, status: Return['status']) => {
    try {
      if (status === 'approved') {
        await approveReturn(id);
      } else if (status === 'rejected') {
        await rejectReturn(id);
      } else if (status === 'refunded') {
        await processRefund(id);
      }
      
      setReturns(returns.map(r => r.id === id ? { ...r, status } : r));
      showToast(`Return ${status} successfully and vendor notified`, 'success');
    } catch (error) {
      console.error('Error updating return:', error);
      showToast('Failed to update return', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Return & Refund Management" />
        <TableSkeleton rows={5} columns={7} />
      </div>
    );
  }

  return (
    <>
      <div>
        <TopBar title="Return & Refund Management" />

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Return ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {returns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">{returnItem.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">{returnItem.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{returnItem.customerName || 'Unknown Customer'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{returnItem.productName || 'Unknown Product'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{returnItem.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{(returnItem.refundAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        returnItem.status === 'refunded' ? 'bg-green-100 text-green-700' :
                        returnItem.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        returnItem.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {returnItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {returnItem.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(returnItem.id, 'approved')}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(returnItem.id, 'rejected')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {returnItem.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(returnItem.id, 'refunded')}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors font-medium"
                        >
                          Process Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
}
