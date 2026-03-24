'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vendor } from '@/types';
import TableSkeleton from '@/components/admin/TableSkeleton';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    vendorId: string | null;
    action: 'approve' | 'suspend' | 'reject' | null;
  }>({ isOpen: false, vendorId: null, action: null });
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'vendors'));
      
      const vendorsList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const productsQuery = query(collection(db, 'products'), where('vendorId', '==', docSnap.id));
          const productsCount = await getCountFromServer(productsQuery);
          
          return {
            id: docSnap.id,
            name: data.name || data.storeName || 'N/A',
            email: data.email || 'N/A',
            status: data.status || 'pending',
            totalProducts: productsCount.data().count,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
      );

      setVendors(vendorsList);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showToast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.vendorId || !confirmModal.action) return;

    const statusMap = {
      approve: 'approved' as const,
      suspend: 'suspended' as const,
      reject: 'pending' as const,
    };

    const status = statusMap[confirmModal.action];

    try {
      await updateDoc(doc(db, 'vendors', confirmModal.vendorId), { status });
      setVendors(vendors.map(v => v.id === confirmModal.vendorId ? { ...v, status } : v));

      const actionText = confirmModal.action === 'approve' ? 'approved' : 
                        confirmModal.action === 'suspend' ? 'suspended' : 'reactivated';
      showToast(`Vendor ${actionText} successfully`, 'success');
    } catch (error) {
      console.error('Error updating vendor status:', error);
      showToast('Failed to update vendor status', 'error');
    } finally {
      setConfirmModal({ isOpen: false, vendorId: null, action: null });
    }
  };

  const openConfirmModal = (vendorId: string, action: 'approve' | 'suspend' | 'reject') => {
    setConfirmModal({ isOpen: true, vendorId, action });
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Vendor Management" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  const getModalContent = () => {
    switch (confirmModal.action) {
      case 'approve':
        return {
          title: 'Approve Vendor',
          description: 'Are you sure you want to approve this vendor? They will be able to list products.',
        };
      case 'suspend':
        return {
          title: 'Suspend Vendor',
          description: 'Are you sure you want to suspend this vendor? Their products will be hidden.',
        };
      case 'reject':
        return {
          title: 'Reactivate Vendor',
          description: 'Are you sure you want to reactivate this vendor?',
        };
      default:
        return { title: '', description: '' };
    }
  };

  return (
    <>
      <div>
        <TopBar title="Vendor Management" />
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vendor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        vendor.status === 'approved' ? 'bg-green-100 text-green-700' :
                        vendor.status === 'suspended' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{vendor.totalProducts}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {vendor.status !== 'approved' && (
                          <button
                            onClick={() => openConfirmModal(vendor.id, 'approve')}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                          >
                            Approve
                          </button>
                        )}
                        {vendor.status !== 'suspended' && (
                          <button
                            onClick={() => openConfirmModal(vendor.id, 'suspend')}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                          >
                            Suspend
                          </button>
                        )}
                        {vendor.status === 'suspended' && (
                          <button
                            onClick={() => openConfirmModal(vendor.id, 'reject')}
                            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                          >
                            Reactivate
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={getModalContent().title}
        description={getModalContent().description}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, vendorId: null, action: null })}
      />

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
