'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Banner } from '@/types';
import TableSkeleton from '@/components/admin/TableSkeleton';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import { useToast } from '@/hooks/useToast';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    link: '',
    position: 1,
  });
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'banners'));
      const bannersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Banner[];

      setBanners(bannersList.sort((a, b) => a.position - b.position));
    } catch (error) {
      console.error('Error fetching banners:', error);
      showToast('Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that an image URL is provided
    if (!formData.imageUrl || formData.imageUrl.trim() === '') {
      showToast('Please upload an image or provide an image URL', 'error');
      return;
    }
    
    try {
      const bannerData = {
        ...formData,
        isActive: true,
      };

      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), bannerData);
        fetchBanners();
        showToast('Banner updated successfully', 'success');
      } else {
        await addDoc(collection(db, 'banners'), { ...bannerData, createdAt: new Date() });
        fetchBanners();
        showToast('Banner created successfully', 'success');
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving banner:', error);
      showToast('Failed to save banner', 'error');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'banners', id), { isActive: !isActive });
      setBanners(banners.map(b => b.id === id ? { ...b, isActive: !isActive } : b));
      showToast(`Banner ${!isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      console.error('Error toggling banner:', error);
      showToast('Failed to update banner', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      await deleteDoc(doc(db, 'banners', id));
      setBanners(banners.filter(b => b.id !== id));
      showToast('Banner deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting banner:', error);
      showToast('Failed to delete banner', 'error');
    }
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      link: banner.link,
      position: banner.position,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      imageUrl: '',
      link: '',
      position: 1,
    });
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Banner Management" />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <>
      <div>
        <TopBar title="Banner Management">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Banner
          </button>
        </TopBar>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Link</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{banner.position}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{banner.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]" title={banner.imageUrl}>
                          {banner.imageUrl}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 hover:underline">
                      <a href={banner.link} target="_blank" rel="noopener noreferrer">{banner.link}</a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(banner.id, banner.isActive)}
                          className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg transition-colors"
                        >
                          {banner.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(banner)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingBanner ? 'Edit Banner' : 'Add Banner'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                <ImageUpload
                  onUploadComplete={(urls) => setFormData({ ...formData, imageUrl: urls[0] || '' })}
                  maxFiles={1}
                  folder="banners"
                  existingImages={formData.imageUrl ? [formData.imageUrl] : []}
                />
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Or enter image URL manually</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: Number(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                  min="1"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all font-medium"
                >
                  {editingBanner ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
}
