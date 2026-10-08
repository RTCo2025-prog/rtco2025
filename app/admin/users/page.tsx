'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ArrowLeft, 
  PlusCircle, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Lock, 
  X, 
  UserCheck, 
  RefreshCw, 
  Home, 
  CheckCircle2, 
  KeyRound,
  Building2
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

const MODULES = [
  { key: 'fleet', name: 'قطاع النقل والأسطول' },
  { key: 'hr', name: 'الموارد البشرية والرواتب' },
  { key: 'vouchers', name: 'المالية وسندات الصرف والقبض' },
  { key: 'contracting', name: 'المقاولات والمشاريع' },
  { key: 'realestate', name: 'العقارات والاستثمار' },
  { key: 'inventory', name: 'التجارة والمخزن المركزي' },
  { key: 'admin_docs', name: 'الإدارة والكتب الرسمية (صادر/وارد)' },
  { key: 'contracts', name: 'العقود الإلكترونية (سيارات/دور)' },
  { key: 'installments', name: 'المبيعات بالأقساط المدمجة' },
];

export default function UsersManagementPage() {
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [assignedBranchId, setAssignedBranchId] = useState('ALL');
  const [status, setStatus] = useState('ACTIVE');
  const [permissions, setPermissions] = useState<Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }>>({});

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

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches', { cache: 'no-store' });
      const data = await res.json();
      if (data && (data.success || data.branches)) {
        setBranches(data.branches || []);
      }
    } catch (e) {
      console.error('Failed to load branches:', e);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users', { cache: 'no-store' });
      const data = await res.json();
      if (data.users) {
        // إخفاء الحساب السيادي pro برمجياً بحيث لا يظهر في الجدول نهائياً
        setUsers(data.users.filter((u: any) => String(u.username || '').trim().toLowerCase() !== 'pro'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadBranches();
    loadUsers();
  }, []);

  const branchesListOptions = [
    { branch_id: 'ALL', name: '🌐 المقر الرئيسي (عرض المنظومة الموحدة)' },
    ...branches.map(b => ({
      branch_id: b.branch_id,
      name: `📍 ${b.name_ar}`
    }))
  ];

  const getBranchDisplayName = (bId: string) => {
    if (!bId || bId === 'ALL') return 'المقر الرئيسي (عرض المنظومة الموحدة)';
    const found = branches.find(b => b.branch_id === bId);
    return found?.name_ar || bId;
  };

  const openNewUserModal = () => {
    setEditingUserId(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setJobTitle('');
    setAssignedBranchId(branches.length > 0 ? branches[0].branch_id : 'BR-HQ-01');
    setStatus('ACTIVE');

    const defaultPerms: any = {};
    MODULES.forEach(m => {
      defaultPerms[m.key] = { view: false, add: false, edit: false, delete: false };
    });
    setPermissions(defaultPerms);
    setShowModal(true);
  };

  const openEditUserModal = (u: any) => {
    setEditingUserId(u.user_id);
    setUsername(u.username);
    setPassword('');
    setFullName(u.full_name);
    setJobTitle(u.job_title || 'موظف');
    setAssignedBranchId(u.assigned_branch_id || 'ALL');
    setStatus(u.status || 'ACTIVE');

    const isFullAdmin = u.username === 'admin' || u.is_super_admin;
    const existing = u.permissions || {};
    const perms: any = {};

    MODULES.forEach(m => {
      perms[m.key] = {
        view: isFullAdmin ? true : Boolean(existing[m.key]?.view),
        add: isFullAdmin ? true : Boolean(existing[m.key]?.add),
        edit: isFullAdmin ? true : Boolean(existing[m.key]?.edit),
        delete: isFullAdmin ? true : Boolean(existing[m.key]?.delete)
      };
    });
    setPermissions(perms);
    setShowModal(true);
  };

  const handleTogglePermission = (moduleKey: string, action: 'view' | 'add' | 'edit' | 'delete') => {
    setPermissions(prev => {
      const currentModule = prev[moduleKey] || { view: false, add: false, edit: false, delete: false };
      const nextVal = !currentModule[action];
      const updatedModule = { ...currentModule, [action]: nextVal };
      
      if (action !== 'view' && nextVal) {
        updatedModule.view = true;
      }

      return {
        ...prev,
        [moduleKey]: updatedModule
      };
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // حظر إنشاء حساب pro من الواجهة نهائياً
    if (!editingUserId && username.trim().toLowerCase() === 'pro') {
      alert('تنبيه أمني: الحساب (pro) هو حساب سيادي خاص بالمبرمج ولا يمكن إنشاؤه عبر الموقع مطلقاً.');
      return;
    }

    setLoading(true);
    try {
      const isFullAdmin = username.trim().toLowerCase() === 'admin';
      
      let finalPermissions = permissions;
      if (isFullAdmin) {
        const fullPerms: any = {};
        MODULES.forEach(m => {
          fullPerms[m.key] = { view: true, add: true, edit: true, delete: true };
        });
        finalPermissions = fullPerms;
      }

      const payload: any = {
        action: editingUserId ? 'UPDATE_USER' : 'CREATE_USER',
        username: username.trim(),
        full_name: fullName.trim(),
        job_title: jobTitle.trim(),
        assigned_branch_id: isFullAdmin ? 'ALL' : assignedBranchId,
        status,
        permissions: finalPermissions
      };

      if (password && password.trim()) {
        payload.password = password.trim();
      }
      if (editingUserId) payload.user_id = editingUserId;

      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم حفظ وتحديث البيانات والصلاحيات ونطاق الفرع بنجاح!');
        setShowModal(false);
        await loadUsers();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (u.username === 'admin' || u.is_super_admin) {
      alert('حساب المدير المفوض الأساسي محمي ولا يمكن حذفه!');
      return;
    }
    if (!confirm(`تأكيد حذف حساب الموظف (${u.full_name})؟`)) return;

    try {
      const res = await fetch(`/api/auth/users?id=${u.user_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadUsers();
      } else {
        alert(data.error || 'فشل حذف الحساب');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';

  return (
    <AuthGuard>
      <div dir="rtl" className="min-h-screen bg-[#06080e] text-slate-100 p-4 md:p-8 font-cairo text-xs">
        
        {/* الترويسة العلوية */}
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${primaryCol}, ${secondaryCol})` }}
            >
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white">إدارة الحسابات وتخصيص الفروع والصلاحيات</h1>
              <p className="text-slate-400 mt-0.5">لوحة تحكم المدير المفوض لإنشاء حسابات موظفي {companySettings.company_name} وحصر فروعهم وتخصيص صلاحيات الأقسام بدقة</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            <button
              onClick={() => {
                loadSettings();
                loadBranches();
                loadUsers();
              }}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              title="تحديث القائمة"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openNewUserModal}
              className="text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer"
              style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
            >
              <PlusCircle className="w-4 h-4" /> إنشاء حساب موظف جديد
            </button>
            <Link href="/" className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white flex items-center gap-1.5 font-bold transition">
              <Home className="w-4 h-4" /> الرئيسية
            </Link>
          </div>
        </div>

        {/* جدول الحسابات */}
        <div className="max-w-6xl mx-auto mt-6 bg-[#0b101d] border border-slate-800/90 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: primaryCol }} /> الحسابات المعتمدة بالنظام ({users.length})
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0e1424] text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3.5">اسم الموظف</th>
                  <th className="p-3.5">اسم الدخول</th>
                  <th className="p-3.5">المسمى الوظيفي</th>
                  <th className="p-3.5">نطاق الفرع المخصص</th>
                  <th className="p-3.5">نوع الحساب</th>
                  <th className="p-3.5">الأقسام المصرح له بها</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {users.map(u => {
                  const isAdm = u.username === 'admin' || u.is_super_admin;
                  const perms = u.permissions || {};
                  const allowedModules = MODULES.filter(m => perms[m.key]?.view);
                  const branchDisplayName = getBranchDisplayName(u.assigned_branch_id);

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 font-bold text-white">{u.full_name}</td>
                      <td className="p-3.5 font-mono text-slate-300 font-bold">{u.username}</td>
                      <td className="p-3.5 text-slate-400">{u.job_title}</td>
                      <td className="p-3.5">
                        {isAdm || u.assigned_branch_id === 'ALL' || !u.assigned_branch_id ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            🌐 كافة الفروع
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            📍 {branchDisplayName}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isAdm ? (
                          <span 
                            className="px-2.5 py-1 rounded-full border text-[10px] font-black"
                            style={{ backgroundColor: `${primaryCol}20`, color: primaryCol, borderColor: `${primaryCol}40` }}
                          >
                            المدير المفوض (شامل)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                            حساب مخصص
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isAdm ? (
                          <span className="font-bold text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> كافة الأقسام والصلاحيات
                          </span>
                        ) : allowedModules.length === 0 ? (
                          <span className="text-rose-400 font-bold">لا توجد أقسام مفعلة</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {allowedModules.map(m => (
                              <span key={m.key} className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-sans">
                                {m.name} ({[
                                  perms[m.key]?.add ? 'إضافة' : '',
                                  perms[m.key]?.edit ? 'تعديل' : '',
                                  perms[m.key]?.delete ? 'حذف' : ''
                                ].filter(Boolean).join(', ') || 'عرض'})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {u.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition cursor-pointer"
                            style={{ color: primaryCol }}
                            title="تعديل الصلاحيات والفرع"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!isAdm && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 bg-slate-900 hover:bg-rose-900/40 text-rose-400 border border-slate-700 rounded-lg transition cursor-pointer"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* نافذة تخصيص حساب الموظف والفرع والصلاحيات */}
        {showModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b101d] border border-slate-700 w-full max-w-2xl rounded-3xl p-5 md:p-6 shadow-2xl text-right space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4" style={{ color: primaryCol }} />
                  {editingUserId ? 'تعديل الصلاحيات وحصر الفرع للحساب' : 'إنشاء حساب موظف جديد وتحديد فرعه وصلاحياته'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">اسم المستخدم (Login Username) *</label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      disabled={!!editingUserId}
                      placeholder="اسم الدخول بالإنجليزية"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none font-mono focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      {editingUserId ? 'كلمة المرور (اتركها فارغة إذا لم ترغب بتغييرها)' : 'كلمة المرور *'}
                    </label>
                    <input
                      type="password"
                      required={!editingUserId}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">اسم الموظف الكامل *</label>
                    <input
                      type="text"
                      required
                      placeholder="الاسم الثلاثي واللقب"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المسمى الوظيفي</label>
                    <input
                      type="text"
                      placeholder="محاسب، كابتن نقل..."
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* تحديد وحصر الفرع من قاعدة البيانات ديناميكياً */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <label className="block text-amber-400 mb-1.5 font-bold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> الفرع المخصص للعمل (حصر نطاق البيانات):
                  </label>
                  <select
                    value={assignedBranchId}
                    onChange={(e) => setAssignedBranchId(e.target.value)}
                    disabled={username.trim().toLowerCase() === 'admin'}
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-2.5 text-amber-300 font-bold outline-none cursor-pointer"
                  >
                    {branchesListOptions.map(b => (
                      <option key={b.branch_id} value={b.branch_id} className="bg-[#0b101d] text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    * عند اختيار فرع محدد، سيتم قفل المنظومة تلقائياً للموظف على هذا الفرع ولن يتمكن من رؤية أو التبديل لباقي الأفرع.
                  </p>
                </div>

                {/* تحديد الأقسام والصلاحيات */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: primaryCol }}>
                      <Lock className="w-3.5 h-3.5" /> تحديد الأقسام المصرح بدخولها والإجراءات المسموحة:
                    </span>
                  </div>

                  <div className="space-y-2">
                    {MODULES.map(m => {
                      const perm = permissions[m.key] || { view: false, add: false, edit: false, delete: false };
                      const isFullAdmin = username.trim().toLowerCase() === 'admin';

                      return (
                        <div key={m.key} className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs sm:w-48">{m.name}</span>
                          
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(m.key, 'view')}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                                isFullAdmin || perm.view ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}
                            >
                              عرض القسم {isFullAdmin || perm.view ? '✓' : ''}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(m.key, 'add')}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                                isFullAdmin || perm.add ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}
                            >
                              إضافة {isFullAdmin || perm.add ? '✓' : ''}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(m.key, 'edit')}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                                isFullAdmin || perm.edit ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}
                            >
                              تعديل {isFullAdmin || perm.edit ? '✓' : ''}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(m.key, 'delete')}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                                isFullAdmin || perm.delete ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}
                            >
                              حذف {isFullAdmin || perm.delete ? '✓' : ''}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer font-bold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer transition"
                    style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ وتطبيق الصلاحيات'}
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