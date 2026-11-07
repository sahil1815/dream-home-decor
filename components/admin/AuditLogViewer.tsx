'use client';

import React, { useState } from 'react';
import { AuditLogEntry } from '@/types/database';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  Eye,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';

interface AuditLogViewerProps {
  initialLogs: AuditLogEntry[];
}

export function AuditLogViewer({ initialLogs }: AuditLogViewerProps) {
  const [logs] = useState<AuditLogEntry[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'manager' | 'staff'>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      log.admin_email.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(q)) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(q));

    const matchRole = roleFilter === 'all' || log.admin_role === roleFilter;

    return matchQuery && matchRole;
  });

  const roleBadges: Record<string, { label: string; bg: string; text: string }> = {
    owner: { label: 'মালিক', bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800' },
    manager: { label: 'ম্যানেজার', bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800' },
    staff: { label: 'স্টাফ', bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800' },
  };

  const actionLabels: Record<string, string> = {
    order_status_update: 'অর্ডার স্ট্যাটাস পরিবর্তন',
    order_cancel: 'অর্ডার বাতিলকরণ',
    add_order_note: 'অভ্যন্তরীণ স্টাফ নোট যোগ',
    verify_payment: 'অগ্রিম পেমেন্ট ভেরিফাই',
    edit_order: 'অর্ডার বিবরণ সম্পাদন',
    bulk_status_update: 'বাল্ক স্ট্যাটাস পরিবর্তন',
    block_customer: 'কাস্টমার ব্লকলিস্টে অন্তর্ভুক্ত',
    unblock_customer: 'কাস্টমার আনব্লক',
    update_customer_note: 'কাস্টমার নোট সংরক্ষণ',
    save_product: 'পণ্য যোগ বা সম্পাদন',
    duplicate_product: 'পণ্য ক্লোন / ডুপ্লিকেট',
    delete_product: 'পণ্য অপসারন (সফট ডিলিট)',
    save_category: 'ক্যাটাগরি আপডেট',
    save_delivery_zone: 'ডেলিভারি চার্জ নির্ধারণ',
    save_site_content: 'সাইট পলিসি / কনটেন্ট এডিট',
    update_custom_request: 'কাস্টম ফার্নিচার কোটেশন আপডেট',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-[#8B5A2B]" />
          <span>সিকিউরিটি ও অ্যাডমিন অডিট লগ</span>
        </h1>
        <p className="text-xs sm:text-sm font-bn text-stone-600 mt-1">
          অ্যাডমিন প্যানেলে সম্পাদিত প্রতিটি পরিবর্তন, স্ট্যাটাস আপডেট ও আর্থিক অ্যাকশনের অমোচনীয় রেকর্ড।
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ইমেইল, অ্যাকশন বা অর্ডার আইডি দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bn focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/20 focus:border-[#8B5A2B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'owner' | 'manager' | 'staff')}
              aria-label="অ্যাডমিন রোল ফিল্টার"
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-700 focus:outline-none focus:border-[#8B5A2B]"
            >
              <option value="all">সকল ভূমিকা (All Roles)</option>
              <option value="owner">মালিক (Owner)</option>
              <option value="manager">ম্যানেজার (Manager)</option>
              <option value="staff">স্টাফ (Staff)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-stone-500 font-bn">
            <FileText className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p>কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bn text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">অ্যাডমিন ও ভূমিকা</th>
                  <th className="py-3 px-4 font-semibold">অ্যাকশন</th>
                  <th className="py-3 px-4 font-semibold">মডিউল / আইডি</th>
                  <th className="py-3 px-4 font-semibold">সময়</th>
                  <th className="py-3 px-4 font-semibold text-right">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-bn text-xs sm:text-sm">
                {filteredLogs.map((entry) => {
                  const roleCfg = roleBadges[entry.admin_role] || {
                    label: entry.admin_role,
                    bg: 'bg-stone-100 border-stone-300',
                    text: 'text-stone-700',
                  };

                  return (
                    <tr key={entry.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Admin Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900 font-sans text-xs">
                          {entry.admin_email}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] border font-bold ${roleCfg.bg} ${roleCfg.text}`}
                        >
                          {roleCfg.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-stone-800">
                          {actionLabels[entry.action] || entry.action}
                        </span>
                        <div className="text-[11px] font-mono text-stone-400">
                          {entry.action}
                        </div>
                      </td>

                      {/* Module & Entity ID */}
                      <td className="py-3 px-4">
                        <span className="text-stone-700 uppercase font-mono text-xs">
                          {entry.entity_type}
                        </span>
                        {entry.entity_id && (
                          <div className="text-[11px] font-sans text-stone-500 font-bold">
                            {entry.entity_id}
                          </div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-sans text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{new Date(entry.created_at).toLocaleString('bn-BD')}</span>
                        </div>
                      </td>

                      {/* Details inspect */}
                      <td className="py-3 px-4 text-right">
                        {entry.details ? (
                          <button
                            type="button"
                            onClick={() => setSelectedEntry(entry)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200 cursor-pointer"
                            title="বিস্তারিত ডাটা দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-stone-400 text-xs italic">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details JSON Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#8B5A2B]" />
                <span>অডিট লগ মেটাডাটা</span>
              </h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 font-bn text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-500 block">ব্যবহারকারী:</span>
                  <strong className="font-sans text-stone-800">{selectedEntry.admin_email}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">ভূমিকা:</span>
                  <strong className="text-stone-800">{selectedEntry.admin_role}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">অ্যাকশন:</span>
                  <strong className="font-mono text-stone-800">{selectedEntry.action}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">সময়:</span>
                  <span className="font-sans text-stone-800">
                    {new Date(selectedEntry.created_at).toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-stone-500 block mb-1 font-semibold">পেলোড ও প্যারামিটার:</span>
                <pre className="p-3 bg-stone-900 text-amber-200 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                  {JSON.stringify(selectedEntry.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-800 font-bn text-xs font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
