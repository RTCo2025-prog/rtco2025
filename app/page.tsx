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
  Briefcase, 
  Receipt, 
  Users, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  ArrowLeft,
  PieChart,
  Building,
  Boxes,
  Sparkles,
  ArrowUpRight,
  BellRing,
  Check,
  Coins,
  FileSpreadsheet,
  ShieldAlert,
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
  MapPin
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  
  const [showManageModal, setShowManageModal] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

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

  // تحديث الساعة والتاريخ الحي بتوقيت العراق
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

    if (!confirm('تنبيه هام: سيتم استعادة وتحديث بيانات الجداول في السيرفر بناءً على هذه النسخة. هل ترغب بالاستمرار؟')) {
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
          alert('تهانينا! تم رفع واستعادة النسخة الاحتياطية بنجاح.');
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
    resetForm();
    fetchUsers();
  };

  const handleOpenGovernanceModal = () => {
    setShowGovernanceModal(true);
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
        return { name: 'الإدارة والكتب الرسمية', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'CONTRACTS':
        return { name: 'العقود الإلكترونية الرسمية', icon: <FileCheck className="w-3.5 h-3.5" />, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'INSTALLMENTS':
        return { name: 'المبيعات بالأقساط المدمجة', icon: <CreditCard className="w-3.5 h-3.5" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'FINANCE':
      case 'VOUCHERS':
        return { name: 'الإدارة المالية والسندات', icon: <Wallet className="w-3.5 h-3.5" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'PROJECTS':
      case 'CONTRACTING':
        return { name: 'المقاولات والمشاريع', icon: <HardHat className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'INVENTORY':
        return { name: 'التجارة والمخزن المركزي', icon: <Boxes className="w-3.5 h-3.5" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'FLEET':
        return { name: 'أسطول النقل اللوجستي', icon: <Truck className="w-3.5 h-3.5" />, color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' };
      case 'HR':
        return { name: 'الموارد البشرية والرواتب', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      default:
        return { name: 'الإدارة العامة والمركزية', icon: <Building2 className="w-3.5 h-3.5" />, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

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
  const roleColor = isSuperAdmin 
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  return (
    <AuthGuard>
      <div dir="rtl" className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row font-cairo text-[14px] selection:bg-amber-500 selection:text-slate-950">
        
        {/* القائمة الجانبية العصرية (Glassmorphism Sidebar) */}
        <aside className="w-full md:w-72 bg-[#0b0f17]/90 backdrop-blur-2xl border-b md:border-b-0 md:border-l border-slate-800/60 p-6 flex flex-col justify-between shadow-2xl z-20">
          <div>
            <div className="flex items-center gap-3.5 mb-8 bg-gradient-to-r from-amber-500/10 via-[#101622] to-transparent p-3.5 rounded-2xl border border-amber-500/20 shadow-lg">
              <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-slate-950 p-1 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-md">
                <Image 
                  src="/logo.png" 
                  alt="شركة البرج المتألق" 
                  width={44} 
                  height={44} 
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-[15px] font-black text-white tracking-wide">شركة البرج المتألق</h1>
                <p className="text-[11px] text-amber-400 font-mono font-bold">Enterprise ERP • RTCO</p>
              </div>
            </div>

            <nav className="space-y-1.5 font-semibold text-[13px]">
              <Link href="/" className="flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 p-3.5 rounded-2xl border border-amber-500/30 font-bold shadow-lg shadow-amber-500/5">
                <Layers className="w-4 h-4 text-amber-400" /> لوحة التحكم المركزية
              </Link>

              {canViewAdminDocs && (
                <Link href="/admin/documents" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group border border-amber-500/10 bg-amber-500/5">
                  <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold">الإدارة والكتب الرسمية</span>
                </Link>
              )}

              {isSuperAdmin && (
                <>
                  <Link 
                    href="/admin/users"
                    className="w-full flex items-center gap-3 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 border border-emerald-500/20 bg-emerald-500/5 p-3.5 rounded-2xl transition group text-[13px] font-bold shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" /> إدارة وصلاحيات الحسابات
                  </Link>

                  <button 
                    onClick={handleOpenManageModal}
                    className="w-full flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 bg-slate-900/50 p-3.5 rounded-2xl transition group text-[13px] cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" /> قائمة الحسابات السريعة
                  </button>

                  <button 
                    onClick={handleOpenGovernanceModal}
                    className="w-full flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 bg-slate-900/50 p-3.5 rounded-2xl transition group text-[13px] cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" /> مركز الرقابة والأرشفة السحابية
                  </button>
                </>
              )}
              
              {(canViewContracts || canViewInstallments) && (
                <div className="pt-3 pb-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-3 font-bold">الأنظمة والعقود والبيع</span>
                </div>
              )}

              {canViewContracts && (
                <Link href="/real-estate/contracts" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group border border-purple-500/20 bg-purple-500/5">
                  <FileCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" /> 
                  <span className="font-semibold">العقود الإلكترونية (سيارات/دور)</span>
                </Link>
              )}

              {canViewInstallments && (
                <Link href="/inventory/installments" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group border border-emerald-500/20 bg-emerald-500/5">
                  <CreditCard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" /> 
                  <span className="font-semibold">المبيعات بالأقساط المدمجة</span>
                </Link>
              )}

              <div className="pt-3 pb-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-3 font-bold">قطاعات المنظومة</span>
              </div>

              {canViewBranches && (
                <Link href="/branches" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group">
                  <Building2 className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" /> 
                  <span>الفروع والقطاعات</span>
                </Link>
              )}

              {canViewProjects && (
                <Link href="/projects" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group">
                  <HardHat className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" /> 
                  <span>المقاولات والمشاريع</span>
                </Link>
              )}

              {canViewFleet && (
                <Link href="/fleet" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group">
                  <Truck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" /> 
                  <span>أسطول النقل اللوجستي</span>
                </Link>
              )}

              {canViewInventory && (
                <Link href="/inventory" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group">
                  <Boxes className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" /> 
                  <span>التجارة العامة والمخزن</span>
                </Link>
              )}

              {canViewRealEstate && (
                <Link href="/real-estate" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group">
                  <Building className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" /> 
                  <span>العقارات والاستثمار</span>
                </Link>
              )}

              {canViewHR && (
                <Link href="/hr" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group">
                  <Users className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" /> 
                  <span>الموارد البشرية والرواتب</span>
                </Link>
              )}

              {canViewFinancials && (
                <>
                  <div className="pt-3 pb-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-3 font-bold">المركز المالي</span>
                  </div>

                  <Link href="/vouchers" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group">
                    <Wallet className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" /> 
                    <span>السندات والقيود المحاسبية</span>
                  </Link>

                  <Link href="/finance/reports" className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-800/60 p-3.5 rounded-2xl transition group border border-sky-500/20 bg-sky-500/5">
                    <PieChart className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" /> 
                    <span>التقرير المالي وقائمة الدخل</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>قاعدة البيانات:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> متصل لايف (Neon Cloud)
            </span>
          </div>
        </aside>

        {/* المحتوى الرئيسي العصري */}
        <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto bg-gradient-to-br from-[#07090e] via-[#0b0f18] to-[#07090e]">
          
          {/* شريط معلومات الشركة والوقت التاريخ البارز والمكبر */}
          <section className="bg-gradient-to-r from-[#0f1523] via-[#131b2e] to-[#0f1523] border border-slate-800/90 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-white">المركز الرئيسي: العراق - النجف الأشرف - حي الفرات</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">شركة البرج المتألق للمقاولات العامة والتجارة والاستثمار العقاري</p>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono bg-slate-950/90 px-6 py-3.5 rounded-2xl border border-slate-800/90 shadow-inner">
              <div className="flex items-center gap-2 text-amber-400 text-lg font-black tracking-wider">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>{currentTime || '00:00:00'}</span>
              </div>
              <span className="text-slate-700 text-lg">|</span>
              <div className="flex items-center gap-2 text-sky-400 text-sm font-bold">
                <Calendar className="w-5 h-5 text-sky-400" />
                <span>{currentDate || 'جاري التحميل...'}</span>
              </div>
            </div>
          </section>

          {/* شريط الترويسة العليا (Modern Glass Header) */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0f1523]/80 border border-slate-800/80 backdrop-blur-2xl p-4 md:p-6 rounded-3xl shadow-2xl gap-4 relative z-30">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">لوحة المراقبة التشغيلية والمالية الموحدة</h2>
                <span className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/40 text-[11px] font-mono px-3 py-0.5 rounded-full font-bold shadow-sm">
                  v2.5 Live
                </span>
              </div>
              <p className="text-[13px] text-slate-400 mt-1">المتابعة اللحظية للعمليات والمشاريع، التدفق النقدي، والكتب الرسمية</p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-3 bg-[#131b2e] border border-slate-700/60 hover:border-amber-500/50 text-slate-300 hover:text-white rounded-2xl transition shadow-lg cursor-pointer group"
                  title="سجل الإشعارات المركزي"
                >
                  <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-rose-500/50">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-[#0f1523]/95 border border-slate-800 backdrop-blur-3xl rounded-3xl p-4 shadow-2xl space-y-3 z-50 text-right animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    <div className="border-b border-slate-800/80 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 relative rounded-xl overflow-hidden bg-slate-950 p-0.5 border border-amber-500/30 flex items-center justify-center shrink-0">
                            <Image 
                              src="/logo.png" 
                              alt="شركة البرج المتألق" 
                              width={28} 
                              height={28} 
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-white leading-tight">شركة البرج المتألق</h3>
                            <p className="text-[10px] text-amber-400/90 font-mono">سجل الأنشطة والإشعارات المركزي</p>
                          </div>
                        </div>

                        {unreadCount > 0 ? (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-bold bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> تم القراءة
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">الكل مقروء ✓</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 bg-[#131b2e] px-3.5 py-2 rounded-2xl border border-slate-800/80">
                        <span>إجمالي حركات المنظومة:</span>
                        <strong className="text-amber-400 font-mono">{notifications.length} إشعار</strong>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 font-cairo pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          لا توجد إشعارات مسجلة حتى الآن.
                        </div>
                      ) : (
                        notifications.map((n, i) => {
                          const badge = getSectorBadge(n.sector);
                          return (
                            <Link
                              key={n.notification_id || i}
                              href={n.link || '/'}
                              onClick={() => setShowNotifMenu(false)}
                              className={`block p-3.5 rounded-2xl transition hover:bg-slate-800/80 border ${
                                !n.is_read 
                                  ? 'bg-[#131b2e] border-amber-500/30 shadow-lg' 
                                  : 'bg-slate-950/40 border-slate-800/50 opacity-75'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                  {badge.icon} {badge.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {String(n.created_at || '').replace('T', ' ').substring(11, 16)}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {canViewFinancials && (
                <Link href="/finance/reports" className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-sky-500/5 group">
                  <PieChart className="w-4 h-4 group-hover:scale-110 transition-transform" /> التقارير وقائمة الدخل
                </Link>
              )}

              {isSuperAdmin && (
                <Link 
                  href="/admin/users" 
                  className="flex items-center gap-2 bg-[#131b2e] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-xl group"
                  title="إدارة صلاحيات الأقسام والحسابات"
                >
                  <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" /> إدارة الصلاحيات
                </Link>
              )}

              <div className="flex items-center gap-3 bg-[#131b2e]/90 border border-slate-700/60 px-3.5 py-2 rounded-2xl shadow-inner">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-800 flex items-center justify-center shrink-0">
                  {currentUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-tight">{currentUser.full_name}</p>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border inline-block mt-0.5 ${roleColor}`}>
                    {roleTitle}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition mr-1 cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* 1. شريط التنبيهات الذكي العصري */}
          {systemAlerts.length > 0 && (
            <section className="bg-gradient-to-r from-amber-500/10 via-[#0f1523] to-[#0f1523] border-r-4 border-amber-500 border border-slate-800/80 p-5 rounded-3xl space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <BellRing className="w-4 h-4 animate-bounce text-amber-400" />
                  <span>تنبيهات الإدارة والعمليات العاجلة ({systemAlerts.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">تحديث فوري من ملفات المشاريع قيد التنفيذ والكوادر النشطة</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemAlerts.slice(0, 6).map((al, idx) => (
                  <Link 
                    key={idx} 
                    href={al.link}
                    className="bg-[#131b2e]/70 border border-slate-800/80 hover:border-amber-500/50 p-3.5 rounded-2xl transition flex items-center justify-between text-xs group shadow-sm hover:shadow-md"
                  >
                    <div className="truncate pr-1">
                      <p className="font-bold text-white group-hover:text-amber-300 transition truncate">{al.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{al.desc}</p>
                    </div>
                    <span className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 2. المؤشرات المالية المتميزة (Modern Financial KPI Cards) */}
          {(isSuperAdmin || canViewFinancials) && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0f1523]/90 border border-slate-800/90 hover:border-amber-500/30 p-6 rounded-3xl relative overflow-hidden shadow-2xl transition duration-300 group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
                <span className="text-xs text-slate-400 font-semibold block">إجمالي النفقات والمصروفات</span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-2 tracking-tight group-hover:scale-[1.02] transition-transform origin-right">
                  {formatNum(financialSummary.payments)} <span className="text-xs font-sans text-slate-500">د.ع</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1.5">تكاليف ونفقات العمليات القائمة</span>
              </div>

              <div className="bg-[#0f1523]/90 border border-slate-800/90 hover:border-emerald-500/30 p-6 rounded-3xl relative overflow-hidden shadow-2xl transition duration-300 group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
                <span className="text-xs text-slate-400 font-semibold block">إجمالي المقبوضات المحصلة</span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-2 tracking-tight group-hover:scale-[1.02] transition-transform origin-right">
                  {formatNum(financialSummary.receipts)} <span className="text-xs font-sans text-slate-500">د.ع</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1.5">مقبوضات الأنشطة والمشاريع الجارية</span>
              </div>

              <div className="bg-[#0f1523]/90 border border-slate-800/90 hover:border-rose-500/30 p-6 rounded-3xl relative overflow-hidden shadow-2xl transition duration-300 group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-600"></div>
                <span className="text-xs text-slate-400 font-semibold block">كتلة الرواتب الشهرية الثابتة</span>
                <div className="text-2xl font-black font-mono text-rose-400 mt-2 tracking-tight group-hover:scale-[1.02] transition-transform origin-right">
                  {formatNum(financialSummary.totalMonthlySalaries)} <span className="text-xs font-sans text-slate-500">د.ع</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1.5">إجمالي رواتب الكوادر النشطة</span>
              </div>

              <div className="bg-[#0f1523]/90 border border-slate-800/90 hover:border-sky-500/30 p-6 rounded-3xl relative overflow-hidden shadow-2xl transition duration-300 group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-sky-600"></div>
                <span className="text-xs text-slate-400 font-semibold block">صافي رصيد الصندوق والسيولة</span>
                <div className={`text-2xl font-black font-mono mt-2 tracking-tight group-hover:scale-[1.02] transition-transform origin-right ${financialSummary.netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatNum(financialSummary.netCash)} <span className="text-xs font-sans text-slate-500">د.ع</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1.5">سيولة العمليات والمشاريع الجارية</span>
              </div>
            </section>
          )}

          {/* 3. مركز الإجراءات السريعة العصري */}
          <section className="bg-[#0f1523]/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                مركز الإجراءات السريعة (Quick Actions)
              </h3>
              <span className="text-[11px] text-slate-400">إجراءات مخصصة وفق أذونات حسابك</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
              {canAddVouchers && (
                <Link href="/vouchers" className="bg-[#131b2e] hover:bg-[#1a243c] border border-purple-500/20 hover:border-purple-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-purple-300 font-bold group text-center shadow-md">
                  <Wallet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>تسجيل سند مالي</span>
                </Link>
              )}

              {canAddAdminDocs && (
                <Link href="/admin/documents" className="bg-[#131b2e] hover:bg-[#1a243c] border border-amber-500/20 hover:border-amber-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-amber-300 font-bold group text-center shadow-md">
                  <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>كتاب رسمي (صادر/وارد)</span>
                </Link>
              )}

              {canAddContracts && (
                <Link href="/real-estate/contracts" className="bg-[#131b2e] hover:bg-[#1a243c] border border-indigo-500/20 hover:border-indigo-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-indigo-300 font-bold group text-center shadow-md">
                  <FileCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>عقد بيع (سيارة/دار)</span>
                </Link>
              )}

              {canAddInstallments && (
                <Link href="/inventory/installments" className="bg-[#131b2e] hover:bg-[#1a243c] border border-emerald-500/20 hover:border-emerald-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-emerald-300 font-bold group text-center shadow-md">
                  <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>عقد بيع بالتقسيط</span>
                </Link>
              )}

              {canAddHR && (
                <Link href="/hr" className="bg-[#131b2e] hover:bg-[#1a243c] border border-rose-500/20 hover:border-rose-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-rose-300 font-bold group text-center shadow-md">
                  <Coins className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>قيد سلفة موظف</span>
                </Link>
              )}

              {canAddProjects && (
                <Link href="/projects" className="bg-[#131b2e] hover:bg-[#1a243c] border border-sky-500/20 hover:border-sky-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-sky-300 font-bold group text-center shadow-md">
                  <HardHat className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>إضافة مشروع</span>
                </Link>
              )}
            </div>
          </section>

          {/* 4. شبكة الكروت التشغيلية الفاخرة لجميع القطاعات (Modern Grid Cards) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {canViewAdminDocs && (
              <Link href="/admin/documents" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-amber-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition">الإدارة والكتب الرسمية</span>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-white font-mono tracking-tight">{officialDocsCount} <span className="text-xs font-sans text-slate-400 font-normal">مخاطبات</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-amber-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>الصادرة، الواردة، والأوامر الإدارية A4</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {canViewContracts && (
              <Link href="/real-estate/contracts" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-indigo-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-300 transition">العقود الإلكترونية الرسمية</span>
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <FileCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-indigo-400 font-mono tracking-tight">{electronicContractsCount} <span className="text-xs font-sans text-slate-400 font-normal">عقود معتمدة</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-indigo-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>بيع وشراء (سيارات، دور، دراجات)</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {canViewInstallments && (
              <Link href="/inventory/installments" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-emerald-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-300 transition">المبيعات بالأقساط المدمجة</span>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-emerald-400 font-mono tracking-tight">{installmentsCount} <span className="text-xs font-sans text-slate-400 font-normal">عقود تقسيط</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-emerald-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>جدولة مدمجة للعملاء والتجار والتراجع</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {canViewBranches && (
              <Link href="/branches" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-sky-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-sky-300 transition">الفروع والقطاعات</span>
                  <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-white font-mono tracking-tight">{dashboardData.branches.length} <span className="text-xs font-sans text-slate-400 font-normal">فروع</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-sky-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>نشطة ومربوطة سحابياً</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {canViewProjects && (
              <Link href="/projects" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-amber-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition">مشاريع المقاولات الجارية</span>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <HardHat className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-amber-400 font-mono tracking-tight">{ongoingProjects.length} <span className="text-xs font-sans text-slate-400 font-normal">مشاريع جارية</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-amber-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>المستخلصات ونسب الإنجاز الحية</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {canViewFleet && (
              <Link href="/fleet" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-emerald-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-300 transition">أسطول النقل العام واللوجستيات</span>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-emerald-400 font-mono tracking-tight">{dashboardData.counts.vehicles} <span className="text-xs font-sans text-slate-400 font-normal">آليات</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-emerald-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>الرحلات والصيانة اللحظية</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {canViewInventory && (
              <Link href="/inventory" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-amber-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition">التجارة العامة والمخزن المركزي</span>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <Boxes className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-white font-mono tracking-tight">{dashboardData.counts.items} <span className="text-xs font-sans text-slate-400 font-normal">أصناف مسجلة</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-amber-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>إدارة التوريدات والبيع التجاري</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {canViewRealEstate && (
              <Link href="/real-estate" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-purple-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-purple-300 transition">العقارات والوحدات الاستثمارية</span>
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <Building className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-purple-400 font-mono tracking-tight">{dashboardData.counts.units} <span className="text-xs font-sans text-slate-400 font-normal">وحدات</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-purple-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>عقود البيع وجداول الأقساط</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

            {canViewHR && (
              <Link href="/hr" className="bg-gradient-to-b from-[#0f1523] to-[#0b0f17] border border-slate-800/90 hover:border-rose-500/50 p-6 rounded-3xl transition duration-300 group relative overflow-hidden shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-rose-300 transition">الموارد البشرية والرواتب</span>
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 group-hover:scale-110 transition-transform shadow-md">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-3xl font-black text-rose-400 font-mono tracking-tight">{dashboardData.counts.employees} <span className="text-xs font-sans text-slate-400 font-normal">كوادر</span></div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-rose-400 font-medium pt-3.5 border-t border-slate-800/80">
                  <span>مسير الرواتب والسلف الآلية</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            )}

          </section>

          {/* 5. تحليل موقف المشاريع قيد التنفيذ */}
          {ongoingProjects.length > 0 && canViewProjects && (
            <section className="bg-[#0f1523]/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <HardHat className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">الموقف المالي للمشاريع الإنشائية قيد التنفيذ</h3>
                    <p className="text-[11px] text-slate-400">مقارنة المقبوض الفعلي من العملاء مقابل النفقات الحقيقية للمشاريع الجارية</p>
                  </div>
                </div>
                <Link href="/projects" className="text-xs text-amber-400 hover:text-amber-300 font-bold transition flex items-center gap-1">
                  تفاصيل المشاريع <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ongoingProjects.slice(0, 3).map((p) => {
                  const contract = Number(p.contract_value || 0);
                  const rate = Number(p.completion_rate || 0);
                  return (
                    <div key={p.project_id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3 text-xs shadow-inner">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white truncate max-w-[170px]">{p.project_name}</span>
                        <span className="text-[10px] font-mono font-bold bg-[#131b2e] border border-slate-800 px-2.5 py-0.5 rounded-full text-amber-400">
                          {rate}% إنجاز
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                        <span>قيمة العقد:</span>
                        <strong className="text-white">{formatNum(contract)} د.ع</strong>
                      </div>

                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500 rounded-full" style={{ width: `${rate}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 6. جدول فروع الشركة المربوطة سحابياً */}
          {canViewBranches && (
            <section id="branches" className="bg-[#0f1523]/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="bg-amber-500/10 p-2.5 rounded-2xl text-amber-400 border border-amber-500/20 shadow-inner">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">فروع الشركة المربوطة سحابياً (Neon Cloud Live Sync)</h3>
                    <p className="text-[11px] text-slate-400">حالة الفروع ومقرات الأنشطة التجارية لشركة البرج المتألق</p>
                  </div>
                </div>
                <Link href="/branches" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold transition">
                  إدارة الفروع <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                <table className="w-full text-xs text-right">
                  <thead className="bg-[#131b2e] text-slate-400 border-b border-slate-800 text-[11px]">
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
                        <td className="p-3.5 font-mono text-amber-400 font-bold">{b.branch_code || b.code}</td>
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

        </main>

        {/* النافذة الشاملة لمركز الرقابة والأرشفة السحابية وإقفال الفترات */}
        {showGovernanceModal && isSuperAdmin && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0f1523] border border-slate-700/80 w-full max-w-5xl rounded-3xl p-6 md:p-8 shadow-2xl text-right space-y-6 my-8">
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/40 text-emerald-400 shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      مركز الرقابة والتدقيق والحفظ الاحتياطي السحابي
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      حفظ وتنزيل قواعد البيانات، رفع واستعادة النسخ الاحتياطية، وسجل تدقيق الحركات
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGovernanceModal(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Download className="w-4 h-4" />
                    <span>النسخ الاحتياطي الفوري الشامل (Neon Cloud Backup)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    توليد وتنزيل ملف مشفر ومنظم بصيغة JSON يشمل كافة جداول النظام لحمايتها من أي طارئ.
                  </p>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> تنزيل نسخة احتياطية كاملة الآن (.JSON)
                  </button>

                  <div className="pt-2 border-t border-slate-900">
                    <label className="block text-slate-400 mb-1.5 text-xs font-semibold">استعادة ورفع نسخة احتياطية (.JSON):</label>
                    <label className={`w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${restoringSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className="w-4 h-4" /> {restoringSubmitting ? 'جاري الاستعادة ورفع البيانات...' : 'رفع واستعادة نسخة احتياطية'}
                      <input type="file" accept=".json" disabled={restoringSubmitting} onChange={handleUploadBackupFile} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Lock className="w-4 h-4" />
                    <span>إقفال وتجميد الفترات والشهور المالية</span>
                  </div>
                  <form onSubmit={handleCloseFinancialPeriod} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">اختر الشهر للإقفال:</label>
                        <input
                          type="month"
                          required
                          value={periodToLock}
                          onChange={(e) => setPeriodToLock(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">بيان ومبرر الإقفال:</label>
                        <input
                          type="text"
                          required
                          placeholder="مطابقة الصندوق"
                          value={lockNotes}
                          onChange={(e) => setLockNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={lockingSubmitting}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition text-xs shadow-lg shadow-amber-500/20 mt-1 cursor-pointer"
                    >
                      {lockingSubmitting ? 'جاري الإقفال...' : `تأكيد إقفال وتجميد شهر (${periodToLock})`}
                    </button>
                  </form>
                </div>
              </div>

              {closedPeriods.length > 0 && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-400" /> قائمة الفترات المالية المقفلة حالياً
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {closedPeriods.map(p => (
                      <div key={p.period_id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold font-mono text-amber-400">شهر: {p.period_month}</p>
                          <p className="text-[10px] text-slate-400">{p.closed_by} • {p.closure_notes}</p>
                        </div>
                        <button
                          onClick={() => handleReopenPeriod(p.period_month)}
                          className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                          title="إعادة فتح الفترة المالية"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-sky-400" />
                    سجل التدقيق الرقابي للحركات والعمليات الإدارية (Audit Trail)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">سجل أمني غير قابل للحذف</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                  <div className="overflow-x-auto max-h-[320px]">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
                        <tr>
                          <th className="p-3.5">المستخدم / المسؤول</th>
                          <th className="p-3.5">نوع الحدث</th>
                          <th className="p-3.5">القطاع</th>
                          <th className="p-3.5">البيان الرقابي للعملية</th>
                          <th className="p-3.5 text-center">التاريخ والتوقيت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono text-[12px]">
                        {loadingGovernance ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-sans">جاري تحميل سجل التدقيق...</td></tr>
                        ) : auditLogs.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-sans">لا توجد حركات مسجلة في سجل الرقابة حتى الآن.</td></tr>
                        ) : (
                          auditLogs.map(l => (
                            <tr key={l.log_id} className="hover:bg-slate-900/60 transition">
                              <td className="p-3.5 font-bold font-sans text-white">{l.user_name} ({l.user_role})</td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                                  l.action_type === 'LOCK' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                  l.action_type === 'UNLOCK' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                  'bg-sky-500/20 text-sky-400 border-sky-500/30'
                                }`}>
                                  {l.action_type}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-300 font-sans">{l.sector}</td>
                              <td className="p-3.5 text-slate-200 font-sans">{l.description}</td>
                              <td className="p-3.5 text-center text-slate-500 text-[11px]">
                                {String(l.created_at || '').replace('T', ' ').slice(0, 16)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* النافذة الشاملة لإدارة المستخدمين */}
        {showManageModal && isSuperAdmin && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0f1523] border border-slate-700/80 w-full max-w-5xl rounded-3xl p-6 md:p-8 shadow-2xl text-right space-y-6 my-8">
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-amber-400" />
                    مركز إدارة المستخدمين وصلاحيات الموظفين
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    إنشاء حسابات جديدة، تعديل الرتب، تغيير كلمات المرور، وإدارة الوصول
                  </p>
                </div>
                <button 
                  onClick={() => setShowManageModal(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      {isEditing ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {isEditing ? 'تعديل بيانات المستخدم' : 'إنشاء حساب موظف جديد'}
                    </h4>
                    {isEditing && (
                      <button
                        onClick={resetForm}
                        className="text-[10px] text-slate-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </div>

                  {formMessage && (
                    <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                      {formMessage}
                    </div>
                  )}

                  <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">الاسم الكامل *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: م. علي مهدي"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">اسم المستخدم (Username) *</label>
                      <input
                        type="text"
                        required
                        disabled={isEditing}
                        dir="ltr"
                        placeholder="ali_site"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono outline-none ${isEditing ? 'opacity-50 cursor-not-allowed' : 'focus:border-amber-500'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">
                        {isEditing ? 'كلمة المرور الجديدة (اتركها فارغة إذا لم ترد التغيير)' : 'كلمة المرور *'}
                      </label>
                      <input
                        type="password"
                        required={!isEditing}
                        placeholder="••••••••"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">المسمى الوظيفي</label>
                      <input
                        type="text"
                        placeholder="مهندس موقع، محاسب..."
                        value={formJobTitle}
                        onChange={(e) => setFormJobTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    {isEditing && (
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">حالة الحساب</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none"
                        >
                          <option value="ACTIVE">نشط (ACTIVE)</option>
                          <option value="SUSPENDED">معطل (SUSPENDED)</option>
                        </select>
                      </div>
                    )}

                    <div className="pt-1">
                      <Link
                        href="/admin/users"
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> لتحديد أذونات الأقسام التفصيلية (اضغط هنا)
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition text-xs shadow-lg shadow-amber-500/20 mt-2 cursor-pointer"
                    >
                      {formSubmitting ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إنشاء وتفعيل الحساب'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      قائمة الحسابات النشطة بالمنظومة ({usersList.length})
                    </h4>
                    <span className="text-[10px] text-slate-400">يمكنك تعديل أي حساب أو حذفه مباشرة</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                    <div className="overflow-x-auto max-h-[420px]">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
                          <tr>
                            <th className="p-3.5">المستخدم</th>
                            <th className="p-3.5">اسم الدخول</th>
                            <th className="p-3.5">المسمى الوظيفي</th>
                            <th className="p-3.5 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {loadingUsers ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500">جاري تحميل بيانات الموظفين...</td>
                            </tr>
                          ) : usersList.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500">لا يوجد مستخدمين مسجلين.</td>
                            </tr>
                          ) : (
                            usersList.map((u) => {
                              const isMe = u.user_id === currentUser?.user_id;

                              return (
                                <tr key={u.user_id} className="hover:bg-slate-900/60 transition">
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-slate-400" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-white flex items-center gap-1.5">
                                          {u.full_name}
                                          {isMe && (
                                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">أنت</span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3.5 font-mono text-slate-300 text-[11px]">{u.username}</td>
                                  <td className="p-3.5">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border inline-block ${
                                      u.is_super_admin 
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}>
                                      {u.is_super_admin ? 'المدير المفوض' : (u.job_title || 'موظف')}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleStartEdit(u)}
                                        className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl border border-slate-700 transition cursor-pointer"
                                        title="تعديل البيانات أو كلمة المرور"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      {!isMe && !u.is_super_admin && (
                                        <button
                                          onClick={() => handleDeleteUser(u)}
                                          className="p-2 bg-slate-900 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/30 transition cursor-pointer"
                                          title="حذف الحساب"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
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