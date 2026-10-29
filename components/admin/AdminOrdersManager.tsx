'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Phone,
  MessageCircle,
  Printer,
  ChevronDown,
  CheckCircle,
  Hammer,
  Truck,
  Clock,
  XCircle,
  Eye,
  Loader2,
  FileText,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/database';
import { formatBDT, getStatusBadgeInfo, buildWhatsAppUrl } from '@/lib/utils';
import { updateOrderStatusAction } from '@/lib/actions';

interface AdminOrdersManagerProps {
  initialOrders: Order[];
  whatsappNumber?: string;
}

export function AdminOrdersManager({ initialOrders }: AdminOrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter and search
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.includes(q) ||
      order.customer_address.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch {
      // Error handling
    } finally {
      setUpdatingId(null);
    }
  };

  const printCourierSlip = (order: Order) => {
    setSelectedOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, ফোন বা অর্ডার আইডি দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <div className="text-xs font-bn text-stone-500">
            মোট পাওয়া গেছে:{' '}
            <strong className="text-stone-900 font-sans">{filteredOrders.length}</strong> টি অর্ডার
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bn">
          {[
            { key: 'all', label: 'সবগুলো' },
            { key: 'pending', label: 'অপেক্ষমাণ (Pending)' },
            { key: 'confirmed', label: 'কনফার্মড (Confirmed)' },
            { key: 'in_production', label: 'কারখানায় তৈরি (In Production)' },
            { key: 'shipped', label: 'কুরিয়ারে (Shipped)' },
            { key: 'delivered', label: 'ডেলিভার্ড (Delivered)' },
            { key: 'cancelled', label: 'বাতিল (Cancelled)' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap font-semibold transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#8B5A2B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bn">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">অর্ডার আইডি</th>
                <th className="py-3.5 px-4">গ্রাহকের নাম ও ফোন</th>
                <th className="py-3.5 px-4">ঠিকানা ও জোন</th>
                <th className="py-3.5 px-4">আইটেম ও মূল্য</th>
                <th className="py-3.5 px-4">বর্তমান স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-right">এক-ক্লিক অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400 font-bn">
                    কোনো অর্ডার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadgeInfo(order.status);
                  const isUpdating = updatingId === order.id;

                  const whatsappMsg = `আসসালামু আলাইকুম ${order.customer_name}, ড্রিম হোম ডেকোর কারখানা থেকে আপনার অর্ডার #${order.order_number} (${order.status === 'in_production' ? 'কারখানায় তৈরি হচ্ছে' : 'প্রক্রিয়াধীন'}) সম্পর্কে যোগাযোগ করছি।`;
                  const waUrl = buildWhatsAppUrl(order.customer_phone, whatsappMsg);

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-sans font-extrabold text-[#8B5A2B] text-sm block">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] text-stone-400 font-sans block mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-GB')}
                        </span>
                      </td>

                      {/* Customer Info & Direct Call/WhatsApp */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-bold text-stone-900 text-sm">{order.customer_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded transition-colors"
                            title="সরাসরি কল দিন"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{order.customer_phone}</span>
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 p-0.5"
                            title="WhatsApp মেসেজ দিন"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </td>

                      {/* Address & Zone */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <p className="text-stone-700 leading-relaxed truncate">{order.customer_address}</p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.2 rounded font-semibold bg-stone-100 text-stone-600">
                          {order.delivery_zone === 'inside' ? 'ঢাকার ভেতরে (৳১২০)' : 'ঢাকার বাইরে (৳২০০)'}
                        </span>
                        {order.order_notes && (
                          <p className="text-[10px] text-amber-700 italic mt-0.5">
                            নোট: {order.order_notes}
                          </p>
                        )}
                      </td>

                      {/* Items & Amount */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-bold text-stone-900 text-sm font-sans">
                          {formatBDT(order.total_amount)}
                        </p>
                        <span className="text-[10px] text-stone-500 font-bn">
                          {order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'বিকাশ/নগদ'}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="relative inline-block">
                          <select
                            disabled={isUpdating}
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className={`text-xs font-bn font-bold rounded-xl px-2.5 py-1.5 border appearance-none pr-7 cursor-pointer focus:outline-hidden ${badge.className}`}
                          >
                            <option value="pending">অপেক্ষমাণ (Pending)</option>
                            <option value="confirmed">কনফার্মড (Confirmed)</option>
                            <option value="in_production">কারখানায় তৈরি (In Production)</option>
                            <option value="shipped">কুরিয়ারে (Shipped)</option>
                            <option value="delivered">ডেলিভার্ড (Delivered)</option>
                            <option value="cancelled">বাতিল (Cancelled)</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-stone-500" />
                        </div>
                        {isUpdating && (
                          <span className="text-[10px] text-stone-400 block mt-0.5 flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> সেভ হচ্ছে...
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-bn font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>বিস্তারিত</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => printCourierSlip(order)}
                          className="inline-flex items-center gap-1 bg-[#8B5A2B]/10 hover:bg-[#8B5A2B]/20 text-[#8B5A2B] px-2.5 py-1.5 rounded-lg text-xs font-bn font-bold transition-colors cursor-pointer"
                          title="কুরিয়ার স্লিপ প্রিন্ট"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>স্লিপ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details / Printable Courier Invoice Slip Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#1C1917] text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bn font-bold text-base text-white">
                  কুরিয়ার ডেলিভারি চালান / ইনভয়েস স্লিপ
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-3.5 py-1.5 rounded-lg text-xs font-bn font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট করুন</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Slip Content */}
            <div className="p-6 sm:p-8 space-y-6 text-stone-900 bg-white" id="printable-courier-slip">
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-stone-900 pb-4">
                <div>
                  <h1 className="font-serif font-black text-2xl tracking-tight text-stone-900">
                    Dream Home Decor
                  </h1>
                  <p className="text-xs font-bn font-semibold text-[#8B5A2B]">
                    সরাসরি নিজস্ব কারখানা ও বিক্রয়কেন্দ্র (মিরপুর, ঢাকা)
                  </p>
                  <p className="text-[11px] font-sans text-stone-500">
                    Hotline: 01712-345678 | WhatsApp: 8801712345678
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-sans font-black text-2xl text-stone-900 tracking-wider">
                    {selectedOrder.order_number}
                  </span>
                  <p className="text-xs font-bn text-stone-500 mt-0.5">
                    তারিখ: {new Date(selectedOrder.created_at).toLocaleDateString('en-GB')}
                  </p>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-stone-900 text-white font-bn text-xs font-bold mt-1">
                    ক্যাশ অন ডেলিভারি (COD)
                  </span>
                </div>
              </div>

              {/* Delivery Destination & Customer */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bn">
                <div>
                  <span className="text-stone-400 font-bold block uppercase tracking-wider text-[10px]">
                    প্রাপকের তথ্য (Customer Details):
                  </span>
                  <p className="font-bold text-stone-900 text-sm mt-1">{selectedOrder.customer_name}</p>
                  <p className="font-sans font-bold text-stone-900 text-sm">{selectedOrder.customer_phone}</p>
                  <p className="text-stone-700 mt-1 leading-relaxed">{selectedOrder.customer_address}</p>
                </div>

                <div className="text-right">
                  <span className="text-stone-400 font-bold block uppercase tracking-wider text-[10px]">
                    ডেলিভারি জোন ও চার্জ:
                  </span>
                  <p className="font-bold text-stone-900 text-sm mt-1">
                    {selectedOrder.delivery_zone === 'inside' ? 'ঢাকার ভেতরে (Inside)' : 'ঢাকার বাইরে (Outside)'}
                  </p>
                  <p className="text-stone-600 font-sans mt-1">
                    চার্জ: {formatBDT(selectedOrder.delivery_charge)}
                  </p>
                  {selectedOrder.order_notes && (
                    <p className="text-amber-800 italic text-[11px] mt-1">
                      নোট: {selectedOrder.order_notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs font-bn border border-stone-200">
                <thead className="bg-stone-100 text-stone-700 border-b border-stone-200 font-bold">
                  <tr>
                    <th className="p-2.5">পণ্যের বিবরণ</th>
                    <th className="p-2.5 text-center">কালার</th>
                    <th className="p-2.5 text-center">পরিমাণ</th>
                    <th className="p-2.5 text-right">একক মূল্য</th>
                    <th className="p-2.5 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {selectedOrder.order_items?.map((item, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-bold text-stone-900">{item.product_title}</td>
                      <td className="p-2.5 text-center">{item.selected_color || 'Standard'}</td>
                      <td className="p-2.5 text-center font-bold font-sans">{item.quantity}</td>
                      <td className="p-2.5 text-right font-sans">{formatBDT(item.unit_price)}</td>
                      <td className="p-2.5 text-right font-bold font-sans">
                        {formatBDT(item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs font-bn text-stone-700">
                  <div className="flex justify-between">
                    <span>সাবটোটাল:</span>
                    <span className="font-sans font-bold">{formatBDT(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="font-sans font-bold">{formatBDT(selectedOrder.delivery_charge)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-stone-950 pt-2 border-t-2 border-stone-900">
                    <span>ক্যাশ কালেকশন (Total COD):</span>
                    <span className="font-sans text-xl text-[#8B5A2B]">
                      {formatBDT(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-10 flex justify-between items-end text-xs font-bn text-stone-500">
                <div className="text-center border-t border-stone-300 pt-1 w-36">
                  কারখানা প্রতিনিধি স্বাক্ষর
                </div>
                <div className="text-center border-t border-stone-300 pt-1 w-36">
                  কুরিয়ার ডেলিভারি ম্যান
                </div>
                <div className="text-center border-t border-stone-300 pt-1 w-36">
                  গ্রাহক স্বাক্ষর
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
