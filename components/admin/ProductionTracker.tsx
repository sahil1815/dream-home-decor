'use client';

import React, { useState } from 'react';
import {
  Hammer,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/database';
import { buildWhatsAppUrl } from '@/lib/utils';
import { updateOrderStatusAction } from '@/lib/actions';

interface ProductionTrackerProps {
  initialOrders: Order[];
}

export function ProductionTracker({ initialOrders }: ProductionTrackerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Workshop stages that craftsmen work on
  const stages: Array<{
    id: OrderStatus;
    titleBn: string;
    desc: string;
    color: string;
    nextStatus?: OrderStatus;
    nextLabel?: string;
  }> = [
    {
      id: 'confirmed',
      titleBn: '১. কাটিং অপেক্ষমাণ',
      desc: 'কনফার্মড অর্ডার, বোর্ড কাটিং তালিকায় পাঠানো হয়েছে',
      color: 'border-blue-300 bg-blue-50/50',
      nextStatus: 'in_production',
      nextLabel: 'কাটিং শুরু করুন →',
    },
    {
      id: 'in_production',
      titleBn: '২. কারখানা কারিগর ফিটিং',
      desc: 'মেলামাইন বোর্ড কাটিং, পিভিসি এজ ব্যান্ডিং ও ফিটিং চলছে',
      color: 'border-purple-300 bg-purple-50/50',
      nextStatus: 'ready',
      nextLabel: 'ফিটিং সম্পন্ন ও প্যাকিং →',
    },
    {
      id: 'ready',
      titleBn: '৩. বাবল র‍্যাপ প্যাকিং প্রস্তুত',
      desc: 'কোয়ালিটি চেক ও প্যাকিং সম্পন্ন, কুরিয়ার পিকআপের জন্য প্রস্তুত',
      color: 'border-cyan-300 bg-cyan-50/50',
      nextStatus: 'shipped',
      nextLabel: 'কুরিয়ারে পাঠান →',
    },
    {
      id: 'shipped',
      titleBn: '৪. কুরিয়ারে রওয়ানা',
      desc: 'পার্সেল কুরিয়ারের গাড়িতে গ্রাহকের ঠিকানায় যাচ্ছে',
      color: 'border-amber-300 bg-orange-50/50',
      nextStatus: 'delivered',
      nextLabel: 'ডেলিভারি সম্পন্ন চিহ্নিত করুন →',
    },
  ];

  const handleAdvanceStage = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatusAction(
        orderId,
        nextStatus,
        `ওয়ার্কশপ ট্র্যাকার থেকে স্ট্যাটাস পরিবর্তন: ${nextStatus}`
      );
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900 flex items-center gap-2">
            <Hammer className="w-6 h-6 text-[#8B5A2B]" />
            <span>মিরপুর কারখানা প্রোডাকশন কানবান ট্র্যাকার</span>
          </h1>
          <p className="text-xs font-bn text-stone-500 mt-0.5">
            বোর্ড কাটিং, পিভিসি এজ ব্যান্ডিং, ফিটিং ও প্যাকিং এর লাইভ ওয়ার্কশপ ধাপ ট্র্যাকিং
          </p>
        </div>

        <div className="text-xs font-bn bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl font-bold self-start sm:self-auto">
          কারখানায় চলমান অর্ডার:{' '}
          <strong className="text-stone-900 font-sans">
            {
              orders.filter(
                (o) =>
                  o.status === 'confirmed' ||
                  o.status === 'in_production' ||
                  o.status === 'ready'
              ).length
            }
          </strong>{' '}
          টি
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {stages.map((stage) => {
          const stageOrders = orders.filter((o) => o.status === stage.id);

          return (
            <div
              key={stage.id}
              className={`rounded-3xl border p-4 space-y-3.5 flex flex-col justify-between min-h-[500px] ${stage.color}`}
            >
              {/* Stage Header */}
              <div className="flex items-start justify-between gap-2 border-b border-black/10 pb-3">
                <div>
                  <h3 className="font-bn font-bold text-sm text-stone-900">{stage.titleBn}</h3>
                  <p className="text-[11px] font-bn text-stone-500 mt-0.5 leading-tight">
                    {stage.desc}
                  </p>
                </div>
                <span className="font-sans font-black text-sm bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                  {stageOrders.length}
                </span>
              </div>

              {/* Order Cards List in this Stage */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {stageOrders.length === 0 ? (
                  <p className="text-center text-xs font-bn text-stone-400 py-12">
                    এই ধাপে কোনো অর্ডার নেই
                  </p>
                ) : (
                  stageOrders.map((order) => {
                    const isUpdating = updatingId === order.id;
                    const waMsg = `আসসালামু আলাইকুম ${order.customer_name}, আপনার ড্রিম হোম ডেকোর অর্ডার (${order.order_number}) এর বর্তমান কারখানা আপডেট: "${stage.titleBn}"।`;

                    return (
                      <div
                        key={order.id}
                        className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5"
                      >
                        <div className="flex justify-between items-start text-xs font-bn">
                          <div>
                            <span className="font-mono font-bold text-[#8B5A2B]">
                              {order.order_number}
                            </span>
                            <p className="font-bold text-stone-900 mt-0.5">{order.customer_name}</p>
                          </div>
                          <span className="text-[10px] text-stone-400 font-sans">
                            {new Date(order.created_at).toLocaleDateString('en-GB')}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="p-2 bg-stone-50 rounded-xl text-xs font-bn space-y-1">
                          {(order.order_items || []).map((it, idx) => (
                            <div key={idx} className="flex justify-between text-stone-700">
                              <span className="truncate max-w-[170px]">{it.product_title}</span>
                              <span className="font-sans font-bold">x{it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Customer Contact & Move Button */}
                        <div className="flex items-center justify-between pt-1 text-xs font-bn">
                          <div className="flex items-center gap-1.5 text-stone-500">
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="p-1 hover:text-stone-900"
                              title="কল"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={buildWhatsAppUrl(order.customer_phone, waMsg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:text-[#25D366]"
                              title="WhatsApp আপডেট"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {stage.nextStatus && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(order.id, stage.nextStatus!)}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:opacity-50 text-white font-bold rounded-lg text-[11px] shadow-2xs cursor-pointer transition-colors"
                            >
                              <span>{stage.nextLabel}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
