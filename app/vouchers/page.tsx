'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Receipt, 
  ArrowLeft, 
  PlusCircle, 
  Printer, 
  X, 
  Ban, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  RotateCcw, 
  HardHat, 
  Link2, 
  Truck, 
  Layers, 
  FileSpreadsheet,
  PieChart,
  Package,
  User,
  Coins,
  Building,
  Boxes,
  Users,
  Eye,
  Info,
  Calendar,
  CreditCard,
  Languages,
  Lock
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function numberToArabicWords(num: number, currency = 'IQD'): string {
  if (isNaN(num) || num === 0) return '';
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(n: number): string {
    let out = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (h > 0) out += hundreds[h];
    if (rem > 0) {
      if (out !== '') out += ' و';
      if (rem >= 10 && rem <= 19) {
        out += teens[rem - 10];
      } else {
        if (o > 0) out += ones[o];
        if (o > 0 && t > 0) out += ' و';
        if (t > 0) out += tens[t];
      }
    }
    return out;
  }

  const intNum = Math.floor(num);
  const billions = Math.floor(intNum / 1000000000);
  const millions = Math.floor((intNum % 1000000000) / 1000000);
  const thousands = Math.floor((intNum % 1000000) / 1000);
  const remainder = intNum % 1000;

  const parts: string[] = [];
  if (billions > 0) parts.push(billions === 1 ? 'مليار' : billions === 2 ? 'ملياران' : convertGroup(billions) + ' مليار');
  if (millions > 0) parts.push(millions === 1 ? 'مليون' : millions === 2 ? 'مليونان' : convertGroup(millions) + ' مليون');
  if (thousands > 0) parts.push(thousands === 1 ? 'ألف' : thousands === 2 ? 'ألفان' : convertGroup(thousands) + ' ألف');
  if (remainder > 0) parts.push(convertGroup(remainder));

  const words = parts.join(' و');
  const unit = currency === 'USD' ? 'دولار أمريكي' : 'دينار عراقي';
  return `فقط ${words} ${unit} لا غير`;
}

function numberToEnglishWords(num: number, currency = 'IQD'): string {
  if (isNaN(num) || num === 0) return '';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' and ' + inWords(n % 100));
    if (n < 1000000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 === 0 ? '' : ' ' + inWords(n % 1000));
    if (n < 1000000000) return inWords(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 === 0 ? '' : ' ' + inWords(n % 1000000));
    return inWords(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 === 0 ? '' : ' ' + inWords(n % 1000000000));
  }

  const unit = currency === 'USD' ? 'US Dollars' : 'Iraqi Dinars';
  return `Only ${inWords(Math.floor(num))} ${unit}`;
}

function autoTransliterateArabicName(name: string): string {
  if (!name) return '';
  const namesDict: Record<string, string> = {
    'احمد': 'Ahmed', 'أحمد': 'Ahmed', 'ناجي': 'Naji', 'رسول': 'Rasool',
    'علي': 'Ali', 'محمد': 'Mohammed', 'حسن': 'Hassan', 'حسين': 'Hussein',
    'جاسم': 'Jasim', 'حيدر': 'Haider', 'عبد': 'Abd', 'الله': 'Allah',
    'عباس': 'Abbas', 'مصطفى': 'Mustafa', 'كرار': 'Karrar', 'سجاد': 'Sajjad',
    'كاظم': 'Kadhim', 'صادق': 'Sadiq', 'مهدي': 'Mahdi', 'رضا': 'Redha',
    'سمير': 'Samir', 'فاخر': 'Fakhir', 'نورس': 'Nawras', 'الكويتي': 'Al-Kuwaiti'
  };

  const words = name.trim().split(/\s+/);
  const translated = words.map(w => {
    if (namesDict[w]) return namesDict[w];
    const map: Record<string, string> = {
      'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
      'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
      'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'dh', 'ط': 't', 'ظ': 'z', 'ع': 'a',
      'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': ''
    };
    const chars = w.split('').map(c => map[c] !== undefined ? map[c] : c).join('');
    return chars.charAt(0).toUpperCase() + chars.slice(1);
  });

  return translated.join(' ');
}

function autoTranslateTerms(text: string): string {
  if (!text) return '';
  let s = text.trim();

  const dictionary: [RegExp, string][] = [
    [/الدفعة الاولى|الدفعة الأولى/gi, 'First payment'],
    [/الدفعة الثانية/gi, 'Second payment'],
    [/الدفعة الثالثة/gi, 'Third payment'],
    [/الدفعة الرابعة/gi, 'Fourth payment'],
    [/الدفعة الاخيرة|الدفعة الأخيرة/gi, 'Final payment'],
    [/دفعة ثانية/gi, 'Second installment'],
    [/دفعة اولى|دفعة أولى/gi, 'First installment'],
    [/دفعة مقدمة|دفعة مقدمه/gi, 'Advance payment'],
    [/دفعة مستحقة/gi, 'Due payment'],
    [/لبناء منزل|بناء منزل/gi, 'for house construction'],
    [/لبناء دار|بناء دار/gi, 'for residential building construction'],
    [/بناء مجمع|مجمع سكني/gi, 'residential compound construction'],
    [/بناء بيت/gi, 'for house construction'],
    [/صب سقف|صب الاساس|صب الأساس/gi, 'concrete pouring'],
    [/ادخال مواد/gi, 'Import of materials'],
    [/توريد مواد/gi, 'Materials supply'],
    [/شراء مواد/gi, 'Purchase of materials'],
    [/حديد تسليح/gi, 'reinforcing steel rebar'],
    [/سمنت مقاوم|اسمنت مقاوم/gi, 'sulfate resistant cement'],
    [/طابوق|طابوق جمهوري/gi, 'bricks'],
    [/اجور نقل|أجور نقل/gi, 'Transportation fees'],
    [/أجور عمالة|اجور عمل/gi, 'Labor fees'],
    [/من الامارات/gi, 'from the UAE'],
    [/ميناء البصرة/gi, 'Basra Port'],
    [/ميناء ام قصر/gi, 'Umm Qasr Port'],
    [/حجز عقار/gi, 'Real estate booking'],
    [/شراء عقار/gi, 'Real estate purchase'],
    [/دفعة عقد/gi, 'Contract payment'],
    [/سلفة تشغيلية/gi, 'Operational advance'],
    [/صيانة شاحنة/gi, 'Truck maintenance'],
    [/دفعة مستحقات/gi, 'Settlement payment'],
    [/سلفة/gi, 'Advance payment'],
    [/قسط/gi, 'Installment'],
    [/نقد|نقدا|نقداً/gi, 'Cash'],
    [/دفعة للمورد/gi, 'Payment to supplier'],
    [/عن توريد سمنت/gi, 'for cement supply'],
    [/لمشروع بناء بيت/gi, 'for house construction project'],
  ];

  for (const [pattern, replacement] of dictionary) {
    s = s.replace(pattern, replacement);
  }

  if (/[\u0600-\u06FF]/.test(s)) {
    s = autoTransliterateArabicName(s);
  }

  return s;
}

