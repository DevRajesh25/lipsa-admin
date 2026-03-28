'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Toast from './Toast';
import { useToast } from '@/hooks/useToast';
import { Percent } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CommissionSettings() {
  const [commission, setCommission] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchCommission();
  }, []);

  const fetchCommission = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'commission'));
      if (settingsDoc.exists()) {
        setCommission(settingsDoc.data().commissionPercentage || 0);
      }
    } catch (error) {
      console.error('Error fetching commission:', error);
      showToast('Failed to load commission settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (commission < 0 || commission > 100) {
      showToast('Commission must be between 0 and 100', 'error');
      return;
    }

    setSaving(true);

    try {
      await setDoc(doc(db, 'settings', 'commission'), {
        commissionPercentage: commission,
        updatedAt: new Date(),
      });
      showToast('Commission updated successfully', 'success');
    } catch (error) {
      console.error('Error saving commission:', error);
      showToast('Failed to save commission', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-full p-3">
            <Percent className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Commission Settings</h3>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">
          Set the global commission percentage applied to all orders
        </p>
        
        <div className="space-y-4">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={commission}
              onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-gray-900 transition-all text-lg font-semibold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-500">%</span>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

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
