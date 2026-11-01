'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Hammer,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  Video,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Image as ImageIcon,
  Copy,
  Check,
  Loader2,
  Sliders,
  PlayCircle,
} from 'lucide-react';
import { WorkshopData, WorkshopStep } from '@/types/database';
import { DEFAULT_WORKSHOP_DATA } from '@/lib/mock-data';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { saveWorkshopDataAction, resetWorkshopDataAction } from '@/lib/actions';

interface WorkshopManagerProps {
  initialData: WorkshopData;
  defaultFacebookUrl?: string;
}

const SAMPLE_WORKSHOP_IMAGES = [
  {
    name: 'বোর্ড কাটিং মেশিন',
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'পিভিসি এজ ব্যান্ডিং',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'দক্ষ কারিগর ফিটিং',
    url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'বাবল র‍্যাপ প্যাকেজিং',
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'কাঠ ও বোর্ড ওয়ার্কশপ',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'ফিনিশড ফার্নিচার পরিদর্শন',
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
  },
];

export function WorkshopManager({
  initialData,
  defaultFacebookUrl = 'https://www.facebook.com/profile.php?id=61584955311887',
}: WorkshopManagerProps) {
  // Main form state
  const [badge, setBadge] = useState(initialData.badge || DEFAULT_WORKSHOP_DATA.badge);
  const [title, setTitle] = useState(initialData.title || DEFAULT_WORKSHOP_DATA.title);
  const [description, setDescription] = useState(
    initialData.description || DEFAULT_WORKSHOP_DATA.description
  );
  const [steps, setSteps] = useState<WorkshopStep[]>(
    initialData.steps && initialData.steps.length > 0
      ? initialData.steps
      : DEFAULT_WORKSHOP_DATA.steps
  );

  // Video Card state
  const [videoCardEnabled, setVideoCardEnabled] = useState(
    initialData.videoCard?.enabled !== false
  );
  const [videoBadge, setVideoBadge] = useState(
    initialData.videoCard?.badge || DEFAULT_WORKSHOP_DATA.videoCard.badge
  );
  const [videoTitle, setVideoTitle] = useState(
    initialData.videoCard?.title || DEFAULT_WORKSHOP_DATA.videoCard.title
  );
  const [videoDesc, setVideoDesc] = useState(
    initialData.videoCard?.description || DEFAULT_WORKSHOP_DATA.videoCard.description
  );
  const [videoBtnText, setVideoBtnText] = useState(
    initialData.videoCard?.buttonText || DEFAULT_WORKSHOP_DATA.videoCard.buttonText
  );
  const [videoBtnUrl, setVideoBtnUrl] = useState(
    initialData.videoCard?.buttonUrl || defaultFacebookUrl
  );

  // Active view tab
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [editorSection, setEditorSection] = useState<'header' | 'steps' | 'video' | 'sql'>('header');

  // UI status
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Helper: Construct current data payload
  const currentPayload: WorkshopData = {
    badge,
    title,
    description,
    steps,
    videoCard: {
      enabled: videoCardEnabled,
      badge: videoBadge,
      title: videoTitle,
      description: videoDesc,
      buttonText: videoBtnText,
      buttonUrl: videoBtnUrl,
    },
  };

  // Step Management
  const handleUpdateStep = (index: number, field: keyof WorkshopStep, value: string) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddStep = () => {
    const nextIdx = steps.length + 1;
    const newStep: WorkshopStep = {
      id: `step-${Date.now()}`,
      title: `${nextIdx}. নতুন উৎপাদন ধাপ`,
      desc: 'ধাপের বিস্তারিত বিবরণ এখানে লিখুন...',
      image: SAMPLE_WORKSHOP_IMAGES[(nextIdx - 1) % SAMPLE_WORKSHOP_IMAGES.length].url,
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      alert('কমপক্ষে ১টি উৎপাদন ধাপ সেকশনে থাকা আবশ্যক।');
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const copy = [...steps];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSteps(copy);
  };

  // Submit Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await saveWorkshopDataAction(currentPayload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'ওয়ার্কশপ সেকশন সফলভাবে সংরক্ষিত হয়েছে!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'সংরক্ষণ ব্যর্থ হয়েছে',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'নেটওয়ার্ক সমস্যা, পুনরায় চেষ্টা করুন',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Factory Defaults
  const handleReset = async () => {
    if (
      !confirm(
        'আপনি কি নিশ্চিত যে ওয়ার্কশপ সেকশনের সকল তথ্য ফ্যাক্টরি ডিফল্ট মানে রিসেট করতে চান?'
      )
    ) {
      return;
    }

    setIsResetting(true);
    setFeedback(null);

    try {
      const res = await resetWorkshopDataAction();
      if (res.success) {
        setBadge(DEFAULT_WORKSHOP_DATA.badge);
        setTitle(DEFAULT_WORKSHOP_DATA.title);
        setDescription(DEFAULT_WORKSHOP_DATA.description);
        setSteps(DEFAULT_WORKSHOP_DATA.steps);
        setVideoCardEnabled(DEFAULT_WORKSHOP_DATA.videoCard.enabled);
        setVideoBadge(DEFAULT_WORKSHOP_DATA.videoCard.badge);
        setVideoTitle(DEFAULT_WORKSHOP_DATA.videoCard.title);
        setVideoDesc(DEFAULT_WORKSHOP_DATA.videoCard.description);
        setVideoBtnText(DEFAULT_WORKSHOP_DATA.videoCard.buttonText);
        setVideoBtnUrl(DEFAULT_WORKSHOP_DATA.videoCard.buttonUrl);

        setFeedback({
          type: 'success',
          message: 'ফ্যাক্টরি ডিফল্ট ডেটা সফলভাবে রিস্টোর হয়েছে!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'রিসেট ব্যর্থ হয়েছে',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'রিসেট করতে ব্যর্থ হয়েছে',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const sqlSnippet = `-- Optional: Supabase Table for Workshop Settings
CREATE TABLE IF NOT EXISTS workshop_settings (
  id INT PRIMARY KEY DEFAULT 1,
  badge TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  video_card JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_workshop_row CHECK (id = 1)
);

ALTER TABLE workshop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view workshop settings"
  ON workshop_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can update workshop settings"
  ON workshop_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5A2B]/10 text-[#8B5A2B] flex items-center justify-center shrink-0">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-bn text-stone-900">
                ওয়ার্কশপ ও কারখানা সেকশন এডিটর
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-bn">
                সরাসরি কারখানা
              </span>
            </div>
            <p className="text-xs font-bn text-stone-500 mt-0.5">
              হোমপেজের &ldquo;সরাসরি কারখানার অন্দরমহল&rdquo; সেকশনের হেডার, ৪-ধাপের উৎপাদন গ্যালারি ও ফেসবুক ভিডিও ব্যানার এডিট করুন
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/#workshop"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 text-xs font-bn font-semibold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
            <span>হোমপেজে দেখুন</span>
          </Link>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 text-xs font-bn font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="মূল ফ্যাক্টরি টেক্সট ও ছবিতে ফিরে যান"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>ডিফল্ট রিসেট</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B5A2B] hover:bg-[#6D431F] disabled:bg-stone-400 text-white text-xs font-bn font-bold shadow-sm transition-all cursor-pointer hover:shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>পরিবর্তন সেভ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bn font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs (Editor vs Live Real-Time Preview) */}
      <div className="flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-3 font-bn text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'border-[#8B5A2B] text-[#8B5A2B] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>কনটেন্ট এডিটর</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-3 font-bn text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'border-[#8B5A2B] text-[#8B5A2B] bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>রিয়েল-টাইম প্রিভিউ (Live Preview)</span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-[11px] font-bn text-stone-500 pr-2">
          💡 পরিবর্তন করে উপরে &ldquo;পরিবর্তন সেভ করুন&rdquo; এ ক্লিক করুন
        </span>
      </div>

      {/* TAB 1: CONTENT EDITOR */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sub-menu / Section selector for the editor */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-white p-3 rounded-2xl border border-stone-200 space-y-1">
              <button
                type="button"
                onClick={() => setEditorSection('header')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bn text-xs font-bold transition-all text-left cursor-pointer ${
                  editorSection === 'header'
                    ? 'bg-[#8B5A2B] text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>১. সেকশন হেডার ও বিবরণ</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEditorSection('steps')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bn text-xs font-bold transition-all text-left cursor-pointer ${
                  editorSection === 'steps'
                    ? 'bg-[#8B5A2B] text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Hammer className="w-4 h-4" />
                  <span>২. উৎপাদন ধাপসমূহ ({steps.length})</span>
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    editorSection === 'steps'
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {steps.length}টি
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEditorSection('video')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bn text-xs font-bold transition-all text-left cursor-pointer ${
                  editorSection === 'video'
                    ? 'bg-[#8B5A2B] text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span>৩. ফেসবুক ভিডিও ও রিলস ব্যানার</span>
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    videoCardEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {videoCardEnabled ? 'চালু' : 'বন্ধ'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEditorSection('sql')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bn text-xs font-bold transition-all text-left cursor-pointer ${
                  editorSection === 'sql'
                    ? 'bg-[#8B5A2B] text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  <span>৪. ডাটাবেজ সিঙ্ক তথ্য (SQL)</span>
                </span>
              </button>
            </div>

            {/* Quick Live Preview Snippet Card */}
            <div className="bg-stone-900 text-white p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bn text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>তাত্ক্ষণিক প্রিভিউ</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="text-[10px] font-bn text-stone-300 hover:text-white underline cursor-pointer"
                >
                  বড় করে দেখুন
                </button>
              </div>

              <div className="space-y-1.5 border-t border-stone-800 pt-2.5">
                <p className="text-xs font-bn font-bold text-white line-clamp-1">
                  {title}
                </p>
                <p className="text-[11px] font-bn text-stone-400 line-clamp-2">
                  {description}
                </p>
                <div className="text-[10px] font-bn text-amber-300 pt-1">
                  মোট কার্ড: {steps.length}টি ধাপ • ভিডিও ব্যানার: {videoCardEnabled ? 'অন' : 'অফ'}
                </div>
              </div>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* SUB-SECTION 1: HEADER & DESCRIPTION */}
            {editorSection === 'header' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-2xs space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <h2 className="text-base font-bold font-bn text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#8B5A2B]" />
                    <span>সেকশন হেডার ও পরিচিতি বার্তা</span>
                  </h2>
                  <p className="text-xs font-bn text-stone-500 mt-0.5">
                    ওয়ার্কশপ সেকশনের ওপরের ব্যাজ, প্রধান শিরোনাম এবং ফ্যাক্টরি বিবরণ কাস্টমাইজ করুন
                  </p>
                </div>

                {/* Badge Text */}
                <div className="space-y-2">
                  <label className="block text-xs font-bn font-bold text-stone-700">
                    ব্যাজ টেক্সট (Top Badge Text)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="সরাসরি কারখানার অন্দরমহল • Inside Our Workshop"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-xs font-bn"
                    />
                  </div>
                  <p className="text-[11px] font-bn text-stone-400">
                    এটি হেডিংয়ের ওপরে সোনালী ব্যাজ পিল হিসেবে প্রদর্শিত হবে।
                  </p>
                </div>

                {/* Main Heading */}
                <div className="space-y-2">
                  <label className="block text-xs font-bn font-bold text-stone-700">
                    প্রধান শিরোনাম (Main Section Heading) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="আমরা কীভাবে তৈরি করি আপনার পছন্দের ফার্নিচার?"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-sm font-bn font-bold"
                  />
                </div>

                {/* Description Textarea */}
                <div className="space-y-2">
                  <label className="block text-xs font-bn font-bold text-stone-700">
                    বিস্তারিত বিবরণী (Subtitle / Workshop Mission Description)
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="কোনো থার্ড-পার্টি বা মধ্যস্বত্বভোগী নয় — বোর্ড কেনা থেকে শুরু করে..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-xs font-bn leading-relaxed"
                  />
                </div>

                {/* Quick Live Preview of the Header */}
                <div className="bg-stone-900 p-6 rounded-2xl text-center space-y-3">
                  <span className="text-[10px] text-stone-400 font-bn uppercase tracking-wider block">
                    স্টোরফ্রন্টে যেভাবে দেখাবে
                  </span>
                  <div className="inline-flex items-center gap-2 bg-[#8B5A2B] text-white px-3.5 py-1.5 rounded-full text-xs font-bn font-bold">
                    <Hammer className="w-4 h-4 text-amber-300" />
                    <span>{badge}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold font-bn text-white">
                    {title}
                  </h3>
                  <p className="text-stone-300 font-bn text-xs max-w-xl mx-auto leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            )}

            {/* SUB-SECTION 2: PROCESS STEPS GALLERY */}
            {editorSection === 'steps' && (
              <div className="space-y-6">
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold font-bn text-stone-900 flex items-center gap-2">
                      <Hammer className="w-5 h-5 text-[#8B5A2B]" />
                      <span>উৎপাদন ধাপসমূহ ও গ্যালারি কার্ড ({steps.length}টি)</span>
                    </h2>
                    <p className="text-xs font-bn text-stone-500 mt-0.5">
                      প্রতিটি কার্ডের শিরোনাম, বিবরণ ও ছবি পরিবর্তন করুন। নতুন ধাপ যোগ করতে বা ড্রপ করতে পারেন।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bn font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>নতুন ধাপ যোগ করুন</span>
                  </button>
                </div>

                {/* Steps List */}
                <div className="space-y-4">
                  {steps.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-5 transition-all hover:border-stone-300"
                    >
                      {/* Step Header Bar */}
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#8B5A2B] text-white flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bn font-bold text-stone-800 truncate max-w-xs">
                            {step.title || `ধাপ ${idx + 1}`}
                          </span>
                        </div>

                        {/* Order & Delete Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="উপরে নিন"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 'down')}
                            disabled={idx === steps.length - 1}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="নিচে নিন"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                            title="এই ধাপটি মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        {/* Image Preview & URL input */}
                        <div className="md:col-span-4 space-y-3">
                          <div className="relative aspect-4/3 rounded-2xl bg-stone-900 overflow-hidden border border-stone-200">
                            {step.image ? (
                              <Image
                                src={getOptimizedImageUrl(step.image, 400)}
                                alt={step.title || 'Step'}
                                fill
                                sizes="(max-width: 768px) 100vw, 30vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs font-bn gap-1">
                                <ImageIcon className="w-6 h-6" />
                                <span>ছবি পাওয়া যায়নি</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-bn">
                              ধাপ #{idx + 1}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bn font-bold text-stone-600">
                              ইমেজ লিংক (ImageKit / Unsplash URL)
                            </label>
                            <input
                              type="url"
                              value={step.image}
                              onChange={(e) => handleUpdateStep(idx, 'image', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-xs font-sans"
                            />
                          </div>

                          {/* Quick Sample Presets Picker */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bn text-stone-400 block">
                              বা রেডি ছবি বাছাই করুন:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {SAMPLE_WORKSHOP_IMAGES.map((sample, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => handleUpdateStep(idx, 'image', sample.url)}
                                  className="text-[10px] font-bn bg-stone-100 hover:bg-[#8B5A2B] hover:text-white text-stone-700 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                >
                                  {sample.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Title & Description Inputs */}
                        <div className="md:col-span-8 space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bn font-bold text-stone-700">
                              ধাপের শিরোনাম (Step Title) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                              placeholder="১. উন্নত মেলামাইন বোর্ড কাটিং"
                              required
                              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-sm font-bn font-bold"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bn font-bold text-stone-700">
                              ধাপের বিস্তারিত বিবরণ (Step Description)
                            </label>
                            <textarea
                              rows={3}
                              value={step.desc}
                              onChange={(e) => handleUpdateStep(idx, 'desc', e.target.value)}
                              placeholder="কম্পিউটারাইজড কাটার মেশিনে নিখুঁত মাপে বোর্ড সাইজিং করা হয়।"
                              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-xs font-bn leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Step Button */}
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="w-full py-4 rounded-3xl border-2 border-dashed border-stone-300 hover:border-[#8B5A2B] text-stone-600 hover:text-[#8B5A2B] text-xs font-bn font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer bg-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>আরও একটি নতুন উৎপাদন ধাপ যোগ করুন</span>
                </button>
              </div>
            )}

            {/* SUB-SECTION 3: LIVE VIDEO & REELS BANNER */}
            {editorSection === 'video' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold font-bn text-stone-900 flex items-center gap-2">
                      <Video className="w-5 h-5 text-rose-500" />
                      <span>লাইভ ভিডিও ও ফেসবুক রিলস ব্যানার কার্ড</span>
                    </h2>
                    <p className="text-xs font-bn text-stone-500 mt-0.5">
                      ওয়ার্কশপ সেকশনের নিচে প্রদর্শিত বাদামী রঙের ভিডিও কল-টু-অ্যাকশন ব্যানার
                    </p>
                  </div>

                  {/* Enable / Disable Toggle Switch */}
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bn font-bold text-stone-700">
                      {videoCardEnabled ? 'ব্যানার সক্রিয়' : 'ব্যানার নিষ্ক্রিয়'}
                    </span>
                    <div
                      onClick={() => setVideoCardEnabled(!videoCardEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        videoCardEnabled ? 'bg-emerald-600' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                          videoCardEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </label>
                </div>

                <div className={`space-y-5 transition-opacity ${videoCardEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  {/* Video Badge */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bn font-bold text-stone-700">
                      ব্যানার ব্যাজ টেক্সট (Video Badge)
                    </label>
                    <input
                      type="text"
                      value={videoBadge}
                      onChange={(e) => setVideoBadge(e.target.value)}
                      placeholder="কারখানার সরাসরি ভিডিও ও রিলস"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-xs font-bn"
                    />
                  </div>

                  {/* Video Title */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bn font-bold text-stone-700">
                      ব্যানার প্রধান শিরোনাম (Banner Headline)
                    </label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="বোর্ড কাটিং ও তৈরির লাইভ ভিডিও দেখতে চান?"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-sm font-bn font-bold"
                    />
                  </div>

                  {/* Video Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bn font-bold text-stone-700">
                      ব্যানার বিবরণ (Banner Description)
                    </label>
                    <textarea
                      rows={3}
                      value={videoDesc}
                      onChange={(e) => setVideoDesc(e.target.value)}
                      placeholder="আমাদের অফিসিয়াল ফেসবুক পেজে গ্রাহকদের অর্ডার প্রস্তুতের ভিডিও..."
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-xs font-bn leading-relaxed"
                    />
                  </div>

                  {/* Button Text & Button Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bn font-bold text-stone-700">
                        বাটন টেক্সট (Button Text)
                      </label>
                      <input
                        type="text"
                        value={videoBtnText}
                        onChange={(e) => setVideoBtnText(e.target.value)}
                        placeholder="ফেসবুকে ভিডিও দেখুন"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-xs font-bn font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bn font-bold text-stone-700">
                        বাটনের লিঙ্ক ইউআরএল (Button Destination URL)
                      </label>
                      <input
                        type="url"
                        value={videoBtnUrl}
                        onChange={(e) => setVideoBtnUrl(e.target.value)}
                        placeholder="https://www.facebook.com/..."
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#8B5A2B]/40 text-xs font-sans"
                      />
                    </div>
                  </div>

                  {/* Banner Preview */}
                  <div className="bg-gradient-to-r from-[#8B5A2B] to-[#643D1A] rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 mt-4 shadow-lg">
                    <div className="space-y-2 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bn text-amber-200">
                        <Video className="w-4 h-4 text-rose-400" />
                        <span>{videoBadge}</span>
                      </div>
                      <h4 className="text-lg font-bold font-bn text-white">
                        {videoTitle}
                      </h4>
                      <p className="text-amber-100 text-xs font-bn max-w-xl">
                        {videoDesc}
                      </p>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-2 bg-white text-stone-900 font-bn font-bold text-xs px-5 py-2.5 rounded-full shadow">
                      <span>{videoBtnText}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#8B5A2B]" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-SECTION 4: DATABASE & SQL INFO */}
            {editorSection === 'sql' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-2xs space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <h2 className="text-base font-bold font-bn text-stone-900 flex items-center gap-2">
                    <Copy className="w-5 h-5 text-[#8B5A2B]" />
                    <span>ডাটাবেজ সিঙ্ক ও ব্যাকআপ আর্কিটেকচার</span>
                  </h2>
                  <p className="text-xs font-bn text-stone-500 mt-0.5">
                    আপনার এই ওয়ার্কশপ সেকশনটি ফাইল সিস্টেমে সেভ হয় এবং Supabase এ টেবিল থাকলে স্বয়ংক্রিয়ভাবে ক্লাউডেও সিঙ্ক হয়ে যায়
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-bn text-amber-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>স্বয়ংক্রিয় ডুয়েল-স্টোরেজ সিস্টেম সক্রিয়!</span>
                  </p>
                  <p className="text-[12px] leading-relaxed text-amber-800/90">
                    আপনি যখন ওপরের &ldquo;পরিবর্তন সেভ করুন&rdquo; বাটনে চাপ দেন, তখন এটি সরাসরি <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">data/workshop.json</code> ফাইলে সংরক্ষিত হয় এবং সাথে সাথে হোমপেজে তাৎক্ষণিক কার্যকর হয়ে যায়। যদি আপনি চান আপনার ক্লাউড Supabase ডাটাবেজেও এই সেকশনের টেবিল থাকুক, তবে নিচের SQL স্ক্রিপ্টটি Supabase SQL Editor এ একবার রান করে নিতে পারেন (এটি ঐচ্ছিক):
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-500">workshop_settings.sql</span>
                    <button
                      type="button"
                      onClick={copySql}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bn font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>SQL কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-stone-900 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed">
                    {sqlSnippet}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FULL REAL-TIME LIVE PREVIEW (True-to-Life Storefront Dark View) */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-stone-800 text-stone-200 px-4 py-2.5 rounded-2xl text-xs font-bn flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>লাইভ ইন্টার‌্যাক্টিভ প্রিভিউ — হোমপেজের &ldquo;সরাসরি কারখানার অন্দরমহল&rdquo; সেকশন</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="text-amber-400 hover:underline font-bold"
            >
              ← এডিটরে ফিরে যান
            </button>
          </div>

          {/* Actual Workshop Showcase Section rendering with live state */}
          <section className="py-16 sm:py-20 bg-stone-900 text-white rounded-3xl relative overflow-hidden shadow-2xl border border-stone-800">
            {/* Decorative Glow */}
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#8B5A2B]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#8B5A2B] text-white px-3.5 py-1.5 rounded-full text-xs font-bn font-bold tracking-wide">
                  <Hammer className="w-4 h-4 text-amber-300" />
                  <span>{badge || DEFAULT_WORKSHOP_DATA.badge}</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold font-bn text-white leading-tight">
                  {title || DEFAULT_WORKSHOP_DATA.title}
                </h2>

                <p className="text-stone-300 font-bn text-sm sm:text-base leading-relaxed">
                  {description || DEFAULT_WORKSHOP_DATA.description}
                </p>
              </div>

              {/* Dynamic Workshop Gallery */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  steps.length >= 4 ? 'lg:grid-cols-4' : steps.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
                } gap-6 mt-12`}
              >
                {steps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="bg-stone-800/80 rounded-2xl overflow-hidden border border-stone-700 hover:border-amber-500/50 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div className="relative aspect-4/3 bg-stone-950 overflow-hidden">
                      <Image
                        src={getOptimizedImageUrl(step.image, 500)}
                        alt={step.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-bn font-bold text-white text-base">
                        {step.title}
                      </h3>
                      <p className="font-bn text-stone-300 text-xs leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Facebook Reels / Workshop Video Banner Card */}
              {videoCardEnabled && (
                <div className="mt-12 bg-gradient-to-r from-[#8B5A2B] to-[#643D1A] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bn text-amber-200">
                      <Video className="w-4 h-4 text-rose-400" />
                      <span>{videoBadge}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold font-bn text-white">
                      {videoTitle}
                    </h3>
                    <p className="text-amber-100 text-xs sm:text-sm font-bn max-w-xl">
                      {videoDesc}
                    </p>
                  </div>

                  <a
                    href={videoBtnUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-900 font-bn font-bold text-sm px-6 py-3.5 rounded-full shadow-lg transition-all hover:scale-105"
                  >
                    <span>{videoBtnText}</span>
                    <ExternalLink className="w-4 h-4 text-[#8B5A2B]" />
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
