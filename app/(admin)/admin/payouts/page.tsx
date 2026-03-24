'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PayoutRequest } from '@/types';
import { approvePayoutRequest, rejectPayoutRequest, markPayoutAsPaid } from '@/lib/services/payoutService';
import TableSkeleton from '@/components/admin/TableSkeleton';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';
import { DollarSign } from 'lucide-react';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'paid'>('all');
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'payoutRequests'));
      const payoutsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate() || new Date(),
        processedDate: doc.data().processedDate?.toDate(),
      })) as PayoutRequest[];

      setPayouts(payoutsList.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime()));
    } catch (error) {
      console.error('Error fetching payouts:', error);
      showToast('Failed to load payout requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: PayoutRequest['status']) => {
    try {
      if (status === 'approved') {
        await approvePayoutRequest(id);
      } else if (status === 'rejected') {
        await rejectPayoutRequest(id);
      } else if (status === 'paid') {
        await markPayoutAsPaid(id);
      }
      
      const updateData: any = { status };
      if (status !== 'pending') {
        updateData.processedDate = new Date();
      }
      
      setPayouts(payouts.map(p => p.id === id ? { ...p, ...updateData } : p));
      showToast(`Payout request ${status} and vendor notified`, 'success');
    } catch (error) {
      console.error('Error updating payout:', error);
      showToast('Failed to update payout request', 'error');
    }
  };

  const filteredPayouts = filter === 'all' 
    ? payouts 
    : payouts.filter(p => p.status === filter);

  const totalPending = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div>
        <TopBar title="Payout Requests" />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <>
      <div>
        <TopBar title="Payout Requests" />

        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected', 'paid'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Total Pending</p>
                <p className="text-lg font-bold text-gray-900">₹{totalPending.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">{payout.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{payout.vendorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{payout.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payout.requestDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payout.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        payout.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {payout.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(payout.id, 'approved')}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(payout.id, 'rejected')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {payout.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(payout.id, 'paid')}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors font-medium"
                        >
                          Mark as Paid
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
