'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  PieChart as PieChartIcon, 
  ArrowLeft, 
  Printer, 
  RefreshCw, 
  Wallet, 
  TrendingUp, 
  Truck, 
  HardHat, 
  Coins, 
  BarChart3, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  RotateCcw,
  Boxes,
  Building,
  Users,
  Activity,
  ChevronRight,
  ChevronLeft,
  Building2,
  Store,
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Home
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

const PIE_COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#f43f5e'];

function generateYearMonths(year: string = '2026') {
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  return months.map(m => `${year}-${m}`);
}

export default function FinancialReportsPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  const [projectsRaw, setProjectsRaw] = useState<any[]>([]);
  const [vouchersRaw, setVouchersRaw] = useState<any[]>([]);
  const [tripsRaw, setTripsRaw] = useState<any[]>([]);
  const [maintRaw, setMaintRaw] = useState<any[]>([]);
  const [inventoryItemsRaw, setInventoryItemsRaw] = useState<any[]>([]);
  const [inventoryTransRaw, setInventoryTransRaw] = useState<any[]>([]);
  const [employeesRaw, setEmployeesRaw] = useState<any[]>([]);
  const [payrollRunsRaw, setPayrollRunsRaw] = useState<any[]>([]);
  const [realEstateUnitsRaw, setRealEstateUnitsRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
  });
  const [isAllTime, setIsAllTime] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resP, resV, resF, resI, resH, resRE] = await Promise.all([
        fetch('/api/projects', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ projects: [] })),
        fetch('/api/vouchers', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ vouchers: [] })),
        fetch('/api/fleet', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ trips: [], maintenance: [] })),
        fetch('/api/inventory', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ items: [], transactions: [] })),
        fetch('/api/hr', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ employees: [], payrollRuns: [] })),
        fetch('/api/real-estate', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ units: [] }))
      ]);

      if (resP.projects) setProjectsRaw(resP.projects);
      if (resV.vouchers) setVouchersRaw(resV.vouchers);
      if (resF.trips) setTripsRaw(resF.trips);
      if (resF.maintenance) setMaintRaw(resF.maintenance);
      if (resI.items) setInventoryItemsRaw(resI.items);
      if (resI.transactions) setInventoryTransRaw(resI.transactions);
      if (resH.employees) setEmployeesRaw(resH.employees);
      if (resH.payrollRuns) setPayrollRunsRaw(resH.payrollRuns);
      if (resRE.units) setRealEstateUnitsRaw(resRE.units);
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
    loadAllData();
  }, []);

  const setQuickRange = (type: 'THIS_MONTH' | 'THIS_YEAR' | 'ALL') => {
    const now = new Date();
    if (type === 'THIS_MONTH') {
      setIsAllTime(false);
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (type === 'THIS_YEAR') {
      setIsAllTime(false);
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else {
      setIsAllTime(true);
      setStartDate('');
      setEndDate('');
    }
  };

  const handleShiftMonth = (direction: 'PREV' | 'NEXT') => {
    setIsAllTime(false);
    let baseDate = startDate ? new Date(startDate) : new Date();
    if (isNaN(baseDate.getTime())) baseDate = new Date();

    if (direction === 'PREV') {
      baseDate.setMonth(baseDate.getMonth() - 1);
    } else {
      baseDate.setMonth(baseDate.getMonth() + 1);
    }

    const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).toISOString().split('T')[0];
    
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const filteredVouchers = useMemo(() => {
    return vouchersRaw.filter((v: any) => {
      if (v.status === 'VOID' || v.status === 'CANCELLED') return false;
      if (isAllTime) return true;
      const vDate = String(v.issue_date || v.created_at || '').split('T')[0];
      if (startDate && vDate < startDate) return false;
      if (endDate && vDate > endDate) return false;
      return true;
    });
  }, [vouchersRaw, startDate, endDate, isAllTime]);

  const fleetFinance = useMemo(() => {
    const validTrips = tripsRaw.filter((t: any) => {
      if (t.trip_status !== 'COMPLETED') return false;
      if (isAllTime) return true;
      const tDate = String(t.departure_time || t.created_at || '').split('T')[0];
      if (startDate && tDate < startDate) return false;
      if (endDate && tDate > endDate) return false;
      return true;
    });

    const validMaint = maintRaw.filter((m: any) => {
      if (isAllTime) return true;
      const mDate = String(m.service_date || m.created_at || '').split('T')[0];
      if (startDate && mDate < startDate) return false;
      if (endDate && mDate > endDate) return false;
      return true;
    });

    const revenue = validTrips.reduce((acc: number, curr: any) => acc + Number(curr.trip_cost || 0), 0);
    const expenses = validMaint.reduce((acc: number, curr: any) => acc + Number(curr.cost || 0), 0);

    const yearMonths = generateYearMonths('2026');
    const timelineMap = new Map<string, { month: string; revenue: number; expenses: number; net: number }>();
    yearMonths.forEach(ym => timelineMap.set(ym, { month: ym, revenue: 0, expenses: 0, net: 0 }));

    validTrips.forEach((t: any) => {
      const m = String(t.departure_time || t.created_at || '').substring(0, 7) || '2026-09';
      if (!timelineMap.has(m)) timelineMap.set(m, { month: m, revenue: 0, expenses: 0, net: 0 });
      timelineMap.get(m)!.revenue += Number(t.trip_cost || 0);
    });

    validMaint.forEach((ma: any) => {
      const m = String(ma.service_date || ma.created_at || '').substring(0, 7) || '2026-09';
      if (!timelineMap.has(m)) timelineMap.set(m, { month: m, revenue: 0, expenses: 0, net: 0 });
      timelineMap.get(m)!.expenses += Number(ma.cost || 0);
    });

    timelineMap.forEach(val => { val.net = val.revenue - val.expenses; });
    const timelineData = Array.from(timelineMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    return { 
      revenue, 
      expenses, 
      net: revenue - expenses, 
      tripsCount: validTrips.length, 
      maintCount: validMaint.length,
      timelineData
    };
  }, [tripsRaw, maintRaw, startDate, endDate, isAllTime]);

  const tradeFinance = useMemo(() => {
    let salesRevenue = 0;
    let purchasesExpenses = 0;
    let costOfSoldGoods = 0;
    let periodProjectIssues = 0;

    const yearMonths = generateYearMonths('2026');
    const timelineMap = new Map<string, { month: string; sales: number; purchases: number; net: number }>();
    yearMonths.forEach(ym => timelineMap.set(ym, { month: ym, sales: 0, purchases: 0, net: 0 }));

    const validTrans = inventoryTransRaw.filter((tr: any) => {
      if (isAllTime) return true;
      const trDate = String(tr.created_at || '').split('T')[0];
      if (startDate && trDate < startDate) return false;
      if (endDate && trDate > endDate) return false;
      return true;
    });

    validTrans.forEach((tr: any) => {
      const total = Number(tr.total_amount) || 0;
      const qty = Number(tr.quantity) || 0;
      const m = String(tr.created_at || '').substring(0, 7) || '2026-09';
      if (!timelineMap.has(m)) timelineMap.set(m, { month: m, sales: 0, purchases: 0, net: 0 });

      if (tr.trans_type === 'IN') {
        purchasesExpenses += total;
        timelineMap.get(m)!.purchases += total;
      } else if (tr.trans_type === 'OUT') {
        const isCommercial = 
          tr.purpose === 'COMMERCIAL_SALE' || 
          tr.project_name === 'بيع تجارة عامة' || 
          tr.project_name === 'بيع تجاري خارجي' || 
          String(tr.supplier_or_recipient || '').includes('بيع تجاري') ||
          (!tr.project_id && !tr.project_name);

        if (isCommercial) {
          salesRevenue += total;
          timelineMap.get(m)!.sales += total;
          const originalItem = inventoryItemsRaw.find((i: any) => i.item_id === tr.item_id);
          const origCost = Number(originalItem?.unit_cost || 0);
          costOfSoldGoods += (qty * origCost);
        } else {
          periodProjectIssues += total;
        }
      }
    });

    timelineMap.forEach(v => { v.net = v.sales - v.purchases; });
    const timelineData = Array.from(timelineMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    const netProfit = salesRevenue - costOfSoldGoods;

    return {
      salesRevenue,
      purchasesExpenses,
      costOfSoldGoods,
      periodProjectIssues,
      netProfit,
      margin: salesRevenue > 0 ? ((netProfit / salesRevenue) * 100).toFixed(1) : '0',
      timelineData
    };
  }, [inventoryTransRaw, inventoryItemsRaw, startDate, endDate, isAllTime]);

  const hrFinance = useMemo(() => {
    const activeEmployees = employeesRaw.filter((e: any) => e.status === 'ACTIVE' || !e.status);
    const monthlyPayroll = activeEmployees.reduce((acc: number, e: any) => {
      return acc + (Number(e.base_salary || 0) + Number(e.allowances || 0));
    }, 0);

    const yearMonths = generateYearMonths('2026');
    const timelineMap = new Map<string, { month: string; payroll: number }>();
    yearMonths.forEach(ym => timelineMap.set(ym, { month: ym, payroll: 0 }));

    if (payrollRunsRaw && payrollRunsRaw.length > 0) {
      payrollRunsRaw.forEach((r: any) => {
        const m = String(r.payroll_month || r.run_date || r.created_at || '').substring(0, 7);
        if (!timelineMap.has(m)) timelineMap.set(m, { month: m, payroll: 0 });
        timelineMap.get(m)!.payroll += Number(r.net_salary || 0);
      });
    } else {
      if (timelineMap.has('2026-09')) {
        timelineMap.get('2026-09')!.payroll = monthlyPayroll;
      }
    }

    const timelineData = Array.from(timelineMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    const totalSalaries = timelineData.reduce((acc, curr) => acc + curr.payroll, 0) || monthlyPayroll;

    return {
      totalSalaries,
      count: activeEmployees.length,
      monthlyPayroll,
      timelineData
    };
  }, [payrollRunsRaw, employeesRaw]);

  const realEstateFinance = useMemo(() => {
    const soldUnits = realEstateUnitsRaw.filter((u: any) => {
      if (u.status !== 'SOLD') return false;
      if (isAllTime) return true;
      const uDate = String(u.sold_at || u.updated_at || u.created_at || '').split('T')[0];
      if (startDate && uDate && uDate < startDate) return false;
      if (endDate && uDate && uDate > endDate) return false;
      return true;
    });

    const yearMonths = generateYearMonths('2026');
    const timelineMap = new Map<string, { month: string; revenue: number }>();
    yearMonths.forEach(ym => timelineMap.set(ym, { month: ym, revenue: 0 }));

    soldUnits.forEach((u: any) => {
      const m = String(u.sold_at || u.created_at || '').substring(0, 7) || '2026-09';
      if (!timelineMap.has(m)) timelineMap.set(m, { month: m, revenue: 0 });
      timelineMap.get(m)!.revenue += Number(u.price || 0);
    });

    const timelineData = Array.from(timelineMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    const revenue = soldUnits.reduce((acc: number, u: any) => acc + Number(u.price || 0), 0);

    return { 
      revenue, 
      unitsCount: realEstateUnitsRaw.length, 
      soldCount: soldUnits.length,
      timelineData
    };
  }, [realEstateUnitsRaw, startDate, endDate, isAllTime]);

  const projects = useMemo(() => {
    const clean = (t: string) => (t || '').trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ');

    const activeProjectsInPeriod = projectsRaw.filter((p) => {
      if (isAllTime) return true;
      const pStart = String(p.start_date || p.created_at || '').split('T')[0];
      if (endDate && pStart && endDate < pStart) return false;
      return true;
    });

    return activeProjectsInPeriod.map((p) => {
      let rec = 0;
      let exp = 0;
      const pId = String(p.project_id || '');
      const pName = clean(p.project_name);

      for (const v of filteredVouchers) {
        const vProjId = String(v.project_id || '');
        const vProjName = clean(v.project_name || '');
        const vNotes = clean(v.notes || '');

        const isMatched = (vProjId !== '' && vProjId === pId) || 
                          (vProjName !== '' && (vProjName === pName || pName.includes(vProjName))) || 
                          (pName.length > 4 && vNotes.includes(pName));

        if (isMatched) {
          const val = Number(v.total_amount) || Number(v.amount) || 0;
          if (v.voucher_type === 'RECEIPT') rec += val;
          if (v.voucher_type === 'PAYMENT') exp += val;
        }
      }

      return {
        ...p,
        actualReceived: rec,
        actualExpenses: exp,
        netCash: rec - exp
      };
    });
  }, [projectsRaw, filteredVouchers, endDate, isAllTime]);

  const contractingTimeline = useMemo(() => {
    const yearMonths = generateYearMonths('2026');
    const timelineMap = new Map<string, { month: string; receipts: number; expenses: number; net: number }>();
    yearMonths.forEach(ym => timelineMap.set(ym, { month: ym, receipts: 0, expenses: 0, net: 0 }));

    filteredVouchers.forEach((v: any) => {
      if (v.project_id || v.project_name) {
        const m = String(v.issue_date || v.created_at || '').substring(0, 7) || '2026-09';
        if (!timelineMap.has(m)) timelineMap.set(m, { month: m, receipts: 0, expenses: 0, net: 0 });
        const val = Number(v.total_amount || v.amount || 0);
        if (v.voucher_type === 'RECEIPT') timelineMap.get(m)!.receipts += val;
        if (v.voucher_type === 'PAYMENT') timelineMap.get(m)!.expenses += val;
      }
    });

    timelineMap.forEach(v => { v.net = v.receipts - v.expenses; });
    return Array.from(timelineMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredVouchers]);

  const summary = useMemo(() => {
    const totalProjectsContract = projects.reduce((acc, p) => acc + Number(p.contract_value || 0), 0);
    const totalProjectsReceived = projects.reduce((acc, p) => acc + Number(p.actualReceived || 0), 0);
    const totalProjectsCosts = projects.reduce((acc, p) => acc + Number(p.actualExpenses || 0), 0);

    const grandTotalRevenue = totalProjectsReceived + fleetFinance.revenue + tradeFinance.salesRevenue + realEstateFinance.revenue;
    const grandTotalExpenses = totalProjectsCosts + fleetFinance.expenses + tradeFinance.purchasesExpenses + hrFinance.totalSalaries;
    
    const grandNetProfit = grandTotalRevenue - grandTotalExpenses;
    const overallMargin = grandTotalRevenue > 0 ? ((grandNetProfit / grandTotalRevenue) * 100).toFixed(1) : '0';

    return {
      grandTotalRevenue,
      grandTotalExpenses,
      grandNetProfit,
      overallMargin,
      totalProjectsContract,
      totalProjectsReceived,
      totalProjectsCosts,
      projectsCount: projects.length
    };
  }, [projects, fleetFinance, tradeFinance, hrFinance, realEstateFinance]);

  const revenuePieData = useMemo(() => {
    return [
      { name: 'المقاولات', value: summary.totalProjectsReceived },
      { name: 'أسطول النقل', value: fleetFinance.revenue },
      { name: 'التجارة والمخزن', value: tradeFinance.salesRevenue },
      { name: 'العقارات', value: realEstateFinance.revenue }
    ].filter(item => item.value > 0);
  }, [summary, fleetFinance, tradeFinance, realEstateFinance]);

  const expensesPieData = useMemo(() => {
    return [
      { name: 'المقاولات', value: summary.totalProjectsCosts },
      { name: 'تشغيل الأسطول', value: fleetFinance.expenses },
      { name: 'مشتريات المخزن', value: tradeFinance.purchasesExpenses },
      { name: 'كتلة الرواتب', value: hrFinance.totalSalaries }
    ].filter(item => item.value > 0);
  }, [summary, fleetFinance, tradeFinance, hrFinance]);

  if (!currentUser) return null;

  return (
    <AuthGuard moduleName="vouchers" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        {/* الترويسة الرئيسية المحسنة بتصميم متناسق ومؤطر بالكامل */}
        <div className="max-w-7xl mx-auto pb-6 border-b border-slate-800/80 print:hidden">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
            
            {/* الطرف الأيمن: الشعار والعنوان والشارة */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 relative rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 flex items-center justify-center shrink-0 p-2 shadow-xl shadow-amber-500/10">
                <Image 
                  src="/logo.png" 
                  alt="شركة البرج المتألق" 
                  width={48} 
                  height={48} 
                  className="object-contain" 
                  priority 
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                    التقرير المالي التنفيذي وتحليل الاستثمار الموحد
                  </h1>
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-3 py-0.5 rounded-full shadow-inner font-mono">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    RTCO Executive Analytics 2026
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  شركة البرج المتألق • المركز المالي، التحليل الزمني، الرسوم البيانية، واستقلالية القطاعات
                </p>
              </div>
            </div>

            {/* الطرف الأيسر: شريط الإجراءات وأزرار التنقل السريع في سطر واحد ثابت */}
            <div className="flex items-center gap-2.5 flex-nowrap shrink-0 self-end xl:self-auto overflow-x-auto">
              <button 
                onClick={loadAllData} 
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-amber-400 transition cursor-pointer active:scale-95 shadow-sm"
                title="تحديث ومزامنة البيانات اللحظية"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={() => window.print()} 
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> طباعة الميزانية والقوائم (A4)
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

        {/* شريط فلترة النطاق الزمني والتنقل الشهري */}
        <div className="max-w-7xl mx-auto mt-6 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl print:hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Calendar className="w-4 h-4" />
              <span>نطاق التحليل الزمني:</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button 
                onClick={() => handleShiftMonth('PREV')} 
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono text-amber-400 font-bold">تنقل شهري</span>
              <button 
                onClick={() => handleShiftMonth('NEXT')} 
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
                title="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">من:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setIsAllTime(false); setStartDate(e.target.value); }}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">إلى:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setIsAllTime(false); setEndDate(e.target.value); }}
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer ${isAllTime ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-amber-400'}`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> الكل
            </button>
          </div>
        </div>

        {/* المؤشرات المالية الإجمالية العامة للشركة */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 print:hidden">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-slate-400 font-semibold block flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> إجمالي إيرادات الشركة المجمعة
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
                  {formatNum(summary.grandTotalRevenue)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">المقاولات + النقل + التجارة + مبيعات العقارات</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-slate-400 font-semibold block flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" /> إجمالي المصروفات والتشغيل
                </span>
                <div className="text-2xl font-black font-mono text-rose-400 mt-2">
                  {formatNum(summary.grandTotalExpenses)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">المشاريع + صيانة الأسطول + المشتريات + الرواتب</p>
          </div>

          <div className={`bg-slate-900 border p-5 rounded-3xl relative overflow-hidden shadow-xl ${summary.grandNetProfit >= 0 ? 'border-sky-500/40 bg-sky-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-slate-300 font-semibold block flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-sky-400" /> صافي الأرباح التشغيلية
                </span>
                <div className={`text-2xl font-black font-mono mt-2 ${summary.grandNetProfit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                  {formatNum(summary.grandNetProfit)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded-xl text-xs font-bold font-mono">
                {summary.overallMargin}% هامش
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-sans">صافي التدفق بعد حسم كافة النفقات والالتزامات</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-slate-400 font-semibold block flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" /> كتلة الرواتب والأجور
                </span>
                <div className="text-2xl font-black font-mono text-purple-400 mt-2">
                  {formatNum(hrFinance.totalSalaries)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">إجمالي الرواتب والبدلات لعدد {hrFinance.count} موظفين</p>
          </div>
        </div>

        {/* قسم المخططات الدائرية المقارنة */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 print:hidden">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-400" /> مساهمة القطاعات في إيرادات الشركة المجمعة
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">الحصة المالية لكل نشاط تجاري واستثماري</p>
              </div>
            </div>

            <div className="w-full h-72 min-h-[280px]" dir="ltr">
              {revenuePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={revenuePieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="value" isAnimationActive={false}>
                      {revenuePieData.map((_, index) => (
                        <Cell key={`cell-rev-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', textAlign: 'right' }} formatter={(val: any) => [`${formatNum(val)} د.ع`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-20 text-xs">لا توجد إيرادات مسجلة بالفترة</p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-rose-400" /> هيكل توزيع التكاليف والمصروفات
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">مقارنة أوزان الإنفاق التشغيلي والإداري</p>
              </div>
            </div>

            <div className="w-full h-72 min-h-[280px]" dir="ltr">
              {expensesPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={expensesPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="value" isAnimationActive={false}>
                      {expensesPieData.map((_, index) => (
                        <Cell key={`cell-exp-${index}`} fill={['#f43f5e', '#f59e0b', '#38bdf8', '#a855f7'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', textAlign: 'right' }} formatter={(val: any) => [`${formatNum(val)} د.ع`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-20 text-xs">لا توجد تكاليف مسجلة بالفترة</p>
              )}
            </div>
          </div>
        </div>

        {/* 1. قطاع المقاولات والمشاريع */}
        <div className="max-w-7xl mx-auto mt-10 space-y-5 print:hidden">
          <div className="border-b-2 border-amber-500/40 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                <HardHat className="w-6 h-6 text-amber-400" /> 1. قطاع المقاولات والمشاريع الهندسية
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">المستخلصات، الإنفاق الميداني، والتحليل الزمني للمشاريع عبر شهور العام</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
              عقود المشاريع: {formatNum(summary.totalProjectsContract)} د.ع
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-3">ملخص الحسابات الإجمالية للمقاولات:</span>
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">المقبوض الفعلي:</span>
                    <strong className="text-emerald-400 text-sm">{formatNum(summary.totalProjectsReceived)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">التكاليف المنصرفة:</span>
                    <strong className="text-rose-400 text-sm">{formatNum(summary.totalProjectsCosts)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-amber-500/30">
                    <span className="text-slate-300 text-xs font-sans font-bold">صافي السيولة النقدية:</span>
                    <strong className="text-amber-400 text-base">{formatNum(summary.totalProjectsReceived - summary.totalProjectsCosts)} د.ع</strong>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">يشمل مشتريات المواد الموقعية، ومقاولي الباطن، والمصروفات الميدانية.</p>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> المسار الزمني لتدفقات المقاولات (المبالغ عبر الوقت)
                </span>
                <span className="text-[10px] text-amber-400 font-mono">تتبع شهري 2026</span>
              </div>
              <div className="w-full h-64 min-h-[260px] pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={contractingTimeline} margin={{ top: 10, right: 10, left: 15, bottom: 10 }}>
                    <defs>
                      <linearGradient id="gradProjRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="gradProjExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', textAlign: 'right' }} formatter={(val: any) => [`${formatNum(val)} د.ع`]} />
                    <Legend />
                    <Area type="monotone" dataKey="receipts" name="المقبوضات" stroke="#10b981" fill="url(#gradProjRec)" strokeWidth={2.5} isAnimationActive={false} />
                    <Area type="monotone" dataKey="expenses" name="التكاليف" stroke="#f43f5e" fill="url(#gradProjExp)" strokeWidth={2.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* 2. قطاع التجارة العامة والمخزن المركزي */}
        <div className="max-w-7xl mx-auto mt-10 space-y-5 print:hidden">
          <div className="border-b-2 border-sky-500/40 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                <Boxes className="w-6 h-6 text-sky-400" /> 2. قطاع التجارة العامة والمخزن المركزي
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">المبيعات، التوريدات، وهوامش الربح التجاري للمواد والبضائع عبر شهور العام</p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-xl">
              هامش الربح: {tradeFinance.margin}%
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-3">حسابات التجارة والمبيعات:</span>
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">المبيعات المحققة:</span>
                    <strong className="text-emerald-400 text-sm">{formatNum(tradeFinance.salesRevenue)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">المشتريات والتوريد:</span>
                    <strong className="text-rose-400 text-sm">{formatNum(tradeFinance.purchasesExpenses)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-sky-500/30">
                    <span className="text-slate-300 text-xs font-sans font-bold">صافي الربح التجاري:</span>
                    <strong className="text-sky-400 text-base">{formatNum(tradeFinance.netProfit)} د.ع</strong>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">تم احتساب صافي الأرباح بعد طرح تكلفة المواد المباعة من إجمالي المبيعات.</p>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-sky-400" /> المخطط الخطي للمبيعات والمشتريات عبر الوقت
                </span>
                <span className="text-[10px] text-sky-400 font-mono">تتبع شهري 2026</span>
              </div>
              <div className="w-full h-64 min-h-[260px] pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={tradeFinance.timelineData} margin={{ top: 10, right: 10, left: 15, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', textAlign: 'right' }} formatter={(val: any) => [`${formatNum(val)} د.ع`]} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="purchases" name="المشتريات" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="net" name="صافي الربح" stroke="#10b981" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4, fill: '#10b981' }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* 3. قطاع أسطول النقل العام واللوجستيات */}
        <div className="max-w-7xl mx-auto mt-10 space-y-5 print:hidden">
          <div className="border-b-2 border-emerald-500/40 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                <Truck className="w-6 h-6 text-emerald-400" /> 3. قطاع أسطول النقل العام واللوجستيات
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">عوائد رحلات الشحن، تكاليف الصيانة والوقود، والربحية الصافية للآليات</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
              الرحلات المكتملة: {fleetFinance.tripsCount} رحلة
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-3">حسابات تشغيل الأسطول:</span>
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">إيراد النقل المحصل:</span>
                    <strong className="text-emerald-400 text-sm">{formatNum(fleetFinance.revenue)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">الصيانة والوقود:</span>
                    <strong className="text-rose-400 text-sm">{formatNum(fleetFinance.expenses)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-emerald-500/30">
                    <span className="text-slate-300 text-xs font-sans font-bold">صافي دخل الأسطول:</span>
                    <strong className="text-emerald-400 text-base">{formatNum(fleetFinance.net)} د.ع</strong>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">معدل كفاءة استهلاك الوقود والصيانة مسجل بالكامل في وحدة الأسطول.</p>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> المخطط الزمني لأداء الأسطول (الإيراد vs الصيانة)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">تتبع شهري 2026</span>
              </div>
              <div className="w-full h-64 min-h-[260px] pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={fleetFinance.timelineData} margin={{ top: 10, right: 10, left: 15, bottom: 10 }}>
                    <defs>
                      <linearGradient id="gradFleetRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="gradFleetExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', textAlign: 'right' }} formatter={(val: any) => [`${formatNum(val)} د.ع`]} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="إيرادات النقل" stroke="#10b981" fill="url(#gradFleetRev)" strokeWidth={2.5} isAnimationActive={false} />
                    <Area type="monotone" dataKey="expenses" name="الصيانة والتشغيل" stroke="#f59e0b" fill="url(#gradFleetExp)" strokeWidth={2.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* 4. قطاع العقارات والاستثمار */}
        <div className="max-w-7xl mx-auto mt-10 space-y-5 print:hidden">
          <div className="border-b-2 border-purple-500/40 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                <Building className="w-6 h-6 text-purple-400" /> 4. قطاع العقارات والوحدات الاستثمارية
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">عقود البيع، المتحصلات المالية، ونسب إشغال الوحدات عبر شهور العام</p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-xl">
              المباع: {realEstateFinance.soldCount} من أصل {realEstateFinance.unitsCount} وحدة
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-3">مؤشرات القطاع العقاري:</span>
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">إجمالي مبيعات العقارات:</span>
                    <strong className="text-purple-400 text-sm">{formatNum(realEstateFinance.revenue)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">عدد الوحدات الاستثمارية:</span>
                    <strong className="text-white text-sm">{realEstateFinance.unitsCount} وحدة</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-purple-500/30">
                    <span className="text-slate-300 text-xs font-sans font-bold">نسبة التحقيق والإشغال:</span>
                    <strong className="text-purple-300 text-base">
                      {realEstateFinance.unitsCount > 0 ? ((realEstateFinance.soldCount / realEstateFinance.unitsCount) * 100).toFixed(0) : 0}%
                    </strong>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">يشمل الأراضي والدور السكنية والمشاريع الاستثمارية المعتمدة.</p>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> المسار الزمني لتحصيل مبيعات العقارات
                </span>
                <span className="text-[10px] text-purple-400 font-mono">تتبع شهري 2026</span>
              </div>
              <div className="w-full h-64 min-h-[260px] pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={realEstateFinance.timelineData} margin={{ top: 10, right: 10, left: 15, bottom: 10 }}>
                    <defs>
                      <linearGradient id="gradRE" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', textAlign: 'right' }} formatter={(val: any) => [`${formatNum(val)} د.ع`]} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="متحصلات بيع الوحدات" stroke="#a855f7" fill="url(#gradRE)" strokeWidth={2.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* 5. قطاع الموارد البشرية والرواتب */}
        <div className="max-w-7xl mx-auto mt-10 space-y-5 print:hidden">
          <div className="border-b-2 border-rose-500/40 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                <Users className="w-6 h-6 text-rose-400" /> 5. قطاع الموارد البشرية والرواتب والأجور
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">مسير الرواتب المعتمد، البدلات، وتطور الإنفاق على الكوادر عبر شهور العام</p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-xl">
              إجمالي الكوادر: {hrFinance.count} موظف
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-3">كتلة الرواتب والالتزامات:</span>
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">الرواتب المنصرفة بالفترة:</span>
                    <strong className="text-rose-400 text-sm">{formatNum(hrFinance.totalSalaries)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-sans">الكتلة الشهرية الثابتة:</span>
                    <strong className="text-white text-sm">{formatNum(hrFinance.monthlyPayroll)} د.ع</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-rose-500/30">
                    <span className="text-slate-300 text-xs font-sans font-bold">عدد الكوادر النشطة:</span>
                    <strong className="text-rose-400 text-base">{hrFinance.count} موظف نشط</strong>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">يشمل المهندسين، الإداريين، المشرفين، وكباتن أسطول النقل.</p>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-rose-400" /> التطور الزمني لمنصرفات الرواتب والأجور
                </span>
                <span className="text-[10px] text-rose-400 font-mono">تتبع شهري 2026</span>
              </div>
              <div className="w-full h-64 min-h-[260px] pt-2" dir="ltr">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={hrFinance.timelineData} margin={{ top: 10, right: 10, left: 15, bottom: 10 }}>
                    <defs>
                      <linearGradient id="gradPayroll" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', textAlign: 'right' }} formatter={(val: any) => [`${formatNum(val)} د.ع`]} />
                    <Legend />
                    <Area type="monotone" dataKey="payroll" name="كتلة الرواتب" stroke="#f43f5e" fill="url(#gradPayroll)" strokeWidth={2.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* التقرير المالي الرسمي للطباعة A4 المخصص للإدارة العليا */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full max-w-5xl mx-auto bg-white text-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 shadow-2xl mt-14 print:border-none print:shadow-none print:p-0 print:m-0 space-y-6">
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200 shrink-0">
                <Image src="/logo.png" alt="شركة البرج المتألق" width={64} height={64} className="object-contain" priority />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-950">شركة البرج المتألق</h1>
                <p className="text-xs text-slate-600 font-bold mt-0.5">قائمة الدخل المركزية والتقارير المالية التنفيذية لكافة القطاعات</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">النجف الأشرف - حي الفرات | 07868006699</p>
              </div>
            </div>
            <div className="text-left flex flex-col items-end">
              <div className="border-2 border-slate-900 px-4 py-1.5 font-black text-xs uppercase tracking-wider bg-amber-400 text-slate-950 rounded-xl">
                التقرير المالي التنفيذي الموحد
              </div>
              <p className="text-[11px] font-mono mt-2 text-slate-600">تاريخ الطباعة: <span className="font-bold text-slate-950">{new Date().toISOString().split('T')[0]}</span></p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">الفترة: {startDate || 'منذ التأسيس'} إلى {endDate || 'اليوم'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-mono text-center">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 block text-[10px] font-sans">إجمالي الإيرادات المجمعة</span>
              <span className="text-base font-black text-emerald-700">{formatNum(summary.grandTotalRevenue)} د.ع</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 block text-[10px] font-sans">إجمالي المصروفات والتشغيل</span>
              <span className="text-base font-black text-rose-700">{formatNum(summary.grandTotalExpenses)} د.ع</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 block text-[10px] font-sans">صافي أرباح الشركة العام</span>
              <span className="text-base font-black text-sky-700">{formatNum(summary.grandNetProfit)} د.ع</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-xs text-slate-900">جدول الأداء المالي المنعزل والمفصل لكل قطاع:</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-right font-mono">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="p-3">القطاع / الوحدة التشغيلية</th>
                    <th className="p-3">الإيراد / المقبوض</th>
                    <th className="p-3">المصروف والتكاليف</th>
                    <th className="p-3">الموقف / البيان</th>
                    <th className="p-3 text-left">الصافي المالي للقطاع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  <tr>
                    <td className="p-3 font-bold font-sans text-slate-950">1. قطاع المقاولات والمشاريع الهندسية</td>
                    <td className="p-3 text-emerald-700 font-bold">{formatNum(summary.totalProjectsReceived)} د.ع</td>
                    <td className="p-3 text-rose-700 font-bold">{formatNum(summary.totalProjectsCosts)} د.ع</td>
                    <td className="p-3 text-slate-500 font-sans">{projects.length} مشاريع منجزة وقائمة</td>
                    <td className="p-3 text-left font-black text-slate-950">{formatNum(summary.totalProjectsReceived - summary.totalProjectsCosts)} د.ع</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold font-sans text-slate-950">2. قطاع التجارة العامة والمخزن المركزي</td>
                    <td className="p-3 text-emerald-700 font-bold">{formatNum(tradeFinance.salesRevenue)} د.ع</td>
                    <td className="p-3 text-rose-700 font-bold">{formatNum(tradeFinance.purchasesExpenses)} د.ع</td>
                    <td className="p-3 text-slate-500 font-sans">مبيعات واستيراد بضائع</td>
                    <td className="p-3 text-left font-black text-sky-700">{formatNum(tradeFinance.netProfit)} د.ع</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold font-sans text-slate-950">3. قطاع أسطول النقل العام واللوجستيات</td>
                    <td className="p-3 text-emerald-700 font-bold">{formatNum(fleetFinance.revenue)} د.ع</td>
                    <td className="p-3 text-rose-700 font-bold">{formatNum(fleetFinance.expenses)} د.ع</td>
                    <td className="p-3 text-slate-500 font-sans">{fleetFinance.tripsCount} رحلة نقل مكتملة</td>
                    <td className="p-3 text-left font-black text-emerald-700">{formatNum(fleetFinance.net)} د.ع</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold font-sans text-slate-950">4. قطاع العقارات والاستثمار</td>
                    <td className="p-3 text-emerald-700 font-bold">{formatNum(realEstateFinance.revenue)} د.ع</td>
                    <td className="p-3 text-rose-700 font-bold">0 د.ع</td>
                    <td className="p-3 text-slate-500 font-sans">{realEstateFinance.soldCount} وحدات مباعة ومحصلة</td>
                    <td className="p-3 text-left font-black text-purple-700">{formatNum(realEstateFinance.revenue)} د.ع</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold font-sans text-slate-950">5. قطاع الموارد البشرية والرواتب والأجور</td>
                    <td className="p-3 text-slate-400">---</td>
                    <td className="p-3 text-rose-700 font-bold">{formatNum(hrFinance.totalSalaries)} د.ع</td>
                    <td className="p-3 text-slate-500 font-sans">{hrFinance.count} كوادر نشطة</td>
                    <td className="p-3 text-left font-black text-rose-700">-{formatNum(hrFinance.totalSalaries)} د.ع</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-10 text-center border-t border-slate-200">
            <div>
              <p className="font-bold text-xs text-slate-700">مدير الحسابات والمالية</p>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-10"></div>
            </div>
            <div>
              <p className="font-bold text-xs text-slate-700">المدقق المالي الداخلي</p>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-10"></div>
            </div>
            <div>
              <p className="font-bold text-xs text-slate-700">المدير المفوض للشركة</p>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-10"></div>
            </div>
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}