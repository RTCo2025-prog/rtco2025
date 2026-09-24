'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  User, 
  X, 
  RefreshCw, 
  Trash2, 
  Coins, 
  Wallet, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  CreditCard,
  Building2,
  FileSpreadsheet,
  FileText,
  FileCheck,
  Home,
  Sparkles
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

export default function RealEstatePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  // نموذج إضافة وحدة
  const [showAddModal, setShowAddModal] = useState(false);
  const [unitCode, setUnitCode] = useState('');
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('شقة سكنية فاخرة');
  const [areaSqm, setAreaSqm] = useState('180');
  const [price, setPrice] = useState('120000000');
  const [city, setCity] = useState('النجف الأشرف');
  const [location, setLocation] = useState('شارع الكوفة - حي الفرات');
  const [notes, setNotes] = useState('');

  // نموذج بيع وحدة وجدولة الأقساط
  const [sellingUnit, setSellingUnit] = useState<any | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [downPayment, setDownPayment] = useState('40000000');
  const [installmentsCount, setInstallmentsCount] = useState('12');

  const loadData = async () => {
    try {
      const res = await fetch('/api/real-estate', { cache: 'no-store' });
      const data = await res.json();
      if (data.units) setUnits(data.units);
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

  const canAdd = useMemo(() => {
    return hasPermission(currentUser, 'realestate', 'add');
  }, [currentUser]);

  const canEdit = useMemo(() => {
    return hasPermission(currentUser, 'realestate', 'edit');
  }, [currentUser]);

  const canDelete = useMemo(() => {
    return hasPermission(currentUser, 'realestate', 'delete');
  }, [currentUser]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية إضافة وحدات عقارية جديدة');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_UNIT',
          unit_code: unitCode,
          title,
          property_type: propertyType,
          area_sqm: areaSqm,
          price,
          city,
          location,
          notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setUnitCode('');
        setTitle('');
        await loadData();
      } else {
        alert(data.error || 'فشلت إضافة الوحدة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSellUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && !canAdd) {
      alert('ليس لديك صلاحية تسجيل بيع الوحدات العقارية');
      return;
    }
    if (!sellingUnit) return;
    setLoading(true);
    try {
      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SELL_UNIT',
          unit_id: sellingUnit.unit_id,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          down_payment: downPayment,
          installments_count: installmentsCount,
          total_price: sellingUnit.price
        })
      });

      if (res.ok) {
        alert('تم بيع الوحدة وتوليد سند قبض للدفعة المقدمة بنجاح!');
        setSellingUnit(null);
        setBuyerName('');
        setBuyerPhone('');
        await loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async (inst: any, unit: any) => {
    if (!canEdit && !canAdd) {
      alert('ليس لديك صلاحية تسجيل وقبض الأقساط');
      return;
    }
    if (!confirm(`تأكيد قبض القسط بمبلغ (${formatNum(inst.amount)} د.ع) وتوليد سند قبض رسمي؟`)) return;
    try {
      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAY_INSTALLMENT',
          installment_id: inst.installment_id,
          unit_id: unit.unit_id,
          amount: inst.amount,
          buyer_name: unit.buyer_name,
          installment_title: inst.installment_title
        })
      });

      if (res.ok) {
        alert('تم قيد القسط وتوليد سند القبض في السندات والحسابات بنجاح!');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUnit = async (unit: any) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الوحدات العقارية');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف الوحدة العقارية (${unit.title})؟`)) return;
    try {
      const res = await fetch(`/api/real-estate?id=${unit.unit_id}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(u.title).toLowerCase().includes(q) || 
        String(u.unit_code).toLowerCase().includes(q) ||
        String(u.buyer_name || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [units, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalCount = units.length;
    const soldUnits = units.filter(u => u.status === 'SOLD').length;
    const availableUnits = units.filter(u => u.status === 'AVAILABLE').length;
    const totalPortfolioValue = units.reduce((acc, u) => acc + Number(u.price || 0), 0);
    const totalCollected = units.reduce((acc, u) => acc + Number(u.totalPaid || 0), 0);

    return { totalCount, soldUnits, availableUnits, totalPortfolioValue, totalCollected };
  }, [units]);

  if (!currentUser) return null;

  return (
    <AuthGuard moduleName="realestate" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
        
        {/* الترويسة الرئيسية المحسنة بتصميم متناسق ومؤطر بالكامل */}
        <div className="max-w-7xl mx-auto pb-6 border-b border-slate-800/80">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
            
            {/* الطرف الأيمن: الأيقونة والعنوان والشارة */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-500 p-3 rounded-2xl text-slate-950 font-black shadow-xl shadow-purple-500/20 shrink-0 flex items-center justify-center">
                <Building className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                    قطاع التطوير والاستثمار العقاري
                  </h1>
                  <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[11px] font-bold px-3 py-0.5 rounded-full shadow-inner font-mono">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Real Estate & Units
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  شركة البرج المتألق • إدارة العقارات والوحدات السكنية وجدولة الأقساط الاستثمارية للعملاء
                </p>
              </div>
            </div>

            {/* الطرف الأيسر: شريط الإجراءات وأزرار التنقل السريع في سطر واحد ثابت */}
            <div className="flex items-center gap-2 flex-nowrap shrink-0 self-end xl:self-auto overflow-x-auto">
              <Link
                href="/real-estate/contracts"
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-purple-600/20 border border-purple-400/30 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" /> برنامج العقود الإلكترونية الرسمية
              </Link>

              <button 
                onClick={loadData} 
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-purple-400 transition cursor-pointer active:scale-95 shadow-sm"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <Link 
                href="/" 
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" /> الرئيسية
              </Link>
            </div>

          </div>
        </div>

        {/* كروت المؤشرات الكلية للعقارات */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">إجمالي القيمة السوقية للمحفظة</span>
            <div className="text-xl font-black font-mono text-purple-400 mt-2">
              {formatNum(stats.totalPortfolioValue)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">لعدد {stats.totalCount} وحدات وعقارات مسجلة</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">المقبوض من الدفعات والأقساط</span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-2">
              {formatNum(stats.totalCollected)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">مرحّلة كلياً لسندات القبض بالحسابات</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">الوحدات المباعة والمستثمرة</span>
            <div className="text-xl font-black font-mono text-sky-400 mt-2">
              {stats.soldUnits} <span className="text-xs font-sans text-slate-500">وحدات</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">بعقود بيع وأقساط جارية</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">الوحدات الجاهزة والمتاحة للبيع</span>
            <div className="text-xl font-black font-mono text-amber-400 mt-2">
              {stats.availableUnits} <span className="text-xs font-sans text-slate-500">وحدات متاحة</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">معروضة للمستثمرين والمشترين</p>
          </div>
        </div>

        {/* شريط الأدوات والبحث */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم، الرمز، أو المشتري..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="AVAILABLE">متاح للبيع</option>
              <option value="SOLD">مباع وله أقساط</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canAdd && (
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-600/20"
              >
                <PlusCircle className="w-4 h-4" /> إضافة وحدة عقارية جديدة
              </button>
            )}
          </div>
        </div>

        {/* قائمة بطاقات الوحدات العقارية */}
        <div className="max-w-7xl mx-auto space-y-4 mt-6">
          {filteredUnits.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-2xl text-slate-500 text-xs">
              لا توجد وحدات عقارية مسجلة مطابقة للبحث.
            </div>
          ) : (
            filteredUnits.map((u) => {
              const isExpanded = expandedUnitId === u.unit_id;
              const isSold = u.status === 'SOLD';

              return (
                <div key={u.unit_id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition hover:border-slate-700">
                  
                  {/* رأس بطاقة العقار */}
                  <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          {u.unit_code}
                        </span>
                        <h3 className="text-base font-bold text-white">{u.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSold ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isSold ? 'مباعة (أقساط)' : 'متاحة للبيع'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {u.property_type} • المساحة: <strong className="text-slate-200">{u.area_sqm} م²</strong> • الموقع: <strong className="text-slate-200">{u.city} - {u.location}</strong>
                      </p>
                      {isSold && (
                        <p className="text-[11px] text-sky-300">
                          المشتري: <strong>{u.buyer_name}</strong> (هاتف: {u.buyer_phone})
                        </p>
                      )}
                    </div>

                    {/* الأرقام المالية وإجراءات الوحدة */}
                    <div className="flex items-center gap-6 self-stretch lg:self-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                      <div className="text-center font-mono">
                        <span className="text-[10px] text-slate-500 block font-sans">سعر البيع</span>
                        <span className="text-xs font-bold text-purple-400">{formatNum(u.price)} د.ع</span>
                      </div>

                      {isSold && (
                        <div className="text-center font-mono">
                          <span className="text-[10px] text-slate-500 block font-sans">المسدد / المتبقي</span>
                          <span className="text-xs font-bold text-emerald-400">{formatNum(u.totalPaid)}</span> / <span className="text-xs text-rose-400">{formatNum(u.totalRemaining)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {!isSold ? (
                          (canEdit || canAdd) && (
                            <button
                              onClick={() => {
                                setSellingUnit(u);
                                setDownPayment(String(Math.round(Number(u.price) * 0.3)));
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow"
                            >
                              <Coins className="w-3.5 h-3.5" /> تسجيل بيع وأقساط
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => setExpandedUnitId(isExpanded ? null : u.unit_id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1"
                          >
                            <span>{isExpanded ? 'إخفاء الأقساط' : 'جدول سداد الأقساط'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteUnit(u)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/20 transition"
                            title="حذف الوحدة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* الجزء الموسع: جدول الأقساط ومواعيد السداد */}
                  {isExpanded && isSold && (
                    <div className="bg-slate-950/80 p-5 border-t border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4" /> جدول سداد الأقساط الشهرية المسجلة
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          المدفوع: {formatNum(u.totalPaid)} د.ع من إجمالي: {formatNum(u.price)} د.ع
                        </span>
                      </div>

                      <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-900 text-slate-400 text-[11px]">
                            <tr>
                              <th className="p-2.5">عنوان القسط / الدفعة</th>
                              <th className="p-2.5">المبلغ المطلوب</th>
                              <th className="p-2.5">تاريخ الاستحقاق</th>
                              <th className="p-2.5 text-center">حالة السداد</th>
                              <th className="p-2.5 text-center">الإجراء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-mono">
                            {(!u.installments || u.installments.length === 0) ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                                  لا توجد أقساط مجدولة لهذه الوحدة.
                                </td>
                              </tr>
                            ) : (
                              u.installments.map((inst: any) => (
                                <tr key={inst.installment_id} className="hover:bg-slate-900/40">
                                  <td className="p-2.5 font-bold text-white font-sans">{inst.installment_title}</td>
                                  <td className="p-2.5 font-bold text-emerald-400">{formatNum(inst.amount)} د.ع</td>
                                  <td className="p-2.5 text-slate-400">{String(inst.due_date || '').split('T')[0]}</td>
                                  <td className="p-2.5 text-center font-sans">
                                    {inst.is_paid ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        تم السداد وتوليد السند ✓
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        قيد الانتظار
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-center font-sans">
                                    {!inst.is_paid && (canEdit || canAdd) && (
                                      <button
                                        onClick={() => handlePayInstallment(inst, u)}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-[11px] transition shadow"
                                      >
                                        تسجيل القبض
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* نافذة إضافة وحدة جديدة */}
        {showAddModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" /> تسجيل وحدة عقارية جديدة
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUnit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رمز الوحدة *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: APT-101"
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نوع العقار</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    >
                      <option value="شقة سكنية فاخرة">شقة سكنية فاخرة</option>
                      <option value="فيلا مستقلة">فيلا مستقلة</option>
                      <option value="محل / مساحة تجارية">محل / مساحة تجارية</option>
                      <option value="قطعة أرض استثمارية">قطعة أرض استثمارية</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">اسم / وصف الوحدة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شقة دوبلكس إطلالة على الشارع الرئيسي"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المساحة (م²) *</label>
                    <input
                      type="number"
                      required
                      value={areaSqm}
                      onChange={(e) => setAreaSqm(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">السعر الكلي (د.ع) *</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المدينة</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الموقع التفصيلي</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">إلغاء</button>
                  <button type="submit" disabled={loading} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl">
                    {loading ? 'جاري الحفظ...' : 'حفظ الوحدة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة بيع وحدة وجدولة الأقساط */}
        {sellingUnit && (canEdit || canAdd) && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" /> بيع وحدة: {sellingUnit.title}
                </h3>
                <button onClick={() => setSellingUnit(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSellUnit} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono flex justify-between">
                  <span className="text-slate-400 font-sans">السعر الإجمالي للوحدة:</span>
                  <span className="font-bold text-purple-400">{formatNum(sellingUnit.price)} د.ع</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">اسم المشتري / العميل *</label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم الكامل"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="078..."
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الدفعة الأولى (المقدمة) د.ع *</label>
                    <input
                      type="number"
                      required
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">عدد الأقساط الشهرية</label>
                    <select
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    >
                      <option value="6">6 أشهر</option>
                      <option value="12">12 شهراً (سنة)</option>
                      <option value="24">24 شهراً (سنتان)</option>
                      <option value="36">36 شهراً (3 سنوات)</option>
                    </select>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                  سيتم توليد سند قبض مالي للدفعة المقدمة فوراً، وجدولة بقية الأقساط شهرياً تلقائياً.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setSellingUnit(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">إلغاء</button>
                  <button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl">
                    {loading ? 'جاري التنفيذ...' : 'تأكيد البيع والأقساط'}
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