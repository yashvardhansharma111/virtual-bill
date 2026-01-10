'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Admin Sidebar Navigation Component
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post('/api/admin/logout');
      toast.success('Logged out successfully');
      router.push('/admin/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
  ];

  return (
    <div className="w-64 bg-purple-600 text-white min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Virtual Bill</h1>
        <p className="text-purple-200 text-sm">Admin Panel</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-purple-700 text-white'
                    : 'text-purple-100 hover:bg-purple-700/50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto w-full bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-semibold transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
