'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  RefreshCw, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Boxes, 
  HardHat, 
  X, 
  Store, 
  Calendar, 
  RotateCcw, 
  Coins, 
  Wallet, 
  ShoppingBag, 
  Printer, 
  FileText,
  CreditCard,
  Home,
  Sparkles
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

export default function InventoryPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalItemsCount: 0, totalInventoryValue: 0, lowStockCount: 0, lowStockItems: [] });
  const [loading, setLoading] = useState(false);

  // فلاتر البحث والتصنيف والتاريخ
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'ITEMS_LIST' | 'TRANSACTIONS_LOG' | 'LOW_STOCK'>('ITEMS_LIST');

  // نافذة تعريف صنف / بضاعة جديدة
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('مواد إنشائية وبناء');
  const [unit, setUnit] = useState('طن');
  const [initialQty, setInitialQty] = useState('0');
  const [minQty, setMinQty] = useState('5');
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('المخزن المركزي الرئيسي - النجف');

  // نافذة حركة مخزنية وتجارية
  const [selectedItemForTrans, setSelectedItemForTrans] = useState<any | null>(null);
  const [transType, setTransType] = useState<'IN' | 'OUT'>('IN');
  const [transQty, setTransQty] = useState('');
  const [transPrice, setTransPrice] = useState('');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [isExternalSale, setIsExternalSale] = useState(true);
  const [partyName, setPartyName] = useState('');
  const [transNotes, setTransNotes] = useState('');

  // إذن مخزني رسمي للطباعة A4
  const [printedReceipt, setPrintedReceipt] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setTransactions(data.transactions || []);
        setProjects(data.projects || []);
        setSummary(data.summary || { totalItemsCount: 0, totalInventoryValue: 0, lowStockCount: 0, lowStockItems: [] });
      }
    } catch (err) {
      console.error(err);
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

  const canAdd = useMemo(() => {
    return hasPermission(currentUser, 'inventory', 'add');
  }, [currentUser]);

  const canEdit = useMemo(() => {
    return hasPermission(currentUser, 'inventory', 'edit');
  }, [currentUser]);

  const canDelete = useMemo(() => {
    return hasPermission(currentUser, 'inventory', 'delete');
  }, [currentUser]);

  const setQuickRange = (type: 'THIS_MONTH' | 'THIS_YEAR' | 'ALL') => {
    const now = new Date();
    if (type === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (type === 'THIS_YEAR') {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => {
      const trDate = String(tr.created_at || '').split('T')[0];
      if (startDate && trDate < startDate) return false;
      if (endDate && trDate > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const financialAnalytics = useMemo(() => {
    let periodSales = 0;
    let periodPurchases = 0;
    let periodProjectIssues = 0;
    let costOfGoodsSold = 0;

    filteredTransactions.forEach(tr => {
      const total = Number(tr.total_amount) || 0;
      const qty = Number(tr.quantity) || 0;

      if (tr.trans_type === 'IN') {
        periodPurchases += total;
      } else if (tr.trans_type === 'OUT') {
        if (tr.purpose === 'COMMERCIAL_SALE' || tr.project_name === 'بيع تجارة عامة' || tr.project_name === 'بيع تجاري خارجي' || String(tr.supplier_or_recipient || '').includes('بيع تجاري')) {
          periodSales += total;
          const originalItem = items.find(i => i.item_id === tr.item_id);
          const origCost = Number(originalItem?.unit_cost || 0);
          costOfGoodsSold += (qty * origCost);
        } else {
          periodProjectIssues += total;
        }
      }
    });

    const netTradeProfit = periodSales - costOfGoodsSold;
    const profitMargin = periodSales > 0 ? ((netTradeProfit / periodSales) * 100).toFixed(1) : '0';

    return {
      periodSales,
      periodPurchases,
      periodProjectIssues,
      costOfGoodsSold,
      netTradeProfit,
      profitMargin
    };
  }, [filteredTransactions, items]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية إضافة أصناف جديدة للمخزن');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_ITEM',
          item_code: itemCode,
          name: itemName,
          category,
          unit,
          quantity_on_hand: initialQty,
          unit_cost: unitCost,
          selling_price: sellingPrice,
          min_reorder_level: minQty,
          location: warehouseLocation
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setItemCode('');
        setItemName('');
        setUnitCost('');
        setSellingPrice('');
        await loadData();
      } else {
        alert(data.error || 'فشلت إضافة المادة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStockTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية قيد حركات مخزنية أو تجارية');
      return;
    }
    if (!selectedItemForTrans) return;

    if (transType === 'OUT' && !isExternalSale && !targetProjectId) {
      alert('يرجى اختيار المشروع المستلم لتنزيل التكلفة عليه');
      return;
    }

    setLoading(true);
    const projObj = projects.find(p => p.project_id === targetProjectId);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_TRANSACTION',
          item_id: selectedItemForTrans.item_id,
          trans_type: transType,
          purpose: transType === 'IN' ? 'PURCHASE' : isExternalSale ? 'COMMERCIAL_SALE' : 'PROJECT_ISSUE',
          quantity: transQty,
          unit_price: transPrice || (transType === 'IN' ? selectedItemForTrans.unit_cost : (isExternalSale ? (selectedItemForTrans.selling_price || selectedItemForTrans.unit_cost) : selectedItemForTrans.unit_cost)),
          project_id: (transType === 'OUT' && !isExternalSale) ? targetProjectId : null,
          project_name: (transType === 'OUT' && !isExternalSale) ? projObj?.project_name : '',
          supplier_or_recipient: partyName,
          notes: transNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم قيد الحركة بنجاح وتحديث الرصيد التلقائي بالمخزن!');
        setSelectedItemForTrans(null);
        setTransQty('');
        setTransPrice('');
        setTargetProjectId('');
        setIsExternalSale(true);
        setPartyName('');
        setTransNotes('');
        await loadData();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الأصناف من المخزن');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف صنف "${item.name || item.item_name}" من المخزن وكافة حركاته؟`)) return;
    try {
      const res = await fetch(`/api/inventory?item_id=${item.item_id}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTransaction = async (transId: string) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الأذونات المخزنية');
      return;
    }
    if (!confirm('تأكيد حذف هذا الإذن المخزني وعكس كميته على الرصيد؟')) return;
    try {
      const res = await fetch(`/api/inventory?trans_id=${transId}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const q = searchQuery.toLowerCase().trim();
      const name = String(i.name || i.item_name || '').toLowerCase();
      const code = String(i.item_code || '').toLowerCase();
      const cat = String(i.category || '').toLowerCase();

      const matchSearch = !q || name.includes(q) || code.includes(q) || cat.includes(q);
      const matchCategory = selectedCategory === 'ALL' || i.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const lowStockItemsList = useMemo(() => {
    return items.filter(item => {
      const qty = Number(item.quantity_on_hand ?? item.current_qty ?? 0);
      const min = Number(item.min_reorder_level ?? item.min_qty ?? 5);
      return qty <= min;
    });
  }, [items]);

  if (!currentUser) return null;

  return (
    <AuthGuard moduleName="inventory" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        {/* الترويسة الرئيسية المحسنة بتصميم متناسق ومؤطر بالكامل دون التفاف أو نزول للأزرار */}
        <div className="max-w-7xl mx-auto pb-6 border-b border-slate-800/80 print:hidden">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
            
            {/* الطرف الأيمن: الأيقونة والعنوان والشارة */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-3 rounded-2xl text-slate-950 font-black shadow-xl shadow-amber-500/20 shrink-0 flex items-center justify-center">
                <Boxes className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                    قطاع التجارة العامة والمخزن المركزي وإدارة التوريدات
                  </h1>
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-3 py-0.5 rounded-full shadow-inner font-mono">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Enterprise Inventory & Smart Orders
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  شركة البرج المتألق • أذونات الاستلام، الصرف الموقعي، والنواقص، والتحليل المالي
                </p>
              </div>
            </div>

            {/* الطرف الأيسر: شريط الإجراءات في سطر واحد ثابت يمنع التكدس */}
            <div className="flex items-center gap-2 flex-nowrap shrink-0 self-end xl:self-auto overflow-x-auto">
              <Link 
                href="/inventory/installments" 
                className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" /> نظام بيع الأقساط والتجارة الآجلة
              </Link>

              <button 
                onClick={loadData} 
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-amber-400 transition cursor-pointer active:scale-95 shadow-sm" 
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <Link 
                href="/" 
                className="px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" /> الرئيسية
              </Link>
            </div>

          </div>
        </div>

        {/* تنبيه النواقص وحد الطلب التلقائي */}
        {lowStockItemsList.length > 0 && (
          <div className="max-w-7xl mx-auto mt-6 bg-gradient-to-r from-rose-500/15 via-slate-900 to-transparent border-r-4 border-rose-500 border border-slate-800/80 p-4 rounded-3xl flex items-center justify-between print:hidden shadow-lg">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-[14px]">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <span>تنبيه النواقص: لديك ({lowStockItemsList.length}) أصناف وصلت لحد الأمان وإعادة الطلب!</span>
            </div>
            <button 
              onClick={() => setActiveTab('LOW_STOCK')}
              className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              عرض قائمة النواقص ➔
            </button>
          </div>
        )}

        {/* شريط فلترة التاريخ المتقدم */}
        <div className="max-w-7xl mx-auto mt-6 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl print:hidden">
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-[14px]">
              <Calendar className="w-4 h-4" />
              <span>نطاق التحليل المالي للمخزون والتجارة:</span>
            </div>

            <div className="flex items-center gap-2 text-[14px]">
              <span className="text-slate-400">من:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-[14px]">
              <span className="text-slate-400">إلى:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setQuickRange('THIS_MONTH')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setQuickRange('THIS_YEAR')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              هذا العام
            </button>
            <button
              onClick={() => setQuickRange('ALL')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> الكل
            </button>
          </div>
        </div>

        {/* المؤشرات المالية والتشغيلية الموحدة */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 print:hidden">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-lg shadow-sky-500/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] text-slate-400 font-semibold block flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-sky-400" /> مبيعات التجارة الخارجية بالفترة
                </span>
                <div className="text-2xl font-black font-mono text-sky-400 mt-2">
                  {formatNum(financialAnalytics.periodSales)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">إيرادات البيع التجاري المقيدة بحسابات الصندوق</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] text-slate-400 font-semibold block flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-400" /> صافي الربح التجاري المحقق
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
                  {formatNum(financialAnalytics.netTradeProfit)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-mono font-bold">
                {financialAnalytics.profitMargin}% هامش
              </div>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">المبيعات بعد استبعاد تكلفة البضاعة المباشرة</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-lg shadow-rose-500/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] text-slate-400 font-semibold block flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" /> توريدات واستيراد بضاعة جديدة
                </span>
                <div className="text-2xl font-black font-mono text-rose-400 mt-2">
                  {formatNum(financialAnalytics.periodPurchases)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">إجمالي مشتريات المخزن في هذه الفترة</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] text-slate-400 font-semibold block flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-amber-400" /> مواد مصروفة لمشاريع الشركة
                </span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-2">
                  {formatNum(financialAnalytics.periodProjectIssues)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <HardHat className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">مرحّلة لتكاليف مشاريع المقاولات تلقائياً</p>
          </div>
        </div>

        {/* شريط التحكم بالتبويبات الموحد */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mt-8 print:hidden bg-slate-900/80 border border-slate-800 p-3 rounded-3xl backdrop-blur">
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <button
              onClick={() => setActiveTab('ITEMS_LIST')}
              className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'ITEMS_LIST' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Boxes className="w-4 h-4" /> جرد الأصناف والمخزون ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('TRANSACTIONS_LOG')}
              className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'TRANSACTIONS_LOG' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> سجل أذونات الحركات والطباعة ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('LOW_STOCK')}
              className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'LOW_STOCK' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" /> النواقص وحد الطلب ({lowStockItemsList.length})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {canAdd && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-[13px] flex items-center gap-1.5 transition shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> تعريف صنف جديد
              </button>
            )}
          </div>
        </div>

        {/* 1. تبويب جرد ومخزون الأصناف */}
        {activeTab === 'ITEMS_LIST' && (
          <div className="max-w-7xl mx-auto mt-6 space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم، الرمز، أو التصنيف..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-3 py-2 text-[14px] text-white outline-none focus:border-amber-500"
                  />
                </div>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-[14px] text-white outline-none cursor-pointer"
                >
                  <option value="ALL">كافة القطاعات والتصنيفات</option>
                  <option value="مواد إنشائية وبناء">مواد إنشائية وبناء</option>
                  <option value="كهربائيات وتأسيسات">كهربائيات وتأسيسات</option>
                  <option value="صحيات وأنابيب">صحيات وأنابيب</option>
                  <option value="تجارة عامة وبضائع">تجارة عامة وبضائع</option>
                  <option value="قطع غيار وزيوت">قطع غيار وزيوت</option>
                  <option value="أجهزة ومعدات">أجهزة ومعدات</option>
                </select>
              </div>
              <span className="text-[14px] text-slate-400 font-mono">
                إجمالي الأصناف: <strong className="text-white">{filteredItems.length}</strong> | القيمة الكلية: <strong className="text-emerald-400">{formatNum(summary.totalInventoryValue || 0)} د.ع</strong>
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[14px]">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[12px]">
                    <tr>
                      <th className="p-3.5">الرمز</th>
                      <th className="p-3.5">اسم الصنف / المادة</th>
                      <th className="p-3.5">التصنيف</th>
                      <th className="p-3.5">الرصيد المتاح</th>
                      <th className="p-3.5">سعر التكلفة</th>
                      <th className="p-3.5">حد الأمان والطلب</th>
                      <th className="p-3.5">إجمالي القيمة</th>
                      <th className="p-3.5 text-center">إجراءات وأذونات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-[13px]">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500 font-sans">لا توجد بضائع أو أصناف مسجلة مطابقة للبحث.</td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const qty = Number(item.quantity_on_hand ?? item.current_qty ?? 0);
                        const min = Number(item.min_reorder_level ?? item.min_qty ?? 5);
                        const cost = Number(item.unit_cost || 0);
                        const totalVal = qty * cost;
                        const isLow = qty <= min;

                        return (
                          <tr key={item.item_id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 text-amber-400 font-bold">{item.item_code}</td>
                            <td className="p-3.5 font-bold text-white font-sans flex items-center gap-2">
                              <span>{item.name || item.item_name}</span>
                              {isLow && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
                                  <AlertTriangle className="w-3 h-3" /> يحتاج طلب
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-300 font-sans">{item.category}</td>
                            <td className="p-3.5 font-bold text-emerald-400 text-sm">
                              {formatNum(qty)} <span className="text-xs font-sans text-slate-400">{item.unit}</span>
                            </td>
                            <td className="p-3.5 text-slate-200 font-bold">{formatNum(cost)} د.ع</td>
                            <td className="p-3.5 text-slate-400">{min} {item.unit}</td>
                            <td className="p-3.5 font-bold text-sky-400">{formatNum(totalVal)} د.ع</td>
                            <td className="p-3.5 text-center font-sans">
                              <div className="flex items-center justify-center gap-2">
                                {canAdd && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedItemForTrans(item);
                                        setTransType('IN');
                                        setTransPrice(String(item.unit_cost || ''));
                                        setIsExternalSale(false);
                                        setTargetProjectId('');
                                      }}
                                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <ArrowDownLeft className="w-3.5 h-3.5" /> توريد (IN)
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedItemForTrans(item);
                                        setTransType('OUT');
                                        setTransPrice(String(item.selling_price || item.unit_cost || ''));
                                        setIsExternalSale(true);
                                        setTargetProjectId('');
                                      }}
                                      className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Store className="w-3.5 h-3.5" /> بيع / صرف (OUT)
                                    </button>
                                  </>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteItem(item)}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                    title="حذف الصنف"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
        )}

        {/* 2. تبويب سجل أذونات الحركات والطباعة */}
        {activeTab === 'TRANSACTIONS_LOG' && (
          <div className="max-w-7xl mx-auto mt-6 space-y-4 print:hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> سجل أذونات التوريد، الصرف للمشاريع، والبيع التجاري
                </h4>
                <span className="text-[12px] text-slate-400 font-mono">
                  إجمالي الأذونات بالفترة: {filteredTransactions.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right font-mono text-[13px]">
                  <thead className="bg-slate-950 text-slate-400 text-[12px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">نوع الإذن</th>
                      <th className="p-3.5">المادة</th>
                      <th className="p-3.5">الكمية</th>
                      <th className="p-3.5">سعر الوحدة</th>
                      <th className="p-3.5">المبلغ الإجمالي</th>
                      <th className="p-3.5">الجهة / المشروع / المشتري</th>
                      <th className="p-3.5">التاريخ</th>
                      <th className="p-3.5 text-center">طباعة الإذن</th>
                      {canDelete && <th className="p-3.5 text-center">حذف</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={canDelete ? 9 : 8} className="text-center py-8 text-slate-500 font-sans">لا توجد أذونات مسجلة بالنطاق المحدد.</td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tr) => {
                        const isIN = tr.trans_type === 'IN';
                        return (
                          <tr key={tr.trans_id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-sans">
                              {isIN ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                  <ArrowDownLeft className="w-3.5 h-3.5" /> توريد واستيراد (IN)
                                </span>
                              ) : tr.purpose === 'PROJECT_ISSUE' || tr.project_id ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                                  <HardHat className="w-3.5 h-3.5" /> صرف لمشروع (OUT)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1 w-fit">
                                  <Store className="w-3.5 h-3.5" /> بيع تجاري (SALE)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-sans font-bold text-white">
                              {tr.item_name || tr.name} <span className="text-[11px] text-slate-500 font-mono">({tr.item_code})</span>
                            </td>
                            <td className="p-3.5 font-black text-white">
                              {formatNum(tr.quantity)} <span className="text-xs text-slate-400 font-sans">{tr.unit}</span>
                            </td>
                            <td className="p-3.5 text-slate-300 font-bold">{formatNum(tr.unit_price)} د.ع</td>
                            <td className="p-3.5 text-amber-400 font-black">{formatNum(tr.total_amount)} د.ع</td>
                            <td className="p-3.5 font-sans text-slate-200">
                              {tr.project_name ? (
                                <span className="text-amber-300 font-bold">مشروع: {tr.project_name}</span>
                              ) : (
                                <span>{tr.supplier_or_recipient || 'المخزن العام'}</span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-500">{String(tr.created_at || '').substring(0, 10)}</td>
                            <td className="p-3.5 text-center font-sans">
                              <button
                                onClick={() => setPrintedReceipt(tr)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 transition cursor-pointer"
                                title="طباعة الإذن المخزني الرسمي A4"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </td>
                            {canDelete && (
                              <td className="p-3.5 text-center font-sans">
                                <button
                                  onClick={() => handleDeleteTransaction(tr.trans_id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 transition cursor-pointer"
                                  title="حذف الإذن وعكس الكمية"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. تبويب النواقص وحد الطلب */}
        {activeTab === 'LOW_STOCK' && (
          <div className="max-w-7xl mx-auto mt-6 space-y-4 print:hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> قائمة المواد التي وصلت لحد إعادة الطلب
                </h3>
                <p className="text-[13px] text-slate-400 mt-0.5">ينصح بإصدار أذونات توريد وشراء فورية لتفادي توقف الأعمال الإنشائية والتجارية</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItemsList.length > 0 ? (
                lowStockItemsList.map((item: any) => {
                  const qty = Number(item.quantity_on_hand ?? item.current_qty ?? 0);
                  const min = Number(item.min_reorder_level ?? item.min_qty ?? 5);

                  return (
                    <div key={item.item_id} className="bg-slate-900 border border-rose-500/30 p-6 rounded-3xl space-y-3.5 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-mono text-xs text-amber-400 font-bold">{item.item_code}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 font-sans">
                          رصيد حرج
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-base">{item.name || item.item_name}</h4>
                        <p className="text-[13px] text-slate-400 mt-0.5">{item.category} • {item.location || item.warehouse_location}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl font-mono text-[13px]">
                        <div>
                          <span className="text-slate-500 block text-[11px] font-sans">الرصيد المتوفر</span>
                          <strong className="text-rose-400 text-sm">{qty} {item.unit}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] font-sans">حد الأمان الأدنى</span>
                          <strong className="text-slate-300 text-sm">{min} {item.unit}</strong>
                        </div>
                      </div>

                      {canAdd && (
                        <button
                          onClick={() => {
                            setSelectedItemForTrans(item);
                            setTransType('IN');
                            setTransPrice(String(item.unit_cost || ''));
                            setIsExternalSale(false);
                            setTargetProjectId('');
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-[13px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ArrowDownLeft className="w-4 h-4" /> إصدار إذن توريد وشراء الآن
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-500">
                  كافة الأصناف والمواد بالمخزن أعلى من حد الطلب ورصيدها كافٍ تماماً ✓
                </div>
              )}
            </div>
          </div>
        )}

        {/* مستند إذن الصرف / الاستلام المخزني الرسمي للطباعة A4 */}
        {printedReceipt && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:static">
            <div className="w-full max-w-3xl flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 print:hidden shadow-xl">
              <button onClick={() => window.print()} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-[14px] flex items-center gap-2 transition cursor-pointer">
                <Printer className="w-4 h-4" /> طباعة الإذن المخزني الرسمي (A4)
              </button>
              <button onClick={() => setPrintedReceipt(null)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-6">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    <Image src="/logo.png" alt="شركة البرج المتألق" width={64} height={64} className="object-contain" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-950">شركة البرج المتألق</h1>
                    <p className="text-xs text-slate-600 font-bold">إدارة المخازن المركزية والتجارة العامة والتوريدات الميدانية</p>
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="border-2 border-slate-900 px-3 py-1 font-black text-xs uppercase bg-amber-500 text-slate-950 rounded-lg inline-block">
                    {printedReceipt.trans_type === 'IN' ? 'إذن استلام وتوريد مخزني (GRN)' : 'إذن صرف مواد وبضائع (Goods Issue)'}
                  </div>
                  <p className="text-[12px] text-slate-600 mt-2 font-bold">رقم الإذن: {printedReceipt.trans_code}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">التاريخ: {String(printedReceipt.created_at || '').substring(0, 10)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[14px] font-semibold">
                <div>
                  <span className="text-slate-500 block text-xs">الجهة المستلمة / المورد / المشروع:</span>
                  <span className="text-slate-950 font-bold">
                    {printedReceipt.project_name ? `مشروع مقاولة: ${printedReceipt.project_name}` : printedReceipt.supplier_or_recipient || '---'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">نوع ومسار العملية:</span>
                  <span className="text-slate-950 font-bold">
                    {printedReceipt.trans_type === 'IN' 
                      ? 'شراء وتوريد للمخزن المركزي' 
                      : printedReceipt.purpose === 'PROJECT_ISSUE' || printedReceipt.project_id
                      ? 'صرف مباشر لموقع المشروع الإنشائي' 
                      : 'بيع تجاري خارجي'}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right font-mono text-[13px]">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-xs">
                    <tr>
                      <th className="p-3">رمز الصنف</th>
                      <th className="p-3">اسم المادة والمواصفات</th>
                      <th className="p-3">الكمية المسلمة</th>
                      <th className="p-3">سعر الوحدة</th>
                      <th className="p-3">المبلغ الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold text-amber-700">{printedReceipt.item_code}</td>
                      <td className="p-3 font-bold font-sans text-slate-950">{printedReceipt.item_name || printedReceipt.name}</td>
                      <td className="p-3 font-black text-slate-950">{formatNum(printedReceipt.quantity)} {printedReceipt.unit}</td>
                      <td className="p-3 text-slate-800">{formatNum(printedReceipt.unit_price)} د.ع</td>
                      <td className="p-3 font-black text-slate-950">{formatNum(printedReceipt.total_amount)} د.ع</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {printedReceipt.notes && (
                <div className="text-[13px] text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <strong>البيان والملاحظات: </strong> {printedReceipt.notes}
                </div>
              )}

              <div className="grid grid-cols-3 gap-8 pt-12 text-center border-t border-slate-200 text-xs">
                <div>
                  <p className="font-bold text-slate-700">أمين المخزن المختص</p>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div>
                </div>
                <div>
                  <p className="font-bold text-slate-700">المستلم الميداني / العميل</p>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div>
                </div>
                <div>
                  <p className="font-bold text-slate-700">مصادقة الحسابات العامة</p>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تعريف صنف جديد */}
        {showAddModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" /> تعريف صنف / بضاعة جديدة بالمخزن
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-3.5 text-[14px]">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رمز الصنف (Code) *</label>
                    <input
                      type="text"
                      required
                      placeholder="ITM-01"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">القطاع / التصنيف</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                    >
                      <option value="مواد إنشائية وبناء">مواد إنشائية وبناء</option>
                      <option value="كهربائيات وتأسيسات">كهربائيات وتأسيسات</option>
                      <option value="صحيات وأنابيب">صحيات وأنابيب</option>
                      <option value="تجارة عامة وبضائع">تجارة عامة وبضائع</option>
                      <option value="قطع غيار وزيوت">قطع غيار وزيوت</option>
                      <option value="أجهزة ومعدات">أجهزة ومعدات</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">اسم الصنف والمواصفات *</label>
                  <input
                    type="text"
                    required
                    placeholder="حديد تسليح 12 ملم، سمنت مقاوم، كيبل..."
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الوحدة</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                    >
                      <option value="طن">طن</option>
                      <option value="كيس">كيس</option>
                      <option value="متر">متر</option>
                      <option value="قطعة">قطعة</option>
                      <option value="كارتون">كارتون</option>
                      <option value="لتر">لتر</option>
                      <option value="متر مكعب">متر مكعب</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الرصيد الافتتاحي</label>
                    <input
                      type="number"
                      value={initialQty}
                      onChange={(e) => setInitialQty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">حد إعادة الطلب *</label>
                    <input
                      type="number"
                      required
                      value={minQty}
                      onChange={(e) => setMinQty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">سعر التكلفة التقديري (د.ع)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">سعر البيع التجاري (د.ع)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">موقع التخزين بالمخزن</label>
                  <input
                    type="text"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button type="submit" disabled={loading} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition cursor-pointer">
                    {loading ? 'جاري الحفظ...' : 'حفظ وتعريف الصنف'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة حركة مخزنية تجارية */}
        {selectedItemForTrans && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {transType === 'IN' ? (
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  ) : isExternalSale ? (
                    <Store className="w-4 h-4 text-sky-400" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  )}
                  {transType === 'IN' 
                    ? 'إذن استلام وتوريد بضاعة للمخزن' 
                    : isExternalSale 
                    ? 'إذن بيع تجاري خارجي' 
                    : 'إذن صرف مواد لمشروع مقاولة'}
                </h3>
                <button onClick={() => setSelectedItemForTrans(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStockTransaction} className="space-y-3.5 text-[14px]">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-slate-300">الصنف: <strong className="text-white">{selectedItemForTrans.name || selectedItemForTrans.item_name}</strong></p>
                  <p className="text-slate-400 font-mono text-xs">
                    الرصيد المتوفر بالمخزن: <strong className="text-emerald-400">{formatNum(selectedItemForTrans.quantity_on_hand ?? selectedItemForTrans.current_qty ?? 0)} {selectedItemForTrans.unit}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نوع الإذن</label>
                    <select
                      value={transType}
                      onChange={(e) => {
                        setTransType(e.target.value as any);
                        if (e.target.value === 'IN') setIsExternalSale(false);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                    >
                      <option value="IN">توريد واستلام للمخزن (IN)</option>
                      <option value="OUT">صرف أو بيع بضاعة (OUT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الكمية ({selectedItemForTrans.unit}) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0"
                      value={transQty}
                      onChange={(e) => setTransQty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    {transType === 'IN' ? 'سعر الشراء والتكلفة للوحدة (د.ع)' : isExternalSale ? 'سعر البيع للعميل (د.ع) *' : 'سعر التحميل للمشروع (د.ع)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={transPrice}
                    onChange={(e) => setTransPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                  <span className="text-xs text-amber-400 mt-1 block font-mono">
                    الإجمالي المحسوب: {formatNum((Number(transQty) || 0) * (Number(transPrice) || 0))} د.ع
                  </span>
                </div>

                {transType === 'OUT' && (
                  <div className="space-y-3 border-t border-slate-800 pt-3">
                    <label className="block text-slate-400 font-semibold flex items-center gap-1 text-sky-400 text-xs">
                      <ShoppingBag className="w-3.5 h-3.5" /> مسار صرف البضاعة:
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExternalSale(true);
                          setTargetProjectId('');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isExternalSale 
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" /> بيع تجاري خارجي
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsExternalSale(false);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          !isExternalSale 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <HardHat className="w-3.5 h-3.5" /> صرف لمشروع مقاولة
                      </button>
                    </div>

                    {isExternalSale ? (
                      <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-sky-500/30">
                        <div>
                          <label className="block text-slate-300 mb-1 font-semibold text-xs">اسم العميل / المشتري التجاري *</label>
                          <input
                            type="text"
                            required
                            placeholder="العميل أو الجهة المشترية"
                            value={partyName}
                            onChange={(e) => setPartyName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-sky-500 text-[14px]"
                          />
                        </div>
                        <p className="text-[11px] text-sky-400">
                          سيتم توليد سند قبض مالي رسمي تلقائياً في شاشة السندات والتقارير المالية.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold text-xs">مشروع المقاولة المستلم *</label>
                        <select
                          value={targetProjectId}
                          onChange={(e) => setTargetProjectId(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 mt-1 text-[14px] cursor-pointer"
                          required
                        >
                          <option value="">-- اختر المشروع لتنزيل التكلفة عليه --</option>
                          {projects.map((p) => (
                            <option key={p.project_id} value={p.project_id}>
                              {p.project_name}
                            </option>
                          ))}
                        </select>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          تُنزل المواد مباشرة ضمن تكاليف المشروع وتظهر في شاشة المقاولات والتقارير.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {transType === 'IN' && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المورد / المجهز</label>
                    <input
                      type="text"
                      placeholder="اسم المورد أو رقم بيان الاستيراد"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ملاحظات وبيان الإذن</label>
                  <input
                    type="text"
                    placeholder="رقم الوصل، رقم السيارة، موقع التسليم..."
                    value={transNotes}
                    onChange={(e) => setTransNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setSelectedItemForTrans(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className={`px-5 py-2 font-bold rounded-xl text-slate-950 transition cursor-pointer ${
                      transType === 'IN' 
                        ? 'bg-emerald-500 hover:bg-emerald-400' 
                        : isExternalSale 
                        ? 'bg-sky-500 hover:bg-sky-400' 
                        : 'bg-amber-500 hover:bg-amber-400'
                    }`}
                  >
                    {loading ? 'جاري المعالجة...' : transType === 'IN' ? 'اعتماد التوريد للمخزن' : isExternalSale ? 'اعتماد البيع وتوليد سند قبض' : 'اعتماد صرف المواد للمشروع'}
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