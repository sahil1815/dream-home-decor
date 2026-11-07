'use client';

import React, { useState, useTransition } from 'react';
import { Customer } from '@/types/database';
import { toggleCustomerBlocklistAction, updateCustomerNotesAction } from '@/lib/actions';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Edit3,
  MapPin,
  ShoppingBag,
  CreditCard,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface CustomerDirectoryManagerProps {
  initialCustomers: Customer[];
}

export function CustomerDirectoryManager({ initialCustomers }: CustomerDirectoryManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<'all' | 'inside' | 'outside'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Note Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [noteText, setNoteText] = useState('');

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.address && c.address.toLowerCase().includes(q));

    const matchZone = zoneFilter === 'all' || c.delivery_zone === zoneFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'blocked' ? c.is_blocked : !c.is_blocked);

    return matchQuery && matchZone && matchStatus;
  });

  const totalSpentAll = customers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
  const blockedCount = customers.filter((c) => c.is_blocked).length;

  const handleToggleBlock = (customer: Customer) => {
    const newBlockedState = !customer.is_blocked;
    const confirmMsg = newBlockedState
      ? `আপনি কি নিশ্চিতভাবে ${customer.name} (${customer.phone}) কে ব্লক করতে চান? তিনি আর ক্যাশ অন ডেলিভারি অর্ডার দিতে পারবেন না।`
      : `আপনি কি ${customer.name} (${customer.phone}) এর ব্লক প্রত্যাহার করতে চান?`;

    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await toggleCustomerBlocklistAction(customer.phone, newBlockedState);
      if (res.success) {
        setCustomers((prev) =>
          prev.map((item) =>
            item.phone === customer.phone ? { ...item, is_blocked: newBlockedState } : item
          )
        );
        showToast(res.message || 'কাস্টমার স্ট্যাটাস আপডেট হয়েছে', 'success');
      } else {
        showToast(res.error || 'ব্যর্থ হয়েছে', 'error');
      }
    });
  };

  const handleSaveNotes = () => {
    if (!editingCustomer) return;
    startTransition(async () => {
      const res = await updateCustomerNotesAction(editingCustomer.phone, noteText);
      if (res.success) {
        setCustomers((prev) =>
          prev.map((item) =>
            item.phone === editingCustomer.phone ? { ...item, notes: noteText } : item
          )
        );
        showToast('কাস্টমার নোট সফলভাবে সংরক্ষিত হয়েছে', 'success');
        setEditingCustomer(null);
      } else {
        showToast(res.error || 'নোট সংরক্ষণ ব্যর্থ হয়েছে', 'error');
      }
    });
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
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#8B5A2B]" />
            <span>কাস্টমার ডিরেক্টরি ও হিস্টোরি</span>
          </h1>
          <p className="text-xs sm:text-sm font-bn text-stone-600 mt-1">
            গ্রাহকের ফোন নম্বর, পূর্ববর্তী অর্ডারের হিসাব, ঠিকানা ও ফেক-অর্ডার প্রতিরোধ তালিকা।
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#8B5A2B]" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">মোট নিবন্ধিত কাস্টমার</span>
            <span className="text-xl font-bold font-sans text-stone-900">{customers.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">মোট কাস্টমার লাইফটাইম বিক্রয়</span>
            <span className="text-xl font-bold font-sans text-emerald-700">
              ৳{totalSpentAll.toLocaleString('en-US')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[11px] font-bn text-stone-500 block">ব্লকড / ঝুঁকিপূর্ণ একাউন্ট</span>
            <span className="text-xl font-bold font-sans text-rose-700">{blockedCount} জন</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bn focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/20 focus:border-[#8B5A2B]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value as 'all' | 'inside' | 'outside')}
              aria-label="ডেলিভারি এরিয়া ফিল্টার"
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-700 focus:outline-none focus:border-[#8B5A2B]"
            >
              <option value="all">সকল জোন</option>
              <option value="inside">ঢাকা মেট্রো</option>
              <option value="outside">ঢাকার বাইরে</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
              aria-label="কাস্টমার স্ট্যাটাস ফিল্টার"
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-700 focus:outline-none focus:border-[#8B5A2B]"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="active">সক্রিয় গ্রাহক</option>
              <option value="blocked">ব্লকড গ্রাহক</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List Table / Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-stone-500 font-bn">
            <Users className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p>কোনো কাস্টমার পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bn text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">গ্রাহকের নাম ও মোবাইল</th>
                  <th className="py-3.5 px-4 font-semibold">ঠিকানা ও জোন</th>
                  <th className="py-3.5 px-4 font-semibold text-center">অর্ডার সংখ্যা</th>
                  <th className="py-3.5 px-4 font-semibold text-right">মোট ক্রয়</th>
                  <th className="py-3.5 px-4 font-semibold">অভ্যন্তরীণ নোট</th>
                  <th className="py-3.5 px-4 font-semibold text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-bn text-xs sm:text-sm">
                {filteredCustomers.map((customer) => {
                  const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.startsWith('88')
                    ? cleanPhone
                    : cleanPhone.startsWith('0')
                    ? `88${cleanPhone}`
                    : `880${cleanPhone}`;

                  return (
                    <tr
                      key={customer.id || customer.phone}
                      className={`hover:bg-stone-50/60 transition-colors ${
                        customer.is_blocked ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <span>{customer.name}</span>
                          {customer.is_blocked && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 border border-rose-300 font-bold">
                              ব্লকড
                            </span>
                          )}
                        </div>
                        <div className="text-stone-500 font-sans text-xs mt-0.5">
                          {customer.phone}
                        </div>
                      </td>

                      {/* Address & Zone */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-1 text-stone-700">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{customer.address || 'ঠিকানা দেওয়া হয়নি'}</span>
                        </div>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                          {customer.delivery_zone === 'inside' ? 'ঢাকা মেট্রো' : 'ঢাকার বাইরে'}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#8B5A2B]" />
                          <span>{customer.total_orders || 0} টি</span>
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold font-sans text-stone-900 text-sm">
                          ৳{(customer.total_spent || 0).toLocaleString('en-US')}
                        </div>
                      </td>

                      {/* Internal Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {customer.notes ? (
                          <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200/60 line-clamp-2">
                            {customer.notes}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs italic">কোনো নোট নেই</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Call Button */}
                          <a
                            href={`tel:${customer.phone}`}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                            title="সরাসরি কল দিন"
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          {/* WhatsApp Button */}
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-xs"
                            title="WhatsApp মেসেজ দিন"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Edit Notes */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(customer);
                              setNoteText(customer.notes || '');
                            }}
                            className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors border border-stone-200"
                            title="কাস্টমার নোট সম্পাদনা করুন"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Block/Unblock toggle */}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggleBlock(customer)}
                            className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                              customer.is_blocked
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-300'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                            }`}
                            title={customer.is_blocked ? 'আনব্লক করুন' : 'ব্লক করুন (ফেক অর্ডার রোধ)'}
                          >
                            {customer.is_blocked ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              <ShieldAlert className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Note Editor Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">
                গ্রাহক নোট: {editingCustomer.name}
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 font-bn text-sm">
              <p className="text-xs text-stone-500">
                এই নোটটি শুধুমাত্র অ্যাডমিন ও কারখানার স্টাফদের জন্য। গ্রাহক এটি দেখতে পাবেন না।
              </p>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                placeholder="যেমন: কাস্টমার বিকাল ৫টার পর ডেলিভারি পছন্দ করেন, কাঠের গাঢ় কালার পছন্দ করেন ইত্যাদি..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/20 focus:border-[#8B5A2B]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bn text-sm cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-[#8B5A2B] text-white hover:bg-[#724822] font-bn text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
