'use client';

import React, { useState } from 'react';
import { Truck, Save, Check, Loader2, Info, MapPin } from 'lucide-react';
import { DeliveryZoneConfig } from '@/types/database';
import { saveDeliveryZoneAction } from '@/lib/actions';

interface DeliveryZoneManagerProps {
  initialZones: DeliveryZoneConfig[];
}

export function DeliveryZoneManager({ initialZones }: DeliveryZoneManagerProps) {
  const [zones, setZones] = useState<DeliveryZoneConfig[]>(initialZones);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateZone = (index: number, field: keyof DeliveryZoneConfig, val: unknown) => {
    const updated = [...zones];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = val;
    setZones(updated);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      for (const zone of zones) {
        await saveDeliveryZoneAction({
          id: zone.id,
          name: zone.name,
          name_bn: zone.name_bn,
          slug: zone.slug,
          charge: Number(zone.charge),
          estimated_days: zone.estimated_days,
          free_threshold: zone.free_threshold ? Number(zone.free_threshold) : null,
          is_active: zone.is_active,
        });
      }
      setFeedback({ type: 'success', text: 'সকল ডেলিভারি জোন ও চার্জ সফলভাবে সংরক্ষিত হয়েছে!' });
    } catch {
      setFeedback({ type: 'error', text: 'সংরক্ষণ ব্যর্থ হয়েছে' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#8B5A2B]" />
            <span>ডেলিভারি জোন ও কুরিয়ার চার্জ ম্যানেজমেন্ট</span>
          </h1>
          <p className="text-xs font-bn text-stone-500 mt-0.5">
            ঢাকার ভেতরে ও বাইরে কুরিয়ার চার্জ, ডেলিভারি লিড-টাইম এবং ফ্রি ডেলিভারি থ্রেশহোল্ড নির্ধারণ করুন
          </p>
        </div>

        <button
          type="submit"
          form="delivery-form"
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-[#8B5A2B] hover:bg-[#6D431F] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bn font-bold shadow-xs transition-colors cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>চার্জ সেভ করুন</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bn font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <form id="delivery-form" onSubmit={handleSaveAll} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {zones.map((zone, idx) => (
          <div
            key={zone.slug}
            className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8B5A2B]" />
                <h3 className="font-bn font-bold text-base text-stone-900">{zone.name_bn}</h3>
              </div>
              <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-bold uppercase">
                {zone.slug}
              </span>
            </div>

            <div className="space-y-3 text-xs font-bn">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  জোন টাইটেল (বাংলা):
                </label>
                <input
                  type="text"
                  value={zone.name_bn}
                  onChange={(e) => handleUpdateZone(idx, 'name_bn', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    কুরিয়ার চার্জ (৳):
                  </label>
                  <input
                    type="number"
                    value={zone.charge}
                    onChange={(e) => handleUpdateZone(idx, 'charge', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans font-bold text-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    প্রত্যাশিত সময় (Lead Time):
                  </label>
                  <input
                    type="text"
                    value={zone.estimated_days}
                    onChange={(e) => handleUpdateZone(idx, 'estimated_days', e.target.value)}
                    placeholder="১-২ কর্মদিবস"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bn"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  ফ্রি ডেলিভারি মিনিমাম অর্ডার লিমিট (৳ Threshold):
                </label>
                <input
                  type="number"
                  value={zone.free_threshold || ''}
                  onChange={(e) =>
                    handleUpdateZone(
                      idx,
                      'free_threshold',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="যেমন: 15000 (খালি রাখলে প্রযোজ্য নয়)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-sans font-bold"
                />
                <span className="text-[10px] text-stone-400">
                  এই পরিমাণের বেশি অর্ডারে কাস্টমারকে ফ্রি ডেলিভারি অফার দেওয়া হবে
                </span>
              </div>
            </div>
          </div>
        ))}
      </form>
    </div>
  );
}
