'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Branch {
  branch_id: string;
  branch_code: string;
  name_ar: string;
  branch_type: string;
  manager_name: string;
  phone: string;
  city: string;
  address: string;
  status: string;
  created_at?: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // نموذج إضافة / تعديل فرع
  const [formData, setFormData] = useState({
    branch_id: '',
    branch_code: '',
    name_ar: '',
    branch_type: 'تنفيذ المشاريع الإنشائية والهندسية',
    manager_name: '',
    phone: '',
    city: 'النجف الأشرف',
    address: '',
    status: 'ACTIVE'
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches || []);
      }
    } catch (err) {
      console.error('Fetch branches error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      branch_id: '',
      branch_code: `BR-0${branches.length + 1}`,
      name_ar: '',
      branch_type: 'تنفيذ المشاريع الإنشائية والهندسية',
      manager_name: '',
      phone: '',
      city: 'النجف الأشرف',
      address: '',
      status: 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (b: Branch) => {
    setFormData({
      branch_id: b.branch_id,
      branch_code: b.branch_code,
      name_ar: b.name_ar,
      branch_type: b.branch_type,
      manager_name: b.manager_name,
      phone: b.phone,
      city: b.city,
      address: b.address,
      status: b.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ar || !formData.branch_code) {
      alert('يرجى كتابة اسم الفرع وكود الفرع');
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(formData.branch_id);
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch('/api/branches', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (res.ok && (result.success || result.branch)) {
        setShowModal(false);
        fetchBranches();
      } else {
        alert(result.error || 'تعذر حفظ بيانات الفرع');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الفرع (${name})؟`)) return;

    try {
      const res = await fetch(`/api/branches?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setBranches((prev) => prev.filter((b) => b.branch_id !== id));
      } else {
        alert(data.error || 'فشل حذف الفرع');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ أثناء الحذف');
    }
  };

  const filteredBranches = branches.filter((b) =>
    (b.name_ar || '').includes(searchTerm) ||
    (b.branch_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.manager_name || '').includes(searchTerm) ||
    (b.city || '').includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#0b1320] text-slate-100 p-4 md:p-8 font-sans" dir="rtl">
      {/* الشريط العلوي */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
              إدارة الفروع والمقرات الإدارية
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            متابعة الفروع المعتمدة لشركة البرج المتألق وتوزيع الهيكل التشغيلي
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm transition"
          >
            الرئيسية
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <span>+</span>
            <span>إضافة فرع جديد</span>
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-medium">إجمالي الفروع المسجلة</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{branches.length} فرع</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-xl font-bold">
            🏢
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-medium">الفروع النشطة</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {branches.filter((b) => b.status === 'ACTIVE').length} فرع
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl font-bold">
            ✓
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-medium">المدينة الرئيسية</div>
            <div className="text-2xl font-black text-blue-400 mt-1">النجف الأشرف</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold">
            📍
          </div>
        </div>
      </div>

      {/* شريط البحث */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="البحث باسم الفرع، الرمز، المسؤول، أو المدينة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 transition"
          />
        </div>
      </div>

      {/* قائمة الفروع */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-16 text-slate-500">جاري تحميل بيانات الفروع...</div>
        ) : filteredBranches.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400">
            لا توجد فروع مطابقة لعملية البحث
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBranches.map((branch) => (
              <div
                key={branch.branch_id}
                className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {branch.branch_code}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        branch.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {branch.status === 'ACTIVE' ? 'نشط تشغيلياً' : 'متوقف'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                    {branch.name_ar}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{branch.branch_type}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">المسؤول:</span>
                      <span className="font-medium text-slate-200">{branch.manager_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الهاتف:</span>
                      <span className="font-mono text-slate-200">{branch.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الموقع / العنوان:</span>
                      <span className="text-slate-200">
                        {branch.city} - {branch.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(branch)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition cursor-pointer"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(branch.branch_id, branch.name_ar)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 font-medium transition cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نافذة الإضافة / التعديل */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101928] border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {formData.branch_id ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد للمنظومة'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">رمز الفرع (Code) *</label>
                  <input
                    type="text"
                    required
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="مثال: BR-06"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">اسم الفرع بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="مثال: فرع الصيانة والتطوير"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">نوع القطاع / طبيعة العمل</label>
                <input
                  type="text"
                  value={formData.branch_type}
                  onChange={(e) => setFormData({ ...formData, branch_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="مثال: تنفيذ المشاريع الإنشائية والهندسية"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">اسم المدير / المسؤول</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="اسم المسؤول المعتمد"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="078xxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">المدينة</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">العنوان / الموقع</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="مثال: حي الفرات"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">الحالة التشغيلية</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">نشط (ACTIVE)</option>
                  <option value="INACTIVE">متوقف (INACTIVE)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}