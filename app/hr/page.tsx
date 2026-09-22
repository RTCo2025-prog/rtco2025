'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  RefreshCw, 
  Trash2, 
  Wallet, 
  Coins, 
  Phone, 
  X, 
  Printer, 
  Sparkles, 
  User, 
  Scissors, 
  FileSpreadsheet, 
  Clock, 
  Send, 
  Palmtree, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Award,
  FileCheck,
  Briefcase,
  GraduationCap,
  Paperclip,
  ExternalLink,
  BookOpen,
  Camera,
  Upload,
  Edit3
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function formatDateOnly(val: string | null | undefined): string {
  if (!val) return '---';
  return String(val).split('T')[0];
}

function getArabicMonthName(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [, m] = monthStr.split('-');
  const months: { [key: string]: string } = {
    '01': 'كانون الثاني',
    '02': 'شباط',
    '03': 'آذار',
    '04': 'نيسان',
    '05': 'أيار',
    '06': 'حزيران',
    '07': 'تموز',
    '08': 'آب',
    '09': 'أيلول',
    '10': 'تشرين الأول',
    '11': 'تشرين الثاني',
    '12': 'كانون الأول'
  };
  return months[m] || '';
}

export default function HRManagementPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [penaltiesAppraisals, setPenaltiesAppraisals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'EMPLOYEES_HUB' | 'PAYROLL_SHEET' | 'LEDGER' | 'APPRAISALS'>('EMPLOYEES_HUB');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  // الشهر المختار الحالي دائماً
  const [filterMonth, setFilterMonth] = useState('2026-09');

  // حقول إضافة موظف جديد
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empCode, setEmpCode] = useState('');
  const [department, setDepartment] = useState('المقاولات والمشاريع');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [hireDate, setHireDate] = useState('2026-09-18');
  const [contractType, setContractType] = useState<'PERMANENT' | 'FIXED'>('PERMANENT');
  const [contractEndDate, setContractEndDate] = useState('');
  const [baseSalary, setBaseSalary] = useState('500000');
  const [allowances, setAllowances] = useState('150000');
  const [phone, setPhone] = useState('');
  const [leaveBalance, setLeaveBalance] = useState('21');
  const [bankAccount, setBankAccount] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // حقول تعديل بيانات الموظف
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editEmpCode, setEditEmpCode] = useState('');
  const [editDepartment, setEditDepartment] = useState('المقاولات والمشاريع');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editHireDate, setEditHireDate] = useState('');
  const [editContractType, setEditContractType] = useState<'PERMANENT' | 'FIXED'>('PERMANENT');
  const [editContractEndDate, setEditContractEndDate] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState('');
  const [editAllowances, setEditAllowances] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLeaveBalance, setEditLeaveBalance] = useState('');

  // السيرة الذاتية (CV)
  const [cvModalEmp, setCvModalEmp] = useState<any | null>(null);
  const [cvPrintEmp, setCvPrintEmp] = useState<any | null>(null);
  const [cvAvatar, setCvAvatar] = useState('');
  const [education, setEducation] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [documentsList, setDocumentsList] = useState<any[]>([]);

  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [adjType, setAdjType] = useState<'DEDUCTION' | 'LOAN' | 'BONUS' | 'OVERTIME'>('DEDUCTION');
  const [adjAmount, setAdjAmount] = useState('33333');
  const [overtimeHours, setOvertimeHours] = useState('5');
  const [installmentsCount, setInstallmentsCount] = useState('1');
  const [adjReason, setAdjReason] = useState('');

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState<'UNPAID' | 'ANNUAL' | 'SICK'>('UNPAID');
  const [leaveDays, setLeaveDays] = useState('2');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [appraisalEmpId, setAppraisalEmpId] = useState('');
  const [recordType, setRecordType] = useState<'APPRAISAL' | 'PENALTY'>('APPRAISAL');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDetails, setRecordDetails] = useState('');
  const [ratingScore, setRatingScore] = useState('5');

  // تأييد الراتب
  const [targetDestinationPrompt, setTargetDestinationPrompt] = useState<{ emp: any; net: number } | null>(null);
  const [certificateDestination, setCertificateDestination] = useState('إلى من يهمه الأمر');
  const [salaryCertEmp, setSalaryCertEmp] = useState<any | null>(null);

  const [processingPayroll, setProcessingPayroll] = useState(false);

  // استخراج الصلاحيات الدقيقة لهذا المستخدم في قسم الموارد البشرية والرواتب
  const canAdd = useMemo(() => {
    return hasPermission(currentUser, 'hr', 'add');
  }, [currentUser]);

  const canEdit = useMemo(() => {
    return hasPermission(currentUser, 'hr', 'edit');
  }, [currentUser]);

  const canDelete = useMemo(() => {
    return hasPermission(currentUser, 'hr', 'delete');
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data.success) {
        setEmployees(data.employees || []);
        setAdjustments(data.adjustments || []);
        setPayrollRuns(data.payrollRuns || []);
        setLeaves(data.leaves || []);
        setPenaltiesAppraisals(data.penaltiesAppraisals || []);
        if (data.employees?.length > 0 && !expandedEmpId) {
          setExpandedEmpId(data.employees[0].employee_id);
        }
      }
    } catch (err) {
      console.warn("HR Data loading warm-up...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch {}
    }
    loadData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية إضافة موظفين جدد');
      return;
    }
    setLoading(true);
    try {
      const combinedFullName = lastName.trim() ? `${firstName.trim()} ${lastName.trim()}` : firstName.trim();

      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_EMPLOYEE',
          emp_code: empCode,
          full_name: combinedFullName,
          job_title: jobTitle,
          department,
          hire_date: hireDate || null,
          contract_end_date: contractType === 'FIXED' ? contractEndDate : null,
          base_salary: baseSalary,
          allowances,
          phone,
          avatar_url: avatarUrl,
          annual_leave_balance: leaveBalance,
          bank_account: bankAccount
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddEmpModal(false);
        setEmpCode('');
        setFirstName('');
        setLastName('');
        setJobTitle('');
        setContractEndDate('');
        setContractType('PERMANENT');
        await loadData();
      } else {
        alert(data.error || 'فشلت إضافة الموظف');
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditEmployeeModal = (emp: any) => {
    if (!canEdit) {
      alert('ليس لديك صلاحية تعديل بيانات الموظفين');
      return;
    }
    setEditingEmployee(emp);
    setEditEmpCode(emp.emp_code || '');
    setEditDepartment(emp.department || 'المقاولات والمشاريع');
    
    const parts = (emp.full_name || '').trim().split(' ');
    if (parts.length > 3) {
      setEditFirstName(parts.slice(0, 3).join(' '));
      setEditLastName(parts.slice(3).join(' '));
    } else {
      setEditFirstName(emp.full_name || '');
      setEditLastName('');
    }

    setEditJobTitle(emp.job_title || '');
    setEditHireDate(formatDateOnly(emp.hire_date) || '2026-09-18');
    setEditContractType(emp.contract_end_date ? 'FIXED' : 'PERMANENT');
    setEditContractEndDate(formatDateOnly(emp.contract_end_date) || '');
    setEditBaseSalary(String(emp.base_salary || 0));
    setEditAllowances(String(emp.allowances || 0));
    setEditPhone(emp.phone || '');
    setEditLeaveBalance(String(emp.annual_leave_balance || 21));
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('ليس لديك صلاحية تعديل بيانات الموظفين');
      return;
    }
    if (!editingEmployee) return;
    setLoading(true);
    try {
      const combinedFullName = editLastName.trim() ? `${editFirstName.trim()} ${editLastName.trim()}` : editFirstName.trim();

      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_EMPLOYEE',
          employee_id: editingEmployee.employee_id,
          emp_code: editEmpCode,
          full_name: combinedFullName,
          job_title: editJobTitle,
          department: editDepartment,
          hire_date: editHireDate || null,
          contract_end_date: editContractType === 'FIXED' ? editContractEndDate : null,
          base_salary: editBaseSalary,
          allowances: editAllowances,
          phone: editPhone,
          annual_leave_balance: editLeaveBalance
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم تعديل وحفظ بيانات الموظف بنجاح!');
        setEditingEmployee(null);
        await loadData();
      } else {
        alert(data.error || 'فشل تعديل الموظف');
      }
    } finally {
      setLoading(false);
    }
  };

  const openCvModal = (emp: any) => {
    setCvModalEmp(emp);
    const cv = emp.cv_data || {};
    setCvAvatar(emp.avatar_url || '');
    setEducation(cv.education || '');
    setExperienceYears(cv.experienceYears || '');
    setSkills(cv.skills || '');
    setBio(cv.bio || '');
    setDocumentsList(cv.documents || []);
    setDocTitle('');
    setDocUrl('');
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCvAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDocToCv = () => {
    if (!docTitle || !docUrl) {
      alert('يرجى كتابة عنوان الوثيقة ورابطها (URL)');
      return;
    }
    setDocumentsList([...documentsList, { title: docTitle, url: docUrl, date: new Date().toISOString().substring(0, 10) }]);
    setDocTitle('');
    setDocUrl('');
  };

  const handleRemoveDocFromCv = (index: number) => {
    setDocumentsList(documentsList.filter((_, i) => i !== index));
  };

  const handleSaveCv = async () => {
    if (!canEdit) {
      alert('ليس لديك صلاحية تعديل السيرة الذاتية');
      return;
    }
    if (!cvModalEmp) return;
    setLoading(true);
    try {
      const cv_data = { education, experienceYears, skills, bio, documents: documentsList };
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_EMPLOYEE_CV',
          employee_id: cvModalEmp.employee_id,
          avatar_url: cvAvatar,
          cv_data
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم حفظ وتحديث السيرة الذاتية والصورة الشخصية بنجاح!');
        setEmployees(prev => prev.map(e => e.employee_id === cvModalEmp.employee_id ? { ...e, cv_data, avatar_url: cvAvatar } : e));
        setCvModalEmp(null);
        await loadData();
      } else {
        alert(data.error || 'فشل حفظ السيرة الذاتية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية قيد الاستقطاعات أو السلف');
      return;
    }
    if (!selectedEmpId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_ADJUSTMENT',
          employee_id: selectedEmpId,
          adj_type: adjType,
          amount: adjAmount,
          hours_count: adjType === 'OVERTIME' ? overtimeHours : 0,
          installments_count: adjType === 'LOAN' ? installmentsCount : 1,
          reason: adjReason,
          effective_month: filterMonth
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(adjType === 'LOAN' && Number(installmentsCount) > 1 ? `تم قيد السلفة وتوزيعها على ${installmentsCount} أشهر بنجاح!` : 'تم قيد الحركة بنجاح!');
        setShowAdjModal(false);
        setSelectedEmpId('');
        setAdjReason('');
        setInstallmentsCount('1');
        await loadData();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecordLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية تسجيل الإجازات');
      return;
    }
    if (!leaveEmpId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_LEAVE',
          employee_id: leaveEmpId,
          leave_type: leaveType,
          days_count: leaveDays,
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          reason: leaveReason
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(leaveType === 'UNPAID' ? 'تم تسجيل الإجازة وخصمها من الرصيد وقيد الاستقطاع المالي!' : 'تم تسجيل الإجازة بنجاح!');
        setShowLeaveModal(false);
        setLeaveEmpId('');
        setLeaveReason('');
        await loadData();
      } else {
        alert(data.error || 'فشلت إضافة الإجازة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية إضافة التقييمات أو العقوبات');
      return;
    }
    if (!appraisalEmpId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_PENALTY_APPRAISAL',
          employee_id: appraisalEmpId,
          record_type: recordType,
          title: recordTitle,
          details: recordDetails,
          rating_score: ratingScore,
          record_date: new Date().toISOString().substring(0, 10)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم تسجيل القيد الإداري بنجاح!');
        setShowAppraisalModal(false);
        setRecordTitle('');
        setRecordDetails('');
        await loadData();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الإجازات');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف هذه الإجازة مع استرجاع رصيد الأيام المخصومة؟')) return;
    try {
      const res = await fetch(`/api/hr?leave_id=${leaveId}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAdjustment = async (adjId: string) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الحركات أو السلف');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف حركة الاستقطاع أو السلفة؟')) return;
    try {
      const res = await fetch(`/api/hr?adj_id=${adjId}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRecord = async (recId: string) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف السجلات الإدارية');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا السجل الإداري؟')) return;
    try {
      const res = await fetch(`/api/hr?rec_id=${recId}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPayroll = async () => {
    if (!canEdit) {
      alert('ليس لديك صلاحية تصفير أو تعديل مسير الرواتب');
      return;
    }
    if (!confirm(`تأكيد استرجاع وتصفير بودرة شهر (${filterMonth}) لإعادة التعديل من جديد؟`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PAYROLL',
          month: filterMonth
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`تم تصفير واسترجاع بودرة شهر ${filterMonth} بنجاح!`);
        setPayrollRuns(prev => prev.filter(r => r.payroll_month !== filterMonth));
        await loadData();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!canEdit) {
      alert('ليس لديك صلاحية اعتماد وترحيل مسير الرواتب');
      return;
    }
    if (!confirm(`تأكيد احتساب وترحيل مسير رواتب شهر (${filterMonth}) مع تطبيق استقطاعات الإجازات وأقساط السلف وتوليد سندات الصرف؟`)) return;
    setProcessingPayroll(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_PAYROLL',
          month: filterMonth
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`تم ترحيل مسير شهر ${filterMonth} بنجاح!`);
        await loadData();
      }
    } finally {
      setProcessingPayroll(false);
    }
  };

  const sendWhatsAppPayslip = (run: any) => {
    const rawPhone = String(run.phone || '').trim().replace(/[^0-9]/g, '');
    if (!rawPhone) {
      alert('لم يتم تسجيل رقم هاتف لهذا الموظف!');
      return;
    }

    let phoneWithCountry = rawPhone;
    if (phoneWithCountry.startsWith('0')) {
      phoneWithCountry = '964' + phoneWithCountry.substring(1);
    } else if (!phoneWithCountry.startsWith('964')) {
      phoneWithCountry = '964' + phoneWithCountry;
    }

    const message = `*شركة البرج المتألق للمقاولات والتجارة*\nإشعار صرف راتب شهر: ${run.payroll_month}\n----------------------------------------\nالسيد/ة: *${run.full_name}* (${run.job_title})\nالرقم الوظيفي: ${run.emp_code}\n\n* الراتب الأساسي: ${formatNum(run.base_salary)} د.ع\n* البدلات والحوافز: +${formatNum(Number(run.allowances) + Number(run.bonuses))} د.ع\n* الساعات الإضافية: +${formatNum(run.overtime_amount)} د.ع\n* الاستقطاعات وأقساط السلف: -${formatNum(Number(run.loans_deducted) + Number(run.penalties))} د.ع\n${run.deduction_reasons ? `* بيان الاستقطاع: ${run.deduction_reasons}\n` : ''}----------------------------------------\n*صافي الراتب المستلم: ${formatNum(run.net_salary)} د.ع*\n\nتم الصرف والترحيل من الإدارة المالية.`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeleteEmployee = async (emp: any) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الموظفين');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف الموظف "${emp.full_name}" وسجلاته؟`)) return;
    try {
      const res = await fetch(`/api/hr?id=${emp.employee_id}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(e.full_name).toLowerCase().includes(q) || 
        String(e.emp_code).toLowerCase().includes(q) || 
        String(e.job_title).toLowerCase().includes(q);

      const matchDept = selectedDept === 'ALL' || e.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [employees, searchQuery, selectedDept]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => String(l.start_date || '').startsWith(filterMonth));
  }, [leaves, filterMonth]);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(a => String(a.effective_month || a.created_at || '').startsWith(filterMonth));
  }, [adjustments, filterMonth]);

  const currentMonthRuns = useMemo(() => {
    return payrollRuns.filter(r => r.payroll_month === filterMonth);
  }, [payrollRuns, filterMonth]);

  const sheetTotals = useMemo(() => {
    const totalBase = currentMonthRuns.reduce((acc, r) => acc + Number(r.base_salary || 0), 0);
    const totalAdditions = currentMonthRuns.reduce((acc, r) => acc + Number(r.allowances || 0) + Number(r.bonuses || 0) + Number(r.overtime_amount || 0), 0);
    const totalDeductions = currentMonthRuns.reduce((acc, r) => acc + Number(r.loans_deducted || 0) + Number(r.penalties || 0), 0);
    const totalNet = currentMonthRuns.reduce((acc, r) => acc + Number(r.net_salary || 0), 0);

    return { totalBase, totalAdditions, totalDeductions, totalNet };
  }, [currentMonthRuns]);

  // تثبيت الحسابات والبطاقات على الشهر الحالي دائماً
  const currentMonthArabic = useMemo(() => {
    return getArabicMonthName(filterMonth);
  }, [filterMonth]);

  const topCardsData = useMemo(() => {
    const activeEmps = employees.filter(e => e.status === 'ACTIVE');
    const totalEmployeesCount = activeEmps.length;

    const totalMonthlyPayroll = activeEmps.reduce((acc, e) => {
      return acc + (Number(e.base_salary || 0) + Number(e.allowances || 0));
    }, 0);

    const totalActualNetPayroll = activeEmps.reduce((acc, emp) => {
      const base = Number(emp.base_salary) || 0;
      const allow = Number(emp.allowances) || 0;
      const empAdjs = adjustments.filter(a => a.employee_id === emp.employee_id && String(a.effective_month || a.created_at || '').startsWith(filterMonth));
      
      const adds = empAdjs.filter(a => a.adj_type === 'BONUS' || a.adj_type === 'OVERTIME').reduce((sum, a) => sum + Number(a.amount || 0), 0);
      const deds = empAdjs.filter(a => a.adj_type === 'DEDUCTION' || a.adj_type === 'LOAN').reduce((sum, a) => sum + ((a.adj_type === 'LOAN' && Number(a.monthly_installment) > 0) ? Number(a.monthly_installment) : Number(a.amount || 0)), 0);
      
      const netEmp = Math.max(0, (base + allow + adds) - deds);
      return acc + netEmp;
    }, 0);

    const monthLoans = adjustments
      .filter(a => a.adj_type === 'LOAN' && String(a.effective_month || a.created_at || '').startsWith(filterMonth))
      .reduce((acc, a) => acc + (Number(a.monthly_installment) || Number(a.amount) || 0), 0);

    const monthLeavesCount = leaves
      .filter(l => String(l.start_date || '').startsWith(filterMonth))
      .length;

    return {
      totalEmployeesCount,
      totalMonthlyPayroll,
      totalActualNetPayroll,
      monthLoans,
      monthLeavesCount
    };
  }, [employees, adjustments, leaves, filterMonth]);

  if (!currentUser) return null;

  return (
    <AuthGuard moduleName="hr" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        {/* الترويسة الرئيسية بعد حذف زر شاشة السندات وتنسيق الأزرار */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 relative rounded-2xl overflow-hidden bg-slate-900 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10 p-1">
              <Image 
                src="/logo.png" 
                alt="شركة البرج المتألق" 
                width={40} 
                height={40} 
                className="object-contain" 
                priority 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white">منظومة الموارد البشرية والرواتب وبودرة المسير</h1>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                  Enterprise HR
                </span>
              </div>
              <p className="text-[13px] text-slate-400 mt-0.5">شركة البرج المتألق - بطاقات الكوادر، السير الذاتية (CV)، السلف المقسطة، وتأييد الرواتب</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button onClick={loadData} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition cursor-pointer" title="تحديث البيانات">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/" className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-[14px] hover:bg-slate-800 transition font-bold text-slate-300">
              <ArrowLeft className="w-4 h-4" /> الرئيسية
            </Link>
          </div>
        </div>

        {/* المؤشرات العامة العلوية */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-6 print:hidden">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">إجمالي كادر وموظفي الشركة</span>
            <div className="text-xl font-black font-mono text-white mt-2">
              {topCardsData.totalEmployeesCount} <span className="text-xs font-sans text-slate-500">موظف نشط</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">
              كتلة الرواتب الأساسية ({currentMonthArabic})
            </span>
            <div className="text-xl font-black font-mono text-amber-400 mt-2">
              {formatNum(topCardsData.totalMonthlyPayroll)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">
              صافي الرواتب ({currentMonthArabic})
            </span>
            <div className="text-xl font-black font-mono text-rose-400 mt-2">
              {formatNum(topCardsData.totalActualNetPayroll)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">
              سلف شهر {currentMonthArabic} ({filterMonth})
            </span>
            <div className="text-xl font-black font-mono text-amber-400 mt-2">
              {formatNum(topCardsData.monthLoans)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">
              إجازات شهر {currentMonthArabic} ({filterMonth})
            </span>
            <div className="text-xl font-black font-mono text-sky-400 mt-2">
              {topCardsData.monthLeavesCount} <span className="text-xs font-sans text-slate-500">إجازة</span>
            </div>
          </div>
        </div>

        {/* شريط التحكم الموحد */}
        <div className="max-w-7xl mx-auto mt-6 print:hidden space-y-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
              <button
                onClick={() => setActiveTab('EMPLOYEES_HUB')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'EMPLOYEES_HUB' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> بطاقات الكوادر ({employees.length})
              </button>
              <button
                onClick={() => setActiveTab('PAYROLL_SHEET')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'PAYROLL_SHEET' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" /> مسير الرواتب والبودرة A4
              </button>
              <button
                onClick={() => setActiveTab('LEDGER')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'LEDGER' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" /> سجل الحركات والإجازات
              </button>
              <button
                onClick={() => setActiveTab('APPRAISALS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'APPRAISALS' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" /> التقييمات والجزاءات ({penaltiesAppraisals.length})
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs text-slate-400 font-semibold">شهر التتبع:</span>
                <span className="text-xs font-bold text-amber-400 font-sans">{currentMonthArabic}</span>
              </div>
              <input 
                type="month" 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-white font-mono text-xs outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-start gap-2 overflow-x-auto bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-2xl">
            {canAdd && (
              <>
                <button
                  onClick={() => setShowAddEmpModal(true)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> إضافة موظف جديد
                </button>
                <button
                  onClick={() => {
                    setAdjType('DEDUCTION');
                    setShowAdjModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-rose-400" /> قيد قطع / خصم
                </button>
                <button
                  onClick={() => {
                    setAdjType('LOAN');
                    setShowAdjModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> قيد سلفة مقسطة
                </button>
                <button
                  onClick={() => {
                    setAdjType('OVERTIME');
                    setShowAdjModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> قيد ساعات إضافية
                </button>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Palmtree className="w-3.5 h-3.5 text-sky-400" /> قيد إجازة
                </button>
                <button
                  onClick={() => setShowAppraisalModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-purple-400" /> تقييم أداء / إنذار
                </button>
              </>
            )}
          </div>
        </div>

        {/* 1. تبويب بطاقات الكوادر */}
        {activeTab === 'EMPLOYEES_HUB' && (
          <div className="max-w-7xl mx-auto mt-5 space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم، الرمز، أو العنوان..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
                <select 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">كافة الأقسام والقطاعات</option>
                  <option value="المقاولات والمشاريع">المقاولات والمشاريع</option>
                  <option value="أسطول النقل العام">أسطول النقل العام</option>
                  <option value="التجارة والمخزن المركزي">التجارة والمخزن المركزي</option>
                  <option value="الإدارة المالية والمحاسبة">الإدارة المالية والمحاسبة</option>
                  <option value="العقارات والاستثمار">العقارات والاستثمار</option>
                  <option value="الإدارة المركزية">الإدارة المركزية</option>
                </select>
              </div>
              <span className="text-xs text-amber-400/90 font-mono">
                حركات شهر: <strong className="text-white font-sans">{currentMonthArabic} ({filterMonth})</strong>
              </span>
            </div>

            <div className="space-y-3">
              {filteredEmployees.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
                  لا يوجد موظفون مسجلون مطابقون للبحث.
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isExpanded = expandedEmpId === emp.employee_id;
                  const empLeaves = leaves.filter(l => l.employee_id === emp.employee_id && String(l.start_date || '').startsWith(filterMonth));
                  const empAdjustments = adjustments.filter(a => a.employee_id === emp.employee_id && String(a.effective_month || a.created_at || '').startsWith(filterMonth));
                  
                  const base = Number(emp.base_salary) || 0;
                  const allow = Number(emp.allowances) || 0;
                  const adds = empAdjustments.filter(a => a.adj_type === 'BONUS' || a.adj_type === 'OVERTIME').reduce((acc, a) => acc + Number(a.amount || 0), 0);
                  const deds = empAdjustments.filter(a => a.adj_type === 'DEDUCTION' || a.adj_type === 'LOAN').reduce((acc, a) => acc + ((a.adj_type === 'LOAN' && Number(a.monthly_installment) > 0) ? Number(a.monthly_installment) : Number(a.amount || 0)), 0);
                  const netCalculated = Math.max(0, (base + allow + adds) - deds);

                  const isContractExpiring = emp.contract_end_date && new Date(emp.contract_end_date).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;

                  return (
                    <div key={emp.employee_id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm">
                      <div 
                        onClick={() => setExpandedEmpId(isExpanded ? null : emp.employee_id)}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                            {emp.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={emp.avatar_url} alt={emp.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-white">{emp.full_name}</h3>
                              <span className="font-mono text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                                {emp.emp_code}
                              </span>
                              {isContractExpiring && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                                  قرب انتهاء العقد ({formatDateOnly(emp.contract_end_date)})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{emp.job_title} • <span className="text-rose-400">{emp.department}</span></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div className="text-right">
                            <span className="text-slate-500 block text-[10px] font-sans">الراتب الأساسي</span>
                            <span className="font-bold text-slate-200">{formatNum(emp.base_salary)} د.ع</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block text-[10px] font-sans">البدلات</span>
                            <span className="font-bold text-slate-300">+{formatNum(emp.allowances)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block text-[10px] font-sans">رصيد الإجازات</span>
                            <span className="font-bold text-sky-400">{emp.annual_leave_balance || 0} يوم</span>
                          </div>
                          <div className="text-right bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                            <span className="text-emerald-400 block text-[10px] font-sans font-bold">الصافي</span>
                            <span className="font-black text-sm text-emerald-400">{formatNum(netCalculated)} د.ع</span>
                          </div>
                          <div className="p-1 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-rose-400" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-amber-400" /> حركات شهر {currentMonthArabic} ({filterMonth})
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap text-xs">
                              {canEdit && (
                                <button
                                  onClick={() => openEditEmployeeModal(emp)}
                                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" /> تعديل الموظف
                                </button>
                              )}

                              {canEdit && (
                                <button
                                  onClick={() => openCvModal(emp)}
                                  className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                >
                                  <BookOpen className="w-3 h-3" /> CV
                                </button>
                              )}
                              <button
                                onClick={() => setCvPrintEmp(emp)}
                                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <Printer className="w-3 h-3" /> طباعة CV
                              </button>
                              <button
                                onClick={() => {
                                  setCertificateDestination('إلى من يهمه الأمر');
                                  setTargetDestinationPrompt({ emp, net: netCalculated });
                                }}
                                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <FileCheck className="w-3 h-3" /> تأييد راتب
                              </button>

                              {canAdd && (
                                <>
                                  <button
                                    onClick={() => {
                                      setLeaveEmpId(emp.employee_id);
                                      setShowLeaveModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                  >
                                    <Palmtree className="w-3 h-3" /> قيد إجازة
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedEmpId(emp.employee_id);
                                      setAdjType('DEDUCTION');
                                      setShowAdjModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                  >
                                    <Scissors className="w-3 h-3" /> خصم
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedEmpId(emp.employee_id);
                                      setAdjType('OVERTIME');
                                      setShowAdjModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5" /> إضافي
                                  </button>
                                </>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteEmployee(emp)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition mr-1 cursor-pointer"
                                  title="حذف الموظف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* إجازات الشهر */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                              <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1">
                                <Palmtree className="w-3.5 h-3.5" /> إجازات شهر {currentMonthArabic} ({empLeaves.length})
                              </h4>
                              {empLeaves.length === 0 ? (
                                <p className="text-slate-500 text-[11px] py-3 text-center">لا توجد إجازات في هذا الشهر.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-right font-mono">
                                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                                      <tr>
                                        <th className="pb-1">النوع</th>
                                        <th className="pb-1">الأيام</th>
                                        <th className="pb-1">التاريخ</th>
                                        {canDelete && <th className="pb-1 text-center">حذف</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {empLeaves.map(l => (
                                        <tr key={l.leave_id}>
                                          <td className="py-1.5 font-sans">
                                            {l.leave_type === 'UNPAID' ? <span className="text-rose-400 font-bold">بدون راتب</span> : <span className="text-sky-400">اعتيادية</span>}
                                          </td>
                                          <td className="py-1.5 text-white font-bold">{l.days_count} يوم</td>
                                          <td className="py-1.5 text-slate-400">{formatDateOnly(l.start_date)}</td>
                                          {canDelete && (
                                            <td className="py-1.5 text-center">
                                              <button onClick={() => handleDeleteLeave(l.leave_id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            {/* حركات الشهر */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                <Scissors className="w-3.5 h-3.5" /> حركات شهر {currentMonthArabic} ({empAdjustments.length})
                              </h4>
                              {empAdjustments.length === 0 ? (
                                <p className="text-slate-500 text-[11px] py-3 text-center">لا توجد حركات في هذا الشهر.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-right font-mono">
                                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                                      <tr>
                                        <th className="pb-1">النوع</th>
                                        <th className="pb-1">المبلغ</th>
                                        <th className="pb-1">البيان</th>
                                        {canDelete && <th className="pb-1 text-center">حذف</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {empAdjustments.map(a => (
                                        <tr key={a.adj_id}>
                                          <td className="py-1.5 font-sans">
                                            {a.adj_type === 'DEDUCTION' ? (
                                              <span className="text-rose-400 font-bold">قطع</span>
                                            ) : a.adj_type === 'OVERTIME' ? (
                                              <span className="text-emerald-400 font-bold">إضافي ({a.hours_count}س)</span>
                                            ) : a.adj_type === 'LOAN' ? (
                                              <span className="text-amber-400 font-bold">سلفة</span>
                                            ) : (
                                              <span className="text-sky-400 font-bold">مكافأة</span>
                                            )}
                                          </td>
                                          <td className="py-1.5 text-white font-bold">
                                            {formatNum((a.adj_type === 'LOAN' && Number(a.monthly_installment) > 0) ? a.monthly_installment : a.amount)} د.ع
                                          </td>
                                          <td className="py-1.5 text-slate-300 font-sans leading-relaxed">{a.reason || '---'}</td>
                                          {canDelete && (
                                            <td className="py-1.5 text-center">
                                              <button onClick={() => handleDeleteAdjustment(a.adj_id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. تبويب مسير الرواتب والبودرة A4 */}
        {activeTab === 'PAYROLL_SHEET' && (
          <div className="max-w-7xl mx-auto mt-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 print:hidden shadow-md">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  مسير رواتب شهر {currentMonthArabic} ({filterMonth})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">اعتماد المسير وحساب الخصومات والسلف وترحيل السندات للصندوق</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                {canEdit && (
                  <>
                    <button
                      onClick={handleResetPayroll}
                      disabled={loading}
                      className="bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/30 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> تصفير وإرجاع البودرة
                    </button>

                    <button
                      onClick={handleProcessPayroll}
                      disabled={processingPayroll}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      {processingPayroll ? 'جاري الترحيل...' : `اعتماد وترحيل رواتب شهر ${currentMonthArabic}`}
                    </button>
                  </>
                )}

                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> طباعة البودرة (A4)
                </button>
              </div>
            </div>

            <div className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xl print:border-none print:shadow-none print:p-0 space-y-5">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 relative flex items-center justify-center p-1 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                    <Image 
                      src="/logo.png" 
                      alt="شركة البرج المتألق" 
                      width={50} 
                      height={50} 
                      className="object-contain" 
                      priority 
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">شركة البرج المتألق</h2>
                    <p className="text-xs text-slate-600 font-bold">جدول مسير رواتب الكوادر والموظفين</p>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <span className="border border-rose-600 px-3 py-1 font-bold text-xs bg-rose-600 text-white rounded-lg inline-block">
                    مسير شهر: {currentMonthArabic} ({filterMonth})
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">تاريخ الاعتماد: {new Date().toISOString().substring(0, 10)}</p>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-right text-[12px] border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 text-center w-8 border-l border-slate-200">ت</th>
                      <th className="p-2.5 border-l border-slate-200">اسم الموظف</th>
                      <th className="p-2.5 border-l border-slate-200">المسمى والقسم</th>
                      <th className="p-2.5 border-l border-slate-200">الراتب الأساسي</th>
                      <th className="p-2.5 border-l border-slate-200">البدلات والحوافز</th>
                      <th className="p-2.5 border-l border-slate-200">الإضافي</th>
                      <th className="p-2.5 border-l border-slate-200">الاستقطاعات والسلف</th>
                      <th className="p-2.5 border-l border-slate-200">سبب القطع</th>
                      <th className="p-2.5 border-l border-slate-200">صافي المستحق</th>
                      <th className="p-2.5 text-center print:hidden border-l border-slate-200">إشعار</th>
                      <th className="p-2.5 text-center w-24">التوقيع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {currentMonthRuns.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-8 text-slate-500 text-xs">
                          البودرة غير مرحلة لشهر {currentMonthArabic} ({filterMonth}) حالياً. اضغط على زر <strong className="text-emerald-700">«اعتماد وترحيل رواتب شهر {currentMonthArabic}»</strong> لتنزيل المسير فوراً.
                        </td>
                      </tr>
                    ) : (
                      currentMonthRuns.map((run, idx) => (
                        <tr key={run.run_id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-center font-mono font-bold text-slate-400 border-l border-slate-200">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200 whitespace-nowrap">
                            {run.full_name}
                          </td>
                          <td className="p-2.5 text-slate-600 border-l border-slate-200 text-[11px] whitespace-nowrap">
                            {run.job_title} <span className="text-slate-400">({run.department})</span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-800 border-l border-slate-200 whitespace-nowrap">{formatNum(run.base_salary)}</td>
                          <td className="p-2.5 font-mono text-emerald-700 font-bold border-l border-slate-200 whitespace-nowrap">
                            +{formatNum(Number(run.allowances) + Number(run.bonuses))}
                          </td>
                          <td className="p-2.5 font-mono text-emerald-600 font-bold border-l border-slate-200 whitespace-nowrap">
                            +{formatNum(run.overtime_amount)}
                          </td>
                          <td className="p-2.5 font-mono text-rose-700 font-bold border-l border-slate-200 whitespace-nowrap">
                            -{formatNum(Number(run.loans_deducted) + Number(run.penalties))}
                          </td>
                          <td className="p-2.5 text-rose-600 text-[11px] leading-relaxed border-l border-slate-200">
                            {run.deduction_reasons || '---'}
                          </td>
                          <td className="p-2.5 font-mono font-black text-slate-950 text-[13px] border-l border-slate-200 whitespace-nowrap">
                            {formatNum(run.net_salary)} <span className="text-[10px] font-sans font-normal text-slate-500">د.ع</span>
                          </td>
                          <td className="p-1.5 text-center print:hidden border-l border-slate-200 whitespace-nowrap">
                            <button
                              onClick={() => sendWhatsAppPayslip(run)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-300 transition inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                              title="إرسال إشعار الراتب عبر واتساب"
                            >
                              <Send className="w-3 h-3 text-emerald-600" /> واتساب
                            </button>
                          </td>
                          <td className="p-1.5 text-center">
                            <div className="border-b border-dashed border-slate-400 w-16 mx-auto mt-2"></div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {currentMonthRuns.length > 0 && (
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-slate-950 font-black border-l border-slate-300">
                          إجمالي مسير شهر {currentMonthArabic}:
                        </td>
                        <td className="p-2.5 font-mono border-l border-slate-300 whitespace-nowrap">{formatNum(sheetTotals.totalBase)}</td>
                        <td className="p-2.5 font-mono text-emerald-700 border-l border-slate-300 whitespace-nowrap">+{formatNum(sheetTotals.totalAdditions)}</td>
                        <td className="p-2.5 border-l border-slate-300"></td>
                        <td className="p-2.5 font-mono text-rose-700 border-l border-slate-300 whitespace-nowrap">-{formatNum(sheetTotals.totalDeductions)}</td>
                        <td className="p-2.5 border-l border-slate-300"></td>
                        <td className="p-2.5 font-mono font-black text-rose-700 text-sm border-l border-slate-300 whitespace-nowrap">
                          {formatNum(sheetTotals.totalNet)} <span className="text-[10px] font-sans font-normal">د.ع</span>
                        </td>
                        <td className="print:hidden border-l border-slate-300"></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-5 text-center border-t border-slate-300 text-xs">
                <div>
                  <p className="font-bold text-slate-800">مسؤول الموارد البشرية</p>
                  <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
                </div>
                <div>
                  <p className="font-bold text-slate-800">مدير الحسابات والمالية</p>
                  <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
                </div>
                <div>
                  <p className="font-bold text-slate-800">المدير التنفيذي للشركة</p>
                  <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. تبويب سجل الحركات والإجازات */}
        {activeTab === 'LEDGER' && (
          <div className="max-w-7xl mx-auto mt-5 space-y-4 print:hidden">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" /> السجل العام لحركات وإجازات شهر {currentMonthArabic} ({filterMonth})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">متابعة كافة الخصومات، السلف المقسطة، وساعات الإضافي المسجلة للموظفين</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Palmtree className="w-4 h-4" /> سجل الإجازات ({filteredLeaves.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right font-mono">
                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="pb-1">الموظف</th>
                        <th className="pb-1">النوع</th>
                        <th className="pb-1">الأيام</th>
                        <th className="pb-1">التاريخ</th>
                        {canDelete && <th className="pb-1 text-center">حذف</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLeaves.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-500 font-sans">لا توجد إجازات في هذا الشهر.</td></tr>
                      ) : (
                        filteredLeaves.map(l => (
                          <tr key={l.leave_id}>
                            <td className="py-2 font-sans font-bold text-slate-200">{l.full_name}</td>
                            <td className="py-2 font-sans">{l.leave_type === 'UNPAID' ? <span className="text-rose-400 font-bold">بدون راتب</span> : <span className="text-sky-400">اعتيادية</span>}</td>
                            <td className="py-2 text-white font-bold">{l.days_count} يوم</td>
                            <td className="py-2 text-slate-400">{formatDateOnly(l.start_date)}</td>
                            {canDelete && (
                              <td className="py-2 text-center">
                                <button onClick={() => handleDeleteLeave(l.leave_id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Scissors className="w-4 h-4" /> سجل الحركات والسلف ({filteredAdjustments.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right font-mono">
                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="pb-1">الموظف</th>
                        <th className="pb-1">النوع</th>
                        <th className="pb-1">المبلغ</th>
                        <th className="pb-1">البيان</th>
                        {canDelete && <th className="pb-1 text-center">حذف</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredAdjustments.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-500 font-sans">لا توجد حركات في هذا الشهر.</td></tr>
                      ) : (
                        filteredAdjustments.map(a => (
                          <tr key={a.adj_id}>
                            <td className="py-2 font-sans font-bold text-slate-200">{a.full_name}</td>
                            <td className="py-2 font-sans">
                              {a.adj_type === 'DEDUCTION' ? (
                                <span className="text-rose-400 font-bold">قطع</span>
                              ) : a.adj_type === 'OVERTIME' ? (
                                <span className="text-emerald-400 font-bold">إضافي</span>
                              ) : a.adj_type === 'LOAN' ? (
                                <span className="text-amber-400 font-bold">سلفة</span>
                              ) : (
                                <span className="text-sky-400 font-bold">مكافأة</span>
                              )}
                            </td>
                            <td className="py-2 text-white font-bold">
                              {formatNum((a.adj_type === 'LOAN' && Number(a.monthly_installment) > 0) ? a.monthly_installment : a.amount)} د.ع
                            </td>
                            <td className="py-2 text-slate-300 font-sans leading-relaxed">{a.reason || '---'}</td>
                            {canDelete && (
                              <td className="py-2 text-center">
                                <button onClick={() => handleDeleteAdjustment(a.adj_id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. تبويب التقييمات والجزاءات */}
        {activeTab === 'APPRAISALS' && (
          <div className="max-w-7xl mx-auto mt-5 space-y-4 print:hidden">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" /> سجل تقييمات الأداء والجزاءات الإدارية
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">توثيق مستويات الالتزام والتكريمات والإنذارات الرسمية</p>
              </div>
              {canAdd && (
                <button
                  onClick={() => setShowAppraisalModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> إضافة تقييم أو إنذار
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {penaltiesAppraisals.length === 0 ? (
                <div className="col-span-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
                  لا توجد سجلات تقييم أو إنذارات مسجلة.
                </div>
              ) : (
                penaltiesAppraisals.map((item) => (
                  <div key={item.record_id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        item.record_type === 'APPRAISAL' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {item.record_type === 'APPRAISAL' ? 'تقييم أداء' : 'إنذار إداري'}
                      </span>
                      {canDelete && (
                        <button onClick={() => handleDeleteRecord(item.record_id)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-rose-400 mt-0.5">{item.full_name} ({item.emp_code})</p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{item.details || 'لا توجد تفاصيل إضافية.'}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                      <span>الدرجة: <strong className="text-amber-400">{item.rating_score} / 5</strong></span>
                      <span>{formatDateOnly(item.record_date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* نافذة السؤال وتحديد جهة توجيه تأييد الراتب */}
        {targetDestinationPrompt && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-400" /> توجيه كتاب تأييد الراتب
                </h3>
                <button onClick={() => setTargetDestinationPrompt(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-300 font-semibold">إلى أي جهة ترغب بتوجيه كتاب التأييد؟</p>
                <p className="text-slate-500 text-[11px]">اكتب اسم الدائرة أو المصرف أو الجهة المعنية (أو اتركها كما هي):</p>
                <input
                  type="text"
                  value={certificateDestination}
                  onChange={(e) => setCertificateDestination(e.target.value)}
                  placeholder="مثال: مصرف الرشيد / فرع النجف..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetDestinationPrompt(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSalaryCertEmp({ ...targetDestinationPrompt.emp, net: targetDestinationPrompt.net });
                    setTargetDestinationPrompt(null);
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  عرض وطباعة التأييد
                </button>
              </div>
            </div>
          </div>
        )}

        {/* مستند السيرة الذاتية والأرشيف للطباعة A4 */}
        {cvPrintEmp && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:static">
            <div className="w-full max-w-4xl flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 print:hidden shadow-xl">
              <button onClick={() => window.print()} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer">
                <Printer className="w-4 h-4" /> طباعة السيرة الذاتية الرسمية (A4)
              </button>
              <button onClick={() => setCvPrintEmp(null)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl p-8 md:p-10 border border-slate-200 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-6">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 relative flex items-center justify-center p-1 bg-slate-50 rounded-xl border border-slate-200">
                    <Image 
                      src="/logo.png" 
                      alt="شركة البرج المتألق" 
                      width={56} 
                      height={56} 
                      className="object-contain" 
                      priority 
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-950">شركة البرج المتألق</h1>
                    <p className="text-xs text-slate-600 font-bold">للمقاولات العامة والتجارة والنقل والاستثمار العقاري</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">قسم إدارة الموارد البشرية والتوظيف</p>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="border-2 border-slate-900 px-3 py-1 font-black text-xs uppercase bg-purple-600 text-white rounded-lg inline-block">
                    السيرة الذاتية الرسمية
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">تاريخ الإصدار: {new Date().toISOString().substring(0, 10)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-300 bg-slate-200 flex items-center justify-center shrink-0">
                  {cvPrintEmp.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cvPrintEmp.avatar_url} alt={cvPrintEmp.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 text-right space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-950">{cvPrintEmp.full_name}</h2>
                    <span className="font-mono text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded">
                      {cvPrintEmp.emp_code}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-purple-700">{cvPrintEmp.job_title} - <span className="text-slate-700">{cvPrintEmp.department}</span></p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-600 font-mono">
                    <div>الهاتف: <strong className="text-slate-900 font-sans">{cvPrintEmp.phone || 'غير مسجل'}</strong></div>
                    <div>تاريخ التعيين: <strong className="text-slate-900">{formatDateOnly(cvPrintEmp.hire_date)}</strong></div>
                    <div>الحالة: <strong className="text-emerald-700 font-sans">على رأس العمل ✓</strong></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 text-xs leading-relaxed">
                <div className="border border-slate-200 p-4 rounded-xl bg-white space-y-1.5 text-right">
                  <h3 className="font-bold text-slate-950 flex items-center gap-1.5 text-sm">
                    <User className="w-4 h-4 text-purple-600" /> النبذة المهنية الموجزة
                  </h3>
                  <p className="text-slate-800 font-sans text-xs leading-relaxed whitespace-pre-line">
                    {cvPrintEmp.cv_data?.bio ? cvPrintEmp.cv_data.bio : 'لا توجد نبذة مهنية مسجلة حتى الآن.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-200 p-3.5 rounded-xl bg-white space-y-1">
                    <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-sky-600" /> المؤهل العلمي
                    </h3>
                    <p className="text-slate-700 font-bold">{cvPrintEmp.cv_data?.education || 'مؤهل أكاديمي معتمد'}</p>
                  </div>
                  <div className="border border-slate-200 p-3.5 rounded-xl bg-white space-y-1">
                    <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-600" /> سنوات الخبرة
                    </h3>
                    <p className="text-slate-700 font-bold">{cvPrintEmp.cv_data?.experienceYears || 'خبرة عملية موثقة'}</p>
                  </div>
                </div>

                <div className="border border-slate-200 p-3.5 rounded-xl bg-white space-y-1">
                  <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" /> المهارات والاختصاصات
                  </h3>
                  <p className="text-slate-700 font-bold">{cvPrintEmp.cv_data?.skills || 'الالتزام ببرامج العمل، الكفاءة في تنفيذ المهام، والعمل الجماعي.'}</p>
                </div>

                <div className="border border-slate-200 p-3.5 rounded-xl bg-white space-y-2">
                  <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-purple-600" /> المستمسكات والشهادات الرسمية
                  </h3>
                  {cvPrintEmp.cv_data?.documents && cvPrintEmp.cv_data.documents.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                      {cvPrintEmp.cv_data.documents.map((d: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px] flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-sans truncate">{d.title}</span>
                          <span className="text-emerald-700 font-bold">مؤرشف ✓</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px]">مستمسكات الموظف محفوظة في الملف الإداري المركزي.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 text-center border-t border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-700">مسؤول شؤون الموظفين</p>
                  <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
                </div>
                <div>
                  <p className="font-bold text-slate-700">مصادقة إدارة الشركة / الختم</p>
                  <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* مستند تأييد الراتب A4 */}
        {salaryCertEmp && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:static">
            <div className="w-full max-w-3xl flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 print:hidden shadow-xl">
              <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer">
                <Printer className="w-4 h-4" /> طباعة تأييد الراتب (A4)
              </button>
              <button onClick={() => setSalaryCertEmp(null)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl p-8 md:p-10 border border-slate-200 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-6">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 relative flex items-center justify-center p-1 bg-slate-50 rounded-xl border border-slate-200">
                    <Image 
                      src="/logo.png" 
                      alt="شركة البرج المتألق" 
                      width={56} 
                      height={56} 
                      className="object-contain" 
                      priority 
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-950">شركة البرج المتألق</h1>
                    <p className="text-xs text-slate-600 font-bold">للمقاولات العامة والتجارة والنقل والاستثمار العقاري</p>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="border-2 border-slate-900 px-3 py-1 font-black text-xs uppercase bg-rose-500 text-white rounded-lg inline-block">
                    شهادة تأييد راتب
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">التاريخ: {new Date().toISOString().substring(0, 10)}</p>
                </div>
              </div>

              <div className="text-center py-2">
                <h3 className="text-lg font-black text-slate-950 underline underline-offset-8">
                  {certificateDestination && certificateDestination !== 'إلى من يهمه الأمر' 
                    ? `إلى / ${certificateDestination} المحترمون` 
                    : 'إلى من يهمه الأمر / تأييد استمرار بالخدمة'}
                </h3>
              </div>

              <div className="space-y-3.5 text-xs text-slate-800 leading-loose">
                <p>
                  تشهد إدارة <strong>شركة البرج المتألق للمقاولات والتجارة العامة</strong> بأن السيد/ة: <strong className="text-slate-950 text-sm">{salaryCertEmp.full_name}</strong>، الحامل للرقم الوظيفي (<span className="font-mono font-bold">{salaryCertEmp.emp_code}</span>), يعمل لدينا بصفة: <strong>{salaryCertEmp.job_title}</strong> في قسم: <strong>{salaryCertEmp.department}</strong> منذ تاريخ: <span className="font-mono font-bold text-slate-950">{formatDateOnly(salaryCertEmp.hire_date)}</span> وما زال مستمراً بعمله حتى الآن.
                </p>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span>الراتب الأساسي الشهري:</span>
                    <strong className="font-mono text-slate-900">{formatNum(salaryCertEmp.base_salary)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>المخصصات والبدلات الثابتة:</span>
                    <strong className="font-mono text-slate-900">{formatNum(salaryCertEmp.allowances)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 pt-2 text-rose-700">
                    <span>صافي الراتب التعاقدي:</span>
                    <strong className="font-mono">{formatNum(Number(salaryCertEmp.base_salary) + Number(salaryCertEmp.allowances))} دينار عراقي</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8 text-center border-t border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-700">مسؤول الموارد البشرية</p>
                  <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
                </div>
                <div>
                  <p className="font-bold text-slate-700">المدير المفوض / ختم الشركة</p>
                  <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تحرير السيرة الذاتية (CV Modal) */}
        {cvModalEmp && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-5 shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    إدارة السيرة الذاتية للموظف: <span className="text-purple-400">{cvModalEmp.full_name}</span>
                  </h3>
                </div>
                <button onClick={() => setCvModalEmp(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* رفع ومعاينة الصورة الشخصية للموظف */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 flex items-center justify-center shrink-0">
                    {cvAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cvAvatar} alt="صورة الموظف" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-purple-400" /> صورة الموظف الشخصية:
                    </label>
                    <div className="flex gap-2 items-center">
                      <label className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 text-xs shrink-0">
                        <Upload className="w-3.5 h-3.5" /> اختر صورة من جهازك
                        <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="أو ضع رابط صورة مباشر..."
                        value={cvAvatar}
                        onChange={(e) => setCvAvatar(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-sky-400" /> التحصيل العلمي
                    </label>
                    <input
                      type="text"
                      placeholder="بكالوريوس هندسة، دبلوم..."
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" /> سنوات الخبرة
                    </label>
                    <input
                      type="text"
                      placeholder="5 سنوات..."
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">المهارات والخبرات</label>
                  <input
                    type="text"
                    placeholder="إدارة المواقع، أوتوكاد..."
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">نبذة مهنية موجزة</label>
                  <textarea
                    rows={3}
                    placeholder="نبذة تعريفية تشمل نقاط القوة..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-purple-400" /> أرشيف المستمسكات والشهادات
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="اسم المستند (بطاقة موحدة...)"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-white outline-none"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="رابط الملف (URL)"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-white font-mono text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddDocToCv}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl transition shrink-0 cursor-pointer"
                      >
                        إرفاق
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    {documentsList.length === 0 ? (
                      <p className="text-slate-500 text-center py-2 text-[11px]">لم يتم إرفاق أي مستمسكات بعد.</p>
                    ) : (
                      documentsList.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-slate-200">{doc.title}</span>
                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline flex items-center gap-1 text-[11px] font-mono">
                              معاينة <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocFromCv(idx)}
                            className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setCvModalEmp(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer">إلغاء</button>
                  {canEdit && (
                    <button 
                      type="button" 
                      onClick={handleSaveCv} 
                      disabled={loading} 
                      className="px-4 py-1.5 font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-500 transition text-xs cursor-pointer"
                    >
                      {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تعديل بيانات الموظف */}
        {editingEmployee && canEdit && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" /> تعديل بيانات الموظف: {editingEmployee.full_name}
                </h3>
                <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateEmployee} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم الموظف *</label>
                    <input
                      type="text"
                      required
                      value={editEmpCode}
                      onChange={(e) => setEditEmpCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">القسم *</label>
                    <select
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="المقاولات والمشاريع">المقاولات والمشاريع</option>
                      <option value="أسطول النقل العام">أسطول النقل العام</option>
                      <option value="التجارة والمخزن المركزي">التجارة والمخزن المركزي</option>
                      <option value="الإدارة المالية والمحاسبة">الإدارة المالية والمحاسبة</option>
                      <option value="العقارات والاستثمار">العقارات والاستثمار</option>
                      <option value="الإدارة المركزية">الإدارة المركزية</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">الاسم الثلاثي *</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">اللقب</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المسمى الوظيفي *</label>
                    <input
                      type="text"
                      required
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">تاريخ المباشرة *</label>
                    <input
                      type="date"
                      required
                      value={editHireDate}
                      onChange={(e) => setEditHireDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <label className="block text-slate-300 font-bold">حالة ونوع العقد الوظيفي:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl cursor-pointer">
                      <input 
                        type="radio" 
                        id="editPermanent" 
                        name="editContractType" 
                        checked={editContractType === 'PERMANENT'} 
                        onChange={() => setEditContractType('PERMANENT')} 
                        className="accent-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="editPermanent" className="text-white font-bold cursor-pointer">مستمر بالدوام الرسمي</label>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl cursor-pointer">
                      <input 
                        type="radio" 
                        id="editFixed" 
                        name="editContractType" 
                        checked={editContractType === 'FIXED'} 
                        onChange={() => setEditContractType('FIXED')} 
                        className="accent-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="editFixed" className="text-white font-bold cursor-pointer">تاريخ انتهاء محدد</label>
                    </div>
                  </div>

                  {editContractType === 'FIXED' && (
                    <div className="pt-1">
                      <label className="block text-amber-400 mb-1 font-semibold">حدد موعد انتهاء العقد *</label>
                      <input
                        type="date"
                        required={editContractType === 'FIXED'}
                        value={editContractEndDate}
                        onChange={(e) => setEditContractEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الراتب الأساسي (د.ع) *</label>
                    <input
                      type="number"
                      required
                      value={editBaseSalary}
                      onChange={(e) => setEditBaseSalary(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">البدلات (د.ع)</label>
                    <input
                      type="number"
                      value={editAllowances}
                      onChange={(e) => setEditAllowances(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-400 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم الهاتف *</label>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رصيد الإجازات السنوي (أيام)</label>
                    <input
                      type="number"
                      value={editLeaveBalance}
                      onChange={(e) => setEditLeaveBalance(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-400 font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setEditingEmployee(null)} 
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/25 cursor-pointer"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة استقطاع / إضافي / سلفة مقسطة */}
        {showAdjModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl text-right space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {adjType === 'DEDUCTION' ? (
                    <Scissors className="w-4 h-4 text-rose-400" />
                  ) : adjType === 'OVERTIME' ? (
                    <Clock className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Coins className="w-4 h-4 text-amber-400" />
                  )}
                  {adjType === 'DEDUCTION' ? 'تسجيل استقطاع / قطع راتب' : adjType === 'OVERTIME' ? 'تسجيل ساعات عمل إضافي' : 'تسجيل سلفة مقسطة'}
                </h3>
                <button onClick={() => setShowAdjModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddAdjustment} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">الموظف المعني *</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => {
                      const empId = e.target.value;
                      setSelectedEmpId(empId);
                      if (adjType === 'OVERTIME') {
                        const emp = employees.find(x => x.employee_id === empId);
                        if (emp) {
                          const base = Number(emp.base_salary) || 0;
                          const dailyRate = base > 0 ? base / 30 : 0;
                          const hourlyRate = dailyRate / 8;
                          const hours = parseFloat(overtimeHours) || 0;
                          const calculatedAmt = Math.round(hourlyRate * hours * 1.5);
                          setAdjAmount(String(calculatedAmt));
                        }
                      }
                    }}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(e => (
                      <option key={e.employee_id} value={e.employee_id}>
                        {e.full_name} (الأساسي: {formatNum(e.base_salary)} د.ع)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نوع الإجراء</label>
                    <select
                      value={adjType}
                      onChange={(e) => {
                        const t = e.target.value as any;
                        setAdjType(t);
                        if (t === 'OVERTIME' && selectedEmpId) {
                          const emp = employees.find(x => x.employee_id === selectedEmpId);
                          if (emp) {
                            const base = Number(emp.base_salary) || 0;
                            const dailyRate = base > 0 ? base / 30 : 0;
                            const hourlyRate = dailyRate / 8;
                            const hours = parseFloat(overtimeHours) || 0;
                            const calculatedAmt = Math.round(hourlyRate * hours * 1.5);
                            setAdjAmount(String(calculatedAmt));
                          }
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none cursor-pointer"
                    >
                      <option value="DEDUCTION">قطع راتب / غياب</option>
                      <option value="OVERTIME">ساعات إضافية</option>
                      <option value="LOAN">سلفة مقسطة</option>
                      <option value="BONUS">مكافأة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      {adjType === 'OVERTIME' ? 'المبلغ (تلقائي)' : 'المبلغ (د.ع) *'}
                    </label>
                    <input
                      type="number"
                      required
                      disabled={adjType === 'OVERTIME'}
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      className={`w-full border rounded-xl p-2 font-mono font-bold outline-none ${
                        adjType === 'OVERTIME' 
                          ? 'bg-slate-900 border-slate-800 text-emerald-400' 
                          : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                      }`}
                    />
                  </div>
                </div>

                {adjType === 'LOAN' && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">أشهر التقسيط *</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        required
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-1.5 text-white font-mono text-center font-bold outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-slate-400 mb-1 font-semibold">القسط الشهري</span>
                      <div className="font-mono font-bold text-amber-400 pt-1 text-xs">
                        {formatNum(Math.round((Number(adjAmount) || 0) / (Number(installmentsCount) || 1)))} د.ع/ش
                      </div>
                    </div>
                  </div>
                )}

                {adjType === 'OVERTIME' && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">عدد الساعات الإضافية *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.5"
                      required
                      value={overtimeHours}
                      onChange={(e) => {
                        const h = e.target.value;
                        setOvertimeHours(h);
                        if (selectedEmpId) {
                          const emp = employees.find(x => x.employee_id === selectedEmpId);
                          if (emp) {
                            const base = Number(emp.base_salary) || 0;
                            const dailyRate = base > 0 ? base / 30 : 0;
                            const hourlyRate = dailyRate / 8;
                            const hours = parseFloat(h) || 0;
                            const calculatedAmt = Math.round(hourlyRate * hours * 1.5);
                            setAdjAmount(String(calculatedAmt));
                          }
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">السبب والبيان *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="اكتب السبب أو المبرر..."
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAdjModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer">إلغاء</button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-4 py-1.5 font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-500 transition text-xs cursor-pointer"
                  >
                    {loading ? 'جاري الاعتماد...' : 'اعتماد الإجراء'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة تسجيل إجازة */}
        {showLeaveModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl text-right space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Palmtree className="w-4 h-4 text-sky-400" /> تقديم إجازة موظف لشهر {currentMonthArabic}
                </h3>
                <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordLeave} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">الموظف *</label>
                  <select
                    value={leaveEmpId}
                    onChange={(e) => setLeaveEmpId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(e => (
                      <option key={e.employee_id} value={e.employee_id}>
                        {e.full_name} (رصيد: {e.annual_leave_balance || 21} يوم)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نوع الإجازة</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none cursor-pointer"
                    >
                      <option value="UNPAID">بدون راتب (خصم مباشر)</option>
                      <option value="ANNUAL">سنوية اعتيادية</option>
                      <option value="SICK">مرضية معتمدة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">عدد الأيام *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={leaveDays}
                      onChange={(e) => {
                        const d = e.target.value;
                        setLeaveDays(d);
                        if (leaveStartDate) {
                          const dt = new Date(leaveStartDate);
                          dt.setDate(dt.getDate() + Math.max(0, parseInt(d || '1') - 1));
                          setLeaveEndDate(dt.toISOString().substring(0, 10));
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">من تاريخ *</label>
                    <input
                      type="date"
                      required
                      value={leaveStartDate}
                      onChange={(e) => {
                        const s = e.target.value;
                        setLeaveStartDate(s);
                        if (s) {
                          const dt = new Date(s);
                          dt.setDate(dt.getDate() + Math.max(0, parseInt(leaveDays || '1') - 1));
                          setLeaveEndDate(dt.toISOString().substring(0, 10));
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">إلى تاريخ</label>
                    <input
                      type="date"
                      disabled
                      value={leaveEndDate}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-400 font-mono outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">سبب الإجازة</label>
                  <input
                    type="text"
                    placeholder="عذر صحي، ظرف عائلي..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowLeaveModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer">إلغاء</button>
                  <button type="submit" disabled={loading} className="px-4 py-1.5 font-bold rounded-xl text-white bg-sky-600 hover:bg-sky-500 transition text-xs cursor-pointer">
                    {loading ? 'جاري الحفظ...' : 'اعتماد الإجازة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة إضافة موظف جديد */}
        {showAddEmpModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-400" /> إضافة موظف جديد لكادر الشركة
                </h3>
                <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم الموظف *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: EMP-003"
                      value={empCode}
                      onChange={(e) => setEmpCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">القسم *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="المقاولات والمشاريع">المقاولات والمشاريع</option>
                      <option value="أسطول النقل العام">أسطول النقل العام</option>
                      <option value="التجارة والمخزن المركزي">التجارة والمخزن المركزي</option>
                      <option value="الإدارة المالية والمحاسبة">الإدارة المالية والمحاسبة</option>
                      <option value="العقارات والاستثمار">العقارات والاستثمار</option>
                      <option value="الإدارة المركزية">الإدارة المركزية</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">الاسم الثلاثي *</label>
                    <input
                      type="text"
                      required
                      placeholder="اسم الموظف وأبيه وجده"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">اللقب</label>
                    <input
                      type="text"
                      placeholder="اللقب أو العشيرة"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المسمى الوظيفي *</label>
                    <input
                      type="text"
                      required
                      placeholder="مهندس موقع، كابتن، محاسب..."
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">تاريخ المباشرة *</label>
                    <input
                      type="date"
                      required
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <label className="block text-slate-300 font-bold">تاريخ انتهاء العقد:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl cursor-pointer">
                      <input 
                        type="radio" 
                        id="permanent" 
                        name="contractType" 
                        checked={contractType === 'PERMANENT'} 
                        onChange={() => setContractType('PERMANENT')} 
                        className="accent-rose-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="permanent" className="text-white font-bold cursor-pointer">مستمر بالدوام الرسمي</label>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl cursor-pointer">
                      <input 
                        type="radio" 
                        id="fixed" 
                        name="contractType" 
                        checked={contractType === 'FIXED'} 
                        onChange={() => setContractType('FIXED')} 
                        className="accent-rose-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="fixed" className="text-white font-bold cursor-pointer">تاريخ انتهاء محدد</label>
                    </div>
                  </div>

                  {contractType === 'FIXED' && (
                    <div className="pt-1">
                      <label className="block text-amber-400 mb-1 font-semibold">حدد موعد انتهاء العقد *</label>
                      <input
                        type="date"
                        required={contractType === 'FIXED'}
                        value={contractEndDate}
                        onChange={(e) => setContractEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الراتب الأساسي (د.ع) *</label>
                    <input
                      type="number"
                      required
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-rose-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">البدلات (د.ع)</label>
                    <input
                      type="number"
                      value={allowances}
                      onChange={(e) => setAllowances(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-rose-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم الهاتف *</label>
                    <input
                      type="text"
                      required
                      placeholder="078xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رصيد الإجازات السنوي (أيام)</label>
                    <input
                      type="number"
                      value={leaveBalance}
                      onChange={(e) => setLeaveBalance(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-rose-500 font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowAddEmpModal(false)} 
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/25 cursor-pointer"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ وتسجيل الموظف'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة تقييم أداء / إنذار */}
        {showAppraisalModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 shadow-2xl text-right space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" /> إضافة تقييم أداء أو إنذار إداري
                </h3>
                <button onClick={() => setShowAppraisalModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddAppraisal} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">الموظف *</label>
                  <select
                    value={appraisalEmpId}
                    onChange={(e) => setAppraisalEmpId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(e => (
                      <option key={e.employee_id} value={e.employee_id}>
                        {e.full_name} ({e.job_title})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نوع القيد</label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none cursor-pointer"
                    >
                      <option value="APPRAISAL">تقييم أداء وتكريم</option>
                      <option value="PENALTY">إنذار / عقوبة إدارية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الدرجة (من 5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      required
                      value={ratingScore}
                      onChange={(e) => setRatingScore(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono text-center font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">عنوان الإجراء / التقييم *</label>
                  <input
                    type="text"
                    required
                    placeholder="تميز في الأداء، إنذار تأخير..."
                    value={recordTitle}
                    onChange={(e) => setRecordTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">التفاصيل والملاحظات</label>
                  <textarea
                    rows={2}
                    placeholder="تفاصيل التقييم أو مبرر العقوبة..."
                    value={recordDetails}
                    onChange={(e) => setRecordDetails(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAppraisalModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer">إلغاء</button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-4 py-1.5 font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition text-xs cursor-pointer"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ الإجراء'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}