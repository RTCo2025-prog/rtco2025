'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Download, 
  Upload, 
  CalendarOff, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileJson, 
  Server, 
  ArrowLeft,
  Lock,
  Unlock,
  History,
  Sparkles
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function BackupManagementPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [closedPeriods, setClosedPeriods] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // قفل الشهر
  const [targetMonth, setTargetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [lockNotes, setLockNotes] = useState('إقفال مالي وتدقيق شامل لكافة القطاعات والفروع');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system', { cache: 'no-store' });
      const data = await res.json();
      if (data && data.success) {
        setClosedPeriods(data.closedPeriods || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try { setCurrentUser(JSON.parse(raw)); } catch {}
    }
    loadData();
  }, []);

  // 1. تنزيل نسخة احتياطية كاملة
  const handleDownloadBackup = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/system?action=BACKUP_DATABASE');
      if (!res.ok) throw new Error('فشل جلب ملف النسخة الاحتياطية');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RTCO_Backup_Complete_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      alert('✓ تم تصدير وتنزيل النسخة الاحتياطية الشاملة بنجاح!');
      loadData();
    } catch (e: any) {
      alert('حدث خطأ: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. استعادة ورفع نسخة احتياطية
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تحذير سيادي: استعادة النسخة الاحتياطية ستقوم بدمج وتحديث السجلات في قاعدة البيانات السحابية، هل تود المتابعة؟')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/admin/system', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RESTORE_DATABASE',
            backupData: content,
            restored_by: currentUser?.full_name || 'المدير المفوض'
          })
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          alert('✓ تمت استعادة النسخة الاحتياطية ومزامنة كافة الجداول بنجاح!');
          window.location.reload();
        } else {
          alert(resData.error || 'فشلت استعادة النسخة');
        }
      } catch {
        alert('الملف غير صالح أو تالف.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // 3. إقفال الفترة المالية
  const handleClosePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`تأكيد إقفال وتجميد الفترة المالية لشهر (${targetMonth})؟`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE_PERIOD',
          period_month: targetMonth,
          closed_by: currentUser?.full_name || 'المدير المفوض',
          closure_notes: lockNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✓ تم إقفال شهر ${targetMonth} بنجاح!`);
        loadData();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. إعادة فتح الفترة المالية
  const handleReopenPeriod = async (monthStr: string) => {
    const reason = prompt(`يرجى كتابة سبب إعادة فتح الشهر المالي (${monthStr}):`);
    if (!reason) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REOPEN_PERIOD',
          period_month: monthStr,
          opened_by: currentUser?.full_name || 'المدير المفوض',
          reason
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✓ تمت إعادة فتح شهر ${monthStr} للعمل.`);
        loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-sm">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleRestoreBackup} 
          accept=".json" 
          className="hidden" 
        />

        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* الترويسة الرئيسية الفاخرة */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black text-white">إدارة النسخ الاحتياطية والحوكمة المالية</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                    Cloud Vault
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">تصدير واستعادة قواعد البيانات السحابية وقفل الفترات الحسابية</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={loadData} 
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-amber-400 transition cursor-pointer"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link 
                href="/" 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> الرئيسية
              </Link>
            </div>
          </div>

          {/* كروت أدوات النسخ الاحتياطي السحابي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* كارت تنزيل النسخة الاحتياطية */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Download className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-slate-500">JSON Full Dump</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">تصدير وتنزيل نسخة احتياطية شاملة</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    توليد ملف مشفر يحتوي على كافة بيانات المنظومة (المقاولات، أسطول النقل، المخازن، الرواتب، السندات، العقود، والأقساط) وحفظها على جهازك.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadBackup}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition cursor-pointer mt-4"
              >
                <Download className="w-4 h-4" /> تنزيل النسخة الاحتياطية الآن
              </button>
            </div>

            {/* كارت استعادة النسخة الاحتياطية */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-slate-500">Restore & Sync</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">استعادة ورفع نسخة احتياطية سابقة</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    استيراد ملف نسخة احتياطية سابقة ومزامنتها مباشرة مع قاعدة البيانات السحابية في حال حدوث أي طارئ أو رغبة بنقل البيانات.
                  </p>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer mt-4"
              >
                <Upload className="w-4 h-4" /> رفع واستعادة ملف النسخة
              </button>
            </div>

          </div>

          {/* قسم قفل الشهر المالي والفترات الحسابية */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarOff className="w-5 h-5 text-rose-400" /> قفل وترحيل الفترات المالية
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">تجميد السجلات الحسابية لمنع التعديل بعد اعتماد الحسابات الختامية</p>
              </div>
            </div>

            <form onSubmit={handleClosePeriod} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">حدد شهر الإقفال:</label>
                <input 
                  type="month"
                  required
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">بيان وملاحظات الإقفال:</label>
                <input 
                  type="text"
                  required
                  value={lockNotes}
                  onChange={(e) => setLockNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                <Lock className="w-4 h-4" /> إقفال وتجميد الشهر
              </button>
            </form>

            {/* جدول الفترات المقفلة */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-400">سجل الفترات المالية المقفلة:</h3>
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">الشهر المقفل</th>
                      <th className="p-3">المسؤول عن الإقفال</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3">تاريخ الإقفال</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {closedPeriods.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                          لا توجد شهور مقفلة حالياً، كافة الفترات المالية مفتوحة للتعديل.
                        </td>
                      </tr>
                    ) : (
                      closedPeriods.map((p) => (
                        <tr key={p.period_id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-rose-400">{p.period_month}</td>
                          <td className="p-3 font-sans font-bold text-white">{p.closed_by}</td>
                          <td className="p-3 font-sans text-slate-300">{p.closure_notes}</td>
                          <td className="p-3 text-slate-400">{String(p.created_at || '').substring(0, 10)}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleReopenPeriod(p.period_month)}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Unlock className="w-3 h-3" /> إعادة فتح
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* سجل التدقيق الرقابي والأمان */}
          {auditLogs.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
              <h2 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" /> سجل العمليات الأمنية والرقابية الأخيرة:
              </h2>
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <div key={log.log_id} className="p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-slate-300">
                    <span className="font-sans font-bold text-white">{log.user_name} ({log.action_type}): {log.description}</span>
                    <span className="text-slate-500">{String(log.created_at).slice(0, 16)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}