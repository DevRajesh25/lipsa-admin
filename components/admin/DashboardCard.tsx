'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  index?: number;
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  gradient,
  change,
  changeType,
  index = 0,
}: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`${gradient} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          {change && (
            <p className={`text-sm font-medium ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="bg-white bg-opacity-50 rounded-full p-3">
          <Icon className="w-6 h-6 text-gray-700" />
        </div>
      </div>
    </motion.div>
  );
}
