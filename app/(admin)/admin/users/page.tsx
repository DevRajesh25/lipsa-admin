'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserRole } from '@/types';
import TableSkeleton from '@/components/admin/TableSkeleton';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; userId: string | null; isBlocked: boolean }>({
    isOpen: false,
    userId: null,
    isBlocked: false,
  });
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      
      const usersList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          email: data.email || 'N/A',
          name: data.name || 'N/A',
          role: data.role || 'customer',
          isBlocked: data.isBlocked || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!blockModal.userId) return;

    try {
      const newBlockStatus = !blockModal.isBlocked;
      
      await updateDoc(doc(db, 'users', blockModal.userId), { isBlocked: newBlockStatus });
      setUsers(users.map(u => u.id === blockModal.userId ? { ...u, isBlocked: newBlockStatus } : u));
      
      showToast(`User ${newBlockStatus ? 'blocked' : 'unblocked'} successfully`, 'success');
      setBlockModal({ isOpen: false, userId: null, isBlocked: false });
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Failed to update user status', 'error');
    }
  };

  const changeUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (error) {
      console.error('Error changing user role:', error);
      showToast('Failed to update user role', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="User Management" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <>
      <div>
        <TopBar title="User Management" />
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={user.role}
                        onChange={(e) => changeUserRole(user.id, e.target.value as UserRole)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-gray-900 bg-white font-medium transition-all"
                      >
                        <option value="customer">Customer</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setBlockModal({ isOpen: true, userId: user.id, isBlocked: user.isBlocked })}
                        className={`px-4 py-2 text-white text-sm rounded-lg transition-all shadow-md hover:shadow-lg font-medium ${
                          user.isBlocked
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                            : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                        }`}
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={blockModal.isOpen}
        title={blockModal.isBlocked ? 'Unblock User' : 'Block User'}
        description={
          blockModal.isBlocked
            ? 'Are you sure you want to unblock this user? They will regain access to the platform.'
            : 'Are you sure you want to block this user? They will lose access to the platform.'
        }
        confirmText={blockModal.isBlocked ? 'Unblock' : 'Block'}
        onConfirm={handleToggleBlock}
        onCancel={() => setBlockModal({ isOpen: false, userId: null, isBlocked: false })}
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
