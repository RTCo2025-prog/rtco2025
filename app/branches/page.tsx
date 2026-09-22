'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  MapPin, 
  Phone, 
  User, 
  LogOut, 
  X, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Briefcase, 
  Layers, 
  Activity, 
  ShieldCheck 
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

export default function BranchesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // نموذج إضافة فرع جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [branchCode, setBranchCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [branchType, setBranchType] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('النجف الأشرف');
  const [address, setAddress] = useState('');

  // نموذج تعديل فرع
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [editNameAr, setEditNameAr] = useState('');
  const [editBranchType, setEditBranchType] = useState('');
  const [editManagerName, setEditManagerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');

  const loadData = async () => {
    try {
      const res = await fetch('/api/branches', { cache: 'no-store' });
      const data = await res.json();
      if (data.branches) setBranches(data.branches);
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
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    router.push('/login');
  };

  // استخراج الصلاحيات الدقيقة لقسم الفروع والقطاعات التشغيلية
  const canAdd = useMemo(() => {
    return hasPermission(currentUser, 'branches', 'add');
  }, [currentUser]);

  const canEdit = useMemo(() => {
    return hasPermission(currentUser, 'branches', 'edit');
  }, [currentUser]);

  const canDelete = useMemo(() => {
    return hasPermission(currentUser, 'branches', 'delete');
  }, [currentUser]);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية إضافة فروع أو قطاعات جديدة');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_code: branchCode,
          name_ar: nameAr,
          branch_type: branchType,
          manager_name: managerName,
          phone,
          city,
          address
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setBranchCode('');
        setNameAr('');
        setBranchType('');
        setManagerName('');
        setPhone('');
        setAddress('');
        await loadData();
      } else {
        alert(data.error || 'فشلت إضافة الفرع');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('ليس لديك صلاحية تعديل بيانات الفروع');
      return;
    }
    if (!editingBranch) return;

    setLoading(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: editingBranch.branch_id,
          name_ar: editNameAr,
          branch_type: editBranchType,
          manager_name: editManagerName,
          phone: editPhone,
          city: editCity,
          address: editAddress,
          status: editStatus
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingBranch(null);
        await loadData();
      } else {
        alert(data.error || 'فشل التعديل');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (b: any) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الفروع');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف فرع "${b.name_ar}"؟`)) return;

    try {
      const res = await fetch(`/api/branches?id=${b.branch_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadData();
      } else {
        alert(data.error || 'فشل حذف الفرع');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredBranches = useMemo(() => {
    return branches.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const code = String(b.branch_code || '').toLowerCase();
      const name = String(b.name_ar || '').toLowerCase();
      const type = String(b.branch_type || '').toLowerCase();
      const manager = String(b.manager_name || '').toLowerCase();
      return !q || code.includes(q) || name.includes(q) || type.includes(q) || manager.includes(q);
    });
  }, [branches, searchQuery]);

  if (!currentUser) return null;

  const roleClean = String(currentUser.role || '').toUpperCase();
  const isSuperAdmin = currentUser?.is_super_admin || roleClean === 'ADMIN' || roleClean.includes('إدارة');

  return (
    <AuthGuard moduleName="branches" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
        
        {/* الترويسة الرئيسية */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2.5 rounded-xl text-slate-950 font-black shadow-lg shadow-sky-500/10">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">إدارة الفروع والقطاعات التشغيلية</h1>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  Corporate Hierarchy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">متابعة الفروع الإدارية والتجارية لشركة البرج المتألق والربط السحابي المباشر</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={loadData}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-sky-400 transition"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-2xl">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-500/50 bg-slate-800 flex items-center justify-center">
                {currentUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-sky-400" />
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-tight">{currentUser.full_name}</p>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border inline-block mt-0.5 bg-sky-500/10 text-sky-400 border-sky-500/30">
                  {isSuperAdmin ? 'الإدارة العليا' : currentUser.job_title || 'موظف قطاع'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition mr-1"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <Link href="/" className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs hover:bg-slate-800 transition">
              <ArrowLeft className="w-4 h-4" /> العودة للرئيسية
            </Link>
          </div>
        </div>

        {/* كروت المؤشرات السريعة للفروع */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">إجمالي الفروع المسجلة</span>
            <div className="text-2xl font-black font-mono text-white mt-2">{branches.length} <span className="text-xs text-slate-500 font-sans">فروع</span></div>
            <p className="text-[11px] text-slate-500 mt-1">تغطي أنشطة المقاولات، التجارة، النقل، والاستثمار العقاري</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">الفروع النشطة تشغيلياً</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
              {branches.filter(b => b.status === 'ACTIVE').length} <span className="text-xs text-slate-500 font-sans">فروع نشطة</span>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> تعمل بكامل طاقتها التشغيلية
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">حالة المزامنة السحابية</span>
            <div className="text-2xl font-black font-mono text-sky-400 mt-2">100%</div>
            <span className="text-[11px] text-sky-400 flex items-center gap-1 mt-1">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Neon Cloud Database Live Sync
            </span>
          </div>
        </div>

        {/* شريط الأدوات والبحث */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، الرمز، أو النشاط..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white outline-none focus:border-sky-500"
            />
          </div>

          {canAdd && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-sky-500/20"
            >
              <PlusCircle className="w-4 h-4" /> إضافة فرع أو قطاع جديد
            </button>
          )}
        </div>

        {/* جدول الفروع والقطاعات الشامل */}
        <div className="max-w-7xl mx-auto mt-4 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/70 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-4">رمز الفرع</th>
                  <th className="p-4">اسم الفرع والقطاع</th>
                  <th className="p-4">طبيعة النشاط التجاري</th>
                  <th className="p-4">المدير المسؤول</th>
                  <th className="p-4">الموقع والهاتف</th>
                  <th className="p-4 text-center">الحالة التشغيلية</th>
                  {(canEdit || canDelete) && <th className="p-4 text-center">الإجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit || canDelete ? 7 : 6} className="p-8 text-center text-slate-500 font-sans">لا توجد فروع مسجلة مطابقة للبحث.</td>
                  </tr>
                ) : (
                  filteredBranches.map((b) => (
                    <tr key={b.branch_id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-mono font-bold text-amber-400">{b.branch_code}</td>
                      <td className="p-4 font-bold text-white text-sm">{b.name_ar}</td>
                      <td className="p-4 text-slate-300 font-sans">{b.branch_type}</td>
                      <td className="p-4 text-sky-400 font-semibold">{b.manager_name}</td>
                      <td className="p-4 text-slate-400">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {b.city} - {b.address}</span>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 mt-0.5"><Phone className="w-3 h-3 text-slate-500" /> {b.phone}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          يعمل بنجاح
                        </span>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setEditingBranch(b);
                                  setEditNameAr(b.name_ar);
                                  setEditBranchType(b.branch_type);
                                  setEditManagerName(b.manager_name);
                                  setEditPhone(b.phone);
                                  setEditCity(b.city);
                                  setEditAddress(b.address);
                                  setEditStatus(b.status || 'ACTIVE');
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 transition"
                                title="تعديل بيانات الفرع"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteBranch(b)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 transition"
                                title="حذف الفرع"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* نافذة إضافة فرع جديد */}
        {showAddModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" /> تسجيل فرع أو قطاع جديد
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddBranch} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رمز الفرع المحاسبي *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: IND-01"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المدينة</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">اسم الفرع والقطاع *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فرع الصناعات الإنشائية والخرسانية"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">طبيعة النشاط التجاري والعمليات *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إنتاج وتوريد الخرسانة الجاهزة والمواد مسبقة الصنع"
                    value={branchType}
                    onChange={(e) => setBranchType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المدير المسؤول</label>
                    <input
                      type="text"
                      placeholder="اسم المدير"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم الهاتف</label>
                    <input
                      type="text"
                      placeholder="078..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">العنوان التفصيلي</label>
                  <input
                    type="text"
                    placeholder="الشارع أو المنطقة"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl"
                  >
                    {loading ? 'جاري الحفظ...' : 'تسجيل الفرع'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة تعديل فرع */}
        {editingBranch && canEdit && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-400" /> تعديل الفرع: {editingBranch.branch_code}
                </h3>
                <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">اسم الفرع *</label>
                  <input
                    type="text"
                    required
                    value={editNameAr}
                    onChange={(e) => setEditNameAr(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">النشاط التجاري</label>
                  <input
                    type="text"
                    value={editBranchType}
                    onChange={(e) => setEditBranchType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المدير المسؤول</label>
                    <input
                      type="text"
                      value={editManagerName}
                      onChange={(e) => setEditManagerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم الهاتف</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المدينة</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">العنوان</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingBranch(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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