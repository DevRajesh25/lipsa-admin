'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { approveProduct, rejectProduct } from '@/lib/services/productService';
import TableSkeleton from '@/components/admin/TableSkeleton';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';
import { Search } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({
    isOpen: false,
    productId: null,
    productName: '',
  });
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, statusFilter, products]);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      
      if (snapshot.empty) {
        console.log('No products found in database. You may need to:');
        console.log('1. Run the initialization script to create sample data');
        console.log('2. Check if vendors exist in the vendors collection');
        
        // Check vendors collection
        const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
        console.log(`Vendors in vendors collection: ${vendorsSnapshot.size}`);
        
        // Check users with vendor role
        const usersVendorsSnapshot = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'vendor'))
        );
        console.log(`Vendors in users collection: ${usersVendorsSnapshot.size}`);
        
        setProducts([]);
        setFilteredProducts([]);
        return;
      }
      
      const productsList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          let vendorName = 'Unknown';
          
          if (data.vendorId) {
            try {
              const vendorDoc = await getDoc(doc(db, 'vendors', data.vendorId));
              if (vendorDoc.exists()) {
                const vendorData = vendorDoc.data();
                vendorName = vendorData.storeName || vendorData.name || 'Unknown';
              }
            } catch (vendorError) {
              console.error('Error fetching vendor:', vendorError);
            }
          }
          
          return {
            id: docSnap.id,
            name: data.name || 'N/A',
            vendorId: data.vendorId || '',
            vendorName,
            categoryId: data.categoryId || '',
            price: data.price || 0,
            stock: data.stock || 0,
            status: data.status || 'pending',
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
      );

      setProducts(productsList);
      setFilteredProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProductStatus = async (productId: string, status: Product['status']) => {
    try {
      if (status === 'approved') {
        await approveProduct(productId);
      } else if (status === 'rejected') {
        await rejectProduct(productId);
      }
      setProducts(products.map(p => p.id === productId ? { ...p, status } : p));
      showToast(`Product ${status} and vendor notified`, 'success');
    } catch (error) {
      console.error('Error updating product status:', error);
      showToast('Failed to update product status', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteModal.productId) return;

    try {
      await deleteDoc(doc(db, 'products', deleteModal.productId));
      setProducts(products.filter(p => p.id !== deleteModal.productId));
      showToast('Product deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Failed to delete product', 'error');
    }
  };

  const openDeleteModal = (productId: string, productName: string) => {
    setDeleteModal({ isOpen: true, productId, productName });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, productId: null, productName: '' });
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Product Management" />
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  const pendingCount = products.filter(p => p.status === 'pending').length;

  return (
    <div>
      <TopBar title="Product Management">
        {pendingCount > 0 && (
          <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium">
            {pendingCount} Pending Approval
          </span>
        )}
      </TopBar>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-gray-900 transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === status
                  ? 'bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.vendorName}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{product.price.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        product.status === 'approved' ? 'bg-green-100 text-green-700' :
                        product.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {product.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateProductStatus(product.id, 'approved')}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateProductStatus(product.id, 'rejected')}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openDeleteModal(product.id, product.name)}
                          className="px-3 py-1 bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-xs rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                      <p className="text-sm text-gray-500">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filter criteria.' 
                          : 'No products have been added to the system yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteModal.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteProduct}
        onCancel={closeDeleteModal}
        variant="danger"
      />

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
