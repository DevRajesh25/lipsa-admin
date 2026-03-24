'use client';

import { Bell, ChevronDown } from 'lucide-react';
import { useState, ReactNode } from 'react';

interface TopBarProps {
  title: string;
  children?: ReactNode;
}

export default function TopBar({ title, children }: TopBarProps) {
  const [dateFilter, setDateFilter] = useState('Last 30 days');

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      
      <div className="flex items-center gap-4">
        {children}
        
        <div className="relative">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="appearance-none bg-gray-50 border-0 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          AD
        </div>
      </div>
    </div>
  );
}
