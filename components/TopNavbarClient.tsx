'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutGrid, 
  ShieldCheck, 
  Bell, 
  FileText, 
  FileCheck, 
  CreditCard, 
  HardHat, 
  Truck, 
  Boxes, 
  Building, 
  Users, 
  Wallet, 
  Settings, 
  Clock, 
  LogOut, 
  User, 
  ChevronDown, 
  Menu, 
  X,
  Lock,
  PieChart,
  CheckCheck,
  Trash2,
  ExternalLink,
  Download,
  Upload,
  CalendarOff,
  Database
} from 'lucide-react';
import { useBranch } from '@/context/BranchContext';

export default function TopNavbarClient() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedBranchId, setSelectedBranchId, branches } = useBranch();

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    logo_url: '',
    primary_color: '#d97706',
  });

  const [showModulesMenu, setShowModulesMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // حالات أدوات الإدارة العليا (النسخ الاحتياطي وقفل الشهر)
  const [showLockMonthModal, setShowLockMonthModal] = useState(false);
  const [lockTargetMonth, setLockTargetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [lockNotes, setLockNotes] = useState('إقفال مالي وتدقيق شامل لكافة القطاعات');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [timeHoursMins, setTimeHoursMins] = useState('');
  const [timePeriod, setTimePeriod] = useState('');

  const isFetchingNotifs = useRef(false);

  // استرجاع المستخدم المعتمد
  const syncUser = () => {
    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try { 
        const u = JSON.parse(raw);
        setCurrentUser(u);
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    syncUser();

    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.settings) {
            setCompanySettings(data.settings);
          }
        }
      } catch {
        // كتم أخطاء انقطاع الاتصال المؤقتة أثناء التنقل
      }
    };
    loadSettings();

    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'م' : 'ص';
      hours = hours % 12 || 12;
      const formattedHours = hours.toString().padStart(2, '0');

      setTimeHoursMins(`${formattedHours}:${mins}`);
      setTimePeriod(period);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [pathname]);

  const fetchNotifications = async () => {
    if (isFetchingNotifs.current) return;
    isFetchingNotifs.current = true;
    try {
      const u = currentUser || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('erp_user') || '{}'));
      const uname = u?.username || '';
      const bId = u?.assigned_branch_id || selectedBranchId || 'ALL';
      const role = u?.role || '';

      const res = await fetch(`/api/notifications?username=${encodeURIComponent(uname)}&branch_id=${encodeURIComponent(bId)}&role=${encodeURIComponent(role)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const apiNotifs = data.notifications || [];
          setNotifications(apiNotifs);
          setUnreadCount(apiNotifs.filter((n: any) => !n.is_read).length);
        }
      }
    } catch {
      // كتم الأخطاء المؤقتة للشبكة
    } finally {
      isFetchingNotifs.current = false;
    }
  };

  // فحص الإشعارات دورياً كل 30 ثانية دون تكرار متزامن
  useEffect(() => {
    fetchNotifications();
    const notifTimer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(notifTimer);
  }, [selectedBranchId]);

  const markAllAsRead = async () => {
    try {
      const uname = currentUser?.username || '';
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_AS_READ', username: uname })
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const markSingleAsRead = async (notifId: string) => {
    try {
      const uname = currentUser?.username || '';
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notifId, username: uname })
      });
      setNotifications(prev => prev.map(n => (n.notification_id === notifId || n.id === notifId) ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const clearAllNotifications = async () => {
    if (!confirm('هل تريد مسح كافة الإشعارات من حسابك؟')) return;
    try {
      const uname = currentUser?.username || '';
      await fetch(`/api/notifications?username=${encodeURIComponent(uname)}`, { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  // دوال النسخة الاحتياطية المتوافقة تماماً مع route.ts للنظام
  const handleDownloadBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await fetch('/api/admin/system?action=BACKUP_DATABASE');
      if (!res.ok) throw new Error('فشل جلب النسخة الاحتياطية');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RTCO_Backup_Complete_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setShowAdminMenu(false);
      alert('تم تنزيل النسخة الاحتياطية الشاملة بنجاح!');
    } catch (e: any) {
      alert('حدث خطأ أثناء تنزيل النسخة الاحتياطية: ' + e.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تحذير: استعادة النسخة الاحتياطية ستقوم بدمج وتحديث البيانات في قاعدة البيانات، هل تود الاستمرار؟')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsBackingUp(true);
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
            alert('تمت استعادة ورفع النسخة الاحتياطية بنجاح!');
            window.location.reload();
          } else {
            alert(resData.error || 'فشلت استعادة النسخة الاحتياطية');
          }
        } catch {
          alert('الملف المختار غير صالح كنسخة احتياطية JSON.');
        } finally {
          setIsBackingUp(false);
          setShowAdminMenu(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    } catch {
      setIsBackingUp(false);
    }
  };

  const handleConfirmLockMonth = async () => {
    if (!confirm(`هل أنت متأكد من إقفال الشهر المالي (${lockTargetMonth})؟`)) return;

    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'CLOSE_PERIOD', 
          period_month: lockTargetMonth,
          closed_by: currentUser?.full_name || 'المدير المفوض',
          closure_notes: lockNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`تم إقفال شهر ${lockTargetMonth} بنجاح!`);
        setShowLockMonthModal(false);
      } else {
        alert(data.error || 'فشلت عملية إقفال الشهر.');
      }
    } catch {
      alert('حدث خطأ في الاتصال بالخادم أثناء إقفال الشهر.');
    }
  };

  // تسجيل الخروج الآمن
  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    document.cookie = 'rtco_selected_branch_id=; path=/; max-age=0';
    document.cookie = 'rtco_secure_session=; path=/; max-age=0';
    window.location.href = '/login';
  };

  if (pathname === '/login') {
    return null;
  }

  // التحقق الحاسم من صلاحية المدير المفوض لضمان ظهور أدوات الإدارة العليا دائماً
  const isSuperAdmin = Boolean(
    currentUser?.is_super_admin || 
    currentUser?.role === 'ADMIN' || 
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.username === 'admin' ||
    currentUser?.username === 'pro'
  );

  const isBranchRestricted = Boolean(!isSuperAdmin && currentUser?.assigned_branch_id && currentUser.assigned_branch_id !== 'ALL');

  const canAccess = (moduleKey: string) => {
    if (isSuperAdmin) return true;
    if (!currentUser?.permissions) return false;
    const p = currentUser.permissions[moduleKey];
    if (typeof p === 'object' && p !== null) {
      return Boolean(p.view);
    }
    if (Array.isArray(p)) {
      return p.includes('view');
    }
    return false;
  };

  const roleTitle = isSuperAdmin ? 'المدير المفوض' : (currentUser?.job_title || 'موظف مصرح');
  const primaryCol = companySettings.primary_color || '#d97706';
  const hasLogo = Boolean(companySettings.logo_url && companySettings.logo_url.trim().length > 10);

  // اسم الفرع المقيد للموظف
  const currentBranchName = () => {
    if (isBranchRestricted) {
      const b = (branches || []).find((x: any) => x.branch_id === currentUser.assigned_branch_id);
      return b ? b.name_ar : 'فرع التجارة العامة والمخازن';
    }
    const cur = (branches || []).find((x: any) => x.branch_id === selectedBranchId);
    return cur ? cur.name_ar : 'المقر الرئيسي (عرض المنظومة الموحدة)';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090e18]/95 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl px-3 md:px-6 py-2.5 print:hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUploadBackup} 
        accept=".json" 
        className="hidden" 
      />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* 1. الجانب الأيمن: شعار الشركة ونطاق العمل المخصص */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group transition">
            <div 
              className="w-10 h-10 relative rounded-2xl overflow-hidden bg-slate-950 p-1 border flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition"
              style={{ borderColor: `${primaryCol}50` }}
            >
              {hasLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
              ) : (
                <Image src="/logo.png" alt={companySettings.company_name} width={36} height={36} className="object-contain" priority />
              )}
            </div>
            <div className="text-right">
              <h1 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight tracking-wide group-hover:text-amber-400 transition">
                {companySettings.company_name}
              </h1>
              <p className="text-[9px] sm:text-[10px] font-mono font-bold" style={{ color: primaryCol }}>
                Enterprise ERP • النجف الأشرف
              </p>
            </div>
          </Link>

          {/* محوّل الفروع */}
          <div className="hidden lg:block">
            {isBranchRestricted ? (
              <div className="flex items-center gap-2 bg-[#0c1424] border border-amber-500/40 rounded-2xl px-3 py-1.5 shadow-md">
                <span className="text-amber-400 text-sm">🏢</span>
                <span className="text-xs font-bold text-amber-300">
                  📍 {currentBranchName()}
                </span>
                <span className="text-[10px] bg-slate-900 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono font-bold">
                  <Lock className="w-2.5 h-2.5 text-amber-400" /> مقيد
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#0c1424] hover:bg-[#101b30] border border-slate-700/80 hover:border-amber-500/50 rounded-2xl px-3 py-1.5 shadow-lg transition">
                <span className="text-amber-400 text-sm">🏢</span>
                <label className="text-xs text-slate-400 font-bold whitespace-nowrap">نطاق العمل:</label>
                <select
                  value={selectedBranchId || 'ALL'}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-xs font-black text-amber-300 focus:outline-none cursor-pointer py-0.5 dir-rtl"
                >
                  <option value="ALL" className="bg-[#0c1424] text-amber-400 font-bold">
                    🌐 المقر الرئيسي (عرض المنظومة الموحدة)
                  </option>
                  {(branches || [])
                    .filter((b: any) => b.branch_id !== 'ALL')
                    .map((b: any) => (
                      <option key={b.branch_id} value={b.branch_id} className="bg-[#0c1424] text-slate-100 font-bold">
                        📍 {b.name_ar} {b.city ? `(${b.city})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 2. الجانب الأيسر (للشاشات الكبيرة): الساعة + القوائم المفلترة + أدوات الإدارة العليا الكاملة */}
        <div className="hidden xl:flex items-center gap-2.5">
          
          {/* الساعة الرقمية */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-[#0c1424] to-[#121c32] border border-amber-500/40 px-3.5 py-1.5 rounded-2xl shadow-lg">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1 font-mono" dir="ltr">
              <span className="text-sm font-black text-amber-300 tracking-wider">
                {timeHoursMins || '12:00'}
              </span>
              <span className="text-[10px] font-black text-amber-500 font-sans">
                {timePeriod || 'م'}
              </span>
            </div>
          </div>

          {/* قائمة قطاعات المنظومة */}
          <div className="relative">
            <button
              onClick={() => { setShowModulesMenu(!showModulesMenu); setShowAdminMenu(false); setShowNotifMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>قطاعات المنظومة</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showModulesMenu ? 'rotate-180' : ''}`} />
            </button>

            {showModulesMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0c1220] border border-slate-700/80 rounded-2xl p-2 shadow-2xl grid grid-cols-1 gap-1 z-50 text-right animate-in fade-in slide-in-from-top-2">
                {canAccess('admin_docs') && (
                  <Link href="/admin/documents" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> الإدارة والكتب الرسمية
                  </Link>
                )}
                {canAccess('contracts') && (
                  <Link href="/real-estate/contracts" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400" /> العقود الإلكترونية الرسمية
                  </Link>
                )}
                {canAccess('installments') && (
                  <Link href="/inventory/installments" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> المبيعات بالأقساط المدمجة
                  </Link>
                )}
                {canAccess('contracting') && (
                  <Link href="/projects" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <HardHat className="w-3.5 h-3.5 text-amber-400" /> قطاع المقاولات والمشاريع
                  </Link>
                )}
                {canAccess('fleet') && (
                  <Link href="/fleet" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Truck className="w-3.5 h-3.5 text-sky-400" /> أسطول النقل واللوجستيات
                  </Link>
                )}
                {canAccess('inventory') && (
                  <Link href="/inventory" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Boxes className="w-3.5 h-3.5 text-amber-500" /> التجارة والمخزن المركزي
                  </Link>
                )}
                {canAccess('realestate') && (
                  <Link href="/real-estate" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Building className="w-3.5 h-3.5 text-purple-400" /> العقارات والاستثمار
                  </Link>
                )}
                {canAccess('hr') && (
                  <Link href="/hr" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Users className="w-3.5 h-3.5 text-rose-400" /> الموارد البشرية والرواتب
                  </Link>
                )}
                {canAccess('vouchers') && (
                  <Link href="/vouchers" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Wallet className="w-3.5 h-3.5 text-purple-400" /> السندات والقيود المحاسبية
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* أدوات الإدارة العليا: متضمنة الإعدادات ورابط صفحة النسخة الاحتياطية فقط بدون الأزرار المباشرة */}
          {isSuperAdmin && (
            <div className="relative">
              <button
                onClick={() => { setShowAdminMenu(!showAdminMenu); setShowModulesMenu(false); setShowNotifMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>أدوات الإدارة العليا</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
              </button>

              {showAdminMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0c1220] border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl space-y-1.5 z-50 text-right animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-800">
                    الإعدادات والرقابة العامة
                  </div>
                  <Link href="/admin/settings" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-amber-400 transition">
                    <Settings className="w-3.5 h-3.5" /> إعدادات الشركة وترويسة الطباعة
                  </Link>
                  <Link href="/admin/users" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-emerald-400 transition">
                    <ShieldCheck className="w-3.5 h-3.5" /> إدارة صلاحيات الموظفين
                  </Link>
                  <Link href="/finance/reports" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-purple-400 transition">
                    <PieChart className="w-3.5 h-3.5" /> التقارير وقائمة الدخل
                  </Link>

                  <div className="px-2 pt-2 pb-1 text-[11px] font-bold text-slate-400 border-b border-t border-slate-800">
                    النسخ الاحتياطي والحوكمة
                  </div>

                  {/* فتح صفحة النسخة الاحتياطية الكاملة المستقلة */}
                  <Link 
                    href="/admin/backup" 
                    onClick={() => setShowAdminMenu(false)} 
                    className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-xs font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 transition"
                  >
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>فتح صفحة النسخة الاحتياطية المستقلة</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* الإشعارات */}
          <div className="relative">
            <button
              onClick={() => { 
                const next = !showNotifMenu;
                setShowNotifMenu(next); 
                setShowModulesMenu(false); 
                setShowAdminMenu(false);
                if (next) fetchNotifications();
              }}
              className={`relative p-2 rounded-xl transition cursor-pointer border ${
                showNotifMenu 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                  : 'bg-slate-900 border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white'
              }`}
              title="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* قائمة الإشعارات المنبثقة */}
            {showNotifMenu && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-[#0c1220] border border-slate-700/90 rounded-3xl p-3 shadow-2xl z-50 text-right animate-in fade-in slide-in-from-top-2 origin-top-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-white">إشعارات النظام</span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold px-2 py-0.2 rounded-full font-mono">
                        {unreadCount} غير مقروء
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                        title="تعليم الكل كمقروء"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px]">قراءة الكل</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="تفريغ السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 py-2">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      لا توجد إشعارات جديدة حالياً ✓
                    </div>
                  ) : (
                    notifications.map((n: any) => {
                      const isUnread = !n.is_read;
                      return (
                        <div
                          key={n.notification_id || n.id}
                          className={`p-2.5 rounded-2xl border transition flex flex-col gap-1 cursor-pointer ${
                            isUnread 
                              ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/60' 
                              : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/40'
                          }`}
                          onClick={() => {
                            if (isUnread) markSingleAsRead(n.notification_id || n.id);
                            if (n.link) {
                              setShowNotifMenu(false);
                              router.push(n.link);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {isUnread && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>}
                              {n.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {n.created_at ? String(n.created_at).slice(5, 16) : ''}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-snug">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/40">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {n.sector || 'GENERAL'}
                            </span>
                            {n.link && (
                              <span className="text-amber-400 hover:underline flex items-center gap-0.5">
                                عرض التفاصيل <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-2 text-center">
                  <button
                    onClick={() => { setShowNotifMenu(false); router.push('/admin/notifications'); }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    عرض كافة الإشعارات في صفحة مستقلة ←
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* بطاقة المستخدم الحالي */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-[#0c1220] border border-slate-800 px-2.5 py-1 rounded-2xl shadow-inner shrink-0">
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition cursor-pointer p-0.5" title="تسجيل الخروج">
                <LogOut className="w-3.5 h-3.5" />
              </button>
              <div className="text-right">
                <p className="text-xs font-black text-white leading-tight">
                  {currentUser.full_name || currentUser.username}
                </p>
                <span className="text-[9px] font-bold text-amber-500 block">
                  {roleTitle}
                </span>
              </div>
              <div className="w-7 h-7 rounded-xl bg-slate-900 border flex items-center justify-center shrink-0" style={{ borderColor: `${primaryCol}50`, color: primaryCol }}>
                <User className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

        </div>

        {/* 3. الجانب الأيسر لشاشات الموبايل والتابلت */}
        <div className="flex xl:hidden items-center gap-2">
          {currentUser && (
            <span className="text-xs font-bold text-white px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 truncate max-w-[110px]">
              {currentUser.full_name?.split(' ')[0] || currentUser.username}
            </span>
          )}
          <button
            onClick={() => { setShowMobileMenu(!showMobileMenu); }}
            className="p-2 bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
          >
            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* نافذة قفل الشهر المالي التفاعلية */}
      {showLockMonthModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1220] border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <CalendarOff className="w-5 h-5" />
                <span>قفل الشهر المالي وترحيل الأرصدة</span>
              </div>
              <button onClick={() => setShowLockMonthModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              إجراء قفل الشهر المالي يعتمد القيود والسجلات المالية لهذا الشهر ويمنع التلاعب بها لضمان مطابقة الحسابات الختامية.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 block">حدد الشهر المراد قفله:</label>
              <input 
                type="month"
                value={lockTargetMonth}
                onChange={(e) => setLockTargetMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 block">ملاحظات وقرار الإقفال:</label>
              <textarea 
                rows={2}
                value={lockNotes}
                onChange={(e) => setLockNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-xs outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowLockMonthModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                type="button" 
                onClick={handleConfirmLockMonth}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                تأكيد قفل الشهر نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* قائمة الموبايل المنسدلة */}
      {showMobileMenu && (
        <div className="xl:hidden mt-2 bg-[#0c1220] border border-slate-700 rounded-2xl p-4 shadow-2xl text-right space-y-3 animate-in fade-in slide-in-from-top-2">
          
          {/* نطاق الفرع بالموبايل */}
          <div className="pb-2 border-b border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">الفرع النشط:</span>
            {isBranchRestricted ? (
              <div className="p-2 bg-slate-950 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold flex items-center justify-between">
                <span>📍 {currentBranchName()}</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">مقيد</span>
              </div>
            ) : (
              <select
                value={selectedBranchId || 'ALL'}
                onChange={(e) => { setSelectedBranchId(e.target.value); setShowMobileMenu(false); }}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 text-xs font-bold"
              >
                <option value="ALL">🌐 المقر الرئيسي (عرض المنظومة الموحدة)</option>
                {(branches || [])
                  .filter((b: any) => b.branch_id !== 'ALL')
                  .map((b: any) => (
                    <option key={b.branch_id} value={b.branch_id}>📍 {b.name_ar}</option>
                  ))}
              </select>
            )}
          </div>

          {/* القطاعات المصرح بها */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mb-1">
              <LayoutGrid className="w-3.5 h-3.5" /> قطاعاتك المصرح بها:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {canAccess('contracting') && (
                <Link href="/projects" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-300 font-bold">
                  🏗️ المقاولات والمشاريع
                </Link>
              )}
              {canAccess('inventory') && (
                <Link href="/inventory" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
                  📦 المخزن والتجارة
                </Link>
              )}
              {canAccess('contracts') && (
                <Link href="/real-estate/contracts" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
                  ✍️ العقود الرسمية
                </Link>
              )}
              {canAccess('vouchers') && (
                <Link href="/vouchers" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
                  💰 السندات المالية
                </Link>
              )}
            </div>
          </div>

          {/* أدوات الإدارة العليا للموبايل */}
          {isSuperAdmin && (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> أدوات الإدارة العليا:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <Link href="/admin/settings" onClick={() => setShowMobileMenu(false)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 font-bold">
                  ⚙️ إعدادات الشركة
                </Link>
                <Link href="/admin/users" onClick={() => setShowMobileMenu(false)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-bold">
                  👥 الصلاحيات
                </Link>
                <Link href="/admin/backup" onClick={() => setShowMobileMenu(false)} className="col-span-2 p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 font-bold text-center">
                  💾 صفحة النسخة الاحتياطية
                </Link>
                <button 
                  onClick={() => { setShowMobileMenu(false); handleDownloadBackup(); }}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-sky-400 font-bold text-right"
                >
                  📥 نسخة احتياطية
                </button>
                <button 
                  onClick={() => { setShowMobileMenu(false); setShowLockMonthModal(true); }}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-rose-400 font-bold text-right"
                >
                  🔒 قفل الشهر
                </button>
              </div>
            </div>
          )}

          {/* تسجيل الخروج */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">{currentUser?.full_name} ({roleTitle})</span>
            <button onClick={handleLogout} className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> خروج
            </button>
          </div>

        </div>
      )}

    </header>
  );
}