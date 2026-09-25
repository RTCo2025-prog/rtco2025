'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Sparkles
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
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  const openNewUserModal = () => {
    setEditingUserId(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setJobTitle('');
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
    setJobTitle(u.job_title);
    setStatus(u.status);

    const perms: any = {};
    MODULES.forEach(m => {
      perms[m.key] = u.permissions?.[m.key] || { view: false, add: false, edit: false, delete: false };
    });
    setPermissions(perms);
    setShowModal(true);
  };

  const handleTogglePermission = (moduleKey: string, action: 'view' | 'add' | 'edit' | 'delete') => {
    setPermissions(prev => {
      const currentModule = prev[moduleKey] || { view: false, add: false, edit: false, delete: false };
      const updatedModule = { ...currentModule, [action]: !currentModule[action] };
      
      if (action !== 'view' && updatedModule[action]) {
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
    setLoading(true);
    try {
      const payload: any = {
        action: editingUserId ? 'UPDATE_USER' : 'CREATE_USER',
        username,
        password,
        full_name: fullName,
        job_title: jobTitle,
        status,
        permissions
      };
      if (editingUserId) payload.user_id = editingUserId;

      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
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
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-xs">
        
        {/* الترويسة */}
        <div className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg"
              style={{ background: `linear-gradient(135deg, ${primaryCol}, ${secondaryCol})` }}
            >
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">إدارة الحسابات وصلاحيات الأقسام</h1>
              <p className="text-slate-400">لوحة تحكم المدير المفوض لإنشاء حسابات موظفي {companySettings.company_name} وتخصيص صلاحيات الأقسام بدقة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadSettings();
                loadUsers();
              }}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              title="تحديث القائمة"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={openNewUserModal}
              className="text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer"
              style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
            >
              <PlusCircle className="w-4 h-4" /> إنشاء حساب موظف جديد
            </button>
            <Link href="/" className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-300 hover:text-white flex items-center gap-1.5">
              <Home className="w-4 h-4" /> الرئيسية
            </Link>
          </div>
        </div>

        {/* قائمة الحسابات */}
        <div className="max-w-6xl mx-auto mt-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: primaryCol }} /> الحسابات المعتمدة بالنظام ({users.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">اسم الدخول</th>
                  <th className="p-3">المسمى الوظيفي</th>
                  <th className="p-3">نوع الحساب</th>
                  <th className="p-3">الأقسام المصرح له بها</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
                {users.map(u => {
                  const perms = u.permissions || {};
                  const allowedModules = MODULES.filter(m => perms[m.key]?.view);

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-white">{u.full_name}</td>
                      <td className="p-3 font-mono text-slate-300">{u.username}</td>
                      <td className="p-3 text-slate-400">{u.job_title}</td>
                      <td className="p-3">
                        {u.is_super_admin ? (
                          <span 
                            className="px-2 py-0.5 rounded border text-[10px] font-bold"
                            style={{ backgroundColor: `${primaryCol}20`, color: primaryCol, borderColor: `${primaryCol}40` }}
                          >
                            المدير المفوض (شامل)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            حساب مخصص
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {u.is_super_admin ? (
                          <span className="font-bold" style={{ color: primaryCol }}>كافة الأقسام والصلاحيات ✓</span>
                        ) : allowedModules.length === 0 ? (
                          <span className="text-rose-400">لا توجد أقسام مفعلة</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {allowedModules.map(m => (
                              <span key={m.key} className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-300">
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
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {u.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                            style={{ color: primaryCol }}
                            title="تعديل الصلاحيات"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!u.is_super_admin && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition cursor-pointer"
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

        {/* نافذة تخصيص حساب الموظف والصلاحيات */}
        {showModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4" style={{ color: primaryCol }} />
                  {editingUserId ? 'تعديل الصلاحيات والحساب' : 'إنشاء حساب موظف جديد وتحديد صلاحياته'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
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
                      disabled={!!editingUserId}
                      placeholder="مثال: ali_transport"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-mono"
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المسمى الوظيفي</label>
                    <input
                      type="text"
                      placeholder="محاسب، كابتن نقل..."
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
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
                      return (
                        <div key={m.key} className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs w-44">{m.name}</span>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(m.key, 'view')}
                              className={`px-3 py-1 rounded-lg border text-xs transition cursor-pointer ${
                                perm.view ? 'font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                              style={perm.view ? { backgroundColor: `${primaryCol}25`, color: primaryCol, borderColor: `${primaryCol}50` } : {}}
                            >
                              {perm.view ? '✓ عرض القسم' : 'عرض القسم'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(m.key, 'add')}
                              className={`px-3 py-1 rounded-lg border text-xs transition cursor-pointer ${
                                perm.add ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {perm.add ? '✓ إضافة' : 'إضافة'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(m.key, 'edit')}
                              className={`px-3 py-1 rounded-lg border text-xs transition cursor-pointer ${
                                perm.edit ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {perm.edit ? '✓ تعديل' : 'تعديل'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(m.key, 'delete')}
                              className={`px-3 py-1 rounded-lg border text-xs transition cursor-pointer ${
                                perm.delete ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {perm.delete ? '✓ حذف' : 'حذف'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer"
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