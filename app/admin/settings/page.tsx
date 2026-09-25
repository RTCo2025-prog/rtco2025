'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  Globe, 
  Phone, 
  MapPin, 
  Mail, 
  Upload, 
  Image as ImageIcon,
  Printer,
  Palette,
  Sparkles
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    tagline: '',
    phone_primary: '',
    phone_secondary: '',
    email: '',
    website: '',
    address: '',
    logo_url: '',
    letterhead_url: '',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  const colorPresets = [
    { name: 'الذهبي والبرتقالي الملكي (الافتراضي)', primary: '#d97706', secondary: '#ea580c' },
    { name: 'الأزرق الداكن والفيروزي المؤسسي', primary: '#0284c7', secondary: '#0d9488' },
    { name: 'الزمردي الراقي والأخضر الداكن', primary: '#059669', secondary: '#10b981' },
    { name: 'العنابي والذهبي الفاخر', primary: '#b91c1c', secondary: '#d97706' },
    { name: 'الأرجواني والنيلي الحديث', primary: '#7c3aed', secondary: '#4f46e5' },
    { name: 'الرمادي التيتانيوم والكحلي', primary: '#334155', secondary: '#1e293b' }
  ];

  const fetchSettings = () => {
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setFormData({
            ...data.settings,
            primary_color: data.settings.primary_color || '#d97706',
            secondary_color: data.settings.secondary_color || '#ea580c'
          });
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'letterhead_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, [field]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('تم حفظ وتحديث بيانات وألوان هوية الشركة بنجاح! تم تعميم اللونين على النظام والكتب الرسمية.');
        fetchSettings();
      } else {
        alert(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err: any) {
      alert(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div dir="rtl" className="min-h-screen bg-[#06080e] text-slate-100 p-4 md:p-8 font-cairo">
        
        {/* الترويسة العلوية */}
        <div className="max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">إعدادات الهوية والألوان وترويسة الطباعة الرسمية</h1>
              <p className="text-xs text-slate-400 mt-0.5">خاصة بالمدير المفوض: التحكم باسم الشركة، العناوين، الهواتف، الشعار، واللونين المعتمدين في النظام</p>
            </div>
          </div>
          <Link href="/" className="bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition">
            <ArrowLeft className="w-4 h-4" /> العودة للرئيسية
          </Link>
        </div>

        <div className="max-w-5xl mx-auto mt-8 bg-[#0b101d] border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-bold shadow-lg">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            
            {/* 1. قسم اختيار واعتماد اللونين الرسميين للنظام والمطبوعات */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 space-y-5 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  ألوان الهوية البصرية الرسمية للشركة (Corporate Color Palette)
                </span>
                <span className="text-[11px] text-slate-500">تعتمد في كافة الكتب الرسمية، الترويسات، الأزرار، والواجهات</span>
              </div>

              {/* بطاقة المعاينة الحية للونين */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-[#070b14] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center font-bold text-white text-xs border border-white/20"
                    style={{ background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})` }}
                  >
                    RTCO
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">معاينة التدرج اللوني المعتمد</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      اللون الأساسي: <span className="font-mono text-amber-400 font-bold">{formData.primary_color}</span> | اللون الثانوي: <span className="font-mono text-sky-400 font-bold">{formData.secondary_color}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white text-slate-950 px-4 py-2 rounded-xl text-center shadow-lg border border-slate-300 w-full md:w-auto">
                  <div className="text-[11px] font-black" style={{ color: formData.primary_color }}>شركة البرج المتألق</div>
                  <div className="w-24 h-1 mx-auto my-1 rounded-full" style={{ backgroundColor: formData.secondary_color }}></div>
                  <div className="text-[9px] text-slate-600 font-medium">نموذج ترويسة الكتب الرسمية</div>
                </div>
              </div>

              {/* منتقي الألوان */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <label className="block text-slate-300 font-bold flex items-center justify-between">
                    <span>(1) اللون الأساسي (Primary Color):</span>
                    <span className="font-mono text-amber-400 text-xs">{formData.primary_color}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-12 h-12 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.primary_color}
                      onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">يستخدم للعناوين الرئيسية، الشارات، اسم الشركة، وحدود الجداول.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <label className="block text-slate-300 font-bold flex items-center justify-between">
                    <span>(2) اللون الثانوي (Secondary Color):</span>
                    <span className="font-mono text-sky-400 text-xs">{formData.secondary_color}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-12 h-12 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.secondary_color}
                      onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">يستخدم للخطوط التزيينية، التدرجات الخلفية، أزرار التفاعل، والزخارف.</p>
                </div>
              </div>

              {/* نماذج سريعة جاهزة */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-400 font-semibold block mb-2">أو اختر أحد النماذج الموصى بها مسبقاً:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {colorPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, primary_color: preset.primary, secondary_color: preset.secondary })}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition flex items-center gap-2 text-right cursor-pointer"
                    >
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span className="w-4 h-4 rounded-full border border-slate-800" style={{ backgroundColor: preset.primary }}></span>
                        <span className="w-4 h-4 rounded-full border border-slate-800" style={{ backgroundColor: preset.secondary }}></span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. قسم ترويسة الطباعة الرسمية والشعار */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  ترويسة الطباعة الرسمية والشعار (Letterhead & Logo)
                </span>
                <span className="text-[11px] text-slate-500">تُدرج تلقائياً في أعلى الكتب الرسمية والتقارير وعقود البيع والسندات</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-slate-300 font-bold">صورة ترويسة الكتب الرسمية (Header Image A4):</label>
                  <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 text-center space-y-3 transition bg-slate-900/40">
                    {formData.letterhead_url ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.letterhead_url} alt="ترويسة الشركة" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="py-6 text-slate-500 flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span>لم يتم رفع صورة ترويسة رسمية بعد</span>
                      </div>
                    )}

                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer font-bold text-xs transition">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{formData.letterhead_url ? 'تغيير صورة الترويسة' : 'رفع صورة الترويسة'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'letterhead_url')} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-slate-300 font-bold">شعار الشركة الرسمي (Logo):</label>
                  <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 text-center space-y-3 transition bg-slate-900/40">
                    {formData.logo_url ? (
                      <div className="relative w-24 h-24 mx-auto rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.logo_url} alt="شعار الشركة" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="py-6 text-slate-500 flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span>لم يتم تعيين شعار مخصص</span>
                      </div>
                    )}

                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer font-bold text-xs transition">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{formData.logo_url ? 'تغيير الشعار' : 'رفع الشعار'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. بيانات الشركة الرسمية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">اسم الشركة الرسمي:</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">الوصف الرسمي للنشاط:</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" /> رقم الهاتف الرئيسي:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="+964..."
                  value={formData.phone_primary}
                  onChange={e => setFormData({ ...formData, phone_primary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 text-right"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" /> رقم الهاتف الإضافي (اختياري):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="+964..."
                  value={formData.phone_secondary}
                  onChange={e => setFormData({ ...formData, phone_secondary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-sky-400" /> البريد الإلكتروني الرسمي:
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 text-right"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-sky-400" /> الموقع الإلكتروني:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" /> العنوان المعتمد للمركز الرئيسي:
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {loading ? 'جاري حفظ الإعدادات...' : 'حفظ وتعميم التحديثات والألوان على كافة أنظمة الشركة'}
              </button>
            </div>
          </form>

        </div>

      </div>
    </AuthGuard>
  );
}