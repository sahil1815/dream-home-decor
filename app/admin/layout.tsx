'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  Gift,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Hammer,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // If on login page, don't show the dashboard shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'ওভারভিউ', href: '/admin', icon: LayoutDashboard },
    { label: 'অর্ডার তালিকা', href: '/admin/orders', icon: ShoppingBag },
    { label: 'পণ্য ম্যানেজমেন্ট', href: '/admin/products', icon: Package },
    { label: 'সাইট ও লোগো সেটিংস', href: '/admin/settings', icon: Settings },
    { label: 'ক্যাম্পেইন ও লটারি', href: '/admin/campaigns', icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1C1917] text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#8B5A2B] text-white flex items-center justify-center font-bold font-serif text-sm">
            DH
          </div>
          <span className="font-serif font-bold text-base text-white">
            Dream Home Admin
          </span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-1.5 text-stone-300 hover:text-white"
        >
          {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside
        className={`w-64 bg-[#1C1917] text-[#FAF8F5] flex flex-col justify-between p-5 border-r border-stone-800 shrink-0 ${
          mobileNavOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="hidden md:flex items-center gap-3 pb-4 border-b border-stone-800">
            <div className="w-10 h-10 rounded-xl bg-[#8B5A2B] text-white flex items-center justify-center font-bold font-serif text-base shadow-sm">
              DH
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-white leading-tight">
                Dream Home Decor
              </h2>
              <span className="text-[11px] font-bn text-amber-500 font-semibold">
                মালিক ও কর্মী প্যানেল
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bn text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#8B5A2B] text-white shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="pt-6 border-t border-stone-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-bn transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>স্টোরফ্রন্ট ভিজিট করুন</span>
            </span>
            <span className="text-[10px] text-amber-400 font-sans">Live</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs font-bn transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Page Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
