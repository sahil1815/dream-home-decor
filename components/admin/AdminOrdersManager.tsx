'use client';

import React, { useState } from 'react';
import {
  Search,
  Phone,
  MessageCircle,
  Printer,
  ChevronDown,
  Eye,
  FileText,
  Download,
  Send,
  XCircle,
  Truck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Order, OrderStatus, DeliveryZone, OrderNote } from '@/types/database';
import { formatBDT, getStatusBadgeInfo, buildWhatsAppUrl } from '@/lib/utils';
import {
  updateOrderStatusAction,
  addOrderNoteAction,
  cancelOrderAction,
  verifyPaymentAction,
  editOrderDetailsAction,
  bulkUpdateOrderStatusAction,
  createCourierBookingAction,
} from '@/lib/actions';

interface AdminOrdersManagerProps {
  initialOrders: Order[];
  whatsappNumber?: string;
}

export function AdminOrdersManager({ initialOrders }: AdminOrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('confirmed');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [courierLoading, setCourierLoading] = useState(false);

  // Modal Sub-Views
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'timeline' | 'notes' | 'edit'>('details');

  // Internal Note State
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Cancellation State
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  // Advance Payment State
  const [advanceInput, setAdvanceInput] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  // Edit Order State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editZone, setEditZone] = useState<DeliveryZone>('inside');
  const [editCharge, setEditCharge] = useState(120);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Open modal and pre-populate edit states
  const openOrderModal = (order: Order, defaultTab: 'details' | 'timeline' | 'notes' | 'edit' = 'details') => {
    setSelectedOrder(order);
    setActiveModalTab(defaultTab);
    setShowCancelPrompt(false);
    setCancelReason('');
    setEditName(order.customer_name);
    setEditPhone(order.customer_phone);
    setEditAddress(order.customer_address);
    setEditZone(order.delivery_zone);
    setEditCharge(order.delivery_charge);
    setAdvanceInput(order.advance_payment_amount?.toString() || '0');
  };

  // Filter and search logic
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesZone = zoneFilter === 'all' || order.delivery_zone === zoneFilter;
    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'cod' && order.payment_method === 'cod') ||
      (paymentFilter === 'mfs' && order.payment_method !== 'cod');

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.includes(q) ||
      order.customer_address.toLowerCase().includes(q);

    return matchesStatus && matchesZone && matchesPayment && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'amount_desc') return Number(b.total_amount) - Number(a.total_amount);
    if (sortBy === 'amount_asc') return Number(a.total_amount) - Number(b.total_amount);
    return 0;
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
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await bulkUpdateOrderStatusAction(selectedIds, bulkStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (selectedIds.includes(o.id) ? { ...o, status: bulkStatus } : o))
        );
        setSelectedIds([]);
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await addOrderNoteAction(selectedOrder.id, newNote.trim());
      if (res.success) {
        const createdNote: OrderNote = {
          id: `note-${Date.now()}`,
          order_id: selectedOrder.id,
          staff_id: 'current_staff',
          staff_name: 'অ্যাডমিন স্টাফ',
          note: newNote.trim(),
          created_at: new Date().toISOString(),
        };
        const updatedNotes = [...(selectedOrder.notes_history || []), createdNote];
        setSelectedOrder({ ...selectedOrder, notes_history: updatedNotes });
        setNewNote('');
      }
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      const res = await cancelOrderAction(selectedOrder.id, cancelReason.trim());
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? { ...o, status: 'cancelled', cancel_reason: cancelReason.trim() }
              : o
          )
        );
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: 'cancelled', cancel_reason: cancelReason.trim() } : null
        );
        setShowCancelPrompt(false);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleVerifyPayment = async (verified: boolean) => {
    if (!selectedOrder) return;
    setIsUpdatingPayment(true);
    try {
      const advance = Number(advanceInput) || 0;
      const res = await verifyPaymentAction(selectedOrder.id, verified, advance);
      if (res.success) {
        const due = Math.max(0, Number(selectedOrder.total_amount) - advance);
        const updated: Order = {
          ...selectedOrder,
          payment_verified: verified,
          advance_payment_amount: advance,
          due_amount: due,
        };
        setSelectedOrder(updated);
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));
      }
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSavingEdit(true);
    try {
      const res = await editOrderDetailsAction({
        orderId: selectedOrder.id,
        customer_name: editName,
        customer_phone: editPhone,
        customer_address: editAddress,
        delivery_zone: editZone,
        delivery_charge: Number(editCharge),
        items: (selectedOrder.order_items || []).map((it) => ({
          id: it.id,
          product_id: it.product_id,
          product_title: it.product_title,
          quantity: it.quantity,
          unit_price: it.unit_price,
          selected_color: it.selected_color,
        })),
      });

      if (res.success) {
        const subtotal = (selectedOrder.order_items || []).reduce(
          (sum, it) => sum + Number(it.unit_price) * it.quantity,
          0
        );
        const total = subtotal + Number(editCharge);
        const updated: Order = {
          ...selectedOrder,
          customer_name: editName,
          customer_phone: editPhone,
          customer_address: editAddress,
          delivery_zone: editZone,
          delivery_charge: Number(editCharge),
          subtotal,
          total_amount: total,
        };
        setSelectedOrder(updated);
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));
        setActiveModalTab('details');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // CSV Export Handler
  const exportToCsv = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'Address',
      'Zone',
      'Items',
      'Subtotal',
      'Delivery Charge',
      'Total Amount',
      'Payment Method',
      'Status',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.order_number}"`,
      `"${new Date(o.created_at).toISOString().split('T')[0]}"`,
      `"${o.customer_name.replace(/"/g, '""')}"`,
      `"${o.customer_phone}"`,
      `"${o.customer_address.replace(/"/g, '""')}"`,
      `"${o.delivery_zone}"`,
      `"${(o.order_items || []).map((i) => `${i.product_title} x${i.quantity}`).join('; ')}"`,
      o.subtotal,
      o.delivery_charge,
      o.total_amount,
      o.payment_method,
      o.status,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dream_home_decor_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Duplicate phone history detection for an order
  const getCustomerPhoneHistory = (phone: string, currentOrderId: string) => {
    const pastOrders = orders.filter((o) => o.customer_phone === phone && o.id !== currentOrderId);
    const returnedCount = pastOrders.filter((o) => o.status === 'returned').length;
    const cancelledCount = pastOrders.filter((o) => o.status === 'cancelled').length;
    const deliveredCount = pastOrders.filter((o) => o.status === 'delivered').length;
    return {
      totalPast: pastOrders.length,
      returnedCount,
      cancelledCount,
      deliveredCount,
      isRepeatCustomer: pastOrders.length > 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Search, Filters & Bulk Actions Card */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
        {/* Search, Zone, Payment, Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অর্ডার নম্বর, নাম, ফোন বা ঠিকানা..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>

          {/* Zone Filter */}
          <div className="lg:col-span-2">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-800"
            >
              <option value="all">সব জোন (All Zones)</option>
              <option value="inside">ঢাকার ভেতরে (Inside)</option>
              <option value="outside">ঢাকার বাইরে (Outside)</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="lg:col-span-2">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-800"
            >
              <option value="all">সব পেমেন্ট (All)</option>
              <option value="cod">ক্যাশ অন ডেলিভারি (COD)</option>
              <option value="mfs">বিকাশ / নগদ (MFS)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-800"
            >
              <option value="date_desc">তারিখ: নতুন আগে</option>
              <option value="date_asc">তারিখ: পুরাতন আগে</option>
              <option value="amount_desc">মূল্য: বেশি থেকে কম</option>
              <option value="amount_asc">মূল্য: কম থেকে বেশি</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <div className="lg:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={exportToCsv}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bn font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>CSV এক্সপোর্ট ({filteredOrders.length})</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs (All 9 statuses) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bn scrollbar-none">
          {[
            { key: 'all', label: `সবগুলো (${orders.length})` },
            { key: 'pending', label: 'অপেক্ষমাণ' },
            { key: 'confirmation_call', label: 'কল সম্পন্ন' },
            { key: 'confirmed', label: 'কনফার্মড' },
            { key: 'in_production', label: 'কারখানায় তৈরি' },
            { key: 'ready', label: 'প্রস্তুত' },
            { key: 'shipped', label: 'কুরিয়ারে' },
            { key: 'delivered', label: 'ডেলিভার্ড' },
            { key: 'cancelled', label: 'বাতিল' },
            { key: 'returned', label: 'ফেরত' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap font-bold transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#8B5A2B] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bulk Action Bar (Visible when checkboxes selected) */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-bn">
            <span className="font-bold text-amber-950">
              {selectedIds.length} টি অর্ডার সিলেক্ট করা হয়েছে
            </span>

            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
                className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bn text-stone-900"
              >
                <option value="confirmed">কনফার্মড করুন</option>
                <option value="in_production">কারখানায় তৈরি পাঠান</option>
                <option value="ready">প্যাকিং প্রস্তুত চিহ্নিত করুন</option>
                <option value="shipped">কুরিয়ারে পাঠানো চিহ্নিত করুন</option>
                <option value="delivered">ডেলিভার্ড চিহ্নিত করুন</option>
                <option value="cancelled">বাতিল চিহ্নিত করুন</option>
              </select>

              <button
                type="button"
                onClick={handleBulkStatusUpdate}
                disabled={isBulkUpdating}
                className="px-3.5 py-1.5 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer shadow-xs transition-colors"
              >
                {isBulkUpdating ? 'আপডেট হচ্ছে...' : 'স্ট্যাটাস পরিবর্তন করুন'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800"
              >
                বাতিল
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Orders Table (Responsive Mobile & Desktop) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs font-bn">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 && selectedIds.length === filteredOrders.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredOrders.map((o) => o.id));
                      else setSelectedIds([]);
                    }}
                    className="rounded border-stone-300 text-[#8B5A2B] focus:ring-[#8B5A2B]"
                  />
                </th>
                <th className="py-3 px-3">অর্ডার নম্বর</th>
                <th className="py-3 px-3">গ্রাহক ও যোগাযোগ</th>
                <th className="py-3 px-3">আইটেম ও ফার্নিচার</th>
                <th className="py-3 px-3">মূল্য ও পেমেন্ট</th>
                <th className="py-3 px-3">স্ট্যাটাস</th>
                <th className="py-3 px-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    কোনো অর্ডার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getStatusBadgeInfo(order.status);
                  const isUpdating = updatingId === order.id;
                  const isSelected = selectedIds.includes(order.id);
                  const waMsg = `আসসালামু আলাইকুম ${order.customer_name}, ড্রিম হোম ডেকোর থেকে আপনার অর্ডারটি (${order.order_number}) নিয়ে যোগাযোগ করছি।`;
                  const waUrl = buildWhatsAppUrl(order.customer_phone, waMsg);

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds((prev) => [...prev, order.id]);
                            else setSelectedIds((prev) => prev.filter((id) => id !== order.id));
                          }}
                          className="rounded border-stone-300 text-[#8B5A2B] focus:ring-[#8B5A2B]"
                        />
                      </td>

                      {/* Order Number & Date */}
                      <td className="py-3.5 px-3 align-top">
                        <p className="font-sans font-bold text-sm text-[#8B5A2B]">
                          {order.order_number}
                        </p>
                        <span className="text-[10px] text-stone-400 font-sans block">
                          {new Date(order.created_at).toLocaleDateString('en-GB')}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-3 align-top">
                        <p className="font-bold text-stone-900 text-xs sm:text-sm">
                          {order.customer_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-sans text-stone-500 text-xs">
                            {order.customer_phone}
                          </span>
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="text-stone-400 hover:text-emerald-600"
                            title="কল দিন"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-400 hover:text-[#25D366]"
                            title="হোয়াটসঅ্যাপ"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 max-w-xs">
                          {order.customer_address}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3 align-top max-w-xs">
                        <p className="font-bold text-stone-800 line-clamp-1">
                          {order.order_items?.[0]?.product_title || 'ফার্নিচার'}
                        </p>
                        <span className="text-[11px] text-stone-400 font-bn">
                          {order.order_items && order.order_items.length > 1
                            ? `+ আরও ${order.order_items.length - 1}টি আইটেম`
                            : '১টি পণ্য'}
                        </span>
                      </td>

                      {/* Price & Payment */}
                      <td className="py-3.5 px-3 align-top">
                        <p className="font-bold text-stone-900 text-sm font-sans">
                          {formatBDT(order.total_amount)}
                        </p>
                        <span
                          className={`text-[10px] font-bn px-1.5 py-0.5 rounded ${
                            order.payment_method === 'cod'
                              ? 'bg-stone-100 text-stone-600'
                              : order.payment_verified
                              ? 'bg-emerald-100 text-emerald-800 font-bold'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.payment_method === 'cod'
                            ? 'ক্যাশ অন ডেলিভারি'
                            : order.payment_verified
                            ? 'বিকাশ (ভেরিফাইড)'
                            : 'বিকাশ (পেন্ডিং)'}
                        </span>
                      </td>

                      {/* Quick Status Dropdown */}
                      <td className="py-3.5 px-3 align-top">
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
                            <option value="confirmation_call">কল সম্পন্ন (Call Done)</option>
                            <option value="confirmed">কনফার্মড (Confirmed)</option>
                            <option value="in_production">কারখানায় তৈরি (In Production)</option>
                            <option value="ready">প্রস্তুত (Ready)</option>
                            <option value="shipped">কুরিয়ারে (Shipped)</option>
                            <option value="delivered">ডেলিভার্ড (Delivered)</option>
                            <option value="cancelled">বাতিল (Cancelled)</option>
                            <option value="returned">ফেরত (Returned)</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-stone-500" />
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-3 align-top text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openOrderModal(order, 'details')}
                          className="inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-bn font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>বিস্তারিত</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="inline-flex items-center gap-1 bg-[#8B5A2B]/10 hover:bg-[#8B5A2B]/20 text-[#8B5A2B] px-2 py-1.5 rounded-lg text-xs font-bn font-bold transition-colors cursor-pointer"
                          title="চালান প্রিন্ট"
                        >
                          <Printer className="w-3.5 h-3.5" />
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

      {/* 3. Comprehensive Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92dvh] flex flex-col">
            {/* Modal Top Header */}
            <div className="p-4 sm:p-5 bg-[#1C1917] text-white flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bn font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>অর্ডার {selectedOrder.order_number}</span>
                    <span className="font-mono text-xs bg-stone-800 px-2 py-0.5 rounded text-amber-300">
                      {getStatusBadgeInfo(selectedOrder.status).labelBn}
                    </span>
                  </h3>
                  <p className="text-[11px] font-sans text-stone-400">
                    Placed: {new Date(selectedOrder.created_at).toLocaleString('en-GB')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#8B5A2B] hover:bg-[#6D431F] text-white px-3 py-1.5 rounded-xl text-xs font-bn font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>চালান প্রিন্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Tabs: Details | Timeline | Staff Notes | Edit Order */}
            <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-4 text-xs font-bn font-bold no-print overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveModalTab('details')}
                className={`py-2 border-b-2 transition-colors cursor-pointer ${
                  activeModalTab === 'details'
                    ? 'border-[#8B5A2B] text-[#8B5A2B]'
                    : 'border-transparent text-stone-500'
                }`}
              >
                অর্ডার বিবরণ ও পেমেন্ট
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('timeline')}
                className={`py-2 border-b-2 transition-colors cursor-pointer ${
                  activeModalTab === 'timeline'
                    ? 'border-[#8B5A2B] text-[#8B5A2B]'
                    : 'border-transparent text-stone-500'
                }`}
              >
                টাইমলাইন ({selectedOrder.status_history?.length || 1})
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('notes')}
                className={`py-2 border-b-2 transition-colors cursor-pointer ${
                  activeModalTab === 'notes'
                    ? 'border-[#8B5A2B] text-[#8B5A2B]'
                    : 'border-transparent text-stone-500'
                }`}
              >
                স্টাফ নোট ({selectedOrder.notes_history?.length || 0})
              </button>
              {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && (
                <button
                  type="button"
                  onClick={() => setActiveModalTab('edit')}
                  className={`py-2 border-b-2 transition-colors cursor-pointer ${
                    activeModalTab === 'edit'
                      ? 'border-[#8B5A2B] text-[#8B5A2B]'
                      : 'border-transparent text-stone-500'
                  }`}
                >
                  অর্ডার এডিট করুন
                </button>
              )}
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Tab 1: Details View */}
              {activeModalTab === 'details' && (
                <div className="space-y-6">
                  {/* Customer History & Risk Alert */}
                  {(() => {
                    const history = getCustomerPhoneHistory(
                      selectedOrder.customer_phone,
                      selectedOrder.id
                    );
                    return (
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bn">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">
                              {selectedOrder.customer_name}
                            </span>
                            <span className="font-mono text-stone-500">
                              {selectedOrder.customer_phone}
                            </span>
                          </div>
                          <p className="text-stone-600 mt-1">{selectedOrder.customer_address}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                            <span>পূর্বে অর্ডার: {history.totalPast} টি</span>
                            {history.returnedCount > 0 && (
                              <span className="text-rose-600 font-bold">
                                • {history.returnedCount}টি ফেরত
                              </span>
                            )}
                            {history.cancelledCount > 0 && (
                              <span className="text-amber-600 font-bold">
                                • {history.cancelledCount}টি বাতিল
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`tel:${selectedOrder.customer_phone}`}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>কল দিন</span>
                          </a>
                          <a
                            href={buildWhatsAppUrl(
                              selectedOrder.customer_phone,
                              `আসসালামু আলাইকুম ${selectedOrder.customer_name}, আপনার ড্রিম হোম ডেকোর অর্ডার (${selectedOrder.order_number}) এর কনফার্মেশনের জন্য যোগাযোগ করছি।`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#25D366] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Suspicious Order Warning */}
                  {selectedOrder.is_flagged_suspicious && (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs font-bn text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">সন্দেহজনক অর্ডার চিহ্নিত (Fraud Risk Flag)</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          এই ফোন নম্বর থেকে পূর্বে অর্ডার বাতিলের হিস্ট্রি অথবা অস্বাভাবিক তথ্য পাওয়া গেছে। পণ্য পাঠানোর পূর্বে ফোনে নিশ্চিত হোন।
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Marketing Attribution (UTM Tracking) */}
                  {(selectedOrder.utm_source || selectedOrder.utm_campaign) && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs font-bn text-blue-900">
                      <span className="font-bold">মার্কেটিং ট্র্যাকিং:</span>
                      <span className="font-sans font-semibold text-blue-800">
                        {selectedOrder.utm_source?.toUpperCase()}
                        {selectedOrder.utm_campaign ? ` (${selectedOrder.utm_campaign})` : ''}
                        {selectedOrder.utm_medium ? ` • ${selectedOrder.utm_medium}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-3">
                    <h4 className="font-bn font-bold text-xs uppercase tracking-wider text-stone-500">
                      অর্ডারকৃত ফার্নিচার আইটেমসমূহ:
                    </h4>
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                      {(selectedOrder.order_items || []).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 flex items-center justify-between text-xs font-bn"
                        >
                          <div>
                            <p className="font-bold text-stone-900 text-sm">
                              {item.product_title}
                            </p>
                            <p className="text-stone-500 text-[11px] font-sans">
                              কালার: {item.selected_color || 'Standard Natural'} | পরিমাণ: {item.quantity} টি
                            </p>
                          </div>
                          <p className="font-sans font-bold text-stone-900 text-sm">
                            {formatBDT(Number(item.unit_price) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial & Advance Payment Tracking */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs font-bn">
                    <div className="flex justify-between items-center text-stone-600">
                      <span>সাবটোটাল (Subtotal):</span>
                      <span className="font-sans font-bold">{formatBDT(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-600">
                      <span>
                        ডেলিভারি চার্জ (
                        {selectedOrder.delivery_zone === 'inside'
                          ? 'ঢাকার ভেতরে ৳120'
                          : 'ঢাকার বাইরে ৳200'}
                        ):
                      </span>
                      <span className="font-sans font-bold">
                        {formatBDT(selectedOrder.delivery_charge)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-stone-900 font-bold text-sm">
                      <span>সর্বমোট বিল (Total):</span>
                      <span className="font-sans text-base text-[#8B5A2B]">
                        {formatBDT(selectedOrder.total_amount)}
                      </span>
                    </div>

                    {/* MFS Advance Payment Row */}
                    <div className="pt-3 border-t border-stone-200 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-stone-900">
                            পেমেন্ট মাধ্যম: {selectedOrder.payment_method.toUpperCase()}
                          </p>
                          {selectedOrder.transaction_id && (
                            <p className="font-mono text-stone-600 text-[11px]">
                              TrxID: {selectedOrder.transaction_id}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={advanceInput}
                            onChange={(e) => setAdvanceInput(e.target.value)}
                            placeholder="অগ্রিম জমা ৳"
                            className="w-28 px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-sans font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyPayment(true)}
                            disabled={isUpdatingPayment}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {selectedOrder.payment_verified ? 'আপডেট' : 'ভেরিফাই ও সেভ'}
                          </button>
                        </div>
                      </div>

                      {Number(selectedOrder.advance_payment_amount || 0) > 0 && (
                        <div className="flex justify-between text-xs text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg">
                          <span>অগ্রিম জমা: {formatBDT(selectedOrder.advance_payment_amount || 0)}</span>
                          <span>বকেয়া (COD কালেকশন): {formatBDT(selectedOrder.due_amount || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Change & Cancel Prompt Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bn font-bold text-stone-700">স্ট্যাটাস:</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) =>
                          handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                        }
                        className="px-3 py-1.5 bg-[#FAF8F5] border border-stone-300 rounded-xl text-xs font-bn font-bold text-stone-900"
                      >
                        <option value="pending">অপেক্ষমাণ (Pending)</option>
                        <option value="confirmation_call">কল সম্পন্ন (Call Done)</option>
                        <option value="confirmed">কনফার্মড (Confirmed)</option>
                        <option value="in_production">কারখানায় তৈরি (In Production)</option>
                        <option value="ready">প্রস্তুত (Ready)</option>
                        <option value="shipped">কুরিয়ারে (Shipped)</option>
                        <option value="delivered">ডেলিভার্ড (Delivered)</option>
                        <option value="cancelled">বাতিল (Cancelled)</option>
                        <option value="returned">ফেরত (Returned)</option>
                      </select>
                    </div>

                    {selectedOrder.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => setShowCancelPrompt(true)}
                        className="text-xs font-bn font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>অর্ডার বাতিল করুন</span>
                      </button>
                    )}
                  </div>

                  {/* Steadfast Courier Booking */}
                  <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#8A5A3B]" />
                      <span className="text-xs font-bn font-bold text-stone-700">কুরিয়ার হ্যান্ডলিং:</span>
                    </div>
                    <button
                      type="button"
                      disabled={courierLoading || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'}
                      onClick={async () => {
                        setCourierLoading(true);
                        try {
                          const res = await createCourierBookingAction(selectedOrder.id);
                          if (res.success) {
                            alert(res.message);
                            handleStatusChange(selectedOrder.id, 'shipped');
                          } else {
                            alert(res.error || 'কুরিয়ার বুকিং ব্যর্থ হয়েছে');
                          }
                        } catch {
                          alert('কুরিয়ার বুকিং ব্যর্থ হয়েছে');
                        } finally {
                          setCourierLoading(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8A5A3B] hover:bg-[#6E442B] disabled:bg-stone-300 text-white rounded-xl text-xs font-bn font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {courierLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>কুরিয়ার বুকিং হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5" />
                          <span>
                            {selectedOrder.status === 'shipped'
                              ? 'পার্সেল বুকড (Steadfast)'
                              : 'Steadfast-এ পার্সেল তৈরি করুন'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Cancellation Prompt Modal Section */}
                  {showCancelPrompt && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                      <p className="text-xs font-bn font-bold text-rose-950">
                        অর্ডার বাতিলের সুনির্দিষ্ট কারণ লিখুন (স্টাফ ও অডিটের জন্য):
                      </p>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="যেমন: কাস্টমার পরে অর্ডার করবেন / ভুল অর্ডার দিয়েছেন..."
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bn text-stone-900"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCancelPrompt(false)}
                          className="px-3 py-1.5 text-xs font-bn text-stone-600 hover:text-stone-900"
                        >
                          ফিরে যান
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmCancel}
                          disabled={isCancelling || !cancelReason.trim()}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bn font-bold cursor-pointer"
                        >
                          {isCancelling ? 'বাতিল হচ্ছে...' : 'বাতিল নিশ্চিত করুন'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Timeline View */}
              {activeModalTab === 'timeline' && (
                <div className="space-y-4">
                  <h4 className="font-bn font-bold text-xs uppercase tracking-wider text-stone-500">
                    অর্ডার স্ট্যাটাস অগ্রগতি ও টাইমলাইন:
                  </h4>
                  <div className="space-y-3 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                    {(selectedOrder.status_history || [
                      {
                        id: 'hist-init',
                        order_id: selectedOrder.id,
                        status: selectedOrder.status,
                        note: 'অর্ডার প্লেস করা হয়েছে',
                        changed_by: 'গ্রাহক',
                        created_at: selectedOrder.created_at,
                      },
                    ]).map((h, i) => (
                      <div key={i} className="relative space-y-0.5 text-xs font-bn">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#8B5A2B] ring-4 ring-white" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">
                            {getStatusBadgeInfo(h.status).labelBn}
                          </span>
                          <span className="text-[10px] text-stone-400 font-sans">
                            {new Date(h.created_at).toLocaleString('en-GB')}
                          </span>
                        </div>
                        <p className="text-stone-600">{h.note || 'স্ট্যাটাস আপডেট'}</p>
                        {h.changed_by && (
                          <p className="text-[10px] text-stone-400">কর্তৃক: {h.changed_by}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Staff Notes View */}
              {activeModalTab === 'notes' && (
                <div className="space-y-4">
                  <h4 className="font-bn font-bold text-xs uppercase tracking-wider text-stone-500">
                    অভ্যন্তরীণ স্টাফ নোট (গ্রাহক দেখতে পাবে না):
                  </h4>

                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={2}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="কাস্টমারের পছন্দ, ডেলিভারি রিকোয়েস্ট বা কল নোট লিখুন..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bn text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#8B5A2B]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isAddingNote || !newNote.trim()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:opacity-50 text-white text-xs font-bn font-bold rounded-xl shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>নোট যুক্ত করুন</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2.5 divide-y divide-stone-100">
                    {(selectedOrder.notes_history || []).length > 0 ? (
                      selectedOrder.notes_history?.map((n) => (
                        <div key={n.id} className="pt-2.5 first:pt-0 space-y-1 text-xs font-bn">
                          <div className="flex justify-between items-center text-stone-400 text-[10px]">
                            <span className="font-bold text-stone-700">{n.staff_name}</span>
                            <span className="font-sans">
                              {new Date(n.created_at).toLocaleString('en-GB')}
                            </span>
                          </div>
                          <p className="text-stone-800 leading-relaxed">{n.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-bn text-stone-400 py-4 text-center">
                        এখনও কোনো অভ্যন্তরীণ নোট যোগ করা হয়নি
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Edit Order Details (Before Shipping) */}
              {activeModalTab === 'edit' && (
                <form onSubmit={handleSaveOrderEdit} className="space-y-4 text-xs font-bn">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                    ডেলিভারি পাঠানোর পূর্বে প্রাপকের নাম, ফোন ও ঠিকানায় কোনো ভুল থাকলে সংশোধন করতে পারেন।
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">গ্রাহকের নাম:</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bn text-stone-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">ফোন নম্বর:</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans text-stone-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">বিস্তারিত ঠিকানা:</label>
                    <textarea
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bn text-stone-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">ডেলিভারি জোন:</label>
                      <select
                        value={editZone}
                        onChange={(e) => {
                          const z = e.target.value as DeliveryZone;
                          setEditZone(z);
                          setEditCharge(z === 'inside' ? 120 : 200);
                        }}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bn text-stone-900"
                      >
                        <option value="inside">ঢাকার ভেতরে</option>
                        <option value="outside">ঢাকার বাইরে</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">ডেলিভারি চার্জ (৳):</label>
                      <input
                        type="number"
                        value={editCharge}
                        onChange={(e) => setEditCharge(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans text-stone-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('details')}
                      className="px-3 py-1.5 text-stone-500 hover:text-stone-800"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="px-4 py-2 bg-[#8B5A2B] hover:bg-[#6D431F] text-white font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                      {isSavingEdit ? 'সংরক্ষিত হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
