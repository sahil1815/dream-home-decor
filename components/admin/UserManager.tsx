'use client';

import React, { useState, useTransition } from 'react';
import { AdminSession } from '@/lib/auth-token';
import { clearAllLoginLockoutsAction } from '@/lib/actions';
import {
  Users,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Server,
} from 'lucide-react';

interface UserManagerProps {
  currentSession: AdminSession | null;
  configuredUsers?: {
    ownerUsername?: string;
    ownerEmail?: string;
    managerUsername?: string;
    managerEmail?: string;
    staffUsername?: string;
    staffEmail?: string;
  };
}

export function UserManager({ currentSession, configuredUsers }: UserManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetLockouts = () => {
    startTransition(async () => {
      const res = await clearAllLoginLockoutsAction();
      if (res.success) {
        showToast(res.message || 'লকআউট রিসেট করা হয়েছে', 'success');
      } else {
        showToast(res.error || 'রিসেট ব্যর্থ হয়েছে', 'error');
      }
    });
  };

  const rbacTiers = [
    {
      role: 'owner',
      titleBn: 'কারখানা মালিক (Owner)',
      username: configuredUsers?.ownerUsername || 'admin',
      email: configuredUsers?.ownerEmail || process.env.NEXT_PUBLIC_ADMIN_OWNER_EMAIL || 'owner@dreamhomedecor.com',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description: 'সর্বোচ্চ প্রশাসনিক ক্ষমতা: ব্র্যান্ড কনফিগারেশন, ইউজার ও অডিট লগ, আর্থিক ডেটা এবং ডাটাবেজ সিকিউরিটি।',
      permissions: [
        'ব্র্যান্ড ও সাইট সেটিংস পরিবর্তন',
        'নিরাপত্তা ও অডিট লগ নিরীক্ষা',
        'লগইন রেট-লিমিট ও লকআউট ক্লিয়ারিং',
        'পণ্য, মূল্য ও কুপন ম্যানেজমেন্ট',
        'কাস্টমার ব্লকলিস্ট ও অর্ডার ভেরিফিকেশন',
      ],
    },
    {
      role: 'manager',
      titleBn: 'স্টোর ম্যানেজার (Manager)',
      username: configuredUsers?.managerUsername || 'manager',
      email: configuredUsers?.managerEmail || process.env.NEXT_PUBLIC_ADMIN_MANAGER_EMAIL || 'manager@dreamhomedecor.com',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      description: 'দৈনন্দিন বাণিজ্যিক অপারেশন: পণ্য তালিকা, মূল্য, ডিসকাউন্ট, ডেলিভারি চার্জ এবং কাস্টমার নিয়ন্ত্রণ।',
      permissions: [
        'পণ্য যোগ, সম্পাদন ও সফট-ডিলিট',
        'ডেলিভারি চার্জ ও ফ্রি ডেলিভারি সীমা নির্ধারণ',
        'কুপন কোড তৈরি ও মেয়াদ নির্ধারণ',
        'কাস্টমার রিভিউ অ্যাপ্রুভ / স্প্যাম ফিল্টার',
        'ফেক অর্ডার কাস্টমার ব্লকলিস্ট',
      ],
    },
    {
      role: 'staff',
      titleBn: 'অর্ডার স্টাফ (Staff)',
      username: configuredUsers?.staffUsername || 'staff',
      email: configuredUsers?.staffEmail || process.env.NEXT_PUBLIC_ADMIN_STAFF_EMAIL || 'staff@dreamhomedecor.com',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      description: 'অর্ডার প্রসেসিং ও কাস্টমার রিলেশনস: ফোন কল, কুরিয়ার স্ট্যাটাস আপডেট এবং অভ্যন্তরীণ নোট লেখা।',
      permissions: [
        'অর্ডার স্ট্যাটাস ৯-ধাপে পরিবর্তন',
        'গ্রাহকের সাথে সরাসরি কল ও WhatsApp ফলোআপ',
        'অভ্যন্তরীণ স্টাফ নোট ও কুরিয়ার ট্র্যাকিং কোড সংরক্ষণ',
        'পরিত্যক্ত চেকআউট রিকভারি ফলোআপ',
        'কুরিয়ার স্লিপ ও চালান প্রিন্টিং',
      ],
    },
  ];

  const permissionsMatrix = [
    { module: 'ড্যাশবোর্ড ও সেলস ওভারভিউ', staff: true, manager: true, owner: true },
    { module: 'অর্ডার প্রসেসিং ও চালান প্রিন্ট', staff: true, manager: true, owner: true },
    { module: 'অভ্যন্তরীণ স্টাফ নোট ও গ্রাহক কল', staff: true, manager: true, owner: true },
    { module: 'ফ্যাক্টরি কানবান ট্র্যাকার', staff: true, manager: true, owner: true },
    { module: 'পরিত্যক্ত চেকআউট ফলোআপ', staff: true, manager: true, owner: true },
    { module: 'পণ্য ক্যাটালগ ও খরচ/বিক্রয় মূল্য নির্ধারণ', staff: false, manager: true, owner: true },
    { module: 'ক্যাটাগরি ও কুপন কোড ম্যানেজমেন্ট', staff: false, manager: true, owner: true },
    { module: 'ডেলিভারি জোন ও চার্জ কনফিগারেশন', staff: false, manager: true, owner: true },
    { module: 'ফেক কাস্টমার ব্লকলিস্ট টগল', staff: false, manager: true, owner: true },
    { module: 'সাইট কনটেন্ট ও পলিসি এডিটর', staff: false, manager: true, owner: true },
    { module: 'ব্র্যান্ড আইডেন্টিটি ও মূল সেটিংস', staff: false, manager: false, owner: true },
    { module: 'নিরাপত্তা অডিট লগ ও একাউন্ট লকআউট রিসেট', staff: false, manager: false, owner: true },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-bn flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#8B5A2B]" />
            <span>ইউজার ভূমিকা ও নিরাপত্তা পারমিশন (RBAC)</span>
          </h1>
          <p className="text-xs sm:text-sm font-bn text-stone-600 mt-1">
            মালিক, ম্যানেজার এবং স্টাফদের প্রিভিলেজ ও অনুমতি ম্যাট্রিক্স।
          </p>
        </div>

        {currentSession?.role === 'owner' && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleResetLockouts}
            className="px-4 py-2 bg-stone-900 text-amber-300 hover:bg-black rounded-xl font-bn text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto border border-stone-800"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>{isPending ? 'রিসেট হচ্ছে...' : 'লগইন লকআউট ক্লিয়ার করুন'}</span>
          </button>
        )}
      </div>

      {/* Current Active Session Card */}
      {currentSession && (
        <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 border border-stone-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#8B5A2B] text-white flex items-center justify-center font-bold font-serif text-lg shrink-0 shadow-sm">
              {currentSession.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold font-bn text-base text-white">{currentSession.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bn font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  বর্তমান সেশন
                </span>
              </div>
              <p className="text-xs font-sans text-stone-400 mt-0.5">{currentSession.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bn text-stone-300 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-800">
            <div>
              <span className="text-stone-500 block text-[11px]">ভূমিকা (Role)</span>
              <strong className="text-amber-400 uppercase font-sans tracking-wide">
                {currentSession.role}
              </strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">এনক্রিপশন</span>
              <span className="text-stone-200 font-sans">HMAC-SHA256 (Web Crypto)</span>
            </div>
          </div>
        </div>
      )}

      {/* 3 Tier Accounts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rbacTiers.map((tier) => (
          <div
            key={tier.role}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bn font-bold border ${tier.badgeColor}`}
                >
                  {tier.titleBn}
                </span>
                <ShieldCheck className="w-4 h-4 text-stone-400" />
              </div>

              <div className="mt-3 space-y-1">
                <div>
                  <span className="text-[11px] font-bn text-stone-500 block">লগইন নাম (Username)</span>
                  <span className="text-xs font-mono font-bold text-[#8B5A2B]">
                    {tier.username}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bn text-stone-500 block">ইমেইল</span>
                  <span className="text-xs font-sans text-stone-700 break-all">
                    {tier.email}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs font-bn text-stone-600 leading-relaxed">
                {tier.description}
              </p>

              <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5 font-bn text-xs">
                <span className="text-stone-500 font-semibold block text-[11px]">
                  অনুমোদিত ক্ষমতা:
                </span>
                {tier.permissions.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-stone-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#8B5A2B]" />
            <span>পারমিশন কন্ট্রোল ম্যাট্রিক্স</span>
          </h2>
          <span className="text-xs font-bn text-stone-500">
            রোল ভিত্তিক এক্সেস কন্ট্রোল (RBAC)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-600 font-bn text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">অ্যাডমিন মডিউল / ফিচার</th>
                <th className="py-3 px-4 font-semibold text-center">স্টাফ (Staff)</th>
                <th className="py-3 px-4 font-semibold text-center">ম্যানেজার (Manager)</th>
                <th className="py-3 px-4 font-semibold text-center">মালিক (Owner)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-bn text-xs sm:text-sm">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-800">{item.module}</td>
                  <td className="py-3 px-4 text-center">
                    {item.staff ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> হ্যাঁ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-full text-xs">
                        না
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.manager ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> হ্যাঁ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-full text-xs">
                        না
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> হ্যাঁ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Best Practices & Env Documentation */}
      <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3 font-bn text-xs sm:text-sm text-stone-700">
        <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2 text-sm sm:text-base">
          <Server className="w-4 h-4 text-[#8B5A2B]" />
          <span>সার্ভার সিকিউরিটি ও ক্রেডেনশিয়াল ব্যবস্থাপনা</span>
        </h3>
        <p className="leading-relaxed">
          ড্রিম হোম ডেকোরের সকল অ্যাডমিন ক্রেডেনশিয়াল কোনো ডাটাবেজ টেবিলে উন্মুক্ত না রেখে নিরাপদ{' '}
          <strong className="font-mono text-stone-900">.env</strong> ভ্যারিয়েবল ও{' '}
          <strong className="font-sans text-stone-900">Bcrypt (Salt rounds 10)</strong> হ্যাশ আকারে সংরক্ষিত থাকে।
          লগইনের সেশন টোকেন <strong className="font-sans text-stone-900">Edge Web Crypto HMAC-SHA256</strong> দ্বারা
          স্বাক্ষরিত এবং ব্রাউজারে শুধুমাত্র <strong className="font-mono text-stone-900">httpOnly; SameSite=Lax</strong>{' '}
          কুকির মাধ্যমে সুরক্ষিত থাকে।
        </p>
        <div className="bg-stone-900 text-stone-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
          <p className="text-amber-400"># পাসওয়ার্ড ও ইমেইল এনভায়রনমেন্ট কনফিগারেশন</p>
          <p>ADMIN_OWNER_EMAIL=&quot;owner@dreamhomedecor.com&quot;</p>
          <p>ADMIN_OWNER_PASSWORD_HASH=&quot;$2b$10$...&quot;</p>
          <p>ADMIN_MANAGER_EMAIL=&quot;manager@dreamhomedecor.com&quot;</p>
          <p>ADMIN_STAFF_EMAIL=&quot;staff@dreamhomedecor.com&quot;</p>
        </div>
      </div>
    </div>
  );
}
