'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { loginAdminAction } from '@/lib/actions';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await loginAdminAction({
        email: email.trim(),
        password,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } else {
        router.push(redirectTarget);
        router.refresh();
      }
    } catch {
      setErrorMsg('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-stone-200/90 space-y-6">
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bn rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
            অ্যাডমিন ইমেইল (Admin Email)
          </label>
          <div className="relative">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="আপনার অনুমোদিত ইমেইল দিন"
              className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans text-stone-900"
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
            পাসওয়ার্ড (Password)
          </label>
          <div className="relative">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans text-stone-900"
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:bg-stone-400 text-white rounded-xl font-bn font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>যাচাই করা হচ্ছে...</span>
            </>
          ) : (
            <>
              <span>নিরাপদ লগইন</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-stone-100">
        <Link
          href="/"
          className="text-xs font-bn text-stone-500 hover:text-stone-800 transition-colors"
        >
          ← মূল ওয়েবসাইটে ফিরে যান
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#8B5A2B] text-white flex items-center justify-center font-bold text-xl font-serif mx-auto shadow-md">
          DH
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#1C1917] tracking-tight">
          Dream Home Decor
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 font-bn">
          অ্যাডমিন কন্ট্রোল পোর্টাল (Owner & Staff Portal)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="p-8 text-center text-xs font-bn text-stone-400">লোড হচ্ছে...</div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
