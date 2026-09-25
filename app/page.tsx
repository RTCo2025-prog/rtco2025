'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Building2, 
  Truck, 
  HardHat, 
  Wallet, 
  Layers, 
  Bell, 
  CheckCircle2, 
  LogOut, 
  User, 
  UserPlus, 
  X, 
  Receipt, 
  Users, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  PieChart, 
  Building, 
  Boxes, 
  Sparkles, 
  ArrowUpRight, 
  BellRing, 
  Check, 
  Coins, 
  Download, 
  Lock, 
  Unlock, 
  History, 
  Activity, 
  FileCheck, 
  CreditCard, 
  FileText, 
  Upload, 
  ChevronLeft, 
  Clock, 
  Calendar, 
  MapPin,
  TrendingUp,
  Globe2,
  ChevronDown,
  LayoutGrid,
  Settings
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

/**
 * مكون الساعة التناظرية التفاعلية الفاخرة (Executive Analog Clock)
 */
function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secAngle = seconds * 6; // 360 / 60
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-amber-500/40 bg-gradient-to-br from-slate-950 via-[#0d1322] to-slate-950 p-2 shadow-2xl flex items-center justify-center shrink-0">
      {/* علامات الساعات الرئيسية */}
      <span className="absolute top-1.5 text-[10px] font-mono font-bold text-amber-400">12</span>
      <span className="absolute bottom-1.5 text-[10px] font-mono font-bold text-slate-400">6</span>
      <span className="absolute right-2 text-[10px] font-mono font-bold text-slate-400">3</span>
      <span className="absolute left-2 text-[10px] font-mono font-bold text-slate-400">9</span>

      {/* عقرب الساعات */}
      <div
        className="absolute w-1 bg-amber-400 rounded-full origin-bottom"
        style={{
          height: '24px',
          bottom: '50%',
          transform: `rotate(${hourAngle}deg)`,
          transformOrigin: '50% 100%',
          transition: 'transform 0.2s cubic-bezier(0.4, 2, 0.55, 0.44)'
        }}
      />

      {/* عقرب الدقائق */}
      <div
        className="absolute w-0.5 bg-sky-300 rounded-full origin-bottom"
        style={{
          height: '34px',
          bottom: '50%',
          transform: `rotate(${minAngle}deg)`,
          transformOrigin: '50% 100%',
          transition: 'transform 0.2s cubic-bezier(0.4, 2, 0.55, 0.44)'
        }}
      />

      {/* عقرب الثواني */}
      <div
        className="absolute w-[1.5px] bg-rose-500 rounded-full origin-bottom"
        style={{
          height: '40px',
          bottom: '50%',
          transform: `rotate(${secAngle}deg)`,
          transformOrigin: '50% 100%'
        }}
      />

      {/* نقطة الارتكاز المركزية */}
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950 z-10 shadow-sm" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    tagline: 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    phone_primary: '07868006699',
    phone_secondary: '07737006699',
    email: '',
    website: '',
    address: 'العراق - النجف الأشرف - حي الفرات',
    logo_url: '',
    letterhead_url: '',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  
  // القوائم المنسدلة العلوية
  const [showModulesMenu, setShowModulesMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // النوافذ المنبثقة
  const [showManageModal, setShowManageModal] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [closedPeriods, setClosedPeriods] = useState<any[]>([]);
  const [loadingGovernance, setLoadingGovernance] = useState(false);
  const [periodToLock, setPeriodToLock] = useState(new Date().toISOString().slice(0, 7));
  const [lockNotes, setLockNotes] = useState('إقفال وتدقيق مالي معتمد');
  const [lockingSubmitting, setLockingSubmitting] = useState(false);
  const [restoringSubmitting, setRestoringSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('موظف');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  const isFetchingNotifs = useRef(false);

  const [dashboardData, setDashboardData] = useState<{
    branches: any[];
    projects: any[];
    vouchers: any[];
    employees: any[];
    counts: { projects: number; vehicles: number; units: number; items: number; employees: number };
  }>({
    branches: [],
    projects: [],
    vouchers: [],
    employees: [],
    counts: { projects: 0, vehicles: 0, units: 0, items: 0, employees: 0 }
  });

  const [electronicContractsCount, setElectronicContractsCount] = useState(0);
  const [installmentsCount, setInstallmentsCount] = useState(0);
  const [officialDocsCount, setOfficialDocsCount] = useState(0);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.settings) {
          setCompanySettings(data.settings);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // تحديث التوقيت الرقمي
  useEffect(() => {
    loadSettings();

    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/auth/users');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.users) {
        setUsersList(data.users);
      }
    } catch {
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchNotifications = async () => {
    if (isFetchingNotifs.current) return;
    isFetchingNotifs.current = true;

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rtco_system_notifications');
      }

      const res = await fetch('/api/notifications', { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const apiNotifs = data.notifications || [];
          setNotifications(apiNotifs);
          setUnreadCount(apiNotifs.filter((n: any) => !n.is_read).length);
        }
      }
    } catch {
    } finally {
      isFetchingNotifs.current = false;
    }
  };

  const fetchGovernanceData = async () => {
    setLoadingGovernance(true);
    try {
      const res = await fetch('/api/admin/system', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        setAuditLogs(data.auditLogs || []);
        setClosedPeriods(data.closedPeriods || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGovernance(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/system?action=BACKUP_DATABASE', '_blank');
  };

  const handleUploadBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تنبيه أمني هام: سيتم استبدال وتحديث بيانات الجداول في السيرفر بناءً على هذه النسخة. هل ترغب بالاستمرار؟')) {
      e.target.value = '';
      return;
    }

    setRestoringSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/admin/system', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RESTORE_DATABASE',
            backupData: jsonContent,
            restored_by: currentUser?.full_name || 'المدير المفوض'
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert('تم رفع واستعادة النسخة الاحتياطية بنجاح.');
          window.location.reload();
        } else {
          alert(data.error || 'فشلت عملية استعادة النسخة');
        }
      } catch (err: any) {
        alert('حدث خطأ في قراءة ملف الـ JSON: ' + err.message);
      } finally {
        setRestoringSubmitting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCloseFinancialPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodToLock) return;
    setLockingSubmitting(true);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE_PERIOD',
          period_month: periodToLock,
          closed_by: currentUser?.full_name || 'الإدارة العليا',
          closure_notes: lockNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`تم إقفال الفترة المالية لشهر (${periodToLock}) بنجاح.`);
        await fetchGovernanceData();
      } else {
        alert(data.error || 'فشلت عملية الإقفال');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLockingSubmitting(false);
    }
  };

  const handleReopenPeriod = async (month: string) => {
    const reason = prompt(`يرجى كتابة سبب إعادة فتح شهر (${month}):`);
    if (!reason) return;

    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REOPEN_PERIOD',
          period_month: month,
          opened_by: currentUser?.full_name || 'الإدارة العليا',
          reason
        })
      });
      if (res.ok) {
        alert(`تمت إعادة فتح شهر (${month}) بنجاح.`);
        await fetchGovernanceData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_AS_READ' })
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch {}
    }

    try {
      const storedContracts = localStorage.getItem('rtco_electronic_contracts');
      if (storedContracts) setElectronicContractsCount(JSON.parse(storedContracts).length);

      const storedInstallments = localStorage.getItem('rtco_inventory_installments');
      if (storedInstallments) setInstallmentsCount(JSON.parse(storedInstallments).length);

      const storedDocs = localStorage.getItem('rtco_official_documents');
      if (storedDocs) setOfficialDocsCount(JSON.parse(storedDocs).length);
    } catch {}

    const fetchData = async () => {
      try {
        const [resB, resP, resF, resU, resI, resH, resV] = await Promise.all([
          fetch('/api/branches').then(r => r.ok ? r.json() : { branches: [] }).catch(() => ({ branches: [] })),
          fetch('/api/projects').then(r => r.ok ? r.json() : { projects: [] }).catch(() => ({ projects: [] })),
          fetch('/api/fleet').then(r => r.ok ? r.json() : { vehicles: [] }).catch(() => ({ vehicles: [] })),
          fetch('/api/real-estate').then(r => r.ok ? r.json() : { units: [] }).catch(() => ({ units: [] })),
          fetch('/api/inventory').then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
          fetch('/api/hr').then(r => r.ok ? r.json() : { employees: [] }).catch(() => ({ employees: [] })),
          fetch('/api/vouchers').then(r => r.ok ? r.json() : { vouchers: [] }).catch(() => ({ vouchers: [] }))
        ]);

        setDashboardData({
          branches: resB.branches || [],
          projects: resP.projects || [],
          vouchers: resV.vouchers || [],
          employees: resH.employees || [],
          counts: {
            projects: resP.projects ? resP.projects.length : 0,
            vehicles: resF.vehicles ? resF.vehicles.length : 0,
            units: resU.units ? resU.units.length : 0,
            items: resI.items ? resI.items.length : 0,
            employees: resH.employees ? resH.employees.length : 0
          }
        });
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    router.push('/login');
  };

  const handleOpenManageModal = () => {
    setShowManageModal(true);
    setShowAdminMenu(false);
    resetForm();
    fetchUsers();
  };

  const handleOpenGovernanceModal = () => {
    setShowGovernanceModal(true);
    setShowAdminMenu(false);
    fetchGovernanceData();
  };

  const resetForm = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setFormFullName('');
    setFormUsername('');
    setFormPassword('');
    setFormJobTitle('موظف');
    setFormStatus('ACTIVE');
    setFormMessage('');
  };

  const handleStartEdit = (u: any) => {
    setIsEditing(true);
    setSelectedUserId(u.user_id);
    setFormFullName(u.full_name);
    setFormUsername(u.username);
    setFormPassword('');
    setFormJobTitle(u.job_title || 'موظف');
    setFormStatus(u.status || 'ACTIVE');
    setFormMessage('');
  };

  const handleDeleteUser = async (u: any) => {
    if (u.user_id === currentUser?.user_id) {
      alert('لا يمكنك حذف حسابك الحالي الذي تستخدمه لتسجيل الدخول!');
      return;
    }
    if (u.is_super_admin) {
      alert('حساب المدير المفوض الأساسي محمي ولا يمكن حذفه!');
      return;
    }
    if (!confirm(`هل أنت متأكد من رغبتك في حذف حساب "${u.full_name}"؟`)) return;

    try {
      const res = await fetch(`/api/auth/users?id=${u.user_id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم حذف الحساب بنجاح');
        fetchUsers();
      } else {
        alert(data.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormMessage('');

    try {
      if (isEditing && selectedUserId) {
        const payload: any = {
          action: 'UPDATE_USER',
          user_id: selectedUserId,
          full_name: formFullName,
          job_title: formJobTitle,
          status: formStatus
        };
        if (formPassword && formPassword.trim()) {
          payload.password = formPassword.trim();
        }

        const res = await fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setFormMessage(data.error || 'فشلت عملية التعديل');
          return;
        }

        alert('تم تحديث بيانات المستخدم بنجاح');
        if (selectedUserId === currentUser?.user_id) {
          const updated = { ...currentUser, full_name: formFullName, job_title: formJobTitle };
          localStorage.setItem('erp_user', JSON.stringify(updated));
          setCurrentUser(updated);
        }
      } else {
        const res = await fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_USER',
            full_name: formFullName,
            username: formUsername,
            password: formPassword,
            job_title: formJobTitle
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setFormMessage(data.error || 'فشلت عملية إنشاء الحساب');
          return;
        }

        alert('تم إنشاء الحساب الجديد بنجاح');
      }

      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFormMessage(err.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setFormSubmitting(false);
    }
  };

  const clean = (t: string) => (t || '').trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ');

  const ongoingProjects = useMemo(() => {
    return dashboardData.projects.filter((p) => {
      const isCompleted = p.status === 'COMPLETED' || Number(p.completion_rate || 0) >= 100;
      return !isCompleted;
    });
  }, [dashboardData.projects]);

  const completedProjectsMap = useMemo(() => {
    const ids = new Set<string>();
    const names = new Set<string>();
    dashboardData.projects.forEach((p) => {
      const isCompleted = p.status === 'COMPLETED' || Number(p.completion_rate || 0) >= 100;
      if (isCompleted) {
        if (p.project_id) ids.add(String(p.project_id).trim());
        if (p.project_name) names.add(clean(p.project_name));
      }
    });
    return { ids, names };
  }, [dashboardData.projects]);

  const financialSummary = useMemo(() => {
    let receipts = 0;
    let payments = 0;

    dashboardData.vouchers.forEach((v) => {
      if (v.status === 'VOID' || v.status === 'CANCELLED') return;

      const vProjId = String(v.project_id || '').trim();
      const vProjName = clean(v.project_name || '');
      const vNotes = clean(v.notes || '');

      const belongsToCompletedProject = 
        (vProjId !== '' && completedProjectsMap.ids.has(vProjId)) ||
        (vProjName !== '' && completedProjectsMap.names.has(vProjName)) ||
        Array.from(completedProjectsMap.names).some(compName => compName.length > 3 && vNotes.includes(compName));

      if (belongsToCompletedProject) return;

      const amt = Number(v.total_amount || v.amount || 0);
      if (v.voucher_type === 'RECEIPT') receipts += amt;
      if (v.voucher_type === 'PAYMENT') payments += amt;
    });

    const netCash = receipts - payments;

    const totalMonthlySalaries = dashboardData.employees
      .filter((e) => e.status === 'ACTIVE')
      .reduce((acc, e) => acc + (Number(e.base_salary || 0) + Number(e.allowances || 0)), 0);

    return { receipts, payments, netCash, totalMonthlySalaries };
  }, [dashboardData.vouchers, dashboardData.employees, completedProjectsMap]);

  const systemAlerts = useMemo(() => {
    const alerts: { title: string; desc: string; type: 'PAYMENT' | 'CONTRACT' | 'BUDGET'; link: string }[] = [];

    ongoingProjects.forEach((p) => {
      const compRate = Number(p.completion_rate || 0);
      (p.payment_terms || []).forEach((t: any) => {
        if (!t.is_paid && compRate >= Number(t.target_milestone_rate || 0)) {
          alerts.push({
            title: `دفعة مستحقة: ${p.project_name}`,
            desc: `استحقاق دفعة (${t.term_title}) بمبلغ ${formatNum(t.amount)} د.ع`,
            type: 'PAYMENT',
            link: '/projects'
          });
        }
      });

      const contract = Number(p.contract_value || 0);
      const exp = Number(p.total_expenses || 0);
      if (contract > 0 && (exp / contract) >= 0.8) {
        alerts.push({
          title: `تجاوز الميزانية: ${p.project_name}`,
          desc: `تم استنزاف ${((exp / contract) * 100).toFixed(0)}% من السقف المالي للعقد`,
          type: 'BUDGET',
          link: '/projects'
        });
      }
    });

    const nowTime = new Date().getTime();
    dashboardData.employees.forEach((emp) => {
      if (emp.contract_end_date && emp.status === 'ACTIVE') {
        const diffDays = Math.ceil((new Date(emp.contract_end_date).getTime() - nowTime) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30 && diffDays >= 0) {
          alerts.push({
            title: `عقد عمل ينتهي قريباً: ${emp.full_name}`,
            desc: `ينتهي العقد خلال ${diffDays} يوماً في (${emp.contract_end_date})`,
            type: 'CONTRACT',
            link: '/hr'
          });
        }
      }
    });

    return alerts;
  }, [ongoingProjects, dashboardData.employees]);

  const getSectorBadge = (sector: string) => {
    switch (sector) {
      case 'ADMIN_DOCS':
        return { name: 'الإدارة والكتب الرسمية', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'CONTRACTS':
        return { name: 'العقود الإلكترونية الرسمية', icon: <FileCheck className="w-3.5 h-3.5" />, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'INSTALLMENTS':
        return { name: 'المبيعات بالأقساط المدمجة', icon: <CreditCard className="w-3.5 h-3.5" />, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'FINANCE':
      case 'VOUCHERS':
        return { name: 'الإدارة المالية والسندات', icon: <Wallet className="w-3.5 h-3.5" />, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'PROJECTS':
      case 'CONTRACTING':
        return { name: 'المقاولات والمشاريع', icon: <HardHat className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'INVENTORY':
        return { name: 'التجارة والمخزن المركزي', icon: <Boxes className="w-3.5 h-3.5" />, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'FLEET':
        return { name: 'أسطول النقل اللوجستي', icon: <Truck className="w-3.5 h-3.5" />, color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'HR':
        return { name: 'الموارد البشرية والرواتب', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      default:
        return { name: 'الإدارة العامة والمركزية', icon: <Building2 className="w-3.5 h-3.5" />, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';
  const hasLogo = Boolean(companySettings.logo_url && companySettings.logo_url.trim().length > 10);
  const hasLetterhead = Boolean(companySettings.letterhead_url && companySettings.letterhead_url.trim().length > 10);

  if (!currentUser) return null;

  const isSuperAdmin = Boolean(currentUser.is_super_admin || currentUser.role === 'ADMIN' || currentUser.username === 'admin');

  const canViewAdminDocs = isSuperAdmin || hasPermission(currentUser, 'admin_docs', 'view');
  const canAddAdminDocs = isSuperAdmin || hasPermission(currentUser, 'admin_docs', 'add');

  const canViewContracts = isSuperAdmin || hasPermission(currentUser, 'contracts', 'view');
  const canAddContracts = isSuperAdmin || hasPermission(currentUser, 'contracts', 'add');

  const canViewInstallments = isSuperAdmin || hasPermission(currentUser, 'installments', 'view');
  const canAddInstallments = isSuperAdmin || hasPermission(currentUser, 'installments', 'add');

  const canViewBranches = isSuperAdmin || hasPermission(currentUser, 'branches', 'view');
  const canViewProjects = isSuperAdmin || hasPermission(currentUser, 'contracting', 'view');
  const canAddProjects = isSuperAdmin || hasPermission(currentUser, 'contracting', 'add');

  const canViewFleet = isSuperAdmin || hasPermission(currentUser, 'fleet', 'view');
  const canViewInventory = isSuperAdmin || hasPermission(currentUser, 'inventory', 'view');
  const canViewRealEstate = isSuperAdmin || hasPermission(currentUser, 'realestate', 'view');
  const canViewHR = isSuperAdmin || hasPermission(currentUser, 'hr', 'view');
  const canAddHR = isSuperAdmin || hasPermission(currentUser, 'hr', 'add');

  const canViewFinancials = isSuperAdmin || hasPermission(currentUser, 'vouchers', 'view');
  const canAddVouchers = isSuperAdmin || hasPermission(currentUser, 'vouchers', 'add');

  const roleTitle = isSuperAdmin ? 'المدير المفوض' : (currentUser.job_title || 'موظف مصرح');

  return (
    <AuthGuard>
      <div dir="rtl" className="min-h-screen bg-[#06080e] text-slate-100 font-cairo text-[14px] selection:bg-amber-500 selection:text-slate-950">
        
        {/* الشريط العلوي الفاخر مع القوائم المنسدلة */}
        <header className="sticky top-0 z-40 bg-[#090e18]/90 backdrop-blur-2xl border-b border-slate-800/80 px-4 md:px-8 py-3.5 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* الشعار واسم الشركة */}
            <div className="flex items-center gap-3.5">
              <div 
                className="w-11 h-11 relative rounded-2xl overflow-hidden bg-slate-950 p-1.5 border flex items-center justify-center shrink-0 shadow-lg"
                style={{ borderColor: `${primaryCol}50`, boxShadow: `0 10px 25px -5px ${primaryCol}30` }}
              >
                {hasLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                ) : (
                  <Image src="/logo.png" alt={companySettings.company_name} width={38} height={38} className="object-contain" priority />
                )}
              </div>
              <div>
                <h1 className="text-base font-black text-white leading-tight tracking-wide">{companySettings.company_name}</h1>
                <p className="text-[10px] font-mono font-bold" style={{ color: primaryCol }}>Enterprise ERP • النجف الأشرف</p>
              </div>
            </div>

            {/* القوائم المنسدلة للتنقل السريع */}
            <div className="hidden lg:flex items-center gap-2">
              
              {/* قائمة القطاعات المنسدلة */}
              <div className="relative">
                <button
                  onClick={() => { setShowModulesMenu(!showModulesMenu); setShowAdminMenu(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <LayoutGrid className="w-4 h-4" style={{ color: primaryCol }} />
                  <span>قطاعات المنظومة</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showModulesMenu ? 'rotate-180' : ''}`} />
                </button>

                {showModulesMenu && (
                  <div className="absolute right-0 mt-3 w-80 bg-[#0c1220] border border-slate-700/80 rounded-3xl p-3 shadow-2xl grid grid-cols-1 gap-1.5 z-50 text-right animate-in fade-in slide-in-from-top-2">
                    {canViewAdminDocs && (
                      <Link href="/admin/documents" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <FileText className="w-4 h-4 text-amber-400" /> الإدارة والكتب الرسمية
                      </Link>
                    )}
                    {canViewContracts && (
                      <Link href="/real-estate/contracts" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <FileCheck className="w-4 h-4 text-indigo-400" /> العقود الإلكترونية الرسمية
                      </Link>
                    )}
                    {canViewInstallments && (
                      <Link href="/inventory/installments" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <CreditCard className="w-4 h-4 text-emerald-400" /> المبيعات بالأقساط المدمجة
                      </Link>
                    )}
                    {canViewProjects && (
                      <Link href="/projects" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <HardHat className="w-4 h-4 text-amber-400" /> قطاع المقاولات والمشاريع
                      </Link>
                    )}
                    {canViewFleet && (
                      <Link href="/fleet" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <Truck className="w-4 h-4 text-sky-400" /> أسطول النقل واللوجستيات
                      </Link>
                    )}
                    {canViewInventory && (
                      <Link href="/inventory" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <Boxes className="w-4 h-4 text-amber-500" /> التجارة والمخزن المركزي
                      </Link>
                    )}
                    {canViewRealEstate && (
                      <Link href="/real-estate" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <Building className="w-4 h-4 text-purple-400" /> العقارات والاستثمار
                      </Link>
                    )}
                    {canViewHR && (
                      <Link href="/hr" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <Users className="w-4 h-4 text-rose-400" /> الموارد البشرية والرواتب
                      </Link>
                    )}
                    {canViewFinancials && (
                      <Link href="/vouchers" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition text-xs font-semibold text-slate-300 hover:text-white">
                        <Wallet className="w-4 h-4 text-purple-400" /> السندات والقيود المحاسبية
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* قائمة الإدارة والتحكم (للمدير المفوض) */}
              {isSuperAdmin && (
                <div className="relative">
                  <button
                    onClick={() => { setShowAdminMenu(!showAdminMenu); setShowModulesMenu(false); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>أدوات الإدارة العليا</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showAdminMenu && (
                    <div className="absolute right-0 mt-3 w-72 bg-[#0c1220] border border-slate-700/80 rounded-3xl p-3 shadow-2xl space-y-1.5 z-50 text-right animate-in fade-in slide-in-from-top-2">
                      <Link href="/admin/settings" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2.5 p-2.5 hover:bg-slate-800 rounded-xl transition text-xs font-bold text-amber-400">
                        <Settings className="w-4 h-4" /> إعدادات الشركة وترويسة الطباعة
                      </Link>
                      <Link href="/admin/users" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2.5 p-2.5 hover:bg-slate-800 rounded-xl transition text-xs font-bold text-emerald-400">
                        <ShieldCheck className="w-4 h-4" /> إدارة صلاحيات الموظفين
                      </Link>
                      <button onClick={handleOpenManageModal} className="w-full flex items-center gap-2.5 p-2.5 hover:bg-slate-800 rounded-xl transition text-xs font-bold text-slate-300 hover:text-white text-right cursor-pointer">
                        <Users className="w-4 h-4 text-amber-400" /> قائمة الحسابات السريعة
                      </button>
                      <button onClick={handleOpenGovernanceModal} className="w-full flex items-center gap-2.5 p-2.5 hover:bg-slate-800 rounded-xl transition text-xs font-bold text-slate-300 hover:text-white text-right cursor-pointer">
                        <Activity className="w-4 h-4 text-sky-400" /> مركز الرقابة والأرشفة
                      </button>
                      <Link href="/finance/reports" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2.5 p-2.5 hover:bg-slate-800 rounded-xl transition text-xs font-bold text-purple-400">
                        <PieChart className="w-4 h-4" /> التقارير وقائمة الدخل
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* أدوات المستخدم والإشعارات */}
            <div className="flex items-center gap-3">
              
              {/* زر الإشعارات المنسدلة */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white rounded-2xl transition shadow-inner cursor-pointer"
                  title="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-md shadow-rose-500/40">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-[#0e1424] border border-slate-800 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl space-y-3 z-50 text-right">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-black text-white">سجل إشعارات المنظومة</span>
                      {unreadCount > 0 ? (
                        <button onClick={markAllNotificationsAsRead} className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 font-bold cursor-pointer">
                          <Check className="w-3 h-3" /> تم القراءة
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">الكل مقروء ✓</span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-slate-500 text-xs">لا توجد إشعارات حالياً.</p>
                      ) : (
                        notifications.map((n, i) => {
                          const badge = getSectorBadge(n.sector);
                          return (
                            <Link key={n.notification_id || i} href={n.link || '/'} onClick={() => setShowNotifMenu(false)} className="block p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 transition">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-flex items-center gap-1 ${badge.color}`}>
                                {badge.icon} {badge.name}
                              </span>
                              <p className="text-xs font-bold text-white mt-1">{n.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* بطاقة المستخدم وتسجيل الخروج */}
              <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-2xl shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border flex items-center justify-center" style={{ borderColor: `${primaryCol}40`, color: primaryCol }}>
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-white leading-tight">{currentUser.full_name}</p>
                  <span className="text-[9px] font-bold" style={{ color: primaryCol }}>{roleTitle}</span>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 p-1.5 rounded-xl transition cursor-pointer" title="تسجيل الخروج">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </header>

        {/* محتوى الصفحة الرئيسي بكامل العرض */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
          
          {/* كرت معلومات الشركة المدمج مع الساعة التناظرية الفاخرة والرقمية */}
          <section 
            className="border rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, #0d1322, #10182b, #0d1322)`,
              borderColor: `${primaryCol}40`
            }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${primaryCol}10` }}></div>

            {/* تفاصيل الشركة الرسمية */}
            <div className="flex items-center gap-5 text-right w-full lg:w-auto relative z-10">
              <div 
                className="w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 shadow-xl"
                style={{ backgroundColor: `${primaryCol}15`, borderColor: `${primaryCol}30`, color: primaryCol }}
              >
                <MapPin className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    سحابي مباشر متصل
                  </span>
                  <p className="text-base md:text-lg font-black text-white">{companySettings.address}</p>
                </div>
                <h2 className="text-sm md:text-base font-bold" style={{ color: primaryCol }}>{companySettings.company_name} - {companySettings.tagline}</h2>
                <p className="text-xs text-slate-400 font-medium">لوحة المراقبة المركزية الموحدة • نظام Enterprise ERP 2026</p>
              </div>
            </div>

            {/* قسم الساعة التناظرية والرقمية الفاخر */}
            <div className="flex items-center justify-between lg:justify-end gap-5 w-full lg:w-auto bg-slate-950/90 px-6 py-4 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
              
              {/* الساعة التناظرية الحية */}
              <AnalogClock />

              {/* الوقت الرقمي والتاريخ */}
              <div className="flex flex-col text-right font-mono space-y-1.5 pl-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">التوقيت الحي (العراق):</span>
                <div className="flex items-center gap-2 text-xl md:text-2xl font-black tracking-wider" style={{ color: primaryCol }}>
                  <Clock className="w-5 h-5 animate-pulse" style={{ color: primaryCol }} />
                  <span>{currentTime || '00:00:00'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold font-sans">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>{currentDate || 'جاري المزامنة...'}</span>
                </div>
              </div>

            </div>
          </section>

          {/* التنبيهات الإدارية العاجلة */}
          {systemAlerts.length > 0 && (
            <section 
              className="border-r-4 border border-slate-800/80 p-4 md:p-5 rounded-3xl space-y-3"
              style={{ 
                borderRightColor: primaryCol,
                background: `linear-gradient(90deg, ${primaryCol}15, #0e1424, #0e1424)`
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-bold flex items-center gap-2" style={{ color: primaryCol }}>
                  <BellRing className="w-4 h-4 animate-bounce" />
                  <span>تنبيهات ومستحقات العمليات العاجلة ({systemAlerts.length})</span>
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">مزامنة حية من ملفات العقود والمشاريع</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemAlerts.slice(0, 3).map((al, idx) => (
                  <Link key={idx} href={al.link} className="bg-[#080d1a] border border-slate-800 hover:border-amber-500/40 p-3 rounded-2xl transition flex items-center justify-between text-xs group">
                    <div className="truncate pr-1">
                      <p className="font-bold text-white group-hover:text-amber-300 transition truncate">{al.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{al.desc}</p>
                    </div>
                    <span className="p-2 rounded-xl bg-slate-900 text-slate-400 group-hover:text-amber-400 shrink-0"><ArrowUpRight className="w-4 h-4" /></span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* المؤشرات المالية الأربعة الرئيسية */}
          {(isSuperAdmin || canViewFinancials) && (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
              <div className="bg-[#0c1220] border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
                <span className="text-xs text-slate-400 font-semibold block">إجمالي المصروفات والنفقات</span>
                <div className="text-xl md:text-2xl font-black font-mono text-amber-400 mt-2 truncate">
                  {formatNum(financialSummary.payments)} <span className="text-xs font-sans text-slate-500">د.ع</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">كافة الحركات المسجلة</span>
              </div>

              <div className="bg-[#0c1220] border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
                <span className="text-xs text-slate-400 font-semibold block">إجمالي المقبوضات المحصلة</span>
                <div className="text-xl md:text-2xl font-black font-mono text-emerald-400 mt-2 truncate">
                  {formatNum(financialSummary.receipts)} <span className="text-xs font-sans text-slate-500">د.ع</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">المشاريع والاستثمارات</span>
              </div>

              <div className="bg-[#0c1220] border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
                <span className="text-xs text-slate-400 font-semibold block">كتلة الرواتب الثابتة</span>
                <div className="text-xl md:text-2xl font-black font-mono text-rose-400 mt-2 truncate">
                  {formatNum(financialSummary.totalMonthlySalaries)} <span className="text-xs font-sans text-slate-500">د.ع</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">الكوادر النشطة بالمنظومة</span>
              </div>

              <div className="bg-[#0c1220] border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
                <span className="text-xs text-slate-400 font-semibold block">صافي السيولة النقدية (الصندوق)</span>
                <div className={`text-xl md:text-2xl font-black font-mono mt-2 truncate ${financialSummary.netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatNum(financialSummary.netCash)} <span className="text-xs font-sans text-slate-500">د.ع</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">الرصيد الفعلي الحالي</span>
              </div>
            </section>
          )}

          {/* مركز الإجراءات السريعة (Quick Actions) */}
          <section className="bg-[#0c1220] border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: primaryCol }} />
                مركز الإجراءات والقيود السريعة
              </h3>
              <span className="text-[11px] text-slate-400">إجراءات مخصصة وفق أذونات حسابك</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-center font-bold">
              {canAddVouchers && (
                <Link href="/vouchers" className="bg-[#080d1a] hover:bg-[#131b2e] border border-purple-500/20 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-purple-300">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span>تسجيل سند مالي</span>
                </Link>
              )}
              {canAddAdminDocs && (
                <Link href="/admin/documents" className="bg-[#080d1a] hover:bg-[#131b2e] border border-amber-500/20 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-amber-300">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>كتاب رسمي (A4)</span>
                </Link>
              )}
              {canAddContracts && (
                <Link href="/real-estate/contracts" className="bg-[#080d1a] hover:bg-[#131b2e] border border-indigo-500/20 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-indigo-300">
                  <FileCheck className="w-5 h-5 text-indigo-400" />
                  <span>عقد بيع معتمد</span>
                </Link>
              )}
              {canAddInstallments && (
                <Link href="/inventory/installments" className="bg-[#080d1a] hover:bg-[#131b2e] border border-emerald-500/20 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-emerald-300">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>عقد تقسيط مدمج</span>
                </Link>
              )}
              {canAddHR && (
                <Link href="/hr" className="bg-[#080d1a] hover:bg-[#131b2e] border border-rose-500/20 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-rose-300">
                  <Coins className="w-5 h-5 text-rose-400" />
                  <span>قيد سلفة موظف</span>
                </Link>
              )}
              {canAddProjects && (
                <Link href="/projects" className="bg-[#080d1a] hover:bg-[#131b2e] border border-sky-500/20 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-sky-300">
                  <HardHat className="w-5 h-5 text-sky-400" />
                  <span>إضافة مشروع إعمار</span>
                </Link>
              )}
            </div>
          </section>

          {/* شبكة القطاعات التشغيلية الشاملة */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5" style={{ color: primaryCol }} />
                جميع القطاعات والوحدات التشغيلية
              </h3>
              <span className="text-xs text-slate-500">متابعة كافة أنشطة وفروع {companySettings.company_name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {canViewAdminDocs && (
                <Link href="/admin/documents" className="bg-[#0a0f1d] border border-slate-800 hover:border-amber-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">ديوان الشركة</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition">الإدارة والكتب الرسمية</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-amber-400">{officialDocsCount} <span className="text-[11px] font-normal text-slate-400">وثيقة</span></span>
                    <span className="text-slate-400 group-hover:text-amber-400 flex items-center gap-1 font-semibold text-[11px]">فتح السجل <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

              {canViewContracts && (
                <Link href="/real-estate/contracts" className="bg-[#0a0f1d] border border-slate-800 hover:border-indigo-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">العقود الرسمية</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-indigo-300 transition">العقود الإلكترونية المعتمدة</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-indigo-400">{electronicContractsCount} <span className="text-[11px] font-normal text-slate-400">عقد معتمد</span></span>
                    <span className="text-slate-400 group-hover:text-indigo-400 flex items-center gap-1 font-semibold text-[11px]">إدارة العقود <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

              {canViewInstallments && (
                <Link href="/inventory/installments" className="bg-[#0a0f1d] border border-slate-800 hover:border-emerald-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">البيع الآجل</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-emerald-300 transition">المبيعات بالأقساط المدمجة</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-emerald-400">{installmentsCount} <span className="text-[11px] font-normal text-slate-400">جدول تقسيط</span></span>
                    <span className="text-slate-400 group-hover:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">متابعة الأقساط <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

              {canViewProjects && (
                <Link href="/projects" className="bg-[#0a0f1d] border border-slate-800 hover:border-amber-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">قطاع الإعمار</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition">المقاولات والمشاريع الحية</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                      <HardHat className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-amber-400">{ongoingProjects.length} <span className="text-[11px] font-normal text-slate-400">مشروع جاري</span></span>
                    <span className="text-slate-400 group-hover:text-amber-400 flex items-center gap-1 font-semibold text-[11px]">نسب الإنجاز <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

              {canViewFleet && (
                <Link href="/fleet" className="bg-[#0a0f1d] border border-slate-800 hover:border-sky-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">النقل واللوجستيات</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-sky-300 transition">أسطول الآليات والشاحنات</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition">
                      <Truck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-sky-400">{dashboardData.counts.vehicles} <span className="text-[11px] font-normal text-slate-400">مركبة نشطة</span></span>
                    <span className="text-slate-400 group-hover:text-sky-400 flex items-center gap-1 font-semibold text-[11px]">الرحلات والصيانة <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

              {canViewInventory && (
                <Link href="/inventory" className="bg-[#0a0f1d] border border-slate-800 hover:border-amber-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">المخازن والتوريد</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition">التجارة العامة والمخزن المركزي</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                      <Boxes className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-amber-400">{dashboardData.counts.items} <span className="text-[11px] font-normal text-slate-400">صنف مسجل</span></span>
                    <span className="text-slate-400 group-hover:text-amber-400 flex items-center gap-1 font-semibold text-[11px]">جرد البضائع <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

              {canViewRealEstate && (
                <Link href="/real-estate" className="bg-[#0a0f1d] border border-slate-800 hover:border-purple-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">التطوير العقاري</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-purple-300 transition">العقارات والوحدات الاستثمارية</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition">
                      <Building className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-purple-400">{dashboardData.counts.units} <span className="text-[11px] font-normal text-slate-400">وحدة استثمارية</span></span>
                    <span className="text-slate-400 group-hover:text-purple-400 flex items-center gap-1 font-semibold text-[11px]">سجل الوحدات <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

              {canViewHR && (
                <Link href="/hr" className="bg-[#0a0f1d] border border-slate-800 hover:border-rose-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">الكادر الوظيفي</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-rose-300 transition">الموارد البشرية والرواتب</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-rose-400">{dashboardData.counts.employees} <span className="text-[11px] font-normal text-slate-400">موظف معتمد</span></span>
                    <span className="text-slate-400 group-hover:text-rose-400 flex items-center gap-1 font-semibold text-[11px]">مسير الرواتب <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

              {canViewBranches && (
                <Link href="/branches" className="bg-[#0a0f1d] border border-slate-800 hover:border-sky-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">المقرات والشبكة</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-sky-300 transition">الفروع والقطاعات التشغيلية</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-sky-400">{dashboardData.branches.length} <span className="text-[11px] font-normal text-slate-400">فرع متصل</span></span>
                    <span className="text-slate-400 group-hover:text-sky-400 flex items-center gap-1 font-semibold text-[11px]">خريطة الفروع <ChevronLeft className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              )}

            </div>
          </section>

          {/* جدول فروع الشركة المربوطة سحابياً */}
          {canViewBranches && (
            <section id="branches" className="bg-[#0c1220] border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl border" style={{ backgroundColor: `${primaryCol}10`, color: primaryCol, borderColor: `${primaryCol}20` }}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">فروع ومقرات الشركة المربوطة سحابياً (Neon Cloud Sync)</h3>
                    <p className="text-[11px] text-slate-400">حالة الفروع ومقرات الأنشطة التجارية لـ {companySettings.company_name}</p>
                  </div>
                </div>
                <Link href="/branches" className="text-xs hover:underline flex items-center gap-1 font-semibold" style={{ color: primaryCol }}>
                  إدارة الفروع <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                <table className="w-full text-xs text-right">
                  <thead className="bg-[#10182b] text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-3.5">رمز الفرع</th>
                      <th className="p-3.5">اسم الفرع والقطاع</th>
                      <th className="p-3.5">النشاط التجاري</th>
                      <th className="p-3.5">المقر والهاتف</th>
                      <th className="p-3.5 text-center">الحالة التشغيلية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {dashboardData.branches.map((b: any) => (
                      <tr key={b.branch_id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono font-bold" style={{ color: primaryCol }}>{b.branch_code || b.code}</td>
                        <td className="p-3.5 text-white font-bold">{b.name_ar}</td>
                        <td className="p-3.5 text-slate-300 font-mono">{b.branch_type || b.sector}</td>
                        <td className="p-3.5 text-slate-400">{b.city || b.address} ({b.phone})</td>
                        <td className="p-3.5 text-center">
                          <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> متصل ونشط
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* تحليل موقف المشاريع الإنشائية قيد التنفيذ */}
          {ongoingProjects.length > 0 && canViewProjects && (
            <section className="bg-[#0c1220] border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: primaryCol }} />
                  <h3 className="text-sm font-bold text-white">الموقف المالي للمشاريع الإنشائية قيد التنفيذ</h3>
                </div>
                <Link href="/projects" className="text-xs hover:underline font-bold flex items-center gap-1" style={{ color: primaryCol }}>
                  تفاصيل المشاريع <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {ongoingProjects.slice(0, 3).map((p) => {
                  const contract = Number(p.contract_value || 0);
                  const rate = Number(p.completion_rate || 0);
                  return (
                    <div key={p.project_id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs shadow-inner">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-white truncate">{p.project_name}</span>
                        <span className="text-[10px] font-mono font-bold bg-[#131b2e] border border-slate-800 px-2.5 py-0.5 rounded-full shrink-0" style={{ color: primaryCol }}>
                          {rate}% إنجاز
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                        <span>قيمة العقد:</span>
                        <strong className="text-white">{formatNum(contract)} د.ع</strong>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${rate}%`, backgroundColor: primaryCol }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </main>

        {/* النافذة الشاملة لمركز الرقابة والأرشفة السحابية وإقفال الفترات */}
        {showGovernanceModal && isSuperAdmin && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0c1220] border border-slate-700 w-full max-w-5xl rounded-3xl p-6 md:p-8 shadow-2xl text-right space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/40 text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">مركز الرقابة والتدقيق والحفظ الاحتياطي السحابي</h3>
                    <p className="text-xs text-slate-400">حفظ وتنزيل قواعد البيانات، رفع النسخ، وإقفال الفترات</p>
                  </div>
                </div>
                <button onClick={() => setShowGovernanceModal(false)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5"><Download className="w-4 h-4" /> النسخ الاحتياطي الفوري (Neon Cloud)</span>
                  <p className="text-slate-400 leading-relaxed">توليد ملف كامل مشفر لكافة جداول النظام لحمايتها من أي طارئ.</p>
                  <button onClick={handleDownloadBackup} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer">
                    تنزيل نسخة احتياطية (.JSON)
                  </button>
                  <div className="pt-2 border-t border-slate-900">
                    <label className="block text-slate-400 mb-1 font-semibold">استعادة ورفع نسخة احتياطية:</label>
                    <label className={`w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer ${restoringSubmitting ? 'opacity-50' : ''}`}>
                      <Upload className="w-4 h-4" /> {restoringSubmitting ? 'جاري الاستعادة...' : 'رفع واستعادة نسخة'}
                      <input type="file" accept=".json" disabled={restoringSubmitting} onChange={handleUploadBackupFile} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: primaryCol }}><Lock className="w-4 h-4" /> إقفال وتجميد الفترات المالية</span>
                  <form onSubmit={handleCloseFinancialPeriod} className="space-y-2">
                    <div>
                      <label className="block text-slate-400 mb-1">اختر الشهر:</label>
                      <input type="month" required value={periodToLock} onChange={(e) => setPeriodToLock(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">مبرر الإقفال:</label>
                      <input type="text" required value={lockNotes} onChange={(e) => setLockNotes(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white" />
                    </div>
                    <button type="submit" disabled={lockingSubmitting} className="w-full py-2.5 text-slate-950 font-bold rounded-xl transition cursor-pointer" style={{ backgroundColor: primaryCol }}>
                      {lockingSubmitting ? 'جاري الإقفال...' : 'تأكيد إقفال وتجميد الشهر'}
                    </button>
                  </form>
                </div>
              </div>

              {closedPeriods.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-300">الفترات المالية المقفلة حالياً:</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {closedPeriods.map(p => (
                      <div key={p.period_id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold font-mono" style={{ color: primaryCol }}>{p.period_month}</p>
                          <p className="text-[10px] text-slate-500">{p.closed_by}</p>
                        </div>
                        <button onClick={() => handleReopenPeriod(p.period_month)} className="p-1.5 hover:bg-rose-600 rounded-lg text-slate-400 hover:text-white cursor-pointer" title="إعادة فتح الفترة">
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5"><History className="w-4 h-4 text-sky-400" /> سجل التدقيق الرقابي للحركات (Audit Trail)</h4>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 text-[11px]">
                      <tr>
                        <th className="p-2.5">المسؤول</th>
                        <th className="p-2.5">النوع</th>
                        <th className="p-2.5">القطاع</th>
                        <th className="p-2.5">البيان</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      {auditLogs.map(l => (
                        <tr key={l.log_id} className="hover:bg-slate-900/40">
                          <td className="p-2.5 font-sans font-bold text-white">{l.user_name}</td>
                          <td className="p-2.5" style={{ color: primaryCol }}>{l.action_type}</td>
                          <td className="p-2.5 font-sans text-slate-300">{l.sector}</td>
                          <td className="p-2.5 font-sans text-slate-400">{l.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* النافذة الشاملة لإدارة المستخدمين */}
        {showManageModal && isSuperAdmin && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0c1220] border border-slate-700 w-full max-w-4xl rounded-3xl p-6 md:p-8 shadow-2xl text-right space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6" style={{ color: primaryCol }} />
                  <h3 className="text-lg font-bold text-white">إدارة الحسابات وصلاحيات الموظفين</h3>
                </div>
                <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold" style={{ color: primaryCol }}>{isEditing ? 'تعديل الحساب' : 'إنشاء حساب جديد'}</h4>
                  {formMessage && <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 font-semibold">{formMessage}</div>}
                  <form onSubmit={handleSaveUser} className="space-y-2.5">
                    <div>
                      <label className="block text-slate-400 mb-1">الاسم الكامل *</label>
                      <input type="text" required value={formFullName} onChange={(e) => setFormFullName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">اسم المستخدم *</label>
                      <input type="text" required disabled={isEditing} dir="ltr" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">{isEditing ? 'كلمة المرور الجديدة' : 'كلمة المرور *'}</label>
                      <input type="password" required={!isEditing} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">المسمى الوظيفي</label>
                      <input type="text" value={formJobTitle} onChange={(e) => setFormJobTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white" />
                    </div>
                    <button type="submit" disabled={formSubmitting} className="w-full py-2.5 text-slate-950 font-bold rounded-xl transition cursor-pointer shadow-md" style={{ backgroundColor: primaryCol }}>
                      {formSubmitting ? 'جاري الحفظ...' : isEditing ? 'تحديث البيانات' : 'تفعيل الحساب'}
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <span className="text-xs font-bold text-white">الحسابات المسجلة بالمنظومة:</span>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
                        <tr>
                          <th className="p-3">الموظف</th>
                          <th className="p-3">اسم الدخول</th>
                          <th className="p-3">الرتبة</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {usersList.map((u) => (
                          <tr key={u.user_id} className="hover:bg-slate-900/50">
                            <td className="p-3 font-bold text-white">{u.full_name}</td>
                            <td className="p-3 font-mono text-slate-400">{u.username}</td>
                            <td className="p-3">{u.is_super_admin ? 'المدير المفوض' : (u.job_title || 'موظف')}</td>
                            <td className="p-3 text-center flex items-center justify-center gap-1.5">
                              <button onClick={() => handleStartEdit(u)} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 cursor-pointer" style={{ color: primaryCol }}><Edit3 className="w-3.5 h-3.5" /></button>
                              {!u.is_super_admin && u.user_id !== currentUser?.user_id && (
                                <button onClick={() => handleDeleteUser(u)} className="p-1.5 bg-slate-900 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/30 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}