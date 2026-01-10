'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AdminSidebar from '@/components/AdminSidebar';

/**
 * Admin Dashboard Page
 * Shows statistics and quick actions
 */
export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/admin/check');
      if (!response.data.success) {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/products');
      
      // Handle response - always ensure we have an array
      const products = Array.isArray(response.data.data) ? response.data.data : [];
      const categories = new Set(products.map((p: any) => p.type));
      
      setStats({
        totalProducts: products.length,
        totalCategories: categories.size,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
      setStats({
        totalProducts: 0,
        totalCategories: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Products</p>
                    <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalProducts}</p>
                  </div>
                  <div className="text-5xl text-purple-200">📦</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Categories</p>
                    <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalCategories}</p>
                  </div>
                  <div className="text-5xl text-purple-200">🏷️</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/admin/products')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Manage Products
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                View User Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