export default function VouchersPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [branchId, setBranchId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [voucherType, setVoucherType] = useState<'RECEIPT' | 'PAYMENT'>('PAYMENT');
  const [sectorType, setSectorType] = useState<'PROJECTS' | 'FLEET' | 'INVENTORY' | 'REAL_ESTATE' | 'HR' | 'GENERAL'>('PROJECTS');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('IQD');
  const [partyNameAr, setPartyNameAr] = useState('');
  const [partyNameEn, setPartyNameEn] = useState('');
  const [notesAr, setNotesAr] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE'>('CASH');
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [message, setMessage] = useState('');

  const [linkedSubId, setLinkedSubId] = useState<string | null>(null);
  const [linkedMatId, setLinkedMatId] = useState<string | null>(null);
  const [linkedExpId, setLinkedExpId] = useState<string | null>(null);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSector, setFilterSector] = useState<'ALL' | 'PROJECTS' | 'FLEET' | 'INVENTORY' | 'REAL_ESTATE' | 'HR'>('ALL');

  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [detailsModalVoucher, setDetailsModalVoucher] = useState<any | null>(null);
  const [cancelModalVoucher, setCancelModalVoucher] = useState<any | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [assignModalVoucher, setAssignModalVoucher] = useState<any | null>(null);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

  const loadData = async () => {
    try {
      const resV = await fetch('/api/vouchers', { cache: 'no-store' });
      const dataV = await resV.json();
      if (dataV.vouchers) setVouchers(dataV.vouchers);

      const resB = await fetch('/api/branches', { cache: 'no-store' });
      const dataB = await resB.json();
      if (dataB.branches && dataB.branches.length > 0) {
        setBranches(dataB.branches);
        setBranchId((prev) => prev || dataB.branches[0].branch_id);
      }

      const resP = await fetch('/api/projects', { cache: 'no-store' });
      const dataP = await resP.json();
      if (dataP.projects) {
        setProjectsList(dataP.projects);
      }
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

    const rawDraft = localStorage.getItem('quick_voucher_draft');
    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft);

        if (parsed.voucher_type === 'RECEIPT' || parsed.type === 'RECEIPT') {
          setVoucherType('RECEIPT');
        } else {
          setVoucherType('PAYMENT');
        }

        if (parsed.party) {
          setPartyNameAr(parsed.party);
          setPartyNameEn(autoTransliterateArabicName(parsed.party));
        }
        if (parsed.amount !== undefined && parsed.amount !== null && parsed.amount !== 0) {
          setAmount(String(parsed.amount));
        }
        if (parsed.project_id) {
          setProjectId(parsed.project_id);
          setSectorType('PROJECTS');
        }
        if (parsed.reason) {
          setNotesAr(parsed.reason);
          setNotesEn(autoTranslateTerms(parsed.reason));
        }

        setLinkedSubId(parsed.subcontractor_id || null);
        setLinkedMatId(parsed.material_id || null);
        setLinkedExpId(parsed.expense_id || null);

        localStorage.removeItem('quick_voucher_draft');
      } catch (err) {
        console.error('Draft parsing error:', err);
      }
    }
  }, []);

  // فحص الصلاحيات الدقيقة لقسم المالية والسندات
  const canAdd = useMemo(() => {
    return hasPermission(currentUser, 'vouchers', 'add');
  }, [currentUser]);

  const canEdit = useMemo(() => {
    return hasPermission(currentUser, 'vouchers', 'edit');
  }, [currentUser]);

  const canDelete = useMemo(() => {
    return hasPermission(currentUser, 'vouchers', 'delete');
  }, [currentUser]);

  const handlePartyArChange = (val: string) => {
    setPartyNameAr(val);
    setPartyNameEn(autoTransliterateArabicName(val));
  };

  const handleNotesArChange = (val: string) => {
    setNotesAr(val);
    setNotesEn(autoTranslateTerms(val));
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية تسجيل واعتماد سندات جديدة');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setMessage('يرجى إدخال مبلغ صحيح');
      return;
    }

    setLoading(true);
    setMessage('');

    const fullNotes = JSON.stringify({
      partyAr: partyNameAr.trim(),
      partyEn: partyNameEn.trim() || autoTransliterateArabicName(partyNameAr.trim()),
      forReasonAr: notesAr.trim(),
      forReasonEn: notesEn.trim() || autoTranslateTerms(notesAr.trim()),
      method: paymentMethod,
      chequeNo: chequeNo,
      bank: bankName,
      sector: sectorType,
      subcontractor_id: linkedSubId || undefined,
      material_id: linkedMatId || undefined,
      expense_id: linkedExpId || undefined
    });

    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: branchId || null,
          project_id: (sectorType === 'PROJECTS' && projectId) ? projectId : null,
          voucher_type: voucherType,
          amount,
          currency,
          notes: fullNotes,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setMessage(`تم اعتماد السند بنجاح برقم: ${resData.voucher_number}`);
        setAmount('');
        setPartyNameAr('');
        setPartyNameEn('');
        setNotesAr('');
        setNotesEn('');
        setChequeNo('');
        setBankName('');
        setLinkedSubId(null);
        setLinkedMatId(null);
        setLinkedExpId(null);
        await loadData();
      } else {
        setMessage(`خطأ: ${resData.error}`);
      }
    } catch (error: any) {
      setMessage(`خطأ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProject = async () => {
    if (!canEdit) {
      alert('ليس لديك صلاحية ربط أو تعديل السندات');
      return;
    }
    if (!assignModalVoucher) return;
    setSavingAssign(true);
    try {
      const res = await fetch('/api/vouchers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_id: assignModalVoucher.voucher_id,
          assign_project_id: targetProjectId || null,
        }),
      });
      if (res.ok) {
        setAssignModalVoucher(null);
        await loadData();
      } else {
        alert('حدث خطأ أثناء ربط المشروع');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAssign(false);
    }
  };

  const handleCancelVoucher = async () => {
    if (!canEdit && !canDelete) {
      alert('ليس لديك صلاحية إلغاء السندات');
      return;
    }
    if (!cancelModalVoucher) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/vouchers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_id: cancelModalVoucher.voucher_id,
          cancel_reason: cancelReasonInput || 'إلغاء بناءً على طلب الإدارة وتصفير القيد',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`تم إلغاء السند ${cancelModalVoucher.voucher_number} بنجاح`);
        setCancelModalVoucher(null);
        setCancelReasonInput('');
        await loadData();
      } else {
        alert(data.error || 'حدث خطأ أثناء الإلغاء');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const parseVoucherData = (v: any) => {
    if (!v.notes) {
      return { 
        partyAr: '—', partyEn: '—', forReasonAr: '—', forReasonEn: '—', 
        method: 'CASH', chequeNo: '', bank: '', sector: 'GENERAL',
        subcontractor_id: '', material_id: '', expense_id: ''
      };
    }

    try {
      const p = JSON.parse(v.notes);
      const pAr = p.partyAr || p.party || '';
      const pEn = p.partyEn || autoTransliterateArabicName(pAr) || '—';
      const rAr = p.forReasonAr || p.forReason || '';
      const rEn = p.forReasonEn || autoTranslateTerms(rAr) || '—';
      const sector = p.sector || (v.project_id ? 'PROJECTS' : 'GENERAL');

      return {
        partyAr: pAr || '—',
        partyEn: pEn,
        forReasonAr: rAr || '—',
        forReasonEn: rEn,
        method: p.method || 'CASH',
        chequeNo: p.chequeNo || '',
        bank: p.bank || '',
        sector,
        subcontractor_id: p.subcontractor_id || '',
        material_id: p.material_id || '',
        expense_id: p.expense_id || '',
        isCancelled: p.isCancelled || v.status === 'CANCELLED' || v.status === 'VOID',
      };
    } catch {
      return {
        partyAr: '—',
        partyEn: '—',
        forReasonAr: v.notes,
        forReasonEn: autoTranslateTerms(v.notes),
        method: 'CASH',
        chequeNo: '',
        bank: '',
        sector: v.project_id ? 'PROJECTS' : 'GENERAL',
        subcontractor_id: '',
        material_id: '',
        expense_id: '',
        isCancelled: v.status === 'CANCELLED' || v.status === 'VOID',
      };
    }
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const details = parseVoucherData(v);
      const isCancelled = v.status === 'CANCELLED' || v.status === 'VOID';

      if (filterSearch.trim()) {
        const query = filterSearch.toLowerCase().trim();
        const matchNumber = v.voucher_number?.toLowerCase().includes(query);
        const matchPartyAr = details.partyAr?.toLowerCase().includes(query);
        const matchPartyEn = details.partyEn?.toLowerCase().includes(query);
        const matchReason = details.forReasonAr?.toLowerCase().includes(query);
        const matchProject = v.project_name?.toLowerCase().includes(query);
        if (!matchNumber && !matchPartyAr && !matchPartyEn && !matchReason && !matchProject) {
          return false;
        }
      }

      if (filterBranch !== 'ALL' && v.branch_name !== filterBranch) {
        return false;
      }

      if (filterStatus === 'ACTIVE' && isCancelled) return false;
      if (filterStatus === 'VOID' && !isCancelled) return false;

      if (filterType !== 'ALL' && v.voucher_type !== filterType) {
        return false;
      }

      if (filterSector !== 'ALL') {
        const sec = String(details.sector || '').toUpperCase();
        if (filterSector === 'PROJECTS') {
          if (!v.project_id && sec !== 'PROJECTS') return false;
        } else if (filterSector === 'FLEET') {
          if (sec !== 'FLEET' && sec !== 'TRANSPORT_LOGISTICS' && !String(v.notes).includes('TRANSPORT_LOGISTICS')) return false;
        } else if (filterSector === 'INVENTORY') {
          if (sec !== 'INVENTORY' && !String(v.notes).includes('INVENTORY')) return false;
        } else if (filterSector === 'REAL_ESTATE') {
          if (sec !== 'REAL_ESTATE' && !String(v.notes).includes('REAL_ESTATE')) return false;
        } else if (filterSector === 'HR') {
          if (sec !== 'HR' && !String(v.notes).includes('HR')) return false;
        }
      }

      return true;
    });
  }, [vouchers, filterSearch, filterBranch, filterStatus, filterType, filterSector]);

  const resetFilters = () => {
    setFilterSearch('');
    setFilterBranch('ALL');
    setFilterStatus('ALL');
    setFilterType('ALL');
    setFilterSector('ALL');
  };

  const exportCSV = () => {
    if (filteredVouchers.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }
    const headers = ['رقم السند', 'النوع', 'المبلغ', 'العملة', 'المستفيد / الطرف', 'القطاع / المشروع', 'البيان', 'التاريخ'];
    const rows = filteredVouchers.map(v => {
      const d = parseVoucherData(v);
      const sectorTitle = d.sector === 'FLEET' || d.sector === 'TRANSPORT_LOGISTICS' ? 'أسطول النقل' : 
                          d.sector === 'INVENTORY' ? 'المخزن والتجارة' :
                          d.sector === 'REAL_ESTATE' ? 'العقارات والاستثمار' :
                          d.sector === 'HR' ? 'الموارد البشرية' :
                          v.project_name || 'عام';
      return [
        `"${v.voucher_number}"`,
        v.voucher_type === 'RECEIPT' ? 'وصل قبض' : 'سند صرف',
        v.total_amount,
        v.currency,
        `"${d.partyAr}"`,
        `"${sectorTitle}"`,
        `"${d.forReasonAr}"`,
        `"${String(v.issue_date || '').split('T')[0]}"`
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `سندات_وحسابات_البرج_المتألق_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AuthGuard moduleName="vouchers" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait !important;
              margin: 10mm 8mm !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background-color: #ffffff !important;
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
            }
            .print-hide {
              display: none !important;
            }
            .print-container-white {
              position: static !important;
              background-color: #ffffff !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              box-shadow: none !important;
            }
            .print-voucher-card {
              border: 2px solid #000000 !important;
              border-radius: 8px !important;
              box-shadow: none !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 16px 20px !important;
              background-color: #ffffff !important;
              background: #ffffff !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            img {
              image-rendering: -webkit-optimize-contrast !important;
            }
          }
        `}</style>

        {/* 1. قسم إدارة السندات */}
        <div className="print-hide">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 relative rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10 p-1">
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
                <h1 className="text-xl font-black text-white">إدارة السندات والقيود المالية المركزية</h1>
                <p className="text-[13px] text-slate-400">شركة البرج المتألق - نظام السندات الدفتري والمالي لجميع قطاعات الشركة</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Link 
                href="/finance/reports" 
                className="flex items-center gap-2 bg-sky-500/15 border border-sky-500/40 text-sky-400 px-4 py-2.5 rounded-xl text-[14px] hover:bg-sky-500/25 transition font-bold shadow-lg shadow-sky-500/10"
              >
                <PieChart className="w-4 h-4" /> التقارير وقائمة الدخل
              </Link>
              
              <Link href="/fleet" className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-[14px] hover:bg-slate-700 transition text-emerald-400">
                <Truck className="w-4 h-4" /> أسطول النقل اللوجستي
              </Link>
              <Link href="/projects" className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-[14px] hover:bg-slate-700 transition text-amber-400">
                <HardHat className="w-4 h-4" /> إدارة المشاريع
              </Link>
              <Link href="/" className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-[14px] hover:bg-slate-800 transition">
                <ArrowLeft className="w-4 h-4" /> العودة للرئيسية
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* نموذج إدخال السند */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl h-fit space-y-4 shadow-2xl relative overflow-hidden">
              {!canAdd && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <Lock className="w-8 h-8 text-amber-400" />
                  <p className="text-[14px] font-bold text-white">إصدار السندات مقيد بالصلاحيات</p>
                  <p className="text-xs text-slate-400">حسابك لا يمتلك صلاحية إضافة سندات مالية جديدة. راجع المدير المفوض لمنحك إذن الإضافة.</p>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-400" /> تسجيل قيد مالي جديد
                </h2>
                {(linkedSubId || linkedMatId || linkedExpId) && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    مقترن ببند مشروع ✓
                  </span>
                )}
              </div>

              {message && (
                <div className={`p-3 rounded-2xl text-xs font-semibold ${message.includes('خطأ') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleCreateVoucher} className="space-y-3.5 text-[14px]">
                
                {/* 1. نوع السند والقطاع */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-xs">نوع السند المالي *</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVoucherType('RECEIPT')}
                        className={`py-2 text-center rounded-xl font-bold border transition text-xs ${voucherType === 'RECEIPT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        قبض
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoucherType('PAYMENT')}
                        className={`py-2 text-center rounded-xl font-bold border transition text-xs ${voucherType === 'PAYMENT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        صرف
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-xs">القطاع المعني *</label>
                    <select
                      value={sectorType}
                      onChange={(e: any) => setSectorType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none text-xs"
                    >
                      <option value="PROJECTS">المقاولات والمشاريع</option>
                      <option value="FLEET">أسطول النقل اللوجستي</option>
                      <option value="INVENTORY">التجارة العامة والمخزن</option>
                      <option value="REAL_ESTATE">العقارات والاستثمار</option>
                      <option value="HR">الموارد البشرية والرواتب</option>
                      <option value="GENERAL">مصاريف وإيرادات عامة</option>
                    </select>
                  </div>
                </div>

                {/* 2. الفرع والمشروع المرتبط */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-xs">الفرع *</label>
                    <select 
                      value={branchId} 
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none text-xs"
                    >
                      {branches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>{b.name_ar}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-xs">المشروع المرتبط:</label>
                    <select 
                      value={projectId} 
                      disabled={sectorType !== 'PROJECTS'}
                      onChange={(e) => setProjectId(e.target.value)}
                      className={`w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none text-xs ${sectorType !== 'PROJECTS' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- عام (بدون مشروع) --</option>
                      {projectsList.map((p) => (
                        <option key={p.project_id} value={p.project_id}>
                          {p.project_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. اسم الطرف والمستفيد */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-amber-400 mb-1 font-bold text-xs">
                      {voucherType === 'RECEIPT' ? 'استلمت من (بالعربية) *:' : 'سلمت الى (بالعربية) *:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="اسم المستلم أو العميل"
                      value={partyNameAr}
                      onChange={(e) => handlePartyArChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">
                      {voucherType === 'RECEIPT' ? 'Received From (English):' : 'Delivered To (English):'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="Party Name"
                      value={partyNameEn}
                      onChange={(e) => setPartyNameEn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sky-300 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* 4. المبلغ والعملة */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-xs">المبلغ رقماً *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-xs">العملة</label>
                    <select 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none text-xs"
                    >
                      <option value="IQD">دينار عراقي (IQD)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                  </div>
                </div>

                {amount && Number(amount) > 0 && (
                  <div className="p-2.5 bg-slate-950 rounded-xl text-xs text-amber-300 font-semibold border border-slate-800 space-y-0.5">
                    <div>{numberToArabicWords(parseFloat(amount), currency)}</div>
                    <div className="text-slate-400 font-serif text-[11px]">{numberToEnglishWords(parseFloat(amount), currency)}</div>
                  </div>
                )}

                {/* 5. البيان وسبب الصرف */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-xs">وذلك عن (بالعربية) *:</label>
                    <input
                      type="text"
                      required
                      placeholder="البيان وسبب الصرف بالتفصيل"
                      value={notesAr}
                      onChange={(e) => handleNotesArChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">
                      For (English Purpose):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="Payment Purpose"
                      value={notesEn}
                      onChange={(e) => setNotesEn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sky-300 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* 6. طريقة الدفع */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">طريقة السداد</label>
                  <div className="flex gap-4 mb-2 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="pay_type" 
                        checked={paymentMethod === 'CASH'} 
                        onChange={() => setPaymentMethod('CASH')} 
                      />
                      نقداً (Cash)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="pay_type" 
                        checked={paymentMethod === 'CHEQUE'} 
                        onChange={() => setPaymentMethod('CHEQUE')} 
                      />
                      شيك (Cheque)
                    </label>
                  </div>

                  {paymentMethod === 'CHEQUE' && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="شيك رقم"
                        value={chequeNo}
                        onChange={(e) => setChequeNo(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="المصرف المسحوب عليه"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-white text-xs"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !canAdd}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition text-xs mt-2 shadow-lg shadow-amber-500/20"
                >
                  {loading ? 'جاري الاعتماد...' : 'اعتماد وترحيل السند المالي'}
                </button>
              </form>
            </div>

            {/* جدول السندات المسجلة */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-4 shadow-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" /> السندات المالية المسجلة
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono font-normal">
                    ({filteredVouchers.length} من {vouchers.length})
                  </span>
                </h2>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCSV}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1 font-bold"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> تصدير Excel
                  </button>
                  {(filterSearch || filterBranch !== 'ALL' || filterStatus !== 'ALL' || filterType !== 'ALL' || filterSector !== 'ALL') && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> إعادة ضبط
                    </button>
                  )}
                </div>
              </div>

              {/* أزرار التصفية لجميع قطاعات الشركة الخمسة */}
              <div className="flex gap-2 flex-wrap text-xs">
                <button
                  onClick={() => setFilterSector('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    filterSector === 'ALL' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> جميع القطاعات
                </button>
                <button
                  onClick={() => setFilterSector('PROJECTS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    filterSector === 'PROJECTS' ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5 text-amber-400" /> المقاولات والمشاريع
                </button>
                <button
                  onClick={() => setFilterSector('FLEET')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    filterSector === 'FLEET' ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-400" /> أسطول النقل
                </button>
                <button
                  onClick={() => setFilterSector('INVENTORY')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    filterSector === 'INVENTORY' ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5 text-sky-400" /> المخزن والتجارة
                </button>
                <button
                  onClick={() => setFilterSector('REAL_ESTATE')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    filterSector === 'REAL_ESTATE' ? 'bg-purple-500 text-white font-black shadow-md shadow-purple-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-purple-400" /> العقارات والاستثمار
                </button>
                <button
                  onClick={() => setFilterSector('HR')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    filterSector === 'HR' ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-rose-400" /> الموارد البشرية والرواتب
                </button>
              </div>

              {/* شريط الفلترة والبحث */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Search className="w-3 h-3 text-amber-400" /> البحث:
                  </label>
                  <input
                    type="text"
                    placeholder="ابحث برقم، اسم، أو بيان..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-amber-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Filter className="w-3 h-3 text-sky-400" /> تصفية حسب الفرع:
                  </label>
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-sky-500 outline-none text-xs"
                  >
                    <option value="ALL">كل الفروع</option>
                    {branches.map((b) => (
                      <option key={b.branch_id} value={b.name_ar}>{b.name_ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> حالة الوصل:
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-emerald-500 outline-none text-xs"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="ACTIVE">الجارية فقط (ACTIVE)</option>
                    <option value="VOID">الملغية فقط (VOID)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-rose-400" /> نوع السند:
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:border-rose-500 outline-none text-xs"
                  >
                    <option value="ALL">جميع الأنواع</option>
                    <option value="RECEIPT">وصل قبض (استلام)</option>
                    <option value="PAYMENT">سند صرف (دفع)</option>
                  </select>
                </div>
              </div>

              {/* جدول السندات مع زر التفاصيل الدفتري */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[14px]">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[12px]">
                    <tr>
                      <th className="p-3.5">رقم السند</th>
                      <th className="p-3.5">الطرف / المستفيد</th>
                      <th className="p-3.5">القطاع / المشروع</th>
                      <th className="p-3.5 whitespace-nowrap text-center">النوع</th>
                      <th className="p-3.5">المبلغ</th>
                      <th className="p-3.5 text-center">حالة الوصل</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredVouchers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500">
                          لا توجد سندات مطابقة للبحث.
                        </td>
                      </tr>
                    ) : (
                      filteredVouchers.map((v) => {
                        const details = parseVoucherData(v);
                        const isCancelled = v.status === 'CANCELLED' || v.status === 'VOID';
                        const isReceiptType = String(v.voucher_type || '').toUpperCase() === 'RECEIPT';
                        const sec = String(details.sector || '').toUpperCase();

                        return (
                          <tr key={v.voucher_id} className={`transition ${isCancelled ? 'bg-rose-950/25 opacity-75' : 'hover:bg-slate-800/30'}`}>
                            <td className="p-3.5 font-mono font-bold">
                              <span className={isCancelled ? 'line-through text-slate-400' : 'text-amber-400'}>
                                {v.voucher_number}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-slate-200">
                              <div className="flex flex-col">
                                <span>{details.partyAr || '—'}</span>
                                {details.subcontractor_id && (
                                  <span className="text-[10px] text-sky-400 flex items-center gap-0.5 mt-0.5 font-sans">
                                    <User className="w-2.5 h-2.5" /> مقاول باطن
                                  </span>
                                )}
                                {details.material_id && (
                                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5 mt-0.5 font-sans">
                                    <Package className="w-2.5 h-2.5" /> توريد مادة
                                  </span>
                                )}
                                {details.expense_id && (
                                  <span className="text-[10px] text-rose-400 flex items-center gap-0.5 mt-0.5 font-sans">
                                    <Coins className="w-2.5 h-2.5" /> مصروف تشغيلي
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {sec === 'FLEET' || sec === 'TRANSPORT_LOGISTICS' ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs">
                                    <Truck className="w-3.5 h-3.5" /> أسطول النقل
                                  </span>
                                ) : sec === 'INVENTORY' ? (
                                  <span className="inline-flex items-center gap-1 text-sky-400 font-bold bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full text-xs">
                                    <Boxes className="w-3.5 h-3.5" /> التجارة والمخزن
                                  </span>
                                ) : sec === 'REAL_ESTATE' ? (
                                  <span className="inline-flex items-center gap-1 text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs">
                                    <Building className="w-3.5 h-3.5" /> العقارات والاستثمار
                                  </span>
                                ) : sec === 'HR' ? (
                                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs">
                                    <Users className="w-3.5 h-3.5" /> الموارد البشرية
                                  </span>
                                ) : v.project_name ? (
                                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                                    <HardHat className="w-3.5 h-3.5" /> {v.project_name}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-xs">عام (بدون مشروع)</span>
                                )}
                                {!isCancelled && !v.project_id && canEdit && (
                                  <button
                                    onClick={() => {
                                      setAssignModalVoucher(v);
                                      setTargetProjectId(v.project_id || '');
                                    }}
                                    className="text-slate-400 hover:text-amber-300 p-1 rounded-lg hover:bg-slate-800 transition"
                                    title="ربط السند بمشروع"
                                  >
                                    <Link2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap text-center">
                              <span className={`px-3 py-1 rounded-xl text-xs font-bold border whitespace-nowrap inline-flex items-center justify-center min-w-[75px] ${
                                isReceiptType 
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}>
                                {isReceiptType ? 'وصل قبض' : 'سند صرف'}
                              </span>
                            </td>
                            <td className={`p-3.5 font-black font-mono ${isCancelled ? 'line-through text-slate-500' : 'text-white'}`}>
                              {Number(v.total_amount).toLocaleString()} {v.currency}
                            </td>
                            <td className="p-3.5 text-center">
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-xs">
                                  <Ban className="w-3.5 h-3.5" /> ملغي (VOID)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> جاري (ACTIVE)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDetailsModalVoucher(v)}
                                  className="bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-slate-950 font-bold p-1.5 rounded-xl border border-sky-500/30 transition shadow"
                                  title="عرض تفاصيل هذا الوصل الغرض منه"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setSelectedVoucher(v)}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 text-xs"
                                  title="طباعة السند"
                                >
                                  <Printer className="w-3.5 h-3.5" /> طباعة
                                </button>
                                
                                {!isCancelled && (canEdit || canDelete) && (
                                  <button
                                    onClick={() => setCancelModalVoucher(v)}
                                    className="bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 text-xs border border-rose-500/30"
                                    title="إلغاء السند"
                                  >
                                    <Ban className="w-3.5 h-3.5" /> إلغاء
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
        </div>

        {/* نافذة تفاصيل السند الكاملة والارتباط */}
        {detailsModalVoucher && (() => {
          const d = parseVoucherData(detailsModalVoucher);
          const isReceiptType = String(detailsModalVoucher.voucher_type || '').toUpperCase() === 'RECEIPT';
          const sec = String(d.sector || '').toUpperCase();
          const sectorName = 
            sec === 'FLEET' || sec === 'TRANSPORT_LOGISTICS' ? 'أسطول النقل اللوجستي' :
            sec === 'INVENTORY' ? 'التجارة العامة والمخزن المركزي' :
            sec === 'REAL_ESTATE' ? 'العقارات والاستثمارات' :
            sec === 'HR' ? 'الموارد البشرية والرواتب' :
            detailsModalVoucher.project_name ? 'قطاع المقاولات والمشاريع' : 'المصروفات والإيرادات العامة';

          return (
            <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-right space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-sky-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">بطاقة التدقيق المالي للسند</h3>
                      <p className="text-xs font-mono text-amber-400">{detailsModalVoucher.voucher_number}</p>
                    </div>
                  </div>
                  <button onClick={() => setDetailsModalVoucher(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[11px]">نوع السند</span>
                      <strong className={`font-bold ${isReceiptType ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isReceiptType ? 'وصل قبض (تحصيل إيراد)' : 'سند صرف (نفقة ومستحقات)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">المبلغ المقيد</span>
                      <strong className="text-white font-mono text-sm">
                        {formatNum(detailsModalVoucher.total_amount || detailsModalVoucher.amount)} {detailsModalVoucher.currency}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">القطاع التابع له:</span>
                      <span className="text-sky-400 font-bold">{sectorName}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">المشروع الإنشائي:</span>
                      <span className="text-amber-400 font-bold font-mono">
                        {detailsModalVoucher.project_name || 'غير مرتبط بمشروع إنشائي'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">البند الفرعي المحدد:</span>
                      <span className="text-white font-bold">
                        {d.subcontractor_id ? 'عقد مقاول باطن' :
                         d.material_id ? 'توريد مواد ومعدات' :
                         d.expense_id ? 'مصروف تشغيلي وميداني' : 'قيد عام مباشر'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">المستفيد / الطرف:</span>
                      <span className="text-white font-bold">{d.partyAr}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">طريقة الدفع:</span>
                      <span className="text-slate-200 font-mono">
                        {d.method === 'CHEQUE' ? `شيك رقم (${d.chequeNo || '—'}) على بنك (${d.bank || '—'})` : 'نقداً (Cash)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">تاريخ التحرير:</span>
                      <span className="text-slate-200 font-mono">
                        {String(detailsModalVoucher.issue_date || detailsModalVoucher.created_at || '').split('T')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block font-semibold text-[11px]">البيان والغرض من السند (وذلك عن):</span>
                    <p className="text-slate-100 font-bold leading-relaxed">{d.forReasonAr}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setDetailsModalVoucher(null);
                      setSelectedVoucher(detailsModalVoucher);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> معاينة وطباعة السند
                  </button>
                  <button
                    onClick={() => setDetailsModalVoucher(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* نافذة ربط السند بمشروع */}
        {assignModalVoucher && canEdit && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-amber-400" /> ربط السند بمشروع مقاولة
                </h3>
                <button onClick={() => setAssignModalVoucher(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[14px] text-slate-300">
                ربط السند رقم <span className="font-mono text-amber-400 font-bold">{assignModalVoucher.voucher_number}</span> بمشروع لاحتساب تكلفته أو مقبوضاته تلقائياً:
              </p>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">اختر المشروع:</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[14px] text-white outline-none"
                >
                  <option value="">-- فك الربط (عام بدون مشروع) --</option>
                  {projectsList.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_name} ({p.client_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setAssignModalVoucher(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs">
                  إلغاء
                </button>
                <button onClick={handleAssignProject} disabled={savingAssign} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs">
                  {savingAssign ? 'جاري الحفظ...' : 'تأكيد الربط'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تأكيد الإلغاء */}
        {cancelModalVoucher && (canEdit || canDelete) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right">
              <div className="flex items-center gap-3 text-rose-400 mb-3 border-b border-slate-800 pb-3">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">تأكيد إلغاء السند المالي</h3>
              </div>
              <p className="text-[14px] text-slate-300 leading-relaxed mb-4">
                أنت على وشك تحويل السند رقم <span className="font-mono text-amber-400 font-bold">{cancelModalVoucher.voucher_number}</span> إلى حالة <span className="text-rose-400 font-bold">ملغي (VOID)</span> وتصفير أثره المالي.
              </p>
              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1 font-semibold">سبب الإلغاء (للتوثيق):</label>
                <input 
                  type="text"
                  placeholder="مثال: خطأ في المبلغ أو اسم المستلم"
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[14px] text-white outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setCancelModalVoucher(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs">
                  تراجع
                </button>
                <button onClick={handleCancelVoucher} disabled={cancelling} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs">
                  {cancelling ? 'جاري الإلغاء...' : 'تأكيد إلغاء السند'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. قالب السند الورقي الدفتري الرسمي (A4) */}
        {selectedVoucher && (() => {
          const details = parseVoucherData(selectedVoucher);
          const isReceipt = String(selectedVoucher.voucher_type || '').toUpperCase() === 'RECEIPT';
          const formattedDate = new Date(selectedVoucher.issue_date || selectedVoucher.created_at || Date.now()).toISOString().split('T')[0];
          const numOnly = selectedVoucher.voucher_number.replace(/\D/g, '').padStart(6, '0');
          const numVal = parseFloat(selectedVoucher.total_amount) || 0;
          const isCancelled = selectedVoucher.status === 'CANCELLED' || selectedVoucher.status === 'VOID' || details.isCancelled;

          const arabicWords = numberToArabicWords(numVal, selectedVoucher.currency);
          const englishWords = numberToEnglishWords(numVal, selectedVoucher.currency);

          const forReasonArText = details.forReasonAr || '';
          const forReasonEnText = details.forReasonEn && details.forReasonEn !== '—' ? details.forReasonEn : autoTranslateTerms(forReasonArText);

          return (
            <div className="print-container-white fixed inset-0 bg-slate-950/90 z-50 overflow-y-auto flex flex-col items-center print:bg-white print:static">
              <div className="print-hide sticky top-0 z-50 w-full bg-slate-900/95 border-b border-slate-700 backdrop-blur px-6 py-2.5 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                  <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg transition">
                    <Printer className="w-4 h-4" /> أمر الطباعة الآن (Print)
                  </button>
                  <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
                    معاينة السند: <span className="font-mono text-amber-400 font-bold">{selectedVoucher.voucher_number}</span>
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${isCancelled ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                    {isCancelled ? 'الحالة: ملغي (VOID)' : 'الحالة: جاري (ACTIVE)'}
                  </span>
                </div>
                <button onClick={() => setSelectedVoucher(null)} className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full max-w-4xl p-4 flex justify-center print:p-0 print:w-full print:max-w-none print:m-0">
                <div className="print-voucher-card bg-white text-slate-900 w-full rounded-xl shadow-2xl p-5 md:p-6 border-2 border-slate-800 relative overflow-hidden">
                  {isCancelled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="border-8 border-rose-600/30 text-rose-600/30 font-black text-6xl md:text-8xl tracking-widest uppercase rotate-[-25deg] px-12 py-4 rounded-3xl select-none">
                        VOID / ملغي
                      </div>
                    </div>
                  )}

                  <div dir="ltr" className="w-full bg-white text-slate-900 font-sans">
                    <div className="grid grid-cols-3 items-center border-b-2 border-slate-800 pb-3 mb-4">
                      <div className="text-left flex flex-col justify-between h-full">
                        <div>
                          <h2 className="text-lg font-black tracking-tight text-slate-900 font-serif leading-none">
                            THE SHINING TOWER
                          </h2>
                          <p className="text-[10px] text-slate-800 font-semibold leading-tight mt-1">
                            For general contracting<br />
                            general trade, public transportation<br />
                            and real estate investments
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="text-red-600 font-black text-xl font-mono tracking-wider">
                            No: {numOnly}
                          </div>
                          <div className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider ${isCancelled ? 'border-red-600 text-red-600 bg-red-50' : 'border-emerald-700 text-emerald-800 bg-emerald-50'}`}>
                            {isCancelled ? 'ملغي | VOID' : 'جاري | ACTIVE'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-20 relative flex items-center justify-center">
                          <Image 
                            src="/logo.png" 
                            alt="شركة البرج المتألق" 
                            width={75} 
                            height={75} 
                            className="object-contain" 
                            priority 
                          />
                        </div>
                        <div className="mt-1 text-center">
                          <div className="font-black text-sm text-slate-950 leading-tight">
                            {isReceipt ? 'وصل قبض' : 'سند صرف'}
                          </div>
                          <div className="font-serif font-black text-[11px] text-slate-800 tracking-wider uppercase border-b-2 border-slate-800 pb-0.5">
                            {isReceipt ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-between h-full" dir="rtl">
                        <div>
                          <h1 className="text-xl font-black text-slate-900 leading-none">البرج المتألق</h1>
                          <p className="text-[11px] text-slate-800 font-bold leading-tight mt-1">
                            للمقاولات العامة والتجارة العامة<br />
                            والنقل العام والإستثمارات العقارية
                          </p>
                        </div>
                        <div className="mt-2 inline-flex border-2 border-slate-800 bg-slate-50 font-bold text-sm self-start">
                          <div className="px-4 py-0.5 font-mono border-l-2 border-slate-800 min-w-[110px] text-center text-slate-950 font-black text-base">
                            {Number(selectedVoucher.total_amount).toLocaleString()}
                          </div>
                          <div className="px-2.5 py-0.5 text-xs text-slate-800 flex items-center justify-center font-bold">
                            {selectedVoucher.currency === 'USD' ? '$' : 'د.ع'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs font-bold text-slate-900">
                      <div className="flex items-center">
                        <span className="font-serif text-slate-800 min-w-[70px] text-sm">Date:</span>
                        <div className="flex-1 border-b-2 border-dotted border-slate-400 mx-2 flex justify-between items-center px-4">
                          <span className="font-mono text-slate-800 text-sm">{formattedDate}</span>
                          <span className="font-mono text-slate-800 text-sm">{formattedDate}</span>
                        </div>
                        <span className="min-w-[70px] text-right text-sm" dir="rtl">: التاريخ</span>
                      </div>

                      <div className="flex items-center">
                        <span className="font-serif text-slate-800 min-w-[130px] text-sm">
                          {isReceipt ? 'Received From:' : 'Delivered To:'}
                        </span>
                        <div className="flex-1 border-b-2 border-dotted border-slate-400 mx-2 flex justify-between items-center px-4 gap-4">
                          <span className="font-serif font-black text-slate-950 text-sm text-left flex-1 font-sans">{details.partyEn}</span>
                          <span className="font-black text-slate-950 text-sm text-right flex-1" dir="rtl">{details.partyAr}</span>
                        </div>
                        <span className="min-w-[100px] text-right text-sm" dir="rtl">
                          : {isReceipt ? 'استلمت من' : 'سلمت الى'}
                        </span>
                      </div>

                      <div className="flex items-start">
                        <span className="font-serif text-slate-800 min-w-[100px] text-sm pt-0.5">Amount of:</span>
                        <div className="flex-1 border-b-2 border-dotted border-slate-400 mx-2 flex justify-between items-start px-4 gap-6 pb-0.5">
                          <span className="font-serif text-slate-900 text-xs text-left leading-relaxed flex-1 font-bold">{englishWords}</span>
                          <span className="text-slate-900 text-xs font-black text-right leading-relaxed flex-1" dir="rtl">{arabicWords}</span>
                        </div>
                        <span className="min-w-[85px] text-right text-sm pt-0.5" dir="rtl">: مبلغ وقدره</span>
                      </div>

                      <div className="flex items-start">
                        <span className="font-serif text-slate-800 min-w-[70px] text-sm pt-0.5">For:</span>
                        <div className="flex-1 border-b-2 border-dotted border-slate-400 mx-2 flex flex-col px-4 gap-1 pb-1">
                          <span className="font-serif text-slate-950 text-xs text-left font-bold" dir="ltr">{forReasonEnText}</span>
                          <span className="text-slate-950 text-xs font-black text-right" dir="rtl">{forReasonArText}</span>
                        </div>
                        <span className="min-w-[70px] text-right text-sm pt-0.5" dir="rtl">: وذلك عن</span>
                      </div>

                      <div className="pt-1 space-y-2 font-bold text-slate-900">
                        <div className="flex items-center justify-between" dir="rtl">
                          <div className="flex items-center gap-5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-900 text-sm font-bold">نقد</span>
                              <span className="border-2 border-slate-800 w-4 h-4 inline-flex items-center justify-center font-black text-xs bg-white">
                                {details.method === 'CASH' ? '✓' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-900 text-sm font-bold">شيك رقم</span>
                              <span className="border-2 border-slate-800 w-4 h-4 inline-flex items-center justify-center font-black text-xs bg-white">
                                {details.method === 'CHEQUE' ? '✓' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 border-b-2 border-dotted border-slate-400 mx-3 text-center font-mono font-bold text-sm">
                            {details.chequeNo || ''}
                          </div>
                          <div className="font-serif text-slate-900 text-sm font-bold text-left min-w-[110px]" dir="ltr">
                            Cash CHg No
                          </div>
                        </div>

                        <div className="flex items-center justify-between" dir="rtl">
                          <div className="flex items-center flex-1 gap-2">
                            <span className="text-slate-900 text-sm font-bold min-w-[60px]">على البنك</span>
                            <div className="flex-1 border-b-2 border-dotted border-slate-400 text-center font-bold text-slate-900 px-2 text-xs">
                              {details.bank || ''}
                            </div>
                            <span className="font-serif text-slate-900 text-sm font-bold min-w-[40px] text-center" dir="ltr">Bank</span>
                          </div>
                          <div className="flex items-center flex-1 gap-2 mr-4">
                            <span className="text-slate-900 text-sm font-bold min-w-[45px]">تاريخ</span>
                            <div className="flex-1 border-b-2 border-dotted border-slate-400 text-center font-mono font-bold text-slate-900 px-2 text-xs">
                              {details.method === 'CHEQUE' ? formattedDate : ''}
                            </div>
                            <span className="font-serif text-slate-900 text-sm font-bold min-w-[40px] text-center" dir="ltr">Date</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-8 pb-2 text-center">
                      <div>
                        <p className="font-serif font-black text-slate-900 text-sm">Manager : المدير</p>
                        <div className="border-b-2 border-slate-900 mt-6 w-36 mx-auto"></div>
                      </div>
                      <div>
                        <p className="font-serif font-black text-slate-900 text-sm">Accountant : المحاسب</p>
                        <div className="border-b-2 border-slate-900 mt-6 w-36 mx-auto"></div>
                      </div>
                      <div>
                        <p className="font-serif font-black text-slate-900 text-sm">Receiver : المستلم</p>
                        <div className="border-b-2 border-slate-900 mt-6 w-36 mx-auto"></div>
                      </div>
                    </div>

                    <div className="border-t border-slate-400 mt-4 pt-2 text-center text-[10px] text-slate-800 font-bold" dir="rtl">
                      العنوان : العراق - النجف الأشرف - حي الفرات - شارع الجنسية / التلفون : 07868006699 - 07737006699
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </AuthGuard>
  );
}