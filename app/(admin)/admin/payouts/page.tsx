'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PayoutRequest, Vendor } from '@/types';
import { approvePayoutRequest, rejectPayoutRequest, markPayoutAsPaid } from '@/lib/services/payoutService';
import TableSkeleton from '@/components/admin/TableSkeleton';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';
import { DollarSign, Eye, X, Building2, CreditCard } from 'lucide-react';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'paid'>('all');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [vendorDetails, setVendorDetails] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'payoutRequests'));
      
      const payoutsList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Get vendor name from vendors collection
          let vendorName = 'Unknown';
          if (data.vendorId) {
            try {
              const vendorDoc = await getDoc(doc(db, 'vendors', data.vendorId));
              if (vendorDoc.exists()) {
                vendorName = vendorDoc.data().name || 'Unknown';
              } else {
                console.warn(`Vendor not found: ${data.vendorId}`);
              }
            } catch (error) {
              console.error(`Error fetching vendor ${data.vendorId}:`, error);
            }
          }
          
          return {
            id: docSnap.id,
            vendorId: data.vendorId || '',
            vendorName,
            amount: data.amount || 0,
            status: data.status || 'pending',
            requestDate: data.requestDate?.toDate() || new Date(),
            processedDate: data.processedDate?.toDate(),
          } as PayoutRequest;
        })
      );

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

  const viewPayoutDetails = async (payout: PayoutRequest) => {
    console.log('Viewing payout details:', payout);
    setSelectedPayout(payout);
    setLoadingVendor(true);
    
    try {
      console.log('Fetching vendor details for:', payout.vendorId);
      const vendorDoc = await getDoc(doc(db, 'vendors', payout.vendorId));
      
      if (vendorDoc.exists()) {
        const vendorData = {
          id: vendorDoc.id,
          ...vendorDoc.data(),
          createdAt: vendorDoc.data().createdAt?.toDate() || new Date(),
        } as Vendor;
        
        console.log('Vendor details loaded:', vendorData);
        setVendorDetails(vendorData);
      } else {
        console.warn('Vendor document not found');
        showToast('Vendor details not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      showToast('Failed to load vendor details', 'error');
    } finally {
      setLoadingVendor(false);
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewPayoutDetails(payout)}
                          className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payout.status === 'pending' && (
                          <>
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
                          </>
                        )}
                        {payout.status === 'approved' && (
                          <button
                            onClick={() => updateStatus(payout.id, 'paid')}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors font-medium"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedPayout && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => {
            setSelectedPayout(null);
            setVendorDetails(null);
          }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-3xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Payout Details</h3>
                  <p className="text-purple-100 text-sm">Vendor information and bank details</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPayout(null);
                    setVendorDetails(null);
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Payout Info */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-l-4 border-purple-500">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Payout Request ID</p>
                <p className="font-mono text-sm font-bold text-gray-900">{selectedPayout.id}</p>
              </div>

              {/* Amount Card */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-5 text-white shadow-lg">
                <p className="text-sm font-semibold mb-1">Payout Amount</p>
                <p className="text-3xl font-bold">₹{selectedPayout.amount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-green-100 mt-1">
                  Requested on {selectedPayout.requestDate.toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Vendor Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Vendor Information</h4>
                </div>

                {loadingVendor ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : vendorDetails ? (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Vendor Name</p>
                      <p className="font-bold text-gray-900">{vendorDetails.name}</p>
                    </div>

                    {vendorDetails.storeName && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Store Name</p>
                        <p className="font-semibold text-gray-900">{vendorDetails.storeName}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{vendorDetails.email}</p>
                      </div>

                      {vendorDetails.phone && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs text-gray-600 mb-1">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{vendorDetails.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Vendor details not available</p>
                )}
              </div>

              {/* Bank Details */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5 border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Bank Details</h4>
                </div>

                {loadingVendor ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : vendorDetails?.bankDetails ? (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Account Holder Name</p>
                      <p className="font-bold text-gray-900">{vendorDetails.bankDetails.accountHolderName}</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">Account Number</p>
                      <p className="font-mono font-bold text-gray-900">{vendorDetails.bankDetails.accountNumber}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Bank Name</p>
                        <p className="font-semibold text-gray-900">{vendorDetails.bankDetails.bankName}</p>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">IFSC Code</p>
                        <p className="font-mono font-semibold text-gray-900">{vendorDetails.bankDetails.ifscCode}</p>
                      </div>
                    </div>

                    {vendorDetails.bankDetails.branch && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">Branch</p>
                        <p className="font-semibold text-gray-900">{vendorDetails.bankDetails.branch}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-800">⚠️ Bank details not provided by vendor</p>
                    <p className="text-xs text-yellow-700 mt-1">Please contact the vendor to update their bank information</p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Payout Status</p>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                  selectedPayout.status === 'paid' ? 'bg-green-500 text-white' :
                  selectedPayout.status === 'approved' ? 'bg-blue-500 text-white' :
                  selectedPayout.status === 'rejected' ? 'bg-red-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {selectedPayout.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 rounded-b-3xl p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedPayout(null);
                  setVendorDetails(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
}
