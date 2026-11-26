'use client';

import React, { useState, useTransition } from 'react';
import { AdminRole, AdminSession } from '@/lib/auth-token';
import type { AdminSecurityOverview, ChangePasswordResult } from '@/lib/admin-credentials';
import {
  clearAllLoginLockoutsAction,
  changeAdminPasswordAction,
  getAdminSecurityOverviewAction,
} from '@/lib/actions';
import {
  Users,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Server,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Database,
  FileCode2,
  Loader2,
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
  initialSecurityOverview?: AdminSecurityOverview;
}

function generateStrongPassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*_-+=';
  const all = upper + lower + digits + symbols;

  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);

  const chars = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    symbols[bytes[3] % symbols.length],
  ];

  for (let i = 4; i < length; i++) {
    chars.push(all[bytes[i] % all.length]);
  }

  // Fisher-Yates shuffle with cryptographic randomness
  const shuffleBytes = new Uint32Array(chars.length);
  crypto.getRandomValues(shuffleBytes);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

export function UserManager({
  currentSession,
  configuredUsers,
  initialSecurityOverview,
}: UserManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [overview, setOverview] = useState<AdminSecurityOverview | undefined>(initialSecurityOverview);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password Change Form State
  const [targetRole, setTargetRole] = useState<AdminRole>('owner');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwResult, setPwResult] = useState<ChangePasswordResult | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
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

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(14);
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowNewPw(true);
    setShowConfirmPw(true);
    showToast('নিরাপদ শক্তিশালী পাসওয়ার্ড তৈরি হয়েছে (সংরক্ষণ করার আগে কপি করে রাখুন)', 'success');
  };

  const handleCopyNewPassword = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      showToast('নতুন পাসওয়ার্ড ক্লিপবোর্ডে কপি করা হয়েছে', 'success');
    } catch {
      showToast('কপি করা যায়নি, অনুগ্রহ করে ম্যানুয়ালি কপি করুন', 'error');
    }
  };

  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasLetter: /[A-Za-z]/.test(newPassword),
    hasDigitOrSymbol: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword),
    matchesConfirm: confirmPassword.length > 0 && newPassword === confirmPassword,
  };

  const isFormReady =
    currentPassword.length > 0 &&
    passwordChecks.minLength &&
    passwordChecks.hasLetter &&
    passwordChecks.hasDigitOrSymbol &&
    passwordChecks.matchesConfirm;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormReady || isSavingPassword) return;

    setIsSavingPassword(true);
    setPwResult(null);

    try {
      const res = await changeAdminPasswordAction({
        targetRole,
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPwResult(res);

      if (res.success) {
        showToast(res.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPw(false);
        setShowNewPw(false);
        setShowConfirmPw(false);

        const refreshed = await getAdminSecurityOverviewAction();
        if (refreshed.success && refreshed.overview) {
          setOverview(refreshed.overview);
        }
      } else {
        showToast(res.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে', 'error');
      }
    } catch {
      const fallbackErr = {
        success: false,
        error: 'সার্ভারের সাথে যোগাযোগ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
      };
      setPwResult(fallbackErr);
      showToast(fallbackErr.error, 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const roleStatusMap = new Map(overview?.roles.map((r) => [r.role, r]));

  const rbacTiers = [
    {
      role: 'owner' as AdminRole,
      titleBn: 'কারখানা মালিক (Owner)',
      username: roleStatusMap.get('owner')?.username || configuredUsers?.ownerUsername || 'admin',
      email: roleStatusMap.get('owner')?.email || configuredUsers?.ownerEmail || 'owner@dreamhomedecor.com',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description: 'সর্বোচ্চ প্রশাসনিক ক্ষমতা: ব্র্যান্ড কনফিগারেশন, পাসওয়ার্ড পরিবর্তন, অডিট লগ এবং ডাটাবেজ সিকিউরিটি।',
      permissions: [
        'সকল রোলের পাসওয়ার্ড পরিবর্তন ও সেশন বাতিল',
        'ব্র্যান্ড ও সাইট সেটিংস পরিবর্তন',
        'নিরাপত্তা ও অডিট লগ নিরীক্ষা',
        'লগইন রেট-লিমিট ও লকআউট ক্লিয়ারিং',
        'পণ্য, মূল্য, কুপন ও অর্ডার নিয়ন্ত্রণ',
      ],
    },
    {
      role: 'manager' as AdminRole,
      titleBn: 'স্টোর ম্যানেজার (Manager)',
      username: roleStatusMap.get('manager')?.username || configuredUsers?.managerUsername || 'manager',
      email: roleStatusMap.get('manager')?.email || configuredUsers?.managerEmail || 'manager@dreamhomedecor.com',
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
      role: 'staff' as AdminRole,
      titleBn: 'অর্ডার স্টাফ (Staff)',
      username: roleStatusMap.get('staff')?.username || configuredUsers?.staffUsername || 'staff',
      email: roleStatusMap.get('staff')?.email || configuredUsers?.staffEmail || 'staff@dreamhomedecor.com',
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
    { module: 'পাসওয়ার্ড পরিবর্তন ও সিকিউরিটি অডিট লগ', staff: false, manager: false, owner: true },
  ];

  const roleLabelsBn: Record<AdminRole, string> = {
    owner: 'মালিক (Owner)',
    manager: 'ম্যানেজার (Manager)',
    staff: 'স্টাফ (Staff)',
  };

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
            মালিক, ম্যানেজার এবং স্টাফদের পাসওয়ার্ড পরিবর্তন, সেশন সুরক্ষা ও অনুমতি ম্যাট্রিক্স।
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
              <span className="text-stone-500 block text-[11px]">সেশন ভার্সন</span>
              <span className="text-stone-200 font-mono">v{currentSession.tokenVersion ?? 1}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">এনক্রিপশন</span>
              <span className="text-stone-200 font-sans">Bcrypt (12) + HMAC-SHA256</span>
            </div>
          </div>
        </div>
      )}

      {/* Owner-Only Password Management Desk */}
      {currentSession?.role === 'owner' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-linear-to-r from-[#1C1917] to-stone-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B5A2B] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-base sm:text-lg text-white">
                  পাসওয়ার্ড ও একাউন্ট সিকিউরিটি ম্যানেজমেন্ট
                </h2>
                <p className="text-xs font-bn text-stone-300 mt-0.5">
                  মালিক যেকোনো সময় নিজের বা স্টাফ/ম্যানেজারের পাসওয়ার্ড পরিবর্তন করতে পারবেন। পরিবর্তন করলে পুরনো সকল ডিভাইসের লগইন স্বয়ংক্রিয়ভাবে বাতিল হয়ে যাবে।
                </p>
              </div>
            </div>

            {overview && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bn shrink-0">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                    overview.supabaseConfigured
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-stone-800 border-stone-700 text-stone-300'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  {overview.supabaseConfigured ? 'ডাটাবেজ ভল্ট সক্রিয়' : 'ডাটাবেজ অফলাইন'}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                    overview.envFileWritable
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  {overview.envFileWritable
                    ? `${overview.envFileName} অটো-সিঙ্ক চালু`
                    : overview.isServerless
                      ? 'সার্ভারলেস (.env Read-Only)'
                      : 'লোকাল .env পাওয়া যায়নি'}
                </span>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Role Selector Tabs */}
            <div>
              <span className="block text-xs font-bn font-bold text-stone-700 mb-2">
                কোন একাউন্টের পাসওয়ার্ড পরিবর্তন করতে চান?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['owner', 'manager', 'staff'] as AdminRole[]).map((roleOption) => {
                  const status = roleStatusMap.get(roleOption);
                  const selected = targetRole === roleOption;
                  return (
                    <button
                      key={roleOption}
                      type="button"
                      onClick={() => {
                        setTargetRole(roleOption);
                        setPwResult(null);
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#FAF8F5] border-[#8B5A2B] ring-2 ring-[#8B5A2B]/20'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bn font-bold text-sm text-stone-900">
                          {roleLabelsBn[roleOption]}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            status?.source === 'database'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {status?.source === 'database' ? 'DB Vault' : '.env'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-stone-500 mt-1 truncate">
                        @{status?.username || roleOption}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {pwResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-bn space-y-1.5 ${
                  pwResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-start gap-2 font-bold text-sm">
                  {pwResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{pwResult.success ? pwResult.message : pwResult.error}</span>
                </div>

                {pwResult.success && (
                  <ul className="pl-6 space-y-1 text-stone-700 list-disc">
                    <li>
                      ডাটাবেজ (`admin_users`):{' '}
                      <strong>
                        {pwResult.dbSaved
                          ? 'Bcrypt (12 rounds) হ্যাশ সংরক্ষিত হয়েছে'
                          : pwResult.dbError
                            ? `সংরক্ষণ করা যায়নি (${pwResult.dbError})`
                            : 'ডাটাবেজ কনফিগার করা নেই'}
                      </strong>
                    </li>
                    <li>
                      এনভায়রনমেন্ট ফাইল (`.env`):{' '}
                      <strong>
                        {pwResult.envSynced
                          ? `${pwResult.envFile} ফাইলে নতুন Bcrypt হ্যাশ আপডেট করা হয়েছে এবং পুরনো প্লেইনটেক্সট পাসওয়ার্ড সরানো হয়েছে`
                          : pwResult.envReason === 'serverless_readonly'
                            ? 'সার্ভারলেস (Vercel) হোস্টিংয়ে ফাইলসিস্টেম Read-Only হওয়ায় সরাসরি .env ফাইল এডিট হয় না; তবে ডাটাবেজের নতুন পাসওয়ার্ড তাৎক্ষণিকভাবে কার্যকর হয়েছে'
                            : 'রাইটেবল .env ফাইল পাওয়া যায়নি (ডাটাবেজের পাসওয়ার্ড কার্যকর রয়েছে)'}
                      </strong>
                    </li>
                    <li>
                      সেশন নিরাপত্তা: টোকেন ভার্সন <strong>v{pwResult.newTokenVersion}</strong>-এ উন্নীত হয়েছে — পুরনো সকল সেশন বাতিল করা হয়েছে।
                    </li>
                  </ul>
                )}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Owner Password */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                  আপনার বর্তমান মালিক পাসওয়ার্ড (Current Owner Password) *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="যাচাইয়ের জন্য বর্তমান মালিক পাসওয়ার্ড লিখুন"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans text-stone-900"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    aria-label={showCurrentPw ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    className="absolute right-3 top-2.5 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bn font-bold text-stone-700">
                    {roleLabelsBn[targetRole]}-এর নতুন পাসওয়ার্ড *
                  </label>
                  <div className="flex items-center gap-2">
                    {newPassword && (
                      <button
                        type="button"
                        onClick={handleCopyNewPassword}
                        className="text-[11px] font-bn text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> কপি
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] font-bn font-semibold text-[#8B5A2B] hover:text-[#6D431F] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> স্ট্রং পাসওয়ার্ড তৈরি করুন
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৮ অক্ষর (অক্ষর + সংখ্যা/চিহ্ন)"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans text-stone-900"
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    aria-label={showNewPw ? 'নতুন পাসওয়ার্ড লুকান' : 'নতুন পাসওয়ার্ড দেখুন'}
                    className="absolute right-3 top-2.5 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bn font-bold text-stone-700 mb-1.5">
                  নতুন পাসওয়ার্ড পুনরায় লিখুন (Confirm) *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B] font-sans text-stone-900"
                  />
                  <ShieldCheck className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    aria-label={showConfirmPw ? 'নিশ্চিতকরণ পাসওয়ার্ড লুকান' : 'নিশ্চিতকরণ পাসওয়ার্ড দেখুন'}
                    className="absolute right-3 top-2.5 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Checklist */}
              <div className="md:col-span-2 bg-stone-50 rounded-xl p-3.5 border border-stone-200 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-bn">
                <span className={passwordChecks.minLength ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                  {passwordChecks.minLength ? '✓' : '○'} কমপক্ষে ৮ অক্ষর
                </span>
                <span className={passwordChecks.hasLetter ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                  {passwordChecks.hasLetter ? '✓' : '○'} অন্তত ১টি ইংরেজি অক্ষর
                </span>
                <span className={passwordChecks.hasDigitOrSymbol ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                  {passwordChecks.hasDigitOrSymbol ? '✓' : '○'} অন্তত ১টি সংখ্যা বা চিহ্ন
                </span>
                <span className={passwordChecks.matchesConfirm ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                  {passwordChecks.matchesConfirm ? '✓' : '○'} উভয় পাসওয়ার্ড মিলছে
                </span>
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[11px] font-bn text-stone-500">
                  পাসওয়ার্ড পরিবর্তন করলে তা নিরাপদ Bcrypt (১২ রাউন্ড) হ্যাশ হিসেবে সংরক্ষিত হবে — কোথাও প্লেইনটেক্সট সংরক্ষণ করা হবে না।
                </p>

                <button
                  type="submit"
                  disabled={!isFormReady || isSavingPassword}
                  className="px-5 py-2.5 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl font-bn font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>আপডেট হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>নিরাপদভাবে পাসওয়ার্ড পরিবর্তন করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3 Tier Accounts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rbacTiers.map((tier) => {
          const status = roleStatusMap.get(tier.role);
          return (
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
                  <span className="text-[10px] font-mono text-stone-500">
                    {status?.source === 'database' ? 'DB Vault' : '.env'} • v{status?.tokenVersion ?? 1}
                  </span>
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
                  {status?.passwordUpdatedAt && (
                    <div>
                      <span className="text-[11px] font-bn text-stone-500 block">সর্বশেষ পাসওয়ার্ড পরিবর্তন</span>
                      <span className="text-[11px] font-sans text-stone-600">
                        {new Date(status.passwordUpdatedAt).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}
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
          );
        })}
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
          <span>সার্ভার সিকিউরিটি ও .env সিঙ্ক প্রক্রিয়া</span>
        </h3>
        <p className="leading-relaxed">
          পাসওয়ার্ড পরিবর্তন করলে সেটি <strong className="font-sans text-stone-900">Bcrypt (12 salt rounds)</strong>{' '}
          দিয়ে হ্যাশ হয়ে Supabase-এর সুরক্ষিত <strong className="font-mono text-stone-900">admin_users</strong>{' '}
          টেবিলে (শুধুমাত্র <strong className="font-mono text-stone-900">service_role</strong> এক্সেস) সংরক্ষিত হয় এবং
          সেশন <strong className="font-mono text-stone-900">token_version</strong> বৃদ্ধি পাওয়ায় পুরনো সকল লগইন বাতিল হয়।
          লোকাল বা রাইটেবল সার্ভারে <strong className="font-mono text-stone-900">.env.local</strong> ফাইলও স্বয়ংক্রিয়ভাবে
          নিরাপদ হ্যাশ ভ্যারিয়েবল (<strong className="font-mono text-stone-900">ADMIN_OWNER_PASSWORD_HASH</strong>) দিয়ে
          আপডেট হয়। তবে Vercel-এর মতো সার্ভারলেস হোস্টিংয়ে ফাইলসিস্টেম Read-Only হওয়ায় সরাসরি{' '}
          <strong className="font-mono text-stone-900">.env</strong> পরিবর্তন না হয়ে ডাটাবেজের হ্যাশই সকল সার্ভারে প্রাধান্য পায়।
        </p>
        <div className="bg-stone-900 text-stone-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
          <p className="text-amber-400"># পাসওয়ার্ড ও সেশন এনভায়রনমেন্ট কনফিগারেশন (Bcrypt Hash)</p>
          <p>ADMIN_OWNER_EMAIL=&quot;owner@dreamhomedecor.com&quot;</p>
          <p>ADMIN_OWNER_PASSWORD_HASH=&quot;\$2b\$12\$...&quot;</p>
          <p>ADMIN_MANAGER_PASSWORD_HASH=&quot;\$2b\$12\$...&quot;</p>
          <p>ADMIN_STAFF_PASSWORD_HASH=&quot;\$2b\$12\$...&quot;</p>
        </div>
      </div>
    </div>
  );
}
