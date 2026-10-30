'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setErrorMsg(
            'ইমেইলটি এখনও কনফার্ম করা হয়নি (Email not confirmed)। অনুগ্রহ করে Supabase ড্যাশবোর্ডে Authentication > Users থেকে ইউজারটি Confirm করুন অথবা নিচের "ডেমো মোডে প্রবেশ করুন" বাটনে ক্লিক করুন।'
          );
        } else if (error.message?.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg(
            'ভুল ইমেইল বা পাসওয়ার্ড (Invalid credentials)। Supabase Authentication-এ এই ইউজার তৈরি ও কনফার্ম করা আছে কি না যাচাই করুন।'
          );
        } else {
          setErrorMsg(error.message || 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।');
        }
      } else {
        // Clear any previous demo cookie and navigate
        document.cookie = 'dhd_demo_admin=; path=/; max-age=0; SameSite=Lax';
        window.location.href = '/admin';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'লগইন করতে সমস্যা হচ্ছে';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@dreamhome.com');
    setPassword('dreamhome123');
  };

  const handleDemoAccess = () => {
    // Set 24h demo cookie for instant local access
    document.cookie = 'dhd_demo_admin=true; path=/; max-age=86400; SameSite=Lax';
    window.location.href = '/admin';
  };

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
          অ্যাডমিন কন্ট্রোল পোর্টাল (Owner & Staff Dashboard)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dreamhome.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans"
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
                  <span>লগইন করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials & Demo Mode Helper */}
          <div className="pt-4 border-t border-stone-100 text-center space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-xs font-bn font-semibold text-[#8B5A2B] hover:underline"
              >
                [ডেমো ক্রিডেনশিয়ালস ফিল করুন]
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={handleDemoAccess}
                className="text-xs font-bn font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg hover:bg-amber-100 transition-colors"
              >
                ডেমো মোডে প্রবেশ করুন →
              </button>
            </div>
            <p className="text-[11px] text-stone-400 font-sans">
              admin@dreamhome.com / dreamhome123
            </p>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs font-bn text-stone-500 hover:text-stone-800 transition-colors"
            >
              ← মূল ওয়েবসাইটে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
