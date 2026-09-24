'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  Clock, 
  TrendingUp,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Receipt,
  FileText,
  Hammer,
  Paperclip,
  Printer,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
  ClipboardList,
  DollarSign,
  Download,
  ShieldAlert,
  BellRing,
  BarChart3,
  LogOut,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Coins,
  Eye,
  Home,
  Sparkles
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function parseVoucherNotes(notes: string) {
  if (!notes) return { party: '---', reason: '---', method: 'نقداً', subId: '', matId: '', expId: '' };
  try {
    const p = JSON.parse(notes);
    return {
      party: p.partyAr || p.party || '---',
      reason: p.forReasonAr || p.forReason || p.notes || '---',
      method: p.method === 'CHEQUE' ? `شيك (${p.chequeNo || 'بدون رقم'})` : 'نقداً',
      subId: p.subcontractor_id || '',
      matId: p.material_id || '',
      expId: p.expense_id || ''
    };
  } catch {
    return { party: '---', reason: notes, method: 'نقداً', subId: '', matId: '', expId: '' };
  }
}

export default function ProjectsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [activeItemVouchersModal, setActiveItemVouchersModal] = useState<{
    title: string;
    targetName: string;
    vouchers: any[];
  } | null>(null);

  // تحديث الصلاحيات البرمجية لتقرأ مصفوفة الصلاحيات المخصصة التي يمنحها المدير المفوض
  const permissions = useMemo(() => {
    if (!currentUser) {
      return {
        canCreateProject: false,
        canDeleteProject: false,
        canEditContract: false,
        canViewAnalytics: false,
        canManageVouchers: false,
        canUpdateSiteProgress: false,
        canReceiveMaterials: false,
        canAddSiteLogs: false,
      };
    }

    const canAdd = hasPermission(currentUser, 'contracting', 'add');
    const canEdit = hasPermission(currentUser, 'contracting', 'edit');
    const canDelete = hasPermission(currentUser, 'contracting', 'delete');
    const canView = hasPermission(currentUser, 'contracting', 'view');
    const canVouchers = hasPermission(currentUser, 'vouchers', 'add') || hasPermission(currentUser, 'vouchers', 'view');

    return {
      canCreateProject: canAdd,
      canDeleteProject: canDelete,
      canEditContract: canEdit,
      canViewAnalytics: canView,
      canManageVouchers: canVouchers,
      canUpdateSiteProgress: canEdit,
      canReceiveMaterials: canAdd || canEdit,
      canAddSiteLogs: canAdd || canEdit,
    };
  }, [currentUser]);

  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('النجف الأشرف');
  const [contractValue, setContractValue] = useState('');
  const [currency, setCurrency] = useState('IQD');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [completionRate, setCompletionRate] = useState('0');
  const [notes, setNotes] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editRate, setEditRate] = useState('0');
  const [editStatus, setEditStatus] = useState('IN_PROGRESS');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteModalProject, setDeleteModalProject] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [statementProject, setStatementProject] = useState<any | null>(null);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'MILESTONES' | 'SUBS' | 'EXPENSES' | 'MATERIALS' | 'LOGS' | 'TERMS' | 'DOCS'>('ANALYTICS');

  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneWeight, setMilestoneWeight] = useState('20');

  const [subName, setSubName] = useState('');
  const [subTrade, setSubTrade] = useState('كهرباء وتأسيسات');
  const [subValue, setSubValue] = useState('');
  const [subNotes, setSubNotes] = useState('');

  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('نقل وآليات');
  const [expAmount, setExpAmount] = useState('');
  const [expNotes, setExpNotes] = useState('');

  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const [matName, setMatName] = useState('');
  const [matUnit, setMatUnit] = useState('طن');
  const [matSupplier, setMatSupplier] = useState('');
  const [matRec, setMatRec] = useState('');
  const [matPrice, setMatPrice] = useState('');

  const [logDate, setLogDate] = useState('');
  const [logWorkers, setLogWorkers] = useState('');
  const [logWeather, setLogWeather] = useState('صحو');
  const [logNotes, setLogNotes] = useState('');

  const [termTitle, setTermTitle] = useState('');
  const [termPct, setTermPct] = useState('');

  const handleQuickVoucherFromProject = (
    partyName: string, 
    amountVal: number, 
    projId: string, 
    vType: 'RECEIPT' | 'PAYMENT', 
    reasonText: string,
    materialId?: string,
    subcontractorId?: string,
    expenseId?: string
  ) => {
    const draftData = {
      party: partyName,
      amount: amountVal,
      project_id: projId,
      type: vType,
      voucher_type: vType,
      reason: reasonText,
      material_id: materialId || null,
      subcontractor_id: subcontractorId || null,
      expense_id: expenseId || null
    };
    localStorage.setItem('quick_voucher_draft', JSON.stringify(draftData));
    localStorage.setItem('active_voucher_tab', vType);
    router.push(`/vouchers?type=${vType}`);
  };

  const loadData = async () => {
    try {
      const [resP, resV] = await Promise.all([
        fetch('/api/projects', { cache: 'no-store' }).catch(() => null),
        fetch('/api/vouchers', { cache: 'no-store' }).catch(() => null)
      ]);

      if (resV && resV.ok) {
        const dataV = await resV.json();
        if (dataV.vouchers) setVouchers(dataV.vouchers);
      }

      if (resP && resP.ok) {
        const dataP = await resP.json();
        if (dataP.projects) {
          setProjects(dataP.projects);
        }
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    setStartDate(new Date().toISOString().split('T')[0]);
    setLogDate(new Date().toISOString().split('T')[0]);

    const savedUser = localStorage.getItem('erp_user');
    if (!savedUser) {
      router.push('/login');
      return;
    }

    try {
      setCurrentUser(JSON.parse(savedUser));
    } catch {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    router.push('/login');
  };

  const clean = (t: string) => (t || '').trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ');

  const calculatedProjects = useMemo(() => {
    return projects.map((p) => {
      let rec = 0;
      let exp = 0;
      const matchedVouchers: any[] = [];
      const pId = String(p.project_id || '');
      const pName = clean(p.project_name);

      for (const v of vouchers) {
        if (v.status === 'VOID' || v.status === 'CANCELLED') continue;
        const vProjId = String(v.project_id || v.v_proj_id || '');
        const vProjName = clean(v.project_name || '');
        const vNotes = clean(v.notes || '');

        const isMatched = (vProjId !== '' && vProjId === pId) || 
                          (vProjName !== '' && (vProjName === pName || pName.includes(vProjName))) || 
                          (pName.length > 4 && vNotes.includes(pName));
        if (isMatched) {
          let val = Number(v.total_amount || v.amount || v.calculated_amount || 0);
          if (val === 0 && v.notes) {
            try {
              const parsed = JSON.parse(v.notes);
              if (parsed.amount) val = Number(parsed.amount);
            } catch {}
          }
          matchedVouchers.push({ ...v, amount: val });
          if (v.voucher_type === 'RECEIPT') rec += val;
          if (v.voucher_type === 'PAYMENT') exp += val;
        }
      }

      const projectPayVouchers = vouchers.filter((v) => {
        if (v.voucher_type !== 'PAYMENT' || v.status === 'VOID' || v.status === 'CANCELLED') return false;
        const vProjId = String(v.project_id || v.v_proj_id || '');
        const vNotes = clean(v.notes || '');
        return (vProjId === pId) || vNotes.includes(pName);
      }).map((v) => {
        let vSubId = '';
        let vMatId = '';
        let vExpId = '';
        let vParty = '';
        let voucherVal = Number(v.total_amount || v.amount || v.calculated_amount || 0);
        try {
          const parsed = JSON.parse(v.notes || '{}');
          if (parsed.subcontractor_id) vSubId = String(parsed.subcontractor_id);
          if (parsed.material_id) vMatId = String(parsed.material_id);
          if (parsed.expense_id) vExpId = String(parsed.expense_id);
          if (parsed.partyAr) vParty = clean(parsed.partyAr);
          if (voucherVal === 0 && parsed.amount) voucherVal = Number(parsed.amount);
        } catch {}
        return {
          ...v,
          vSubId,
          vMatId,
          vExpId,
          vParty: vParty || clean(v.party_name || ''),
          vNotesClean: clean(v.notes || ''),
          totalVoucherAmount: voucherVal,
          remainingAlloc: voucherVal
        };
      });

      // 1. مقاولو الباطن
      const rawSubs = p.subcontractors || [];
      const mergedSubsMap = new Map<string, any>();
      let totalSubsContract = 0;
      let totalSubsPaidVouchers = 0;

      for (const sub of rawSubs) {
        const sNameKey = clean(sub.name);
        const cVal = Number(sub.contract_value) || 0;
        const sIdStr = String(sub.subcontractor_id || '');
        totalSubsContract += cVal;

        let batchPaid = 0;
        const attachedVouchers: any[] = [];

        for (const v of projectPayVouchers) {
          if (v.remainingAlloc <= 0) continue;
          if (sIdStr !== '' && (v.vSubId === sIdStr || v.vNotesClean.includes(sIdStr))) {
            const take = Math.min(cVal - batchPaid, v.remainingAlloc);
            batchPaid += take;
            v.remainingAlloc -= take;
            attachedVouchers.push(v);
            if (batchPaid >= cVal) break;
          }
        }

        if (batchPaid < cVal) {
          for (const v of projectPayVouchers) {
            if (v.remainingAlloc <= 0 || v.vSubId !== '') continue;
            const isMatch = (v.vParty === sNameKey || v.vNotesClean.includes(sNameKey)) && v.vNotesClean.includes(clean(sub.trade));
            if (isMatch) {
              const take = Math.min(cVal - batchPaid, v.remainingAlloc);
              batchPaid += take;
              v.remainingAlloc -= take;
              attachedVouchers.push(v);
              if (batchPaid >= cVal) break;
            }
          }
        }

        const cappedPaid = Math.min(cVal, batchPaid);
        totalSubsPaidVouchers += cappedPaid;
        const remainingVal = Math.max(0, cVal - cappedPaid);
        const progressPct = cVal > 0 ? Math.min(100, Math.round((cappedPaid / cVal) * 100)) : 0;

        const subItem = {
          subcontractor_id: sub.subcontractor_id,
          name: sub.name,
          trade: sub.trade,
          contract_value: cVal,
          paid_amount: cappedPaid,
          remaining_amount: remainingVal,
          progress_pct: progressPct,
          notes: sub.notes || '',
          is_paid: cappedPaid >= cVal && cVal > 0,
          attachedVouchers
        };

        if (mergedSubsMap.has(sNameKey)) {
          const group = mergedSubsMap.get(sNameKey);
          group.total_contract += cVal;
          group.paid_amount += cappedPaid;
          group.unpaid_amount += remainingVal;
          group.batches.push(subItem);
        } else {
          mergedSubsMap.set(sNameKey, {
            name: sub.name,
            total_contract: cVal,
            paid_amount: cappedPaid,
            unpaid_amount: remainingVal,
            batches: [subItem]
          });
        }
      }

      const enrichedSubs = Array.from(mergedSubsMap.values());
      const totalSubsRemainingNoVouchers = Math.max(0, totalSubsContract - totalSubsPaidVouchers);

      // 2. المصاريف التشغيلية
      const rawOperatingExp = p.operating_expenses || [];
      const mergedExpMap = new Map<string, any>();
      let totalOperatingExpCost = 0;
      let totalOperatingExpPaid = 0;

      for (const expItem of rawOperatingExp) {
        const expNameKey = clean(expItem.title);
        const eVal = Number(expItem.amount) || 0;
        const eIdStr = String(expItem.expense_id || '');
        totalOperatingExpCost += eVal;

        let batchPaid = 0;
        const attachedVouchers: any[] = [];

        for (const v of projectPayVouchers) {
          if (v.remainingAlloc <= 0) continue;
          if (eIdStr !== '' && (v.vExpId === eIdStr || v.vNotesClean.includes(eIdStr))) {
            const take = Math.min(eVal - batchPaid, v.remainingAlloc);
            batchPaid += take;
            v.remainingAlloc -= take;
            attachedVouchers.push(v);
            if (batchPaid >= eVal) break;
          }
        }

        const cappedPaid = Math.min(eVal, batchPaid);
        totalOperatingExpPaid += cappedPaid;
        const remainingVal = Math.max(0, eVal - cappedPaid);
        const progressPct = eVal > 0 ? Math.min(100, Math.round((cappedPaid / eVal) * 100)) : 0;

        const singleExp = {
          expense_id: expItem.expense_id,
          title: expItem.title,
          category: expItem.category,
          amount: eVal,
          paid_amount: cappedPaid,
          remaining_amount: remainingVal,
          progress_pct: progressPct,
          notes: expItem.notes || '',
          is_paid: cappedPaid >= eVal && eVal > 0,
          attachedVouchers
        };

        if (mergedExpMap.has(expNameKey)) {
          const group = mergedExpMap.get(expNameKey);
          group.total_amount += eVal;
          group.paid_amount += cappedPaid;
          group.unpaid_amount += remainingVal;
          group.batches.push(singleExp);
        } else {
          mergedExpMap.set(expNameKey, {
            title: expItem.title,
            total_amount: eVal,
            paid_amount: cappedPaid,
            unpaid_amount: remainingVal,
            batches: [singleExp]
          });
        }
      }

      const projectOperatingExpenses = Array.from(mergedExpMap.values());
      const totalOperatingExpRemaining = Math.max(0, totalOperatingExpCost - totalOperatingExpPaid);

      // 3. المواد والتوريدات
      const rawMaterials = p.materials || [];
      const mergedMaterialsMap = new Map<string, any>();
      let actualMaterialsCost = 0;
      let paidMaterialsVouchers = 0;

      for (const mat of rawMaterials) {
        const nameKey = clean(mat.material_name);
        const recQty = Number(mat.quantity_received) || 0;
        const price = Number(mat.unit_price) || 0;
        const itemCost = recQty * price;
        actualMaterialsCost += itemCost;
        const matIdStr = String(mat.material_id || '');

        let batchPaid = 0;
        const attachedVouchers: any[] = [];

        for (const v of projectPayVouchers) {
          if (v.remainingAlloc <= 0) continue;
          if (matIdStr !== '' && (v.vMatId === matIdStr || v.vNotesClean.includes(matIdStr))) {
            const take = Math.min(itemCost - batchPaid, v.remainingAlloc);
            batchPaid += take;
            v.remainingAlloc -= take;
            attachedVouchers.push(v);
            if (batchPaid >= itemCost) break;
          }
        }

        if (batchPaid < itemCost) {
          const sNameClean = clean(mat.supplier_name || '');
          for (const v of projectPayVouchers) {
            if (v.remainingAlloc <= 0 || v.vMatId !== '') continue;
            const isMatch = (sNameClean && sNameClean !== 'عام' && (v.vParty.includes(sNameClean) || v.vNotesClean.includes(sNameClean))) && v.vNotesClean.includes(nameKey);
            if (isMatch) {
              const take = Math.min(itemCost - batchPaid, v.remainingAlloc);
              batchPaid += take;
              v.remainingAlloc -= take;
              attachedVouchers.push(v);
              if (batchPaid >= itemCost) break;
            }
          }
        }

        const cappedPaid = Math.min(itemCost, batchPaid);
        paidMaterialsVouchers += cappedPaid;
        const remainingVal = Math.max(0, itemCost - cappedPaid);
        const progressPct = itemCost > 0 ? Math.min(100, Math.round((cappedPaid / itemCost) * 100)) : 0;

        const batchItem = {
          material_id: mat.material_id,
          supplier_name: mat.supplier_name || 'عام',
          quantity_received: recQty,
          unit_price: price,
          total_cost: itemCost,
          paid_amount: cappedPaid,
          remaining_amount: remainingVal,
          progress_pct: progressPct,
          is_paid: cappedPaid >= itemCost && itemCost > 0,
          created_at: mat.created_at,
          attachedVouchers
        };

        if (mergedMaterialsMap.has(nameKey)) {
          const group = mergedMaterialsMap.get(nameKey);
          group.quantity_received += recQty;
          group.total_cost += itemCost;
          group.paid_cost += cappedPaid;
          group.unpaid_cost += remainingVal;
          group.batches.push(batchItem);
          group.unit_price = group.quantity_received > 0 ? group.total_cost / group.quantity_received : group.unit_price;
        } else {
          mergedMaterialsMap.set(nameKey, {
            material_name: mat.material_name,
            unit: mat.unit,
            supplier_name: mat.supplier_name || 'عام',
            quantity_received: recQty,
            unit_price: price,
            total_cost: itemCost,
            paid_cost: cappedPaid,
            unpaid_cost: remainingVal,
            batches: [batchItem]
          });
        }
      }

      const materialsList = Array.from(mergedMaterialsMap.values());
      const remainingMaterialsPending = Math.max(0, actualMaterialsCost - paidMaterialsVouchers);

      // 4. الدفعات التعاقدية
      const currentRate = Number(p.completion_rate || 0);
      const calculatedTerms = (p.payment_terms || []).map((term: any) => {
        const tTitle = clean(term.term_title);
        const termIdStr = String(term.term_id || '');
        let actualVoucherPaid = 0;
        const attachedVouchers: any[] = [];

        for (const v of vouchers) {
          if (v.status !== 'VOID' && v.status !== 'CANCELLED') {
            const vNotes = clean(v.notes || '');
            const vProjId = String(v.project_id || v.v_proj_id || '');
            const isProjectMatch = (vProjId === pId || vNotes.includes(pName));
            const isTermMatch = (termIdStr !== '' && vNotes.includes(termIdStr)) || (tTitle.length > 2 && vNotes.includes(tTitle));

            if (isProjectMatch && isTermMatch) {
              let amt = Number(v.total_amount || v.amount || v.calculated_amount || 0);
              if (amt === 0 && v.notes) {
                try {
                  const parsed = JSON.parse(v.notes);
                  if (parsed.amount) amt = Number(parsed.amount);
                } catch {}
              }
              actualVoucherPaid += amt;
              attachedVouchers.push(v);
            }
          }
        }

        const totalTermAmt = Number(term.amount) || 0;
        const paidFinal = term.is_paid ? totalTermAmt : Math.min(totalTermAmt, actualVoucherPaid);
        const remainTermAmt = Math.max(0, totalTermAmt - paidFinal);
        const termPct = totalTermAmt > 0 ? Math.min(100, Math.round((paidFinal / totalTermAmt) * 100)) : 0;

        return {
          ...term,
          is_paid: paidFinal >= totalTermAmt && totalTermAmt > 0,
          isDueNow: paidFinal < totalTermAmt && currentRate >= Number(term.target_milestone_rate || 0),
          paidAmt: paidFinal,
          remainAmt: remainTermAmt,
          progressPct: termPct,
          attachedVouchers
        };
      });

      const pureGeneralExpenses = Math.max(0, exp - totalSubsPaidVouchers - paidMaterialsVouchers - totalOperatingExpPaid);
      const totalSiteCosts = actualMaterialsCost + totalSubsContract + totalOperatingExpCost + pureGeneralExpenses;
      const actualNetCash = rec - totalSiteCosts;
      const actualMarginPct = rec > 0 ? ((actualNetCash / rec) * 100) : 0;

      const contractVal = Number(p.contract_value) || 0;
      const expectedNetProfit = contractVal - totalSiteCosts;
      const netMarginPercentage = contractVal > 0 ? ((expectedNetProfit / contractVal) * 100) : 0;

      return {
        ...p,
        total_received: rec,
        total_expenses: totalSiteCosts,
        total_site_costs: totalSiteCosts,
        actual_net_cash: actualNetCash,
        actual_margin_pct: Number(actualMarginPct.toFixed(1)),
        vouchers: matchedVouchers.length > 0 ? matchedVouchers : (p.vouchers || []),
        subcontractors: enrichedSubs,
        operating_expenses: projectOperatingExpenses,
        materials: materialsList,
        due_terms: calculatedTerms.filter((t: any) => t.isDueNow),
        payment_terms: calculatedTerms,
        planned_materials_cost: actualMaterialsCost,
        actual_materials_cost: actualMaterialsCost,
        paid_materials_vouchers: paidMaterialsVouchers,
        remaining_materials_pending: remainingMaterialsPending,
        total_subs_cost: totalSubsContract,
        total_subs_paid_vouchers: totalSubsPaidVouchers,
        total_subs_remaining_no_vouchers: totalSubsRemainingNoVouchers,
        total_operating_exp_cost: totalOperatingExpCost,
        total_operating_exp_paid: totalOperatingExpPaid,
        remaining_operating_exp_pending: totalOperatingExpRemaining,
        other_expenses: pureGeneralExpenses,
        expected_net_profit: expectedNetProfit,
        net_margin_percentage: Number(netMarginPercentage.toFixed(1))
      };
    });
  }, [projects, vouchers]);

  const activeTabProject = useMemo(() => {
    if (!activeProjectId) return null;
    return calculatedProjects.find((p) => String(p.project_id) === String(activeProjectId)) || null;
  }, [calculatedProjects, activeProjectId]);

  const filteredProjects = useMemo(() => {
    return calculatedProjects.filter((p) => {
      const matchSearch = p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [calculatedProjects, searchQuery, statusFilter]);

  const activeOngoingProjects = useMemo(() => {
    return calculatedProjects.filter((p) => {
      const isCompleted = p.status === 'COMPLETED' || Number(p.completion_rate || 0) >= 100;
      return !isCompleted;
    });
  }, [calculatedProjects]);

  const totalValue = useMemo(() => {
    return activeOngoingProjects.reduce((acc, curr) => acc + Number(curr.contract_value || 0), 0);
  }, [activeOngoingProjects]);

  const totalExpenses = useMemo(() => {
    return activeOngoingProjects.reduce((acc, curr) => acc + Number(curr.total_expenses || 0), 0);
  }, [activeOngoingProjects]);

  const totalReceived = useMemo(() => {
    return activeOngoingProjects.reduce((acc, curr) => acc + Number(curr.total_received || 0), 0);
  }, [activeOngoingProjects]);

  const totalNetLiquidity = useMemo(() => {
    return totalReceived - totalExpenses;
  }, [totalReceived, totalExpenses]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canCreateProject) {
      alert('ليس لديك صلاحية إضافة مشاريع جديدة');
      return;
    }
    if (!projectName || !clientName || !contractValue) {
      setMessage('يرجى ملء الحقول الأساسية');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          client_name: clientName,
          location,
          contract_value: contractValue,
          currency,
          start_date: startDate || null,
          expected_end_date: expectedEndDate || null,
          completion_rate: completionRate,
          notes,
        }),
      });
      if (res.ok) {
        setMessage('تم تسجيل المشروع بنجاح!');
        setProjectName('');
        setClientName('');
        setLocation('النجف الأشرف');
        setContractValue('');
        setCompletionRate('0');
        setNotes('');
        setExpectedEndDate('');
        loadData();
      }
    } catch (err: any) {
      setMessage(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProject) return;
    if (!permissions.canUpdateSiteProgress) {
      alert('ليس لديك صلاحية تعديل نسبة إنجاز المشاريع');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: editingProject.project_id,
          completion_rate: parseFloat(editRate),
          status: editStatus,
        }),
      });
      if (res.ok) {
        setEditingProject(null);
        await loadData();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteModalProject) return;
    if (!permissions.canDeleteProject) {
      alert('ليس لديك صلاحية حذف المشاريع');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects?id=${deleteModalProject.project_id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteModalProject(null);
        loadData();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!milestoneName || !activeTabProject) return;
    if (!permissions.canUpdateSiteProgress) {
      alert('ليس لديك صلاحية إضافة مراحل');
      return;
    }
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ADD_MILESTONE', project_id: activeTabProject.project_id, name: milestoneName, weight: milestoneWeight }),
    });
    setMilestoneName('');
    loadData();
  };

  const handleUpdateMilestoneProgress = async (milestoneId: string, percentage: number) => {
    if (!activeTabProject) return;
    if (!permissions.canUpdateSiteProgress) {
      alert('ليس لديك صلاحية تعديل مراحل الإنجاز');
      return;
    }
    setProjects((prev) => prev.map((p) => {
      if (String(p.project_id) === String(activeTabProject.project_id)) {
        return {
          ...p,
          milestones: (p.milestones || []).map((m: any) => m.milestone_id === milestoneId ? { ...m, completion_percentage: percentage } : m)
        };
      }
      return p;
    }));

    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_MILESTONE_PROGRESS', milestone_id: milestoneId, completion_percentage: percentage }),
    });
  };

  const handleAddSubcontractor = async () => {
    if (!subName || !activeTabProject) return;
    if (!permissions.canEditContract) {
      alert('ليس لديك صلاحية إضافة مقاولي باطن');
      return;
    }
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'ADD_SUBCONTRACTOR', 
        project_id: activeTabProject.project_id, 
        name: subName.trim(), 
        trade: subTrade.trim() || 'أعمال عامة', 
        contract_value: Number(subValue) || 0, 
        paid_amount: 0,
        notes: subNotes.trim()
      }),
    });
    setSubName('');
    setSubValue('');
    setSubNotes('');
    loadData();
  };

  const handleDeleteSubcontractor = async (singleSubId: string) => {
    if (!permissions.canDeleteProject) {
      alert('ليس لديك صلاحية حذف مقاولي الباطن');
      return;
    }
    if (!confirm('تنبيه مالي محكم: حذف هذا العقد سيقوم بإلغاء وإسقاط السندات المالية المرتبطة به وتحويل حالتها إلى ملغي (VOID). هل تريد الاستمرار؟')) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_SUBCONTRACTOR', subcontractor_id: singleSubId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'فشل حذف العقد');
        return;
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleAddOperatingExpense = async () => {
    if (!expTitle || !activeTabProject) return;
    if (!permissions.canEditContract) {
      alert('ليس لديك صلاحية إضافة مصاريف تشغيلية');
      return;
    }
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'ADD_OPERATING_EXPENSE', 
        project_id: activeTabProject.project_id, 
        title: expTitle.trim(), 
        category: expCategory.trim() || 'مصاريف تشغيلية', 
        amount: Number(expAmount) || 0, 
        notes: expNotes.trim()
      }),
    });
    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
    loadData();
  };

  const handleDeleteOperatingExpense = async (singleExpenseId: string) => {
    if (!permissions.canDeleteProject) {
      alert('ليس لديك صلاحية حذف المصاريف التشغيلية');
      return;
    }
    if (!confirm('تنبيه: سيتم حذف هذا البند فقط وتحويل سنداته إلى حالة ملغي (VOID). هل أنت متأكد؟')) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_OPERATING_EXPENSE', expense_id: singleExpenseId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'فشل حذف المصروف');
        return;
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleAddDocument = async () => {
    if (!docTitle || !docUrl || !activeTabProject) return;
    if (!permissions.canEditContract) {
      alert('ليس لديك صلاحية إرفاق وثائق');
      return;
    }
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_DOCUMENT',
        project_id: activeTabProject.project_id,
        title: docTitle,
        file_url: docUrl,
      }),
    });
    setDocTitle('');
    setDocUrl('');
    loadData();
  };

  const handleAddMaterial = async () => {
    if (!matName || !activeTabProject) return;
    if (!permissions.canReceiveMaterials) {
      alert('ليس لديك صلاحية توريد واستلام المواد');
      return;
    }
    const recQty = Number(matRec) || 0;
    const price = Number(matPrice) || 0;

    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_MATERIAL',
        project_id: activeTabProject.project_id,
        material_name: matName.trim(),
        unit: matUnit || 'طن',
        quantity_required: recQty,
        quantity_received: recQty,
        unit_price: price,
        supplier_name: matSupplier.trim() || 'عام'
      }),
    });

    setMatName('');
    setMatRec('');
    setMatPrice('');
    setMatSupplier('');
    loadData();
  };

  const handleDeleteMaterial = async (singleMaterialId: string) => {
    if (!permissions.canDeleteProject) {
      alert('ليس لديك صلاحية حذف المواد');
      return;
    }
    if (!confirm('تنبيه: حذف هذا التوريد سيقوم بإلغاء وإسقاط السندات المسجلة عليه وتحويلها إلى ملغي (VOID). هل أنت متأكد؟')) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_MATERIAL', material_id: singleMaterialId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'فشل حذف المادة');
        return;
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleAddSiteLog = async () => {
    if (!logNotes || !activeTabProject) return;
    if (!permissions.canAddSiteLogs) {
      alert('ليس لديك صلاحية إضافة يوميات الموقع');
      return;
    }
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_SITE_LOG',
        project_id: activeTabProject.project_id,
        log_date: logDate,
        workers_count: Number(logWorkers) || 0,
        weather: logWeather,
        notes: logNotes
      }),
    });
    setLogNotes('');
    setLogWorkers('');
    loadData();
  };

  const handleDeleteSiteLog = async (logId: string) => {
    if (!permissions.canDeleteProject) {
      alert('ليس لديك صلاحية حذف اليوميات');
      return;
    }
    if (!confirm('هل تريد حذف هذا التقرير اليومي؟')) return;
    try {
      await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_SITE_LOG', log_id: logId })
      });
      loadData();
    } catch (err) {
      alert('خطأ في الحذف');
    }
  };

  const handleAddPaymentTerm = async () => {
    if (!termTitle || !activeTabProject) return;
    if (!permissions.canEditContract) {
      alert('ليس لديك صلاحية إضافة دفعات تعاقدية');
      return;
    }
    const contractVal = Number(activeTabProject.contract_value) || 0;
    const pct = Number(termPct) || 0;
    const computedAmt = (contractVal * pct) / 100;
    const pId = activeTabProject.project_id;

    setTermTitle('');
    setTermPct('');

    try {
      await Promise.all([
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ADD_PAYMENT_TERM',
            project_id: pId,
            term_title: termTitle,
            due_percentage: pct,
            amount: computedAmt,
            target_milestone_rate: pct
          }),
        }),
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'ADD_MILESTONE', 
            project_id: pId, 
            name: termTitle, 
            weight: pct 
          }),
        })
      ]);

      await loadData();
    } catch (err: any) {
      console.error('Save error:', err);
    }
  };

  const handleCreateVoucherForTerm = (term: any) => {
    if (!permissions.canManageVouchers) {
      alert('ليس لديك صلاحية إصدار سندات قبض');
      return;
    }
    const remain = term.remainAmt > 0 ? term.remainAmt : term.amount;
    const draftData = {
      party: activeTabProject.client_name,
      amount: remain,
      project_id: activeTabProject.project_id,
      type: 'RECEIPT',
      voucher_type: 'RECEIPT',
      reason: `قبض دفعة تعاقدية (${term.term_title}) [${term.term_id}] بنسبة ${term.due_percentage}% لمشروع ${activeTabProject.project_name}`
    };
    localStorage.setItem('quick_voucher_draft', JSON.stringify(draftData));
    localStorage.setItem('active_voucher_tab', 'RECEIPT');
    router.push('/vouchers?type=RECEIPT');
  };

  const handleDeletePaymentTerm = async (termId: string, termTitleText: string) => {
    if (!permissions.canDeleteProject) {
      alert('ليس لديك صلاحية حذف الدفعات التعاقدية');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة التعاقدية؟ سيتم إلغاء أي سندات قبض مرتبطة بها.')) return;

    try {
      const matchedMilestone = (activeTabProject?.milestones || []).find((m: any) => clean(m.name) === clean(termTitleText));
      
      await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_PAYMENT_TERM', term_id: termId })
      });

      if (matchedMilestone) {
        await fetch('/api/projects', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'DELETE_MILESTONE', milestone_id: matchedMilestone.milestone_id })
        });
      }

      await loadData();
    } catch (err) {
      alert('خطأ في الحذف');
    }
  };

  const exportToCSV = (proj: any) => {
    if (!proj || !proj.vouchers || proj.vouchers.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }
    const headers = ['رقم السند', 'النوع', 'التاريخ', 'الطرف / المستفيد', 'البيان', 'المبلغ'];
    const rows = proj.vouchers.map((v: any) => {
      const parsed = parseVoucherNotes(v.notes);
      return [
        v.voucher_number,
        v.voucher_type === 'RECEIPT' ? 'قبض' : 'صرف',
        v.total_amount,
        v.currency,
        `"${parsed.party}"`,
        `"${parsed.reason.replace(/"/g, '""')}"`,
        v.issue_date ? String(v.issue_date).split('T')[0] : ''
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `سندات_${proj.project_name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted || !currentUser) return null;

  const roleClean = String(currentUser?.role || '').toUpperCase();
  const isSuperAdmin = currentUser?.is_super_admin || roleClean === 'ADMIN' || roleClean.includes('إدارة');
  const roleTitle = isSuperAdmin ? 'الإدارة العليا' : roleClean === 'ACCOUNTANT' ? 'المحاسب المالي' : (currentUser?.job_title || 'موظف مصرح');

  const roleColor = isSuperAdmin
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : roleClean === 'ACCOUNTANT'
    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  return (
    <AuthGuard moduleName="contracting" requiredAction="view">
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
                    إدارة مشاريع المقاولات والإعمار (ERP المتكامل)
                  </h1>
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-3 py-0.5 rounded-full shadow-inner font-mono">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    General Contracting
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  شركة البرج المتألق للمقاولات العامة والاستثمارات العقارية
                </p>
              </div>
            </div>

            {/* الطرف الأيسر: شارة المستخدم وأزرار التنقل السريع في سطر واحد ثابت */}
            <div className="flex items-center gap-2.5 flex-nowrap shrink-0 self-end xl:self-auto overflow-x-auto">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/50 bg-slate-800 flex items-center justify-center shrink-0">
                  {currentUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{currentUser.full_name}</p>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border inline-block mt-0.5 ${roleColor}`}>
                    {roleTitle}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition mr-0.5 cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {permissions.canManageVouchers && (
                <Link 
                  href="/vouchers" 
                  className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer shadow-sm"
                >
                  <Receipt className="w-4 h-4" /> شاشة السندات
                </Link>
              )}

              <Link 
                href="/" 
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" /> الرئيسية
              </Link>
            </div>

          </div>
        </div>

        {/* بطاقات المؤشرات المالية العامة الأربعة للمشاريع الجارية فقط */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 print:hidden">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
            <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي قيم العقود (الجارية)</p>
            <h3 className="text-2xl font-mono font-black text-amber-400">{formatNum(totalValue)} <span className="text-xs text-slate-400 font-sans">د.ع</span></h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
            <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي المقبوضات (المشاريع الجارية)</p>
            <h3 className="text-2xl font-mono font-black text-emerald-400">{formatNum(totalReceived)} <span className="text-xs text-slate-400 font-sans">د.ع</span></h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
            <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي المصروفات (المشاريع الجارية)</p>
            <h3 className="text-2xl font-mono font-black text-rose-400">{formatNum(totalExpenses)} <span className="text-xs text-slate-400 font-sans">د.ع</span></h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
            <p className="text-xs text-slate-400 font-semibold mb-1">صافي السيولة التشغيلية</p>
            <h3 className={`text-2xl font-mono font-black ${totalNetLiquidity >= 0 ? 'text-sky-400' : 'text-rose-500'}`}>
              {formatNum(totalNetLiquidity)} <span className="text-xs text-slate-400 font-sans">د.ع</span>
            </h3>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 print:hidden">
          
          {/* تسجيل مشروع جديد */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl h-fit space-y-4 relative overflow-hidden shadow-2xl">
            {!permissions.canCreateProject && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Lock className="w-8 h-8 text-amber-400" />
                <p className="text-[14px] font-bold text-white">إضافة المشاريع مقيدة بالصلاحيات</p>
                <p className="text-xs text-slate-400">حسابك الحالي لا يمتلك صلاحية إنشاء مشاريع جديدة. راجع المدير المفوض لمنحك إذن الإضافة.</p>
              </div>
            )}

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" /> تسجيل مشروع مقاولة جديد
            </h2>
            {message && (
              <div className={`p-3 rounded-2xl text-xs font-semibold ${message.includes('خطأ') ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {message}
              </div>
            )}
            <form onSubmit={handleCreateProject} className="space-y-3.5 text-[14px]">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">اسم المشروع *</label>
                <input type="text" required placeholder="مجمع الفرات السكني" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">العميل / الجهة المالكة *</label>
                <input type="text" required placeholder="اسم المستثمر أو الجهة" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">موقع العمل</label>
                <input type="text" placeholder="النجف - حي الفرات" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">قيمة العقد *</label>
                  <input type="number" step="any" required placeholder="0.00" value={contractValue} onChange={(e) => setContractValue(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">العملة</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white">
                    <option value="IQD">دينار (IQD)</option>
                    <option value="USD">دولار (USD)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">تاريخ البدء</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">التسليم المتوقع</label>
                  <input type="date" value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
              </div>
              <button type="submit" disabled={loading || !permissions.canCreateProject} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition text-[14px] mt-2 shadow-lg shadow-amber-500/20">
                {loading ? 'جاري التسجيل...' : 'حفظ وتسجيل المشروع'}
              </button>
            </form>
          </div>

          {/* قائمة المشاريع */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row gap-3 shadow-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input type="text" placeholder="ابحث باسم المشروع أو العميل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl pr-10 pl-3 py-2.5 text-[14px] text-white outline-none" />
              </div>
              <div className="w-full sm:w-48">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-2.5 text-[14px] text-white outline-none">
                  <option value="ALL">جميع الحالات</option>
                  <option value="IN_PROGRESS">قيد التنفيذ</option>
                  <option value="COMPLETED">مكتمل ومسلّم</option>
                  <option value="SUSPENDED">متوقف مؤقتاً</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredProjects.map((project) => {
                const rate = Number(project.completion_rate || 0);
                const contract = Number(project.contract_value || 0);
                const received = Number(project.total_received || 0);
                const isCompleted = project.status === 'COMPLETED' || rate === 100;
                const isSuspended = project.status === 'SUSPENDED';

                const costRatio = contract > 0 ? (project.total_site_costs / contract) * 100 : 0;
                const isCostAlert = costRatio >= 80;

                return (
                  <div key={project.project_id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-slate-700 transition space-y-4 shadow-xl">
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">{project.project_name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isSuspended ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}>
                            {isCompleted ? 'مكتمل ومسلّم' : isSuspended ? 'متوقف مؤقتاً' : 'قيد التنفيذ'}
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                            project.actual_net_cash >= 0 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            هامش الربح الفعلي: {project.actual_margin_pct}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" /> {project.client_name}
                          <span className="text-slate-600">•</span>
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> {project.location || 'النجف'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-nowrap self-start lg:self-auto">
                        {permissions.canManageVouchers && (
                          <button onClick={() => setStatementProject(project)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap">
                            <FileText className="w-3.5 h-3.5" /> كشف حساب
                          </button>
                        )}
                        
                        <button onClick={() => setActiveProjectId(project.project_id)} className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap">
                          <BarChart3 className="w-3.5 h-3.5" /> التحليلات
                        </button>

                        {permissions.canUpdateSiteProgress && (
                          <button onClick={() => { setEditingProject(project); setEditRate(project.completion_rate?.toString() || '0'); setEditStatus(project.status || 'IN_PROGRESS'); }} className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap">
                            <Edit3 className="w-3.5 h-3.5" /> تعديل الإنجاز
                          </button>
                        )}

                        {permissions.canDeleteProject && (
                          <button onClick={() => setDeleteModalProject(project)} className="bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white p-2 rounded-xl transition border border-rose-500/30 shrink-0" title="حذف المشروع">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-[13px] font-mono">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-sans">قيمة العقد</span>
                        <span className="font-bold text-amber-400">{formatNum(contract)} {project.currency}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-sans">المقبوض من العميل</span>
                        <span className="font-bold text-emerald-400">{formatNum(received)} {project.currency}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-sans">إجمالي التكاليف الموقعية</span>
                        <span className="font-bold text-rose-400">{formatNum(project.total_site_costs)} {project.currency}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-sans">صافي الربح الفعلي</span>
                        <span className={`font-bold ${project.actual_net_cash >= 0 ? 'text-sky-400' : 'text-rose-500'}`}>
                          {formatNum(project.actual_net_cash)} {project.currency}
                        </span>
                      </div>
                    </div>

                    {isCostAlert && (
                      <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                        <ShieldAlert className="w-4 h-4" />
                        <span>تنبيه مالي: استنزفت التكاليف {costRatio.toFixed(1)}% من سقف قيمة العقد الكلية!</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> نسبة الإنجاز التنفيذي الفعلي
                        </span>
                        <span className="font-mono font-bold text-white">{rate}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${rate >= 100 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-sky-500'}`} style={{ width: `${rate}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* كشف حساب ومستخلص مالي A4 */}
        {statementProject && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:static">
            <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 print:hidden shadow-xl">
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition">
                  <Printer className="w-4 h-4" /> طباعة المستخلص (A4)
                </button>
                <button onClick={() => exportToCSV(statementProject)} className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition">
                  <Download className="w-4 h-4" /> تصدير السندات (Excel / CSV)
                </button>
              </div>
              <button onClick={() => setStatementProject(null)} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-w-5xl bg-white text-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-6">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    <Image src="/logo.png" alt="شركة البرج المتألق" width={70} height={70} className="object-contain" priority />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-950">شركة البرج المتألق</h1>
                    <p className="text-xs text-slate-600 font-bold mt-0.5">للمقاولات العامة والاستثمارات العقارية والنقل العام</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">النجف الأشرف - حي الفرات | 07868006699</p>
                  </div>
                </div>
                <div className="text-left flex flex-col items-end">
                  <div className="border-2 border-slate-900 px-4 py-1.5 font-black text-xs uppercase tracking-wider bg-amber-500 text-slate-950 rounded-xl">
                    كشف حساب ومستخلص مالي تفصيلي
                  </div>
                  <p className="text-[11px] font-mono mt-2 text-slate-500">تاريخ التقرير: <span className="font-bold text-slate-900">{new Date().toISOString().split('T')[0]}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[13px] font-semibold">
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">اسم المشروع</span>
                  <span className="text-slate-950 font-bold block truncate">{statementProject.project_name}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">العميل / المالك</span>
                  <span className="text-slate-950 font-bold block truncate">{statementProject.client_name}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">قيمة العقد</span>
                  <span className="text-amber-600 font-mono font-black text-sm block">{formatNum(statementProject.contract_value)} {statementProject.currency}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">نسبة الإنجاز</span>
                  <span className="text-emerald-600 font-mono font-black text-sm block">{statementProject.completion_rate}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> 1. حركة السندات والتحويلات المالية المقيدة
                </h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-[12px]">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">رقم السند</th>
                        <th className="p-3">النوع</th>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">المستفيد</th>
                        <th className="p-3">البيان</th>
                        <th className="p-3 text-left">المبلغ ({statementProject.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statementProject.vouchers && statementProject.vouchers.length > 0 ? (
                        statementProject.vouchers.map((v: any) => {
                          const parsed = parseVoucherNotes(v.notes);
                          const isRec = v.voucher_type === 'RECEIPT';
                          return (
                            <tr key={v.voucher_id} className="hover:bg-slate-50/80">
                              <td className="p-3 font-mono font-bold text-slate-900">{v.voucher_number}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded font-black text-[10px] ${isRec ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                  {isRec ? 'قبض' : 'صرف'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-500">{String(v.issue_date || '').split('T')[0]}</td>
                              <td className="p-3 font-bold text-slate-800">{parsed.party}</td>
                              <td className="p-3 text-slate-600">{parsed.reason}</td>
                              <td className="p-3 text-left font-mono font-black text-slate-950">{formatNum(v.amount || v.total_amount)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan={6} className="text-center py-6 text-slate-400">لا توجد سندات مسجلة.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span> 2. الموقف المالي لمقاولي الباطن
                </h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-[12px]">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">المقاول</th>
                        <th className="p-3">إجمالي العقود</th>
                        <th className="p-3">المدفوع الفعلي</th>
                        <th className="p-3">المتبقي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {statementProject.subcontractors && statementProject.subcontractors.length > 0 ? (
                        statementProject.subcontractors.map((s: any, sIdx: number) => (
                          <tr key={sIdx}>
                            <td className="p-3 font-bold font-sans text-slate-900">{s.name}</td>
                            <td className="p-3 font-bold text-amber-600">{formatNum(s.total_contract)}</td>
                            <td className="p-3 font-bold text-emerald-600">{formatNum(s.paid_amount)}</td>
                            <td className="p-3 font-bold text-rose-600">{formatNum(s.unpaid_amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="text-center py-6 text-slate-400 font-sans">لا يوجد مقاولو باطن.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-2 border-slate-900 p-5 rounded-2xl bg-slate-50 text-center">
                <div>
                  <p className="text-[11px] text-slate-500 font-bold">إجمالي المقبوضات</p>
                  <p className="text-xl font-black font-mono text-emerald-600">{formatNum(statementProject.total_received)}</p>
                </div>
                <div className="border-x-2 border-slate-200">
                  <p className="text-[11px] text-slate-500 font-bold">إجمالي المصروفات</p>
                  <p className="text-xl font-black font-mono text-rose-600">{formatNum(statementProject.total_expenses)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-bold">صافي السيولة</p>
                  <p className={`text-xl font-black font-mono ${(statementProject.total_received - statementProject.total_expenses) >= 0 ? 'text-sky-700' : 'text-rose-700'}`}>
                    {formatNum(statementProject.total_received - statementProject.total_expenses)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8 text-center border-t border-slate-200">
                <div><p className="font-bold text-xs text-slate-700">المهندس المقيم</p><div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div></div>
                <div><p className="font-bold text-xs text-slate-700">مدير الحسابات</p><div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div></div>
                <div><p className="font-bold text-xs text-slate-700">المدير العام</p><div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div></div>
              </div>
            </div>
          </div>
        )}

        {/* النافذة الشاملة للمشروع */}
        {activeTabProject && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-amber-400" /> إدارة تفاصيل: {activeTabProject.project_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">التحليلات المالية، المواد، اليوميات، والمراحل التنفيذية</p>
                </div>
                <button onClick={() => setActiveProjectId(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* شريط التبويبات */}
              <div className="flex flex-col items-center justify-center gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
                
                {/* السطر الأول */}
                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <button 
                    onClick={() => setActiveTab('ANALYTICS')} 
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      activeTab === 'ANALYTICS' 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>التحليلات والهوامش</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('MATERIALS')} 
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      activeTab === 'MATERIALS' 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-sky-400" />
                    <span>المواد والتوريدات</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('SUBS')} 
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      activeTab === 'SUBS' 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>مقاول باطن</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('EXPENSES')} 
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      activeTab === 'EXPENSES' 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>المصاريف التشغيلية</span>
                  </button>
                </div>

                {/* السطر الثاني */}
                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <button 
                    onClick={() => setActiveTab('TERMS')} 
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      activeTab === 'TERMS' 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>دفعات العقد المستحقة</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('MILESTONES')} 
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      activeTab === 'MILESTONES' 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>مراحل التنفيذ</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('LOGS')} 
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      activeTab === 'LOGS' 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
                    <span>سجل الموقع اليومي</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('DOCS')} 
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                      activeTab === 'DOCS' 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20' 
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                    <span>المخططات والوثائق</span>
                  </button>
                </div>

              </div>

              {/* تبويب التحليلات وهوامش الأرباح */}
              {activeTab === 'ANALYTICS' && (() => {
                const contractVal = Number(activeTabProject.contract_value) || 0;
                const receivedFromClient = Number(activeTabProject.total_received) || 0;
                const remainingFromClient = Math.max(0, contractVal - receivedFromClient);
                const clientCollectionRate = contractVal > 0 ? ((receivedFromClient / contractVal) * 100).toFixed(1) : '0';

                const totalSiteCosts = Number(activeTabProject.total_site_costs) || 0;
                const subsPaidVouchers = Number(activeTabProject.total_subs_paid_vouchers) || 0;
                const paidMaterialsVouchers = Number(activeTabProject.paid_materials_vouchers) || 0;
                const operatingExpPaid = Number(activeTabProject.total_operating_exp_paid) || 0;
                const pureOtherExpenses = Number(activeTabProject.other_expenses) || 0;

                const totalVoucheredExpenses = subsPaidVouchers + paidMaterialsVouchers + operatingExpPaid + pureOtherExpenses;
                const remainingMaterialsPending = Number(activeTabProject.remaining_materials_pending) || 0;
                const subsRemainingNoVouchers = Number(activeTabProject.total_subs_remaining_no_vouchers) || 0;
                const operatingExpRemaining = Number(activeTabProject.remaining_operating_exp_pending) || 0;

                const totalUnvoucheredCosts = remainingMaterialsPending + subsRemainingNoVouchers + operatingExpRemaining;

                const realizedNetProfit = receivedFromClient - totalSiteCosts;
                const realizedMargin = receivedFromClient > 0 ? ((realizedNetProfit / receivedFromClient) * 100).toFixed(1) : '0';

                const ledgerNetCash = receivedFromClient - totalVoucheredExpenses;

                const expectedContractProfit = contractVal - totalSiteCosts;
                const expectedContractMargin = contractVal > 0 ? ((expectedContractProfit / contractVal) * 100).toFixed(1) : '0';

                const budgetBurnRate = contractVal > 0 ? Math.min(100, Math.round((totalSiteCosts / contractVal) * 100)) : 0;

                return (
                  <div className="space-y-4 text-right">
                    
                    {/* البطاقات الرئيسية */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[11px] text-slate-400 font-semibold block">قيمة العقد الإجمالية</span>
                        <p className="text-lg font-mono font-black text-amber-400">
                          {formatNum(contractVal)} <span className="text-xs text-slate-500 font-sans">{activeTabProject.currency}</span>
                        </p>
                        <span className="text-[10px] text-slate-500 block">المبلغ المتفق عليه تعاقدياً</span>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-1 bg-emerald-500/5">
                        <span className="text-[11px] text-emerald-300 font-semibold block">المقبوض الفعلي من العميل</span>
                        <p className="text-lg font-mono font-black text-emerald-400">
                          {formatNum(receivedFromClient)} <span className="text-xs text-emerald-300 font-sans">{activeTabProject.currency}</span>
                        </p>
                        <span className="text-[10px] text-slate-400 block">
                          المحصل: <strong className="text-emerald-400">{clientCollectionRate}%</strong> (المتبقي: {formatNum(remainingFromClient)})
                        </span>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/30 space-y-1 bg-rose-500/5">
                        <span className="text-[11px] text-rose-300 font-semibold block">إجمالي التكاليف الموقعية</span>
                        <p className="text-lg font-mono font-black text-rose-400">
                          {formatNum(totalSiteCosts)} <span className="text-xs text-rose-300 font-sans">{activeTabProject.currency}</span>
                        </p>
                        <span className="text-[10px] text-slate-400 block">مواد + مقاولين + مصاريف تشغيلية</span>
                      </div>

                      <div className={`bg-slate-950 p-4 rounded-2xl border space-y-1 ${realizedNetProfit >= 0 ? 'border-sky-500/40 bg-sky-500/5' : 'border-rose-600/50 bg-rose-950/20'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-300">الربح الفعلي المحقق</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${realizedNetProfit >= 0 ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            (المقبوض - التكاليف)
                          </span>
                        </div>
                        <p className={`text-lg font-mono font-black ${realizedNetProfit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                          {formatNum(realizedNetProfit)} <span className="text-xs font-sans text-slate-400">{activeTabProject.currency}</span>
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>الهامش من المقبوض:</span>
                          <span className={`font-mono font-bold ${realizedNetProfit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                            {realizedMargin}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* تقرير الموقف الدفتري */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-amber-400" />
                          تقرير الموقف الدفتري (مقارنة السندات المقيدة مقابل الالتزامات المعلقة)
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          سيولة الصندوق الدفترية: <strong className="text-sky-400">{formatNum(ledgerNetCash)} {activeTabProject.currency}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-900/80 border border-emerald-500/30 p-4 rounded-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> المقيد رسمياً (تم عمل وصولات له)
                            </span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                              سندات دفتريّة
                            </span>
                          </div>

                          <div className="space-y-2 font-mono">
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>دفعات عميل (سندات قبض):</span>
                              <strong className="text-emerald-400">{formatNum(receivedFromClient)} {activeTabProject.currency}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>مقاولو باطن (سندات صرف):</span>
                              <strong className="text-rose-400">{formatNum(subsPaidVouchers)} {activeTabProject.currency}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>مواد وتوريدات (سندات صرف موردين):</span>
                              <strong className="text-sky-400">{formatNum(paidMaterialsVouchers)} {activeTabProject.currency}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>المصاريف التشغيلية (سندات صرف):</span>
                              <strong className="text-emerald-400">{formatNum(operatingExpPaid)} {activeTabProject.currency}</strong>
                            </div>
                            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold font-sans">
                              <span className="text-white">إجمالي المدفوعات المسندة:</span>
                              <span className="text-rose-400 font-mono">{formatNum(totalVoucheredExpenses)} {activeTabProject.currency}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-amber-400 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4" /> المعلق ميدانياً (لم يتم عمل وصولات له)
                            </span>
                            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                              التزامات واجبة الصرف
                            </span>
                          </div>

                          <div className="space-y-2 font-mono">
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>المتبقي بذمة العميل (لم يُقبض):</span>
                              <strong className="text-amber-400">{formatNum(remainingFromClient)} {activeTabProject.currency}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>مستحقات مقاولي باطن متبقية:</span>
                              <strong className="text-rose-400">{formatNum(subsRemainingNoVouchers)} {activeTabProject.currency}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>متبقي مستحقات الموردين (مواد مستلمة):</span>
                              <strong className="text-amber-400">{formatNum(remainingMaterialsPending)} {activeTabProject.currency}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 text-[11px]">
                              <span>مستحقات المصاريف التشغيلية المتبقية:</span>
                              <strong className="text-amber-400">{formatNum(operatingExpRemaining)} {activeTabProject.currency}</strong>
                            </div>
                            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold font-sans">
                              <span className="text-white">إجمالي الالتزامات المعلقة:</span>
                              <span className="text-rose-400 font-mono">{formatNum(totalUnvoucheredCosts)} {activeTabProject.currency}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* شريط التحليل التوازني */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-amber-400" />
                            التحليل التوازني للعقد (المقبوض الفعلي مقابل التكاليف والعقد الكلي)
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            الربح النهائي المتوقع عند تسليم المشروع بالكامل: 
                            <strong className="text-emerald-400 font-mono mr-1">{formatNum(expectedContractProfit)} {activeTabProject.currency} ({expectedContractMargin}%)</strong>
                          </p>
                        </div>

                        <div className="text-left font-mono text-xs">
                          <span className="text-slate-400 text-[11px]">استنزاف الميزانية: </span>
                          <span className={`font-bold ${budgetBurnRate > 80 ? 'text-rose-400' : budgetBurnRate > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {budgetBurnRate}% من قيمة العقد
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">المقبوض المحصل ({clientCollectionRate}%)</span>
                          <span className="text-emerald-400 font-bold">{formatNum(receivedFromClient)} {activeTabProject.currency}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, Number(clientCollectionRate))}%` }}></div>
                        </div>

                        <div className="flex justify-between text-[11px] font-mono pt-1">
                          <span className="text-slate-400">التكاليف المصروفة من العقد ({budgetBurnRate}%)</span>
                          <span className="text-rose-400 font-bold">{formatNum(totalSiteCosts)} {activeTabProject.currency}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${budgetBurnRate}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* الرسم البياني للمواد */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-sky-400" /> المقارنة التحليلية لتكلفة المواد
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          إجمالي المستلم: <strong className="text-amber-400">{formatNum(activeTabProject.actual_materials_cost)}</strong> {activeTabProject.currency}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">تكلفة المواد المستلمة فعلياً في الموقع</span>
                            <span className="font-mono text-amber-400 font-bold">{formatNum(activeTabProject.actual_materials_cost)} {activeTabProject.currency}</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full w-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* التوزيع التفصيلي للتكاليف */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="font-bold text-white">1. تكلفة المواد الموردة</span>
                          <span className="font-mono text-amber-400 font-bold">
                            {totalSiteCosts > 0 ? ((activeTabProject.actual_materials_cost / totalSiteCosts) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <p className="font-mono font-black text-amber-400 text-base">
                          {formatNum(activeTabProject.actual_materials_cost)} <span className="text-[10px] font-sans text-slate-500">{activeTabProject.currency}</span>
                        </p>
                      </div>

                      <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="font-bold text-white">2. عقود مقاولي الباطن</span>
                          <span className="font-mono text-sky-400 font-bold">
                            {totalSiteCosts > 0 ? (((Number(activeTabProject.total_subs_cost) || 0) / totalSiteCosts) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <p className="font-mono font-black text-sky-400 text-base">
                          {formatNum(activeTabProject.total_subs_cost || 0)} <span className="text-[10px] font-sans text-slate-500">{activeTabProject.currency}</span>
                        </p>
                      </div>

                      <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="font-bold text-white">3. المصاريف التشغيلية</span>
                          <span className="font-mono text-rose-400 font-bold">
                            {totalSiteCosts > 0 ? (((Number(activeTabProject.total_operating_exp_cost) || 0) / totalSiteCosts) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <p className="font-mono font-black text-rose-400 text-base">
                          {formatNum(activeTabProject.total_operating_exp_cost || 0)} <span className="text-[10px] font-sans text-slate-500">{activeTabProject.currency}</span>
                        </p>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* مقاولو الباطن */}
              {activeTab === 'SUBS' && (
                <div className="space-y-4">
                  {permissions.canEditContract && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[14px]">
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">اسم المقاول *</label>
                          <input 
                            type="text" 
                            placeholder="اسم المقاول (مطابق للاسم بالسند)" 
                            value={subName} 
                            onChange={(e) => setSubName(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">التخصص / نوع العمل *</label>
                          <input 
                            type="text" 
                            placeholder="كهرباء، بناء..." 
                            value={subTrade} 
                            onChange={(e) => setSubTrade(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">قيمة العقد (د.ع) *</label>
                          <input 
                            type="number" 
                            placeholder="إجمالي قيمة العقد" 
                            value={subValue} 
                            onChange={(e) => setSubValue(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">ملاحظات العقد</label>
                          <input 
                            type="text" 
                            placeholder="شروط إضافية..." 
                            value={subNotes} 
                            onChange={(e) => setSubNotes(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                      </div>
                      <button onClick={handleAddSubcontractor} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20">
                        <Plus className="w-4 h-4" /> إضافة عقد مقاول باطن جديد
                      </button>
                    </>
                  )}

                  <div className="space-y-4 mt-4">
                    {activeTabProject.subcontractors && activeTabProject.subcontractors.length > 0 ? (
                      activeTabProject.subcontractors.map((subGroup: any, idx: number) => {
                        const totalContract = Number(subGroup.total_contract) || 0;
                        const totalPaid = Number(subGroup.paid_amount) || 0;
                        const totalRemaining = Number(subGroup.unpaid_amount) || 0;

                        return (
                          <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                                  <User className="w-5 h-5 text-sky-400" />
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-white">{subGroup.name}</h4>
                                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    عدد العقود المسجلة: <span className="text-amber-400 font-bold">{subGroup.batches?.length || 0}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-xl text-xs font-mono">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-sans">إجمالي العقود</span>
                                  <span className="font-bold text-amber-400">{formatNum(totalContract)} د.ع</span>
                                </div>
                                <div className="border-r border-slate-700 pr-3">
                                  <span className="text-[10px] text-slate-400 block font-sans">المدفوع / المتبقي</span>
                                  <span className="font-bold">
                                    <span className="text-emerald-400">{formatNum(totalPaid)}</span> / <span className="text-rose-400">{formatNum(totalRemaining)}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <span className="text-[11px] text-slate-400 font-bold block">تفاصيل العقود والأعمال المسجلة ({subGroup.batches?.length || 0}):</span>
                              
                              <div className="grid grid-cols-1 gap-3">
                                {subGroup.batches?.map((batch: any, bIdx: number) => {
                                  const cVal = Number(batch.contract_value) || 0;
                                  const pVal = Number(batch.paid_amount) || 0;
                                  const rVal = Number(batch.remaining_amount) || 0;
                                  const pct = batch.progress_pct || 0;
                                  const isComp = batch.is_paid;

                                  return (
                                    <div key={bIdx} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 text-xs">
                                      
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                          {isComp ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                          ) : (
                                            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
                                          )}
                                          <div>
                                            <p className="font-bold text-slate-100 text-sm">
                                              العمل / التخصص: <span className="text-amber-300">{batch.trade}</span>
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                          <button
                                            type="button"
                                            onClick={() => setActiveItemVouchersModal({
                                              title: `سندات مقاول الباطن (${subGroup.name})`,
                                              targetName: `أعمال ${batch.trade} - ${subGroup.name}`,
                                              vouchers: batch.attachedVouchers || []
                                            })}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                                              isComp 
                                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700'
                                            }`}
                                            title="عرض الوصولات والسندات الصادرة لهذا المقاول"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            {isComp ? 'تم استيفاء العقد بالكامل (عرض السندات ✓)' : 'عرض الوصولات'}
                                          </button>

                                          {!isComp && permissions.canManageVouchers && (
                                            <button
                                              onClick={() => handleQuickVoucherFromProject(
                                                subGroup.name,
                                                rVal > 0 ? rVal : cVal,
                                                activeTabProject.project_id,
                                                'PAYMENT',
                                                `دفعة لمقاول الباطن (${subGroup.name}) عن أعمال ${batch.trade} لمشروع ${activeTabProject.project_name}`,
                                                undefined,
                                                batch.subcontractor_id
                                              )}
                                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                                            >
                                              <Receipt className="w-3.5 h-3.5" /> إصدار دفعة / وصل
                                            </button>
                                          )}

                                          {permissions.canDeleteProject && (
                                            <button
                                              onClick={() => handleDeleteSubcontractor(batch.subcontractor_id)}
                                              className="text-rose-400 hover:text-white hover:bg-rose-600 p-2 rounded-xl border border-rose-500/30 transition shadow"
                                              title="حذف هذا العقد وإلغاء سنده المرتبط"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-xs font-mono">
                                        <div 
                                          className="cursor-pointer hover:bg-slate-900/80 p-1 rounded transition"
                                          onClick={() => setActiveItemVouchersModal({
                                            title: `سندات مقاول الباطن (${subGroup.name})`,
                                            targetName: `أعمال ${batch.trade}`,
                                            vouchers: batch.attachedVouchers || []
                                          })}
                                          title="اضغط لعرض الوصولات"
                                        >
                                          <span className="text-slate-400 block text-[10px] font-sans flex items-center gap-1">
                                            المبلغ المدفوع (سندات) <Eye className="w-3 h-3 text-sky-400" />
                                          </span>
                                          <span className="font-bold text-emerald-400">{formatNum(pVal)} د.ع</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px] font-sans">المبلغ المتبقي</span>
                                          <span className={`font-bold ${rVal > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{formatNum(rVal)} د.ع</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px] font-sans">حالة الصرف</span>
                                          <span className={`font-bold ${isComp ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {isComp ? 'مكتمل السداد' : 'قيد الصرف'}
                                          </span>
                                        </div>
                                      </div>

                                      {batch.notes && (
                                        <div className="bg-slate-950/70 border border-slate-800 p-2 rounded-lg text-[11px] text-slate-300 flex items-start gap-2">
                                          <FileText className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
                                          <span><strong className="text-amber-300 font-medium">الملاحظات:</strong> {batch.notes}</span>
                                        </div>
                                      )}

                                      <div className="space-y-1 pt-1">
                                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                                          <span>نسبة الإيفاء: {pct}%</span>
                                          <span>إجمالي قيمة العقد: {formatNum(cVal)} د.ع</span>
                                        </div>
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full transition-all duration-500 ${isComp ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                            style={{ width: `${pct}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-6 text-slate-500 text-xs">لا يوجد مقاولو باطن مسجلون للمشروع بعد.</p>
                    )}
                  </div>
                </div>
              )}

              {/* تبويب المصاريف التشغيلية */}
              {activeTab === 'EXPENSES' && (
                <div className="space-y-4">
                  {permissions.canEditContract && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[14px]">
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">اسم الجهة / بند المصروف *</label>
                          <input 
                            type="text" 
                            placeholder="إيجار آلية..." 
                            value={expTitle} 
                            onChange={(e) => setExpTitle(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">التصنيف / نوع المصروف *</label>
                          <input 
                            type="text" 
                            placeholder="نقل وآليات..." 
                            value={expCategory} 
                            onChange={(e) => setExpCategory(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">المبلغ المقدر (د.ع) *</label>
                          <input 
                            type="number" 
                            placeholder="المبلغ الكلي" 
                            value={expAmount} 
                            onChange={(e) => setExpAmount(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">ملاحظات المصروف</label>
                          <input 
                            type="text" 
                            placeholder="تفاصيل الدفع..." 
                            value={expNotes} 
                            onChange={(e) => setExpNotes(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                      </div>
                      <button onClick={handleAddOperatingExpense} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20">
                        <Plus className="w-4 h-4" /> إضافة بند مصروف تشغيلي جديد
                      </button>
                    </>
                  )}

                  <div className="space-y-4 mt-4">
                    {activeTabProject.operating_expenses && activeTabProject.operating_expenses.length > 0 ? (
                      activeTabProject.operating_expenses.map((expGroup: any, idx: number) => {
                        const totalAmt = Number(expGroup.total_amount) || 0;
                        const totalPaid = Number(expGroup.paid_amount) || 0;
                        const totalRemaining = Number(expGroup.unpaid_amount) || 0;

                        return (
                          <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                  <Coins className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-white">{expGroup.title}</h4>
                                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    عدد البنود المسجلة: <span className="text-amber-400 font-bold">{expGroup.batches?.length || 0}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-xl text-xs font-mono">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-sans">إجمالي المبلغ</span>
                                  <span className="font-bold text-amber-400">{formatNum(totalAmt)} د.ع</span>
                                </div>
                                <div className="border-r border-slate-700 pr-3">
                                  <span className="text-[10px] text-slate-400 block font-sans">المدفوع / المتبقي</span>
                                  <span className="font-bold">
                                    <span className="text-emerald-400">{formatNum(totalPaid)}</span> / <span className="text-rose-400">{formatNum(totalRemaining)}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-3">
                                {expGroup.batches?.map((batch: any, bIdx: number) => {
                                  const cVal = Number(batch.amount) || 0;
                                  const pVal = Number(batch.paid_amount) || 0;
                                  const rVal = Number(batch.remaining_amount) || 0;
                                  const pct = batch.progress_pct || 0;
                                  const isComp = batch.is_paid;

                                  return (
                                    <div key={bIdx} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 text-xs">
                                      
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                          {isComp ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                          ) : (
                                            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
                                          )}
                                          <div>
                                            <p className="font-bold text-slate-100 text-sm">
                                              التصنيف: <span className="text-amber-300">{batch.category}</span>
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                          {isComp ? (
                                            <button
                                              onClick={() => setActiveItemVouchersModal({
                                                title: `سندات مصروف (${expGroup.title})`,
                                                targetName: `${expGroup.title} - ${batch.category}`,
                                                vouchers: batch.attachedVouchers || []
                                              })}
                                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition"
                                            >
                                              <Eye className="w-3.5 h-3.5" /> مدفوعة بالكامل (عرض السندات ✓)
                                            </button>
                                          ) : (
                                            permissions.canManageVouchers && (
                                              <button
                                                onClick={() => handleQuickVoucherFromProject(
                                                  expGroup.title,
                                                  rVal > 0 ? rVal : cVal,
                                                  activeTabProject.project_id,
                                                  'PAYMENT',
                                                  `دفعة مصروف تشغيلي (${expGroup.title} - ${batch.category}) لمشروع ${activeTabProject.project_name}`,
                                                  undefined,
                                                  undefined,
                                                  batch.expense_id
                                                )}
                                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                                              >
                                                <Receipt className="w-3.5 h-3.5" /> إصدار دفعة / وصل
                                              </button>
                                            )
                                          )}

                                          {permissions.canDeleteProject && (
                                            <button
                                              onClick={() => handleDeleteOperatingExpense(batch.expense_id)}
                                              className="text-rose-400 hover:text-white hover:bg-rose-600 p-2 rounded-xl border border-rose-500/30 transition shadow"
                                              title="حذف هذا المصروف"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-xs font-mono">
                                        <div 
                                          className="cursor-pointer hover:bg-slate-900/80 p-1 rounded transition"
                                          onClick={() => setActiveItemVouchersModal({
                                            title: `سندات مصروف (${expGroup.title})`,
                                            targetName: `${expGroup.title} - ${batch.category}`,
                                            vouchers: batch.attachedVouchers || []
                                          })}
                                          title="اضغط لعرض الوصولات"
                                        >
                                          <span className="text-slate-400 block text-[10px] font-sans flex items-center gap-1">
                                            المبلغ المدفوع (سندات) <Eye className="w-3 h-3 text-sky-400" />
                                          </span>
                                          <span className="font-bold text-emerald-400">{formatNum(pVal)} د.ع</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px] font-sans">المبلغ المتبقي</span>
                                          <span className={`font-bold ${rVal > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{formatNum(rVal)} د.ع</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px] font-sans">حالة الصرف</span>
                                          <span className={`font-bold ${isComp ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {isComp ? 'مكتمل السداد' : 'قيد الصرف'}
                                          </span>
                                        </div>
                                      </div>

                                      {batch.notes && (
                                        <div className="bg-slate-950/70 border border-slate-800 p-2 rounded-lg text-[11px] text-slate-300 flex items-start gap-2">
                                          <FileText className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
                                          <span><strong className="text-amber-300 font-medium">الملاحظات:</strong> {batch.notes}</span>
                                        </div>
                                      )}

                                      <div className="space-y-1 pt-1">
                                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                                          <span>نسبة الإيفاء: {pct}%</span>
                                          <span>المبلغ الإجمالي: {formatNum(cVal)} د.ع</span>
                                        </div>
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full transition-all duration-500 ${isComp ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                            style={{ width: `${pct}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-6 text-slate-500 text-xs">لا توجد مصاريف تشغيلية مسجلة لهذا المشروع بعد.</p>
                    )}
                  </div>
                </div>
              )}

              {/* إدارة المواد والتوريدات */}
              {activeTab === 'MATERIALS' && (
                <div className="space-y-4">
                  {permissions.canReceiveMaterials && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[14px]">
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">اسم المادة *</label>
                          <input 
                            type="text" 
                            placeholder="حديد تسليح..." 
                            value={matName} 
                            onChange={(e) => setMatName(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">الوحدة</label>
                          <input 
                            type="text" 
                            placeholder="طن..." 
                            value={matUnit} 
                            onChange={(e) => setMatUnit(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">اسم المورد</label>
                          <input 
                            type="text" 
                            placeholder="المورد" 
                            value={matSupplier} 
                            onChange={(e) => setMatSupplier(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">الكمية المستلمة *</label>
                          <input 
                            type="number" 
                            placeholder="الكمية" 
                            value={matRec} 
                            onChange={(e) => setMatRec(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 text-xs font-semibold">سعر الوحدة (د.ع) *</label>
                          <input 
                            type="number" 
                            placeholder="السعر" 
                            value={matPrice} 
                            onChange={(e) => setMatPrice(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono" 
                          />
                        </div>
                      </div>
                      <button onClick={handleAddMaterial} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20">
                        <Plus className="w-4 h-4" /> إضافة مادة جديدة للتوريدات
                      </button>
                    </>
                  )}

                  <div className="space-y-4 mt-4">
                    {activeTabProject.materials && activeTabProject.materials.length > 0 ? (
                      activeTabProject.materials.map((mat: any, idx: number) => {
                        const rec = Number(mat.quantity_received) || 0;
                        const unitPrice = Number(mat.unit_price) || 0;
                        const totalCost = Number(mat.total_cost) || (rec * unitPrice);

                        return (
                          <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-white">{mat.material_name} <span className="text-xs text-slate-400">({mat.unit})</span></h4>
                                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    سعر الوحدة: <span className="text-amber-400 font-bold">{formatNum(Math.round(unitPrice))} د.ع</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-xl text-xs font-mono">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-sans">إجمالي الكمية</span>
                                  <span className="font-bold text-emerald-400">{rec} {mat.unit}</span>
                                </div>
                                <div className="border-r border-slate-700 pr-3">
                                  <span className="text-[10px] text-slate-400 block font-sans">إجمالي التكلفة</span>
                                  <span className="font-bold text-sky-400">{formatNum(totalCost)} د.ع</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-3">
                                {mat.batches?.map((batch: any, bIdx: number) => {
                                  const pVal = Number(batch.paid_amount) || 0;
                                  const rVal = Number(batch.remaining_amount) || 0;
                                  const isComp = Boolean(batch.is_paid);
                                  const tCost = Number(batch.total_cost) || 0;
                                  const pct = batch.progress_pct || 0;

                                  return (
                                    <div key={bIdx} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 text-xs">
                                      
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                          {isComp ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                          ) : (
                                            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
                                          )}
                                          <div>
                                            <p className="font-bold text-slate-100 text-sm">
                                              المورد: <span className="text-amber-300">{batch.supplier_name}</span>
                                            </p>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                              <span>الكمية: <strong className="text-emerald-400">{batch.quantity_received} {mat.unit}</strong></span>
                                              <span>•</span>
                                              <span>سعر الوحدة: <strong className="text-slate-300">{formatNum(batch.unit_price)} د.ع</strong></span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                          {isComp ? (
                                            <button
                                              onClick={() => setActiveItemVouchersModal({
                                                title: `سندات توريد (${mat.material_name})`,
                                                targetName: `${mat.material_name} - المورد: ${batch.supplier_name}`,
                                                vouchers: batch.attachedVouchers || []
                                              })}
                                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition"
                                            >
                                              <Eye className="w-3.5 h-3.5" /> مستوفى بالكامل (عرض السندات ✓)
                                            </button>
                                          ) : (
                                            permissions.canManageVouchers && (
                                              <button
                                                onClick={() => handleQuickVoucherFromProject(
                                                  batch.supplier_name && batch.supplier_name !== 'عام' ? batch.supplier_name : 'مورد مواد',
                                                  rVal > 0 ? rVal : tCost,
                                                  activeTabProject.project_id,
                                                  'PAYMENT',
                                                  `دفعة للمورد (${batch.supplier_name}) عن توريد ${mat.material_name} لمشروع ${activeTabProject.project_name}`,
                                                  batch.material_id
                                                )}
                                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                                              >
                                                <Receipt className="w-3.5 h-3.5" /> إصدار دفعة / وصل
                                              </button>
                                            )
                                          )}

                                          {permissions.canDeleteProject && (
                                            <button
                                              onClick={() => handleDeleteMaterial(batch.material_id)}
                                              className="text-rose-400 hover:text-white hover:bg-rose-600 p-2 rounded-xl border border-rose-500/30 transition shadow"
                                              title="حذف هذا التوريد"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-xs font-mono">
                                        <div 
                                          className="cursor-pointer hover:bg-slate-900/80 p-1 rounded transition"
                                          onClick={() => setActiveItemVouchersModal({
                                            title: `سندات توريد (${mat.material_name})`,
                                            targetName: `توريد ${mat.material_name}`,
                                            vouchers: batch.attachedVouchers || []
                                          })}
                                          title="اضغط لعرض الوصولات"
                                        >
                                          <span className="text-slate-400 block text-[10px] font-sans flex items-center gap-1">
                                            المبلغ المدفوع (سندات) <Eye className="w-3 h-3 text-sky-400" />
                                          </span>
                                          <span className="font-bold text-emerald-400">{formatNum(pVal)} د.ع</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px] font-sans">المبلغ المتبقي</span>
                                          <span className={`font-bold ${rVal > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{formatNum(rVal)} د.ع</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px] font-sans">حالة الصرف</span>
                                          <span className={`font-bold ${isComp ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {isComp ? 'مكتمل السداد' : 'قيد الصرف'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="space-y-1 pt-1">
                                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                                          <span>نسبة الإيفاء: {pct}%</span>
                                          <span>إجمالي قيمة التوريد: {formatNum(tCost)} د.ع</span>
                                        </div>
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full transition-all duration-500 ${isComp ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                            style={{ width: `${pct}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-6 text-slate-500 text-xs">لا توجد مواد مسجلة لهذا المشروع بعد.</p>
                    )}
                  </div>
                </div>
              )}

              {/* دفعات العقد المستحقة */}
              {activeTab === 'TERMS' && (
                <div className="space-y-4">
                  {permissions.canEditContract && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[14px]">
                        <input type="text" placeholder="عنوان الدفعة..." value={termTitle} onChange={(e) => setTermTitle(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white" />
                        <input type="number" placeholder="النسبة %" value={termPct} onChange={(e) => setTermPct(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
                      </div>
                      <button onClick={handleAddPaymentTerm} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
                        <Plus className="w-4 h-4" /> إضافة دفعة تعاقدية
                      </button>
                    </>
                  )}

                  <div className="space-y-3 mt-4">
                    {activeTabProject.payment_terms && activeTabProject.payment_terms.length > 0 ? (
                      activeTabProject.payment_terms.map((term: any) => {
                        const isDue = term.isDueNow;

                        return (
                          <div key={term.term_id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {term.is_paid ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : isDue ? (
                                  <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
                                ) : (
                                  <Clock className="w-5 h-5 text-slate-500" />
                                )}
                                <div>
                                  <h4 className="text-base font-bold text-white">{term.term_title}</h4>
                                  <p className="text-[12px] text-slate-400 font-mono mt-0.5">
                                    النسبة من العقد الكلي: <span className="text-amber-400 font-bold">{term.due_percentage}%</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setActiveItemVouchersModal({
                                    title: `سندات قبض دفعة (${term.term_title})`,
                                    targetName: term.term_title,
                                    vouchers: term.attachedVouchers || []
                                  })}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                                    term.is_paid 
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                      : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700'
                                  }`}
                                  title="عرض الوصولات وسندات القبض المسجلة"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  {term.is_paid ? 'تم استلام الدفعة (عرض الوصولات ✓)' : 'عرض الوصولات'}
                                </button>

                                {!term.is_paid && permissions.canManageVouchers && (
                                  <button
                                    onClick={() => handleCreateVoucherForTerm(term)}
                                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md flex items-center gap-1 transition"
                                  >
                                    <Receipt className="w-3.5 h-3.5" /> إصدار وصل قبض رسمي
                                  </button>
                                )}

                                {permissions.canDeleteProject && (
                                  <button
                                    onClick={() => handleDeletePaymentTerm(term.term_id, term.term_title)}
                                    className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white p-2 rounded-xl transition"
                                    title="حذف الدفعة"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-slate-900 p-3 rounded-xl text-xs font-mono">
                              <div 
                                className="cursor-pointer hover:bg-slate-800 p-1 rounded transition"
                                onClick={() => setActiveItemVouchersModal({
                                  title: `سندات قبض دفعة (${term.term_title})`,
                                  targetName: term.term_title,
                                  vouchers: term.attachedVouchers || []
                                })}
                                title="اضغط لعرض الوصولات"
                              >
                                <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                                  المبلغ المستلم (قبض) <Eye className="w-3 h-3 text-sky-400" />
                                </span>
                                <span className="font-bold text-emerald-400">{formatNum(term.paidAmt || 0)} د.ع</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">المبلغ المتبقي</span>
                                <span className={`font-bold ${(term.remainAmt !== undefined ? term.remainAmt : term.amount) > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                  {formatNum(term.remainAmt !== undefined ? term.remainAmt : term.amount)} د.ع
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">حالة الاستحقاق</span>
                                <span className={`font-bold ${term.is_paid ? 'text-emerald-400' : isDue ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                                  {term.is_paid ? 'مستلمة' : isDue ? 'مستحقة القبض الآن!' : 'قيد التحصيل'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                                <span>نسبة الإيفاء: {term.progressPct || 0}%</span>
                                <span>إجمالي قيمة الدفعة: {formatNum(term.amount)} د.ع</span>
                              </div>
                              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${term.is_paid ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${term.progressPct || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-6 text-slate-500 text-xs">لا توجد دفعات تعاقدية مجدولة بعد.</p>
                    )}
                  </div>
                </div>
              )}

              {/* باقي التبويبات (المراحل، اليوميات، الوثائق) */}
              {activeTab === 'MILESTONES' && (
                <div className="space-y-4">
                  {permissions.canUpdateSiteProgress && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="اسم المرحلة..." value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[14px] text-white" />
                      <input type="number" placeholder="الوزن %" value={milestoneWeight} onChange={(e) => setMilestoneWeight(e.target.value)} className="w-24 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[14px] text-white text-center font-mono" />
                      <button onClick={handleAddMilestone} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1">
                        <Plus className="w-4 h-4" /> إضافة
                      </button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {activeTabProject.milestones?.map((m: any) => (
                      <div key={m.milestone_id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white text-sm">{m.name}</p>
                          <span className="font-mono text-amber-400 font-bold text-sm">{m.completion_percentage}% إنجاز</span>
                        </div>
                        {permissions.canUpdateSiteProgress ? (
                          <input type="range" min="0" max="100" value={m.completion_percentage} onChange={(e) => handleUpdateMilestoneProgress(m.milestone_id, Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer" />
                        ) : (
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full" style={{ width: `${m.completion_percentage}%` }}></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'LOGS' && (
                <div className="space-y-4">
                  {permissions.canAddSiteLogs && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[14px]">
                        <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
                        <input type="number" placeholder="عدد العمال" value={logWorkers} onChange={(e) => setLogWorkers(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
                        <select value={logWeather} onChange={(e) => setLogWeather(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white">
                          <option value="صحو">صحو</option>
                          <option value="ممطر">ممطر</option>
                          <option value="حار جداً">حار جداً</option>
                        </select>
                        <textarea placeholder="الملاحظات الميدانية..." value={logNotes} onChange={(e) => setLogNotes(e.target.value)} className="sm:col-span-3 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white h-20" />
                      </div>
                      <button onClick={handleAddSiteLog} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1">
                        <Plus className="w-4 h-4" /> حفظ تقرير اليومية
                      </button>
                    </>
                  )}
                  <div className="space-y-2 mt-2">
                    {activeTabProject.site_logs?.map((log: any) => (
                      <div key={log.log_id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center font-mono text-[11px] text-slate-400">
                          <span className="font-bold text-white">{String(log.log_date).split('T')[0]}</span>
                          <span>العمال: {log.workers_count} | الطقس: {log.weather}</span>
                        </div>
                        <p className="text-slate-200">{log.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'DOCS' && (
                <div className="space-y-4">
                  {permissions.canEditContract && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="عنوان الوثيقة" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[14px] text-white" />
                        <input type="text" placeholder="رابط الملف" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[14px] text-white font-mono" />
                      </div>
                      <button onClick={handleAddDocument} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> إرفاق وثيقة
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* نافذة استعراض سندات البند الواحد المنبثقة التفاعلية */}
        {activeItemVouchersModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">{activeItemVouchersModal.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">البيان: <strong className="text-amber-400">{activeItemVouchersModal.targetName}</strong></p>
                  </div>
                </div>
                <button onClick={() => setActiveItemVouchersModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">قائمة السندات المعتمدة المرتبطة:</span>
                  <span className="font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400 font-bold">
                    العدد: {activeItemVouchersModal.vouchers.length} سند
                  </span>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
                      <tr>
                        <th className="p-3">رقم السند</th>
                        <th className="p-3">النوع</th>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">المستفيد / الطرف</th>
                        <th className="p-3 text-left">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {activeItemVouchersModal.vouchers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                            لا توجد سندات فردية مخصصة لهذا البند حتى الآن.
                          </td>
                        </tr>
                      ) : (
                        activeItemVouchersModal.vouchers.map((v: any, vIdx: number) => {
                          const parsed = parseVoucherNotes(v.notes);
                          const isRec = v.voucher_type === 'RECEIPT';
                          return (
                            <tr key={vIdx} className="hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-amber-400">{v.voucher_number}</td>
                              <td className="p-3 font-sans">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isRec ? 'bg-emerald-50/20 text-emerald-300' : 'bg-rose-50/20 text-rose-300'}`}>
                                  {isRec ? 'قبض' : 'صرف'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">{String(v.issue_date || '').split('T')[0]}</td>
                              <td className="p-3 font-sans text-slate-200 font-medium">{parsed.party || v.party_name}</td>
                              <td className="p-3 text-left font-bold text-white">{formatNum(v.total_amount || v.amount)} د.ع</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-800 font-mono">
                  <span className="text-slate-400 font-sans">إجمالي مبالغ السندات:</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatNum(activeItemVouchersModal.vouchers.reduce((acc: number, v: any) => acc + (Number(v.total_amount || v.amount) || 0), 0))} د.ع
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveItemVouchersModal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تعديل الإنجاز */}
        {editingProject && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" /> تعديل حالة ونسبة الإنجاز
                </h3>
                <button onClick={() => setEditingProject(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">حالة المشروع</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white">
                  <option value="IN_PROGRESS">قيد التنفيذ</option>
                  <option value="COMPLETED">مكتمل ومسلّم</option>
                  <option value="SUSPENDED">متوقف مؤقتاً</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-400 font-semibold">نسبة الإنجاز</label>
                  <span className="font-mono text-amber-400 font-bold">{editRate}%</span>
                </div>
                <input type="range" min="0" max="100" value={editRate} onChange={(e) => setEditRate(e.target.value)} className="w-full accent-amber-500 cursor-pointer" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setEditingProject(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs">إلغاء</button>
                <button onClick={handleSaveEdit} disabled={savingEdit} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs">
                  {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تأكيد الحذف */}
        {deleteModalProject && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">تأكيد حذف المشروع</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف: <span className="text-amber-400 font-bold">{deleteModalProject.project_name}</span>؟
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setDeleteModalProject(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs">تراجع</button>
                <button onClick={handleDeleteProject} disabled={deleting} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs">
                  {deleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}