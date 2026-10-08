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
  X, 
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
  Settings,
  ArrowDownLeft,
  CircleDot
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';
import { useBranch } from '@/context/BranchContext';

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

  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-amber-500/30 bg-gradient-to-br from-slate-950 via-[#0a0f1d] to-slate-950 p-2 shadow-2xl flex items-center justify-center shrink-0">
      <span className="absolute top-1 text-[9px] font-mono font-bold text-amber-400/90">12</span>
      <span className="absolute bottom-1 text-[9px] font-mono font-bold text-slate-500">6</span>
      <span className="absolute right-1.5 text-[9px] font-mono font-bold text-slate-500">3</span>
      <span className="absolute left-1.5 text-[9px] font-mono font-bold text-slate-500">9</span>

      <div
        className="absolute w-1 bg-amber-400 rounded-full origin-bottom"
        style={{
          height: '22px',
          bottom: '50%',
          transform: `rotate(${hourAngle}deg)`,
          transformOrigin: '50% 100%',
          transition: 'transform 0.2s cubic-bezier(0.4, 2, 0.55, 0.44)'
        }}
      />
      <div
        className="absolute w-0.5 bg-sky-300 rounded-full origin-bottom"
        style={{
          height: '30px',
          bottom: '50%',
          transform: `rotate(${minAngle}deg)`,
          transformOrigin: '50% 100%',
          transition: 'transform 0.2s cubic-bezier(0.4, 2, 0.55, 0.44)'
        }}
      />
      <div
        className="absolute w-[1.5px] bg-rose-500 rounded-full origin-bottom"
        style={{
          height: '36px',
          bottom: '50%',
          transform: `rotate(${secAngle}deg)`,
          transformOrigin: '50% 100%'
        }}
      />
      <div className="w-2 h-2 rounded-full bg-amber-400 border border-slate-950 z-10 shadow-sm" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { selectedBranchId, branches } = useBranch();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    tagline: 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    phone_primary: '07868006699',
    phone_secondary: '07737006699',
    email: '',
    website: '',
    address: 'العراق - النجف الأشرف - حي الفرات - شارع الجنسية',
    logo_url: '',
    letterhead_url: '',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

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

  const [allElectronicContracts, setAllElectronicContracts] = useState<any[]>([]);
  const [allInstallments, setAllInstallments] = useState<any[]>([]);
  const [allOfficialDocs, setAllOfficialDocs] = useState<any[]>([]);

  const isInitialLoadRef = useRef(false);

  const currentActiveBranchName = useMemo(() => {
    if (!selectedBranchId || selectedBranchId === 'ALL') {
      return 'المقر الرئيسي (عرض المنظومة الموحدة)';
    }
    const found = (branches || []).find((b: any) => String(b.branch_id).trim() === String(selectedBranchId).trim());
    return found?.name_ar || `فرع ${selectedBranchId}`;
  }, [selectedBranchId, branches]);

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
      // كتم الأخطاء المؤقتة للشبكة
    }
  };

  useEffect(() => {
    loadSettings();

    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true }));
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
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch {
      // كتم التنبيه
    }
  };

  const fetchGovernanceData = async () => {
    setLoadingGovernance(true);
    try {
      const res = await fetch('/api/admin/system');
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

  const fetchData = async () => {
    try {
      const bParam = selectedBranchId && selectedBranchId !== 'ALL' ? `?branch_id=${encodeURIComponent(selectedBranchId)}` : '';

      const [resB, resP, resF, resU, resI, resH, resV, resContracts, resInst, resDocs] = await Promise.all([
        fetch('/api/branches').then(r => r.ok ? r.json() : { branches: [] }).catch(() => ({ branches: [] })),
        fetch(`/api/projects${bParam}`).then(r => r.ok ? r.json() : { projects: [] }).catch(() => ({ projects: [] })),
        fetch(`/api/fleet${bParam}`).then(r => r.ok ? r.json() : { vehicles: [] }).catch(() => ({ vehicles: [] })),
        fetch(`/api/real-estate${bParam}`).then(r => r.ok ? r.json() : { units: [] }).catch(() => ({ units: [] })),
        fetch(`/api/inventory${bParam}`).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
        fetch(`/api/hr${bParam}`).then(r => r.ok ? r.json() : { employees: [] }).catch(() => ({ employees: [] })),
        fetch(`/api/vouchers${bParam}`).then(r => r.ok ? r.json() : { vouchers: [] }).catch(() => ({ vouchers: [] })),
        fetch(`/api/admin/system?action=GET_CONTRACTS`).then(r => r.ok ? r.json() : { contracts: [] }).catch(() => ({ contracts: [] })),
        fetch(`/api/admin/system?action=GET_INSTALLMENTS`).then(r => r.ok ? r.json() : { installments: [] }).catch(() => ({ installments: [] })),
        fetch(`/api/admin/system?action=GET_OFFICIAL_DOCS`).then(r => r.ok ? r.json() : { documents: [] }).catch(() => ({ documents: [] }))
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

      let localContracts = [];
      try {
        const storedC = localStorage.getItem('rtco_electronic_contracts');
        if (storedC) localContracts = JSON.parse(storedC);
      } catch {}
      const finalContracts = resContracts.contracts && resContracts.contracts.length > 0 ? resContracts.contracts : localContracts;
      setAllElectronicContracts(finalContracts);

      let localInst = [];
      try {
        const storedI = localStorage.getItem('rtco_inventory_installments');
        if (storedI) localInst = JSON.parse(storedI);
      } catch {}
      const finalInst = resInst.installments && resInst.installments.length > 0 ? resInst.installments : localInst;
      setAllInstallments(finalInst);

      let localDocs = [];
      try {
        const storedD = localStorage.getItem('rtco_official_documents');
        if (storedD) localDocs = JSON.parse(storedD);
      } catch {}
      const finalDocs = resDocs.documents && resDocs.documents.length > 0 ? resDocs.documents : localDocs;
      setAllOfficialDocs(finalDocs);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch {}
    }

    if (!isInitialLoadRef.current) {
      isInitialLoadRef.current = true;
      fetchData();
      fetchNotifications();
    }

    // فحص دوري كل 30 ثانية لتجنب الضغط على السيرفر
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      fetchData();
    }
  }, [selectedBranchId]);

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
      if (isCompleted) return false;
      if (selectedBranchId && selectedBranchId !== 'ALL') {
        return String(p.branch_id || '').trim() === String(selectedBranchId).trim();
      }
      return true;
    });
  }, [dashboardData.projects, selectedBranchId]);

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

      if (selectedBranchId && selectedBranchId !== 'ALL') {
        const vBranch = String(v.branch_id || '').trim();
        if (vBranch && vBranch !== String(selectedBranchId).trim()) return;
      }

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

    const targetEmployees = dashboardData.employees.filter((e) => {
      if (e.status !== 'ACTIVE') return false;
      if (selectedBranchId && selectedBranchId !== 'ALL') {
        return String(e.branch_id || '').trim() === String(selectedBranchId).trim();
      }
      return true;
    });

    const totalMonthlySalaries = targetEmployees.reduce(
      (acc, e) => acc + (Number(e.base_salary || 0) + Number(e.allowances || 0)), 
      0
    );

    const netCash = receipts - (payments + totalMonthlySalaries);

    return { receipts, payments, netCash, totalMonthlySalaries };
  }, [dashboardData.vouchers, dashboardData.employees, completedProjectsMap, selectedBranchId]);

  const timelineData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; receipts: number; expenses: number; payroll: number; net: number }> = {};

    dashboardData.vouchers.forEach((v) => {
      if (v.status === 'VOID' || v.status === 'CANCELLED') return;
      if (selectedBranchId && selectedBranchId !== 'ALL') {
        const vBranch = String(v.branch_id || '').trim();
        if (vBranch && vBranch !== String(selectedBranchId).trim()) return;
      }

      const dateStr = v.issue_date || v.created_at;
      if (!dateStr) return;
      const m = String(dateStr).substring(0, 7);

      if (!monthlyMap[m]) {
        monthlyMap[m] = { month: m, receipts: 0, expenses: 0, payroll: 0, net: 0 };
      }

      const amt = Number(v.total_amount || v.amount || 0);
      if (v.voucher_type === 'RECEIPT') {
        monthlyMap[m].receipts += amt;
      } else if (v.voucher_type === 'PAYMENT') {
        monthlyMap[m].expenses += amt;
      }
    });

    const targetEmployees = dashboardData.employees.filter((e) => {
      if (e.status !== 'ACTIVE') return false;
      if (selectedBranchId && selectedBranchId !== 'ALL') {
        return String(e.branch_id || '').trim() === String(selectedBranchId).trim();
      }
      return true;
    });

    const currentSal = targetEmployees.reduce(
      (acc, e) => acc + (Number(e.base_salary || 0) + Number(e.allowances || 0)),
      0
    );

    const currentMonthKey = new Date().toISOString().substring(0, 7);
    if (!monthlyMap[currentMonthKey]) {
      monthlyMap[currentMonthKey] = { month: currentMonthKey, receipts: 0, expenses: 0, payroll: 0, net: 0 };
    }
    monthlyMap[currentMonthKey].payroll += currentSal;

    return Object.keys(monthlyMap)
      .sort()
      .map((k) => {
        const item = monthlyMap[k];
        item.net = item.receipts - (item.expenses + item.payroll);
        return item;
      });
  }, [dashboardData.vouchers, dashboardData.employees, selectedBranchId]);

  const filteredCounts = useMemo(() => {
    let contracts = allElectronicContracts;
    let installments = allInstallments;
    let docs = allOfficialDocs;

    if (selectedBranchId && selectedBranchId !== 'ALL') {
      const activeBId = String(selectedBranchId).trim();
      const activeBName = currentActiveBranchName.trim();

      contracts = contracts.filter((c: any) => {
        const bId = String(c.branch_id || '').trim();
        const bName = String(c.branch_name || '').trim();
        return bId === activeBId || bName.includes(activeBName) || bName.includes(activeBId);
      });

      installments = installments.filter((i: any) => {
        const bId = String(i.branch_id || '').trim();
        const bName = String(i.branch_name || '').trim();
        return bId === activeBId || bName.includes(activeBName) || bName.includes(activeBId);
      });

      docs = docs.filter((d: any) => {
        const bId = String(d.branch_id || '').trim();
        const bName = String(d.branch_name || '').trim();
        return bId === activeBId || bName.includes(activeBName) || bName.includes(activeBId);
      });
    }

    return {
      contracts: contracts.length,
      installments: installments.length,
      docs: docs.length
    };
  }, [allElectronicContracts, allInstallments, allOfficialDocs, selectedBranchId, currentActiveBranchName]);

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
        if (selectedBranchId && selectedBranchId !== 'ALL') {
          if (String(emp.branch_id || '').trim() !== String(selectedBranchId).trim()) return;
        }
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
  }, [ongoingProjects, dashboardData.employees, selectedBranchId]);

  const primaryCol = companySettings.primary_color || '#d97706';

  const chartHeight = 220;
  const chartWidth = 720;
  const maxVal = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return 1000000;
    return Math.max(
      ...timelineData.map((t) => Math.max(t.receipts, t.expenses + t.payroll, Math.abs(t.net))),
      1000000
    );
  }, [timelineData]);

  const pointsReceipts = useMemo(() => {
    return timelineData.map((t, idx) => {
      const x = timelineData.length > 1 ? (idx / (timelineData.length - 1)) * (chartWidth - 50) + 25 : chartWidth / 2;
      const y = chartHeight - (t.receipts / maxVal) * (chartHeight - 50) - 25;
      return `${x},${y}`;
    }).join(' ');
  }, [timelineData, maxVal]);

  const pointsExpenses = useMemo(() => {
    return timelineData.map((t, idx) => {
      const x = timelineData.length > 1 ? (idx / (timelineData.length - 1)) * (chartWidth - 50) + 25 : chartWidth / 2;
      const y = chartHeight - ((t.expenses + t.payroll) / maxVal) * (chartHeight - 50) - 25;
      return `${x},${y}`;
    }).join(' ');
  }, [timelineData, maxVal]);

  const pointsNet = useMemo(() => {
    return timelineData.map((t, idx) => {
      const x = timelineData.length > 1 ? (idx / (timelineData.length - 1)) * (chartWidth - 50) + 25 : chartWidth / 2;
      const y = chartHeight - ((Math.max(0, t.net)) / maxVal) * (chartHeight - 50) - 25;
      return `${x},${y}`;
    }).join(' ');
  }, [timelineData, maxVal]);

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

  return (
    <AuthGuard>
      <div dir="rtl" className="min-h-screen bg-[#070b14] text-slate-100 font-cairo text-[14px] selection:bg-amber-500 selection:text-slate-950">
        
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-7">
          
          {/* 1. لوحة القيادة العليا (Executive Command Center) */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0c1322] via-[#090d18] to-[#060911] p-6 md:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              
              {/* بيانات المنشأة ونطاق التغطية */}
              <div className="space-y-2 text-right w-full lg:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                    <CircleDot className="w-3 h-3 animate-ping" />
                    NEON CLOUD CONNECTED
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold">
                    نطاق العمل الحالي: {currentActiveBranchName}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide">
                  {companySettings.company_name}
                </h1>
                <p className="text-xs md:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
                  {companySettings.tagline}
                </p>
                <div className="flex items-center gap-2 text-[11px] md:text-xs text-slate-400 font-mono pt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{companySettings.address}</span>
                </div>
              </div>

              {/* برج المراقبة الزمني التفاعلي */}
              <div className="flex items-center justify-between lg:justify-end gap-5 w-full lg:w-auto bg-slate-950/80 backdrop-blur-xl px-5 py-4 rounded-3xl border border-slate-800 shadow-2xl">
                <AnalogClock />
                <div className="flex flex-col text-right font-mono space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">التوقيت الحي (العراق)</span>
                  <div className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-wider text-amber-400">
                    <Clock className="w-5 h-5 animate-pulse text-amber-400" />
                    <span>{currentTime || '00:00'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sky-400 text-xs font-bold font-sans">
                    <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{currentDate || 'جاري المزامنة...'}</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* 2. المؤشرات المالية الذكية (Financial Vitals) */}
          {(isSuperAdmin || canViewFinancials) && (
            <section className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">المؤشرات النقدية والمصرفية</span>
                  <p className="text-[11px] text-slate-500">متابعة دقيقة ومحدثة تلقائياً بناءً على: {currentActiveBranchName}</p>
                </div>
                <span className="text-xs text-amber-400 font-bold font-mono">محدث لحظياً</span>
              </div>

              {/* بطاقات الإحصائيات الأربعة الشاملة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* المقبوضات المحصلة */}
                <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#0a171d] to-[#070e13] p-5 shadow-xl group hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">إجمالي المقبوضات المحصلة</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl md:text-2xl font-black font-mono text-emerald-400 mt-3 truncate">
                    {formatNum(financialSummary.receipts)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">إجمالي الإيرادات وسندات القبض المعتمدة</p>
                </div>

                {/* المصروفات والنفقات */}
                <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-[#18120c] to-[#0e0c09] p-5 shadow-xl group hover:border-amber-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">إجمالي المصروفات والنفقات</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl md:text-2xl font-black font-mono text-amber-400 mt-3 truncate">
                    {formatNum(financialSummary.payments)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">كافة النفقات التشغيلية وسندات الصرف</p>
                </div>

                {/* كتلة الرواتب */}
                <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-b from-[#190c12] to-[#10070c] p-5 shadow-xl group hover:border-rose-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">كتلة الرواتب الثابتة</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl md:text-2xl font-black font-mono text-rose-400 mt-3 truncate">
                    {formatNum(financialSummary.totalMonthlySalaries)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">مستحقات كوادر الفرع النشطة</p>
                </div>

                {/* صافي السيولة المتاحة */}
                <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-b from-[#0c1422] to-[#070d18] p-5 shadow-xl group hover:border-sky-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">صافي السيولة النقدية المتاحة</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className={`text-xl md:text-2xl font-black font-mono mt-3 truncate ${financialSummary.netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatNum(financialSummary.netCash)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">الرصيد الفعلي المتوفر بالخزينة (المقبوضات - النفقات والرواتب)</p>
                </div>

              </div>

              {/* المخطط البياني الخطي الزمني المتكامل على مدى الوقت */}
              <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      المخطط البياني الخطي لحركة التدفقات والسيولة على مدى الوقت ({currentActiveBranchName})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      مقارنة تراكمية للمقبوضات مقابل المصروفات والرواتب وصافي السيولة شهراً بشهر من تاريخ انطلاق الفرع ولغاية الآن
                    </p>
                  </div>

                  {/* مفتاح الألوان (Legend) */}
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                      <span className="text-slate-300 font-semibold">المقبوضات</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm"></span>
                      <span className="text-slate-300 font-semibold">المصروفات والرواتب</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-sky-400 inline-block shadow-sm"></span>
                      <span className="text-slate-300 font-semibold">صافي السيولة</span>
                    </div>
                  </div>
                </div>

                {/* رسم المخطط الخطي بصيغة SVG نقي بدون مكاتب خارجية */}
                <div className="w-full overflow-x-auto mt-4">
                  {timelineData.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      لا توجد بيانات مالية مسجلة حتى الآن لهذا الفرع لتوليد المخطط البياني.
                    </div>
                  ) : (
                    <div className="min-w-[650px] relative">
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 overflow-visible">
                        {/* خطوط الشبكة الأفقية الخلفية */}
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                          const y = chartHeight - p * (chartHeight - 50) - 25;
                          return (
                            <line
                              key={i}
                              x1="25"
                              y1={y}
                              x2={chartWidth - 25}
                              y2={y}
                              stroke="#1e293b"
                              strokeDasharray="4 4"
                            />
                          );
                        })}

                        {/* خط المقبوضات (أخضر) */}
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointsReceipts}
                        />

                        {/* خط المصروفات والرواتب (أحمر) */}
                        <polyline
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointsExpenses}
                        />

                        {/* خط صافي السيولة المتاحة (أزرق سماوي) */}
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointsNet}
                        />

                        {/* نقاط البيانات التفاعلية على المنحنى */}
                        {timelineData.map((t, idx) => {
                          const x = timelineData.length > 1 ? (idx / (timelineData.length - 1)) * (chartWidth - 50) + 25 : chartWidth / 2;
                          const yR = chartHeight - (t.receipts / maxVal) * (chartHeight - 50) - 25;
                          const yE = chartHeight - ((t.expenses + t.payroll) / maxVal) * (chartHeight - 50) - 25;
                          const yN = chartHeight - ((Math.max(0, t.net)) / maxVal) * (chartHeight - 50) - 25;

                          return (
                            <g key={idx}>
                              <circle cx={x} cy={yR} r="4" fill="#10b981" className="hover:r-6 transition-all" />
                              <circle cx={x} cy={yE} r="4" fill="#f43f5e" className="hover:r-6 transition-all" />
                              <circle cx={x} cy={yN} r="4.5" fill="#38bdf8" className="hover:r-6 transition-all" />
                            </g>
                          );
                        })}
                      </svg>

                      {/* شريط الشهور الزمني أسفل المخطط */}
                      <div className="flex justify-between items-center px-4 mt-2 text-[11px] text-slate-400 font-mono">
                        {timelineData.map((t, i) => (
                          <span key={i}>{t.month}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 3. تنبيهات العمليات الحرجة (Critical Alerts) */}
          {systemAlerts.length > 0 && (
            <section className="rounded-3xl border-r-4 border border-slate-800 bg-gradient-to-r from-amber-500/10 via-[#0a0f1d] to-[#0a0f1d] p-5 shadow-xl space-y-3" style={{ borderRightColor: primaryCol }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-2" style={{ color: primaryCol }}>
                  <BellRing className="w-4 h-4 animate-bounce" />
                  <span>تنبيهات ومستحقات العمليات العاجلة ({systemAlerts.length})</span>
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">نظام التتبع المالي والميداني</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemAlerts.slice(0, 3).map((al, idx) => (
                  <Link key={idx} href={al.link} className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 p-3.5 rounded-2xl transition flex items-center justify-between text-xs group">
                    <div className="truncate pr-1">
                      <p className="font-bold text-white group-hover:text-amber-300 transition truncate">{al.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{al.desc}</p>
                    </div>
                    <span className="p-2 rounded-xl bg-slate-900 text-slate-400 group-hover:text-amber-400 shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 4. لوحة الإدارة السيادية العليا (Executive Governance) */}
          {isSuperAdmin && (
            <section className="rounded-3xl border border-slate-800 bg-[#0a0f1d] p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  أدوات القيادة والرقابة السيادية (Executive Governance)
                </h3>
                <span className="text-[11px] text-emerald-400 font-bold font-mono">AUTHORIZED ONLY</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
                <Link
                  href="/admin/settings"
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-amber-400">إعدادات الشركة والترويسة</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">الهوية والطباعة</p>
                  </div>
                </Link>

                <Link
                  href="/admin/users"
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-purple-400">إدارة الصلاحيات</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">أذونات الكوادر</p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleOpenManageModal}
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-amber-400">قائمة الحسابات السريعة</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">المستخدمين</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenGovernanceModal}
                  className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-sky-400">مركز الرقابة والأرشفة</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">التدقيق والنسخ</p>
                  </div>
                </button>

                <Link
                  href="/finance/reports"
                  className="col-span-2 sm:col-span-1 p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 transition group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400">التقارير وقائمة الدخل</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">الحسابات الختامية</p>
                  </div>
                </Link>
              </div>
            </section>
          )}

          {/* 5. مصفوفة العمليات السريعة (One-Click Operations) */}
          <section className="rounded-3xl border border-slate-800 bg-[#0a0f1d] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                مركز القيود والعمليات المباشرة
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">سريعة ومعتمدة</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-center font-bold">
              {canAddVouchers && (
                <Link href="/vouchers" className="bg-slate-950 hover:bg-slate-900 border border-purple-500/20 hover:border-purple-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-purple-300">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span>تسجيل سند مالي</span>
                </Link>
              )}
              {canAddAdminDocs && (
                <Link href="/admin/documents" className="bg-slate-950 hover:bg-slate-900 border border-amber-500/20 hover:border-amber-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-amber-300">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>كتاب رسمي (A4)</span>
                </Link>
              )}
              {canAddContracts && (
                <Link href="/real-estate/contracts" className="bg-slate-950 hover:bg-slate-900 border border-indigo-500/20 hover:border-indigo-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-indigo-300">
                  <FileCheck className="w-5 h-5 text-indigo-400" />
                  <span>عقد بيع معتمد</span>
                </Link>
              )}
              {canAddInstallments && (
                <Link href="/inventory/installments" className="bg-slate-950 hover:bg-slate-900 border border-emerald-500/20 hover:border-emerald-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-emerald-300">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>عقد تقسيط مدمج</span>
                </Link>
              )}
              {canAddHR && (
                <Link href="/hr" className="bg-slate-950 hover:bg-slate-900 border border-rose-500/20 hover:border-rose-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-rose-300">
                  <Coins className="w-5 h-5 text-rose-400" />
                  <span>قيد سلفة موظف</span>
                </Link>
              )}
              {canAddProjects && (
                <Link href="/projects" className="bg-slate-950 hover:bg-slate-900 border border-sky-500/20 hover:border-sky-500/50 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition text-sky-300">
                  <HardHat className="w-5 h-5 text-sky-400" />
                  <span>إضافة مشروع إعمار</span>
                </Link>
              )}
            </div>
          </section>

          {/* 6. شبكة القطاعات التشغيلية الكبرى (Enterprise Sectors) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  القطاعات والوحدات التشغيلية للمنظومة
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">بيانات وإحصائيات مفلترة بناءً على: {currentActiveBranchName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {canViewAdminDocs && (
                <Link href="/admin/documents" className="bg-[#0a0f1d] border border-slate-800 hover:border-amber-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">ديوان الشركة</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition">الإدارة والكتب الرسمية</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-amber-400">{filteredCounts.docs} <span className="text-xs font-normal text-slate-400">وثيقة</span></span>
                    <span className="text-slate-400 group-hover:text-amber-400 flex items-center gap-1 font-semibold">فتح السجل <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

              {canViewContracts && (
                <Link href="/real-estate/contracts" className="bg-[#0a0f1d] border border-slate-800 hover:border-indigo-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">العقود الرسمية</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-indigo-300 transition">العقود الإلكترونية المعتمدة</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-indigo-400">{filteredCounts.contracts} <span className="text-xs font-normal text-slate-400">عقد</span></span>
                    <span className="text-slate-400 group-hover:text-indigo-400 flex items-center gap-1 font-semibold">إدارة العقود <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

              {canViewInstallments && (
                <Link href="/inventory/installments" className="bg-[#0a0f1d] border border-emerald-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">البيع الآجل</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-emerald-300 transition">المبيعات بالأقساط المدمجة</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-emerald-400">{filteredCounts.installments} <span className="text-xs font-normal text-slate-400">جدول</span></span>
                    <span className="text-slate-400 group-hover:text-emerald-400 flex items-center gap-1 font-semibold">متابعة الأقساط <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

              {canViewProjects && (
                <Link href="/projects" className="bg-[#0a0f1d] border border-slate-800 hover:border-amber-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">قطاع الإعمار</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition">المقاولات والمشاريع الحية</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                      <HardHat className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-amber-400">{ongoingProjects.length} <span className="text-xs font-normal text-slate-400">مشروع جاري</span></span>
                    <span className="text-slate-400 group-hover:text-amber-400 flex items-center gap-1 font-semibold">نسب الإنجاز <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

              {canViewFleet && (
                <Link href="/fleet" className="bg-[#0a0f1d] border border-slate-800 hover:border-sky-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">النقل واللوجستيات</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-sky-300 transition">أسطول الآليات والشاحنات</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition">
                      <Truck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-sky-400">{dashboardData.counts.vehicles} <span className="text-xs font-normal text-slate-400">مركبة</span></span>
                    <span className="text-slate-400 group-hover:text-sky-400 flex items-center gap-1 font-semibold">الرحلات والصيانة <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

              {canViewInventory && (
                <Link href="/inventory" className="bg-[#0a0f1d] border border-slate-800 hover:border-amber-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">المخازن والتوريد</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition">التجارة العامة والمخزن المركزي</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                      <Boxes className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-amber-400">{dashboardData.counts.items} <span className="text-xs font-normal text-slate-400">صنف مسجل</span></span>
                    <span className="text-slate-400 group-hover:text-amber-400 flex items-center gap-1 font-semibold">جرد البضائع <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

              {canViewRealEstate && (
                <Link href="/real-estate" className="bg-[#0a0f1d] border border-slate-800 hover:border-purple-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">التطوير العقاري</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-purple-300 transition">العقارات والوحدات الاستثمارية</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition">
                      <Building className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-purple-400">{dashboardData.counts.units} <span className="text-xs font-normal text-slate-400">وحدة</span></span>
                    <span className="text-slate-400 group-hover:text-purple-400 flex items-center gap-1 font-semibold">سجل الوحدات <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

              {canViewHR && (
                <Link href="/hr" className="bg-[#0a0f1d] border border-slate-800 hover:border-rose-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">الكادر الوظيفي</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-rose-300 transition">الموارد البشرية والرواتب</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-rose-400">{dashboardData.counts.employees} <span className="text-xs font-normal text-slate-400">موظف</span></span>
                    <span className="text-slate-400 group-hover:text-rose-400 flex items-center gap-1 font-semibold">مسير الرواتب <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

              {canViewBranches && (
                <Link href="/branches" className="bg-[#0a0f1d] border border-slate-800 hover:border-sky-500/40 p-5 rounded-3xl transition group shadow-xl flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">المقرات والشبكة</span>
                      <h4 className="text-base font-bold text-white mt-1 group-hover:text-sky-300 transition">الفروع والقطاعات التشغيلية</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-lg font-black text-sky-400">{dashboardData.branches.length} <span className="text-xs font-normal text-slate-400">فرع متصل</span></span>
                    <span className="text-slate-400 group-hover:text-sky-400 flex items-center gap-1 font-semibold">خريطة الفروع <ChevronLeft className="w-4 h-4" /></span>
                  </div>
                </Link>
              )}

            </div>
          </section>

          {/* 7. جدول المقرات المربوطة سحابياً (Neon Cloud Network) */}
          {canViewBranches && (
            <section id="branches" className="rounded-3xl border border-slate-800 bg-[#0a0f1d] p-5 md:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">فروع ومقرات الشركة المربوطة سحابياً (Neon Cloud Sync)</h3>
                    <p className="text-[11px] text-slate-400">المقرات المعتمدة لشركة {companySettings.company_name}</p>
                  </div>
                </div>
                <Link href="/branches" className="text-xs hover:underline flex items-center gap-1 font-semibold text-amber-400">
                  إدارة الفروع <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs text-right whitespace-nowrap">
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
                      <tr key={b.branch_id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3.5 font-mono font-bold text-amber-400">{b.branch_code || b.code}</td>
                        <td className="p-3.5 text-white font-bold">{b.name_ar}</td>
                        <td className="p-3.5 text-slate-300 font-mono">{b.branch_type || b.sector}</td>
                        <td className="p-3.5 text-slate-400">{b.city || b.address} ({b.phone})</td>
                        <td className="p-3.5 text-center">
                          <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
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

          {/* 8. موقف المشاريع الحية (Active Projects Tracker) */}
          {ongoingProjects.length > 0 && canViewProjects && (
            <section className="rounded-3xl border border-slate-800 bg-[#0a0f1d] p-5 md:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white">الموقف المالي للمشاريع الإنشائية قيد التنفيذ ({currentActiveBranchName})</h3>
                </div>
                <Link href="/projects" className="text-xs hover:underline font-bold flex items-center gap-1 text-amber-400">
                  تفاصيل المشاريع <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ongoingProjects.slice(0, 3).map((p) => {
                  const contract = Number(p.contract_value || 0);
                  const rate = Number(p.completion_rate || 0);
                  return (
                    <div key={p.project_id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs shadow-inner">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-white truncate">{p.project_name}</span>
                        <span className="text-[10px] font-mono font-bold bg-[#131b2e] border border-slate-800 px-2.5 py-0.5 rounded-full text-amber-400 shrink-0">
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
                    <h3 className="text-base sm:text-lg font-bold text-white">مركز الرقابة والتدقيق والحفظ الاحتياطي السحابي</h3>
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
                  <h3 className="text-base sm:text-lg font-bold text-white">إدارة الحسابات وصلاحيات الموظفين</h3>
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