'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { InfluencerVideo, Vendor } from '@/types';
import TableSkeleton from '@/components/admin/TableSkeleton';
import Toast from '@/components/admin/Toast';
import TopBar from '@/components/admin/TopBar';
import VendorDetailsModal from '@/components/admin/VendorDetailsModal';
import { useToast } from '@/hooks/useToast';
import { Check, X, Trash2, Play, Filter, ExternalLink } from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface InfluencerVideoWithVendor extends InfluencerVideo {
  vendor?: Vendor;
}

export default function InfluencerVideosPage() {
  const [videos, setVideos] = useState<InfluencerVideoWithVendor[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<InfluencerVideoWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, activeFilter]);

  const fetchVideos = async () => {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'influencerVideos'),
          orderBy('createdAt', 'desc')
        )
      );
      
      const videosList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const videoData = {
            id: docSnap.id,
            ...docSnap.data(),
            uploadDate: docSnap.data().uploadDate?.toDate() || new Date(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          } as InfluencerVideo;

          // Fetch vendor details using vendorId
          let vendor: Vendor | undefined;
          if (videoData.vendorId) {
            try {
              const vendorDoc = await getDoc(doc(db, 'vendors', videoData.vendorId));
              if (vendorDoc.exists()) {
                vendor = {
                  id: vendorDoc.id,
                  ...vendorDoc.data(),
                  createdAt: vendorDoc.data().createdAt?.toDate() || new Date(),
                } as Vendor;
              }
            } catch (error) {
              console.error('Error fetching vendor for video:', videoData.id, error);
            }
          }

          return {
            ...videoData,
            vendor,
          } as InfluencerVideoWithVendor;
        })
      );

      setVideos(videosList);
    } catch (error) {
      console.error('Error fetching influencer videos:', error);
      showToast('Failed to load influencer videos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    if (activeFilter === 'all') {
      setFilteredVideos(videos);
    } else {
      setFilteredVideos(videos.filter(video => video.status === activeFilter));
    }
  };

  const handleApprove = async (videoId: string) => {
    try {
      await updateDoc(doc(db, 'influencerVideos', videoId), {
        status: 'approved'
      });
      
      setVideos(videos.map(video => 
        video.id === videoId ? { ...video, status: 'approved' as const } : video
      ));
      
      showToast('Video approved successfully', 'success');
    } catch (error) {
      console.error('Error approving video:', error);
      showToast('Failed to approve video', 'error');
    }
  };

  const handleReject = async (videoId: string) => {
    try {
      await updateDoc(doc(db, 'influencerVideos', videoId), {
        status: 'rejected'
      });
      
      setVideos(videos.map(video => 
        video.id === videoId ? { ...video, status: 'rejected' as const } : video
      ));
      
      showToast('Video rejected successfully', 'success');
    } catch (error) {
      console.error('Error rejecting video:', error);
      showToast('Failed to reject video', 'error');
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'influencerVideos', videoId));
      setVideos(videos.filter(video => video.id !== videoId));
      showToast('Video deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting video:', error);
      showToast('Failed to delete video', 'error');
    }
  };

  const handleVendorClick = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setVendorModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getFilterCount = (status: FilterStatus) => {
    if (status === 'all') return videos.length;
    return videos.filter(video => video.status === status).length;
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Influencer Videos" />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <>
      <div>
        <TopBar title="Influencer Videos">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            Total: {videos.length} videos
          </div>
        </TopBar>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
            {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({getFilterCount(filter)})
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Video Preview</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vendor Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Play className="w-12 h-12 text-gray-300" />
                        <p className="text-lg font-medium">No videos found</p>
                        <p className="text-sm">
                          {activeFilter === 'all' 
                            ? 'No influencer videos have been uploaded yet.' 
                            : `No ${activeFilter} videos found.`
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center relative">
                            <video
                              src={video.videoUrl}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <a
                              href={video.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline truncate max-w-[150px] flex items-center gap-1"
                              title={video.videoUrl}
                            >
                              View Video <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {video.productName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {video.vendor ? (
                          <button
                            onClick={() => handleVendorClick(video.vendorId)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1 transition-colors"
                          >
                            {video.vendor.name || video.vendor.storeName || 'Unknown Vendor'}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-gray-500 italic">
                            {video.vendorName || 'Vendor not found'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {video.uploadDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(video.status)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {video.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(video.id)}
                                className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                                title="Approve video"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(video.id)}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                title="Reject video"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                            title="Delete video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Vendor Details Modal */}
      <VendorDetailsModal
        isOpen={vendorModalOpen}
        vendorId={selectedVendorId}
        onClose={() => {
          setVendorModalOpen(false);
          setSelectedVendorId(null);
        }}
      />

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
}