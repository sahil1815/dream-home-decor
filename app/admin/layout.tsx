'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Hammer,
  ShieldCheck,
  ImageIcon,
  Factory,
  Compass,
  RotateCcw,
  Users,
  FolderTree,
  Tag,
  MessageSquare,
  FileText,
  Truck,
  KeyRound,
} from 'lucide-react';
import { logoutAdminAction, getAdminSessionAction } from '@/lib/actions';
import { AdminSession } from '@/lib/auth-token';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole: 'staff' | 'manager' | 'owner';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    getAdminSessionAction().then((s) => setSession(s));
  }, [pathname]);

  // If on login page, don't show the dashboard shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logoutAdminAction();
    router.push('/admin/login');
    router.refresh();
  };

  const currentRole = session?.role || 'staff';
  const roleHierarchy: Record<string, number> = {
    staff: 1,
    manager: 2,
    owner: 3,
  };
  const userLevel = roleHierarchy[currentRole] || 1;

  const navGroups: NavGroup[] = [
    {
      title: 'অপারেশন্স',
      items: [
        { label: 'ওভারভিউ', href: '/admin', icon: LayoutDashboard, minRole: 'staff' },
        { label: 'অর্ডার তালিকা', href: '/admin/orders', icon: ShoppingBag, minRole: 'staff' },
        { label: 'ফ্যাক্টরি ট্র্যাকার', href: '/admin/production', icon: Factory, minRole: 'staff' },
        { label: 'কাস্টম ফার্নিচার', href: '/admin/custom-orders', icon: Compass, minRole: 'staff' },
        { label: 'পরিত্যক্ত চেকআউট', href: '/admin/abandoned', icon: RotateCcw, minRole: 'staff' },
        { label: 'কাস্টমার ডিরেক্টরি', href: '/admin/customers', icon: Users, minRole: 'staff' },
      ],
    },
    {
      title: 'ক্যাটালগ ও প্রমোশন',
      items: [
        { label: 'পণ্য ক্যাটালগ', href: '/admin/products', icon: Package, minRole: 'manager' },
        { label: 'ক্যাটাগরি সমূহ', href: '/admin/categories', icon: FolderTree, minRole: 'manager' },
        { label: 'মিডিয়া ও ড্রাইভ', href: '/admin/media', icon: ImageIcon, minRole: 'manager' },
        { label: 'কুপন ও প্রমো কোড', href: '/admin/coupons', icon: Tag, minRole: 'manager' },
        { label: 'গ্রাহক রিভিউ', href: '/admin/reviews', icon: MessageSquare, minRole: 'manager' },
        { label: 'ওয়ার্কশপ ফিচার', href: '/admin/workshop', icon: Hammer, minRole: 'manager' },
      ],
    },
    {
      title: 'সাইট ও সিকিউরিটি',
      items: [
        { label: 'সাইট কনটেন্ট ও পলিসি', href: '/admin/content', icon: FileText, minRole: 'manager' },
        { label: 'ডেলিভারি চার্জ জোন', href: '/admin/delivery', icon: Truck, minRole: 'manager' },
        { label: 'ব্র্যান্ড সেটিংস', href: '/admin/settings', icon: Settings, minRole: 'owner' },
        { label: 'ইউজার ও পারমিশন', href: '/admin/users', icon: KeyRound, minRole: 'owner' },
        { label: 'নিরাপত্তা অডিট লগ', href: '/admin/audit', icon: ShieldCheck, minRole: 'owner' },
      ],
    },
  ];

  const roleLabels: Record<string, { labelBn: string; color: string }> = {
    owner: { labelBn: 'মালিক (Owner)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    manager: { labelBn: 'ম্যানেজার (Manager)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    staff: { labelBn: 'স্টাফ (Staff)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Mobile Admin Header */}
      <div className="md:hidden bg-[#1C1917] text-white p-3.5 sm:p-4 flex items-center justify-between sticky top-0 z-40 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#8B5A2B] text-white flex items-center justify-center font-bold font-serif text-sm shrink-0">
            DH
          </div>
          <span className="font-serif font-bold text-base text-white truncate">
            Dream Home Admin
          </span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label={mobileNavOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
        >
          {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar / Mobile Slide-Over Drawer */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 md:z-30 w-72 md:w-64 bg-[#1C1917] text-[#FAF8F5] flex flex-col justify-between p-4 sm:p-5 border-r border-stone-800 shrink-0 h-screen transition-transform duration-300 ease-in-out ${
          mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#8B5A2B] text-white flex items-center justify-center font-bold font-serif text-base shadow-sm shrink-0">
                DH
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-white leading-tight">
                  Dream Home Decor
                </h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span
                    className={`text-[9px] font-bn px-1.5 py-0.2 rounded border font-semibold ${
                      roleLabels[currentRole]?.color || ''
                    }`}
                  >
                    {roleLabels[currentRole]?.labelBn || 'অ্যাডমিন'}
                  </span>
                </div>
              </div>
            </div>

            {/* Close button for mobile drawer */}
            <button
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              aria-label="মেনু বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Email & Status */}
          {session && (
            <div className="mt-3 p-2 bg-stone-900/80 rounded-xl border border-stone-800/80 text-[11px] font-bn text-stone-400 shrink-0">
              <span className="block text-stone-200 font-bold font-sans text-xs truncate">
                {session.email}
              </span>
              <span className="text-[10px] text-amber-400/90">{session.name}</span>
            </div>
          )}

          {/* Scrollable Nav Groups */}
          <nav className="flex-1 overflow-y-auto space-y-4 my-3 pr-1 text-xs">
            {navGroups.map((group) => {
              // Filter items by role
              const visibleItems = group.items.filter((item) => {
                const reqLevel = roleHierarchy[item.minRole] || 1;
                return userLevel >= reqLevel;
              });

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  <div className="px-3 text-[10px] uppercase font-bn font-bold tracking-wider text-stone-500">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bn text-xs sm:text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-[#8B5A2B] text-white shadow-xs'
                              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer controls */}
          <div className="pt-3 border-t border-stone-800 space-y-1.5 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-bn transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>স্টোরফ্রন্ট দেখুন</span>
              </span>
              <span className="text-[9px] text-amber-400 font-sans font-bold">LIVE</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs font-bn transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>নিরাপদ লগআউট</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Page Content */}
      <main className="flex-1 p-3.5 sm:p-6 md:p-8 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
