'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnalyticsCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function AnalyticsCard({ title, children, className = '' }: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}
