'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CreditCard, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  User, 
  Phone, 
  Calendar, 
  Coins, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Printer, 
  X, 
  Trash2, 
  Building2, 
  QrCode, 
  FileText, 
  Award, 
  DollarSign, 
  Users, 
  Package, 
  RotateCcw, 
  Plus, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  MessageSquareShare,
  Globe,
  ShieldCheck,
  Home,
  Sparkles
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function numberToArabicWords(num: number): string {
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

  return `فقط ${parts.join(' و')} دينار عراقي لا غير`;
}

interface ItemLine {
  itemName: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
}

// دالة إرسال الإشعار المركزي المزدوجة (Hybrid Dispatcher)
async function pushSystemNotification(title: string, message: string, sector: string, link: string, actionType: string = 'ADD') {
  const newNotif = {
    notification_id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    message,
    sector: sector || 'INSTALLMENTS',
    action_type: actionType,
    link: link || '/inventory/installments',
    is_read: false,
    created_at: new Date().toISOString()
  };

  try {
    const localRaw = localStorage.getItem('rtco_system_notifications');
    const local = localRaw ? JSON.parse(localRaw) : [];
    localStorage.setItem('rtco_system_notifications', JSON.stringify([newNotif, ...local]));
  } catch (err) {
    console.error(err);
  }

  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_NOTIFICATION',
        action_type: actionType,
        title,
        message,
        sector,
        link
      })
    });
  } catch (e) {
    console.error('Failed to dispatch notification to API', e);
  }
}

// مزامنة عقد التقسيط مع السيرفر وقاعدة البيانات السحابية
async function syncInstallmentToCloud(plan: any) {
  try {
    await fetch('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_INSTALLMENT', plan })
    });
  } catch (e) {
    console.error('Failed to sync installment to cloud:', e);
  }
}

export default function InstallmentsPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    tagline: 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    phone_primary: '07868006699',
    phone_secondary: '07737006699',
    email: '',
    website: '',
    address: 'العراق - النجف الأشرف - حي الفرات',
    logo_url: '',
    letterhead_url: '',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  const [plans, setPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('ALL');
  const [siteOrigin, setSiteOrigin] = useState('');

  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'MERCHANT'>('INDIVIDUAL');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerIdCard, setCustomerIdCard] = useState('');
  const [customerAddress, setCustomerAddress] = useState('النجف الأشرف');
  
  const [itemLines, setItemLines] = useState<ItemLine[]>([
    { itemName: '', qty: 1, unit: 'قطعة', price: 0, total: 0 }
  ]);

  const [profitRate, setProfitRate] = useState('10');
  const [downPayment, setDownPayment] = useState('0');
  const [monthsCount, setMonthsCount] = useState('10');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');

  const [selectedPlanForPrint, setSelectedPlanForPrint] = useState<any | null>(null);
  const [receiptVoucherForPrint, setReceiptVoucherForPrint] = useState<any | null>(null);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteOrigin(window.location.origin);
    }

    loadSettings();

    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setCurrentUser(u);

        // التحقق من الجلسة الحصرية لمنع الدخول المزدوج
        if (u.user_id && u.session_token) {
          fetch(`/api/auth?action=VERIFY_SESSION&user_id=${encodeURIComponent(u.user_id)}&session_token=${encodeURIComponent(u.session_token)}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.valid === false) {
                localStorage.removeItem('erp_user');
                alert('تنبيه أمني: تم فتح هذا الحساب من جهاز آخر، سيتم تحويلك لصفحة تسجيل الدخول.');
                window.location.href = '/login';
              }
            })
            .catch(() => {});
        }
      } catch {}
    }

    const stored = localStorage.getItem('rtco_inventory_installments');
    if (stored) {
      try {
        setPlans(JSON.parse(stored));
      } catch {}
    }

    fetch('/api/admin/system?action=GET_INSTALLMENTS', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.installments) && data.installments.length > 0) {
          setPlans(data.installments);
          localStorage.setItem('rtco_inventory_installments', JSON.stringify(data.installments));
        }
      })
      .catch(() => {});
  }, []);

  const isSuperAdmin = useMemo(() => {
    return Boolean(currentUser?.is_super_admin || currentUser?.role === 'ADMIN');
  }, [currentUser]);

  const canAdd = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'installments', 'add'));
  }, [currentUser, isSuperAdmin]);

  const canEdit = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'installments', 'edit'));
  }, [currentUser, isSuperAdmin]);

  const canDelete = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'installments', 'delete'));
  }, [currentUser, isSuperAdmin]);

  const handleAddItemLine = () => {
    setItemLines([...itemLines, { itemName: '', qty: 1, unit: 'قطعة', price: 0, total: 0 }]);
  };

  const handleRemoveItemLine = (index: number) => {
    if (itemLines.length <= 1) return;
    setItemLines(itemLines.filter((_, i) => i !== index));
  };

  const handleUpdateItemLine = (index: number, field: keyof ItemLine, val: any) => {
    const updated = [...itemLines];
    const target = { ...updated[index], [field]: val };

    if (field === 'qty' || field === 'price') {
      const q = field === 'qty' ? Number(val) : target.qty;
      const p = field === 'price' ? Number(val) : target.price;
      target.total = Math.round(q * p);
    }
    updated[index] = target;
    setItemLines(updated);
  };

  const calculationPreview = useMemo(() => {
    const sumCashPrice = itemLines.reduce((acc, line) => acc + (Number(line.total) || 0), 0);
    const pRate = Number(profitRate) || 0;
    const dPayment = Number(downPayment) || 0;
    const mCount = Math.max(1, Number(monthsCount) || 1);

    const profitAmount = Math.round(sumCashPrice * (pRate / 100));
    const totalInstallmentPrice = sumCashPrice + profitAmount;
    const remainingToPay = Math.max(0, totalInstallmentPrice - dPayment);
    const monthlyInstallment = Math.round(remainingToPay / mCount);

    return {
      sumCashPrice,
      profitAmount,
      totalInstallmentPrice,
      remainingToPay,
      monthlyInstallment
    };
  }, [itemLines, profitRate, downPayment, monthsCount]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية فتح عقود تقسيط');
      return;
    }

    const validLines = itemLines.filter(l => l.itemName.trim() !== '');
    if (validLines.length === 0) {
      alert('يرجى إدخال مادة واحدة على الأقل في تفاصيل العقد');
      return;
    }

    const { sumCashPrice, totalInstallmentPrice, remainingToPay, monthlyInstallment } = calculationPreview;

    const installmentsSchedule = [];
    const baseDate = new Date(startDate);

    for (let i = 1; i <= Number(monthsCount); i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installmentsSchedule.push({
        installmentNumber: i,
        amount: monthlyInstallment,
        dueDate: dueDate.toISOString().substring(0, 10),
        status: 'UNPAID',
        paidAt: null,
        voucherNo: null
      });
    }

    const goodsDescriptionSummary = validLines.map(l => `${l.itemName} (${l.qty} ${l.unit})`).join(' + ');

    const newPlan = {
      id: `INST-${Date.now().toString().slice(-6)}`,
      customerType,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerIdCard: customerIdCard.trim(),
      customerAddress: customerAddress.trim(),
      items: validLines,
      goodsDescription: goodsDescriptionSummary,
      cashPrice: sumCashPrice,
      profitRate: Number(profitRate),
      totalInstallmentPrice,
      downPayment: Number(downPayment),
      remainingBalance: remainingToPay,
      totalPaid: Number(downPayment),
      monthsCount: Number(monthsCount),
      monthlyInstallment,
      startDate,
      guarantorName: guarantorName.trim(),
      guarantorPhone: guarantorPhone.trim(),
      status: 'ACTIVE',
      installments: installmentsSchedule,
      createdAt: new Date().toISOString()
    };

    const updated = [newPlan, ...plans];
    setPlans(updated);
    localStorage.setItem('rtco_inventory_installments', JSON.stringify(updated));

    await syncInstallmentToCloud(newPlan);

    await pushSystemNotification(
      `عقد تقسيط جديد: ${newPlan.id}`,
      `تم فتح خطة بيع بالتقسيط للعميل (${newPlan.customerName}) لبضاعة (${newPlan.goodsDescription}) بإجمالي ${formatNum(newPlan.totalInstallmentPrice)} د.ع`,
      'INSTALLMENTS',
      '/inventory/installments',
      'ADD'
    );

    setShowNewPlanModal(false);
    setSelectedPlanForPrint(newPlan);
  };

  const handlePayInstallment = async (planId: string, instIndex: number) => {
    if (!canEdit && !canAdd) {
      alert('ليس لديك صلاحية تسجيل وقبض الأقساط');
      return;
    }

    let voucherData: any = null;
    let modifiedPlan: any = null;

    const updated = plans.map(p => {
      if (p.id === planId) {
        const instList = [...p.installments];
        const inst = instList[instIndex];
        if (inst.status === 'PAID') return p;

        const vNo = `RCP-${Math.floor(100000 + Math.random() * 900000)}`;
        inst.status = 'PAID';
        inst.paidAt = new Date().toISOString().substring(0, 10);
        inst.voucherNo = vNo;

        const newPaid = (Number(p.totalPaid) || 0) + Number(inst.amount);
        const newRemaining = Math.max(0, (Number(p.totalInstallmentPrice) || 0) - newPaid);

        voucherData = {
          voucherNo: vNo,
          customerName: p.customerName,
          amount: inst.amount,
          amountWords: numberToArabicWords(inst.amount),
          goodsDescription: p.goodsDescription,
          installmentNumber: inst.installmentNumber,
          totalInstallments: p.monthsCount,
          date: inst.paidAt,
          remainingAfterPayment: newRemaining
        };

        setReceiptVoucherForPrint(voucherData);

        modifiedPlan = {
          ...p,
          totalPaid: newPaid,
          remainingBalance: newRemaining,
          status: newRemaining === 0 ? 'COMPLETED' : 'ACTIVE',
          installments: instList
        };

        return modifiedPlan;
      }
      return p;
    });

    setPlans(updated);
    localStorage.setItem('rtco_inventory_installments', JSON.stringify(updated));

    if (modifiedPlan) {
      await syncInstallmentToCloud(modifiedPlan);
    }

    if (voucherData) {
      await pushSystemNotification(
        `قبض قسط شهري: ${voucherData.voucherNo}`,
        `تم تسديد القسط رقم (${voucherData.installmentNumber}) للعميل (${voucherData.customerName}) بمبلغ ${formatNum(voucherData.amount)} د.ع`,
        'INSTALLMENTS',
        '/inventory/installments',
        'UPDATE'
      );
    }
  };

  const handleRollbackInstallment = async (planId: string, instIndex: number) => {
    if (!canEdit && !canDelete) {
      alert('ليس لديك صلاحية التراجع عن السداد');
      return;
    }

    if (!confirm('تأكيد الرجوع عن تسديد هذا القسط وإعادته إلى قائمة الأقساط المستحقة وتعديل الرصيد؟')) return;

    let rollbackInfo: any = null;
    let modifiedPlan: any = null;

    const updated = plans.map(p => {
      if (p.id === planId) {
        const instList = [...p.installments];
        const inst = instList[instIndex];
        if (inst.status !== 'PAID') return p;

        const deductedAmount = Number(inst.amount) || 0;
        rollbackInfo = {
          customerName: p.customerName,
          installmentNumber: inst.installmentNumber,
          amount: deductedAmount,
          planId: p.id
        };

        inst.status = 'UNPAID';
        inst.paidAt = null;
        inst.voucherNo = null;

        const newPaid = Math.max(0, (Number(p.totalPaid) || 0) - deductedAmount);
        const newRemaining = Math.max(0, (Number(p.totalInstallmentPrice) || 0) - newPaid);

        modifiedPlan = {
          ...p,
          totalPaid: newPaid,
          remainingBalance: newRemaining,
          status: 'ACTIVE',
          installments: instList
        };

        return modifiedPlan;
      }
      return p;
    });

    setPlans(updated);
    localStorage.setItem('rtco_inventory_installments', JSON.stringify(updated));

    if (modifiedPlan) {
      await syncInstallmentToCloud(modifiedPlan);
    }

    if (rollbackInfo) {
      await pushSystemNotification(
        `تراجع عن سداد قسط: ${rollbackInfo.planId}`,
        `تم إلغاء تسديد القسط رقم (${rollbackInfo.installmentNumber}) للعميل (${rollbackInfo.customerName}) بمبلغ ${formatNum(rollbackInfo.amount)} د.ع وإعادته إلى الرصيد المتبقي`,
        'INSTALLMENTS',
        '/inventory/installments',
        'UPDATE'
      );
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف سجلات التقسيط');
      return;
    }

    const planToDelete = plans.find(p => p.id === id);
    if (!planToDelete) return;

    if (!confirm(`هل أنت متأكد من حذف عقد التقسيط (${planToDelete.id}) للعميل (${planToDelete.customerName}) بالكامل وسجلاته؟`)) return;

    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    localStorage.setItem('rtco_inventory_installments', JSON.stringify(updated));

    try {
      await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_INSTALLMENT', planId: id })
      });
    } catch (e) {
      console.error('Failed to delete installment from cloud:', e);
    }

    await pushSystemNotification(
      `حذف عقد تقسيط: ${planToDelete.id}`,
      `تم حذف عقد التقسيط ذي الرقم (${planToDelete.id}) للعميل (${planToDelete.customerName}) وإلغاء جدولة أقساطه من المنظومة`,
      'INSTALLMENTS',
      '/inventory/installments',
      'DELETE'
    );
  };

  const handleSendDetailedWhatsApp = (client: any) => {
    const phone = client.customerPhone;
    if (!phone) {
      alert('رقم هاتف العميل غير مسجل!');
      return;
    }

    const goodsDetails = client.allGoodsList.join(' و ');
    const message = `عزيزنا العميل / ${client.customerName} المحترم،\n\nتذكركم ${companySettings.company_name} للتجارة العامة بخصوص حسابكم المالي للأقساط:\n\n📦 المواد المشتراة: (${goodsDetails})\n💰 المبلغ الكلي مع الأرباح: ${formatNum(client.totalPrice)} د.ع\n💵 الواصل المسدد: ${formatNum(client.totalPaid)} د.ع\n🚨 المتبقي بذمتكم حالياً: ${formatNum(client.remainingBalance)} د.ع\n\nيرجى المبادرة بسداد الأقساط المستحقة في موعدها المحدد لضمان استمرار الخدمة. شاكرين حسن تعاونكم معنا.`;

    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/964${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getVerificationUrl = (planId: string) => {
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : (companySettings.website || siteOrigin || 'https://rtco2025.netlify.app');
    return `${origin}/verify?type=installment&no=${encodeURIComponent(planId)}`;
  };

  const mergedClientsDisplay = useMemo(() => {
    const map = new Map<string, {
      clientId: string;
      customerName: string;
      customerPhone: string;
      customerType: string;
      customerAddress: string;
      allGoodsList: string[];
      contractIds: string[];
      totalPrice: number;
      totalPaid: number;
      remainingBalance: number;
      plans: any[];
    }>();

    plans.forEach(p => {
      const key = p.customerName.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          clientId: key,
          customerName: p.customerName,
          customerPhone: p.customerPhone,
          customerType: p.customerType,
          customerAddress: p.customerAddress,
          allGoodsList: [],
          contractIds: [],
          totalPrice: 0,
          totalPaid: 0,
          remainingBalance: 0,
          plans: []
        });
      }
      const entry = map.get(key)!;
      entry.totalPrice += Number(p.totalInstallmentPrice || 0);
      entry.totalPaid += Number(p.totalPaid || 0);
      entry.remainingBalance += Number(p.remainingBalance || 0);
      entry.contractIds.push(p.id);
      if (p.goodsDescription && !entry.allGoodsList.includes(p.goodsDescription)) {
        entry.allGoodsList.push(p.goodsDescription);
      }
      entry.plans.push(p);
    });

    let result = Array.from(map.values());

    if (clientTypeFilter !== 'ALL') {
      result = result.filter(c => c.customerType === clientTypeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        c.contractIds.some(id => id.toLowerCase().includes(q)) ||
        c.allGoodsList.some(g => g.toLowerCase().includes(q))
      );
    }

    return result;
  }, [plans, searchQuery, clientTypeFilter]);

  const totals = useMemo(() => {
    const totalVolume = plans.reduce((acc, p) => acc + (Number(p.totalInstallmentPrice) || 0), 0);
    const totalCollected = plans.reduce((acc, p) => acc + (Number(p.totalPaid) || 0), 0);
    const totalPending = plans.reduce((acc, p) => acc + (Number(p.remainingBalance) || 0), 0);
    return { totalVolume, totalCollected, totalPending };
  }, [plans]);

  const toggleExpandClient = (clientId: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !(prev[clientId] ?? true)
    }));
  };

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';
  const hasLogo = Boolean(companySettings.logo_url && companySettings.logo_url.trim().length > 10);
  const hasLetterhead = Boolean(companySettings.letterhead_url && companySettings.letterhead_url.trim().length > 10);

  return (
    <AuthGuard moduleName="installments" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        <style jsx global>{`
          @media screen and (max-width: 768px) {
            .print-paper-sheet,
            .print-voucher-sheet {
              min-width: 720px !important;
            }
          }
          @media print {
            @page {
              size: A4 portrait !important;
              margin: 0 !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body, html {
              background-color: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 210mm !important;
            }
            .print-hidden-element {
              display: none !important;
            }
            .print-paper-sheet {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: 8mm 10mm !important;
              margin: 0 !important;
              width: 210mm !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              page-break-after: always !important;
            }
            .print-voucher-sheet {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: 10mm 12mm !important;
              margin: 0 !important;
              width: 210mm !important;
              max-width: 210mm !important;
              page-break-after: always !important;
            }
          }
        `}</style>

        {/* الترويسة الرئيسية المحسنة بتصميم متناسق ومؤطر */}
        <div className="max-w-7xl mx-auto pb-6 border-b border-slate-800/80 print:hidden print-hidden-element">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
            
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 p-3 rounded-2xl text-slate-950 font-black shadow-xl shrink-0 flex items-center justify-center transition-all"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryCol}, ${secondaryCol})`,
                  boxShadow: `0 10px 25px -5px ${primaryCol}40`
                }}
              >
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                    منظومة المبيعات بالأقساط والمواد المدمجة
                  </h1>
                  <span 
                    className="inline-flex items-center gap-1.5 border text-[11px] font-bold px-3 py-0.5 rounded-full shadow-inner font-mono"
                    style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                  >
                    <Sparkles className="w-3 h-3" />
                    مزامنة سحابية • باركود تحقق A4
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {companySettings.company_name} • تجميع فواتير ومواد العميل في حساب موحد مع إرسال التنبيهات وإصدار الوصولات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap self-end sm:self-auto">
              {canAdd && (
                <button
                  onClick={() => {
                    setItemLines([{ itemName: '', qty: 1, unit: 'قطعة', price: 0, total: 0 }]);
                    setShowNewPlanModal(true);
                  }}
                  className="px-4 py-2.5 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition shadow-lg cursor-pointer active:scale-95"
                  style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                >
                  <PlusCircle className="w-4 h-4" /> فتح عقد تقسيط جديد +
                </button>
              )}

              <Link
                href="/inventory"
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" /> المخزن
              </Link>

              <Link
                href="/"
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4" /> الرئيسية
              </Link>
            </div>

          </div>
        </div>

        {/* المؤشرات المالية */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 print:hidden print-hidden-element">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">إجمالي مبيعات الأقساط الكلية</span>
            <div className="text-2xl font-black font-mono mt-2" style={{ color: primaryCol }}>
              {formatNum(totals.totalVolume)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">القيمة الكلية مع نسب الأرباح المحتسبة</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl" style={{ borderColor: `${primaryCol}40` }}>
            <span className="text-xs font-semibold block" style={{ color: primaryCol }}>المقبوض الفعلي (مقدمات + أقساط مسددة)</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
              {formatNum(totals.totalCollected)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">محصل رسمياً في حسابات الصندوق</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl" style={{ borderColor: `${secondaryCol}40` }}>
            <span className="text-xs font-semibold block" style={{ color: secondaryCol }}>الأرصدة الآجلة المتبقية بذمة العملاء</span>
            <div className="text-2xl font-black font-mono text-rose-400 mt-2">
              {formatNum(totals.totalPending)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">مستحقة وفق الجدولة والتواريخ</p>
          </div>
        </div>

        {/* أدوات البحث والفلترة */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 print:hidden print-hidden-element">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="ابحث باسم العميل أو التاجر، رقم الهاتف، أو المادة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <select
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-2 text-white outline-none text-xs"
            >
              <option value="ALL">جميع الفئات</option>
              <option value="INDIVIDUAL">أفراد ومواطنين</option>
              <option value="MERCHANT">تجار ومكاتب تجارية</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            إجمالي العملاء والتجار المسجلين: <strong className="text-white">{mergedClientsDisplay.length}</strong>
          </span>
        </div>

        {/* كروت العرض المدمجة */}
        <div className="max-w-7xl mx-auto space-y-6 mt-4 print:hidden print-hidden-element">
          {mergedClientsDisplay.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl text-center text-slate-500 text-xs">
              لا توجد عقود تقسيط مسجلة مطابقة للبحث. اضغط على "فتح عقد تقسيط جديد" للبدء.
            </div>
          ) : (
            mergedClientsDisplay.map((client) => {
              const isAllPaid = client.remainingBalance <= 0;
              const isExpanded = expandedClients[client.clientId] ?? true;

              return (
                <div 
                  key={client.clientId} 
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 border-r-4"
                  style={{ borderRightColor: primaryCol }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-start gap-3.5">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0"
                        style={{ backgroundColor: `${primaryCol}15`, borderColor: `${primaryCol}30`, color: primaryCol }}
                      >
                        {client.customerType === 'MERCHANT' ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg font-black text-white">{client.customerName}</h2>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {client.contractIds.map(cid => (
                              <span 
                                key={cid} 
                                className="font-mono text-xs font-bold px-2 py-0.5 rounded-md border"
                                style={{ backgroundColor: `${primaryCol}10`, color: primaryCol, borderColor: `${primaryCol}30` }}
                              >
                                {cid}
                              </span>
                            ))}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            client.customerType === 'MERCHANT' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          }`}>
                            {client.customerType === 'MERCHANT' ? 'تاجر / جملة' : 'مواطن / أفراد'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAllPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {isAllPaid ? 'مكتمل السداد بالكامل ✓' : 'جاري التحصيل'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300 flex-wrap">
                          <span className="text-slate-400">المواد المدمجة:</span>
                          <strong className="font-bold bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800" style={{ color: primaryCol }}>
                            {client.allGoodsList.join(' + ')}
                          </strong>
                          <span className="text-slate-500">•</span>
                          <span>هاتف: <strong className="font-mono text-slate-200">{client.customerPhone}</strong></span>
                          <span className="text-slate-500">•</span>
                          <span>العنوان: <strong className="text-slate-200">{client.customerAddress}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end lg:self-auto flex-wrap">
                      <button
                        onClick={() => handleSendDetailedWhatsApp(client)}
                        className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-emerald-500/30 cursor-pointer shadow-sm"
                        title="إرسال تفاصيل الحساب الكاملة للمادة والمبلغ والمتبقي بالواتساب"
                      >
                        <MessageSquareShare className="w-3.5 h-3.5" /> إرسال تنبيه بالواتساب
                      </button>

                      <button
                        onClick={() => toggleExpandClient(client.clientId)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <span>{isExpanded ? 'طي تفاصيل العقود' : 'عرض العقود وجداول الأقساط'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
                    <div className="text-center sm:text-right">
                      <span className="text-slate-500 font-sans block text-[11px]">مجموع المبيعات المدمجة (مع الربح)</span>
                      <strong className="text-base" style={{ color: primaryCol }}>{formatNum(client.totalPrice)} د.ع</strong>
                    </div>
                    <div className="text-center sm:text-right border-y sm:border-y-0 sm:border-x border-slate-800 py-2 sm:py-0 sm:px-4">
                      <span className="text-slate-500 font-sans block text-[11px]">المسدد الكلي (مقدمات + أقساط)</span>
                      <strong className="text-sky-400 text-base">{formatNum(client.totalPaid)} د.ع</strong>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="text-slate-500 font-sans block text-[11px]">المتبقي بذمته حالياً</span>
                      <strong className="text-rose-400 text-base">{formatNum(client.remainingBalance)} د.ع</strong>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 pt-2">
                      {client.plans.map((plan: any) => {
                        const paidCount = plan.installments.filter((i: any) => i.status === 'PAID').length;

                        return (
                          <div key={plan.id} className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-mono text-xs font-black px-2 py-0.5 rounded border"
                                  style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                                >
                                  {plan.id}
                                </span>
                                <h4 className="font-bold text-white text-xs">
                                  المادة: <span style={{ color: primaryCol }}>{plan.goodsDescription}</span>
                                </h4>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  (القسط: {formatNum(plan.monthlyInstallment)} د.ع | المستحق: {paidCount}/{plan.monthsCount})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    await loadSettings();
                                    setSelectedPlanForPrint(plan);
                                  }}
                                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
                                  style={{ color: primaryCol }}
                                >
                                  <Printer className="w-3.5 h-3.5" /> طباعة هذا العقد A4
                                </button>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="p-1 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition cursor-pointer"
                                    title="حذف هذا العقد"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
                              {plan.installments.map((inst: any, idx: number) => {
                                const isPaid = inst.status === 'PAID';
                                return (
                                  <div 
                                    key={idx} 
                                    className={`p-3 rounded-2xl border transition text-xs space-y-2 flex flex-col justify-between ${
                                      isPaid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex justify-between items-center text-[11px]">
                                        <span className="font-bold">قسط #{inst.installmentNumber}</span>
                                        <span className="font-mono text-[10px] text-slate-400">{inst.dueDate}</span>
                                      </div>
                                      <div className="text-sm font-black font-mono mt-1 text-white">
                                        {formatNum(inst.amount)} د.ع
                                      </div>
                                      {isPaid && (
                                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                                          سدد بتاريخ: {inst.paidAt}
                                        </div>
                                      )}
                                    </div>

                                    <div className="pt-2 border-t border-slate-800/80">
                                      {isPaid ? (
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> تم السداد
                                          </span>
                                          <button
                                            onClick={() => handleRollbackInstallment(plan.id, idx)}
                                            className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded border border-rose-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                            title="إلغاء تسديد هذا القسط وإعادة المتبقي"
                                          >
                                            <RotateCcw className="w-2.5 h-2.5" /> تراجع
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => handlePayInstallment(plan.id, idx)}
                                          className="w-full py-1.5 text-slate-950 font-black rounded-xl text-[11px] transition shadow cursor-pointer"
                                          style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                                        >
                                          تسديد وطباعة الوصل
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* نافذة فتح عقد تقسيط جديد */}
        {showNewPlanModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 shadow-2xl text-right space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" style={{ color: primaryCol }} /> فتح عقد بيع بالتقسيط (دمج مواد متعددة لنفس الجهة)
                </h3>
                <button onClick={() => setShowNewPlanModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-bold">جهة الشراء:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      customerType === 'INDIVIDUAL' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <input type="radio" name="cType" checked={customerType === 'INDIVIDUAL'} onChange={() => setCustomerType('INDIVIDUAL')} className="accent-emerald-500" />
                      <span>مواطن / أفراد وعامة الناس</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      customerType === 'MERCHANT' ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <input type="radio" name="cType" checked={customerType === 'MERCHANT'} onChange={() => setCustomerType('MERCHANT')} className="accent-purple-500" />
                      <span>تاجر / متجر / شركة تجارية</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">اسم العميل / التاجر الكامل *</label>
                    <input
                      type="text"
                      required
                      placeholder="الاسم الثلاثي أو اسم المتجر والمسؤول"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-bold"
                      style={{ borderColor: `${primaryCol}50` }}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم الهاتف *</label>
                    <input
                      type="text"
                      required
                      placeholder="078..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم البطاقة الموحدة / السجل التجاري</label>
                    <input
                      type="text"
                      placeholder="رقم الهوية أو السجل"
                      value={customerIdCard}
                      onChange={(e) => setCustomerIdCard(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">عنوان السكن / مقر العمل</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold flex items-center gap-1.5" style={{ color: primaryCol }}>
                      <Package className="w-4 h-4" /> المواد والبضائع المدمجة في هذا العقد:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddItemLine}
                      className="font-bold text-xs flex items-center gap-1 cursor-pointer"
                      style={{ color: primaryCol }}
                    >
                      <Plus className="w-3.5 h-3.5" /> + إضافة مادة أخرى
                    </button>
                  </div>

                  <div className="space-y-2">
                    {itemLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="col-span-5">
                          <input
                            type="text"
                            required
                            placeholder="اسم المادة (مثال: سبلت 2 طن، مبردة، حديد...)"
                            value={line.itemName}
                            onChange={(e) => handleUpdateItemLine(idx, 'itemName', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="الكمية"
                            value={line.qty}
                            onChange={(e) => handleUpdateItemLine(idx, 'qty', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs outline-none text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={line.unit}
                            onChange={(e) => handleUpdateItemLine(idx, 'unit', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none"
                          >
                            <option value="قطعة">قطعة</option>
                            <option value="جهاز">جهاز</option>
                            <option value="طن">طن</option>
                            <option value="كيس">كيس</option>
                            <option value="متر">متر</option>
                            <option value="كارتون">كارتون</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="سعر المفرد"
                            value={line.price || ''}
                            onChange={(e) => handleUpdateItemLine(idx, 'price', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono text-xs outline-none font-bold"
                            style={{ color: primaryCol }}
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemLine(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            title="حذف هذا السطر"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs font-mono pt-1 text-slate-400">
                    <span>مجموع السعر النقدي للبضاعة المدمجة:</span>
                    <strong className="text-white text-sm">{formatNum(calculationPreview.sumCashPrice)} د.ع</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نسبة ربح التقسيط %</label>
                    <input
                      type="number"
                      value={profitRate}
                      onChange={(e) => setProfitRate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 font-mono font-bold outline-none text-xs"
                      style={{ color: primaryCol }}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المقدمة الواصلة (د.ع)</label>
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-emerald-400 font-mono font-bold outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">عدد الأشهر للتقسيط</label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={monthsCount}
                      onChange={(e) => setMonthsCount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sky-400 font-mono font-bold outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3.5 rounded-2xl border border-emerald-500/30 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">الإجمالي الكلي بالتقسيط:</span>
                    <strong className="text-emerald-400 text-sm">{formatNum(calculationPreview.totalInstallmentPrice)} د.ع</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">القسط الشهري المطلوب:</span>
                    <strong className="text-sm" style={{ color: primaryCol }}>{formatNum(calculationPreview.monthlyInstallment)} د.ع/شهر</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">اسم الكفيل الضامن (اختياري)</label>
                    <input
                      type="text"
                      placeholder="اسم الكفيل"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">هاتف الكفيل</label>
                    <input
                      type="text"
                      placeholder="078..."
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowNewPlanModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer"
                    style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                  >
                    اعتماد وجدولة الأقساط للمواد المدمجة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* سند قبض القسط A4 */}
        {receiptVoucherForPrint && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:static">
            <div className="w-full max-w-3xl flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 print:hidden print-hidden-element shadow-xl">
              <button
                onClick={() => window.print()}
                className="text-slate-950 font-black px-6 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
              >
                <Printer className="w-4 h-4" /> طباعة سند قبض القسط (A4)
              </button>
              <button onClick={() => setReceiptVoucherForPrint(null)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-w-3xl overflow-x-auto pb-4">
              <div 
                className="print-voucher-sheet min-w-[720px] sm:min-w-0 bg-white text-slate-950 rounded-3xl p-8 md:p-12 border-2 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-6 font-sans"
                style={{ borderColor: primaryCol }}
              >
                {hasLetterhead ? (
                  <div className="w-full border-b pb-4 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={companySettings.letterhead_url} alt="ترويسة الشركة" className="w-full max-h-32 object-contain" />
                  </div>
                ) : (
                  <div className="flex justify-between items-center border-b-2 pb-5" style={{ borderColor: primaryCol }}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200">
                        {hasLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                        ) : (
                          <Image src="/logo.png" alt="شركة البرج المتألق" width={56} height={56} className="object-contain" priority />
                        )}
                      </div>
                      <div>
                        <h1 className="text-2xl font-black" style={{ color: primaryCol }}>{companySettings.company_name}</h1>
                        <p className="text-xs text-slate-600 font-bold">{companySettings.tagline}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{companySettings.address} | {companySettings.phone_primary}</p>
                      </div>
                    </div>
                    <div className="text-left font-mono text-xs">
                      <div 
                        className="border-2 px-3 py-1 font-black text-slate-950 rounded-lg inline-block"
                        style={{ backgroundColor: `${primaryCol}20`, borderColor: primaryCol }}
                      >
                        سند قبض قسط شهري
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 mt-2 font-mono">رقم الوصل: <span style={{ color: primaryCol }}>{receiptVoucherForPrint.voucherNo}</span></p>
                      <p className="text-[11px] text-slate-500">التاريخ: {receiptVoucherForPrint.date}</p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
                  <p>استلمنا من السيد/ة: <strong className="text-slate-950 text-sm">{receiptVoucherForPrint.customerName}</strong></p>
                  <p>مبلغاً وقدره: <strong className="font-mono text-base font-black" style={{ color: primaryCol }}>{formatNum(receiptVoucherForPrint.amount)} د.ع</strong></p>
                  <p className="font-bold text-slate-700">{receiptVoucherForPrint.amountWords}</p>
                  <p className="pt-2 border-t border-slate-200">
                    وذلك عن: <strong>سداد القسط رقم ({receiptVoucherForPrint.installmentNumber}) من أصل ({receiptVoucherForPrint.totalInstallments}) أقساط عن بضاعة ({receiptVoucherForPrint.goodsDescription}).</strong>
                  </p>
                  <p className="text-[11px] font-mono text-slate-600">
                    المتبقي بذمة العميل بعد هذا السداد: <strong className="text-rose-700">{formatNum(receiptVoucherForPrint.remainingAfterPayment)} د.ع</strong>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-700">المستلم / المحاسب</p>
                    <div className="border-b border-dashed border-slate-400 w-32 mx-auto mt-8"></div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">المسدد / العميل</p>
                    <div className="border-b border-dashed border-slate-400 w-32 mx-auto mt-8"></div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">ختم الشركة المعتمد</p>
                    <div className="border-b border-dashed border-slate-400 w-32 mx-auto mt-8"></div>
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-2 text-center text-[10px] text-slate-500 font-mono">
                  {companySettings.company_name} - {companySettings.address} • هاتف: {companySettings.phone_primary}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* وثيقة العقد وجدول الأقساط A4 مع الباركود السحابي المباشر */}
        {selectedPlanForPrint && (() => {
          const verificationUrl = getVerificationUrl(selectedPlanForPrint.id);
          const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}`;

          return (
            <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-2 sm:p-4 md:p-8 print:p-0 print:bg-white print:static">
              <div className="w-full max-w-[210mm] flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 print:hidden print-hidden-element shadow-xl">
                <button
                  onClick={() => window.print()}
                  className="text-slate-950 font-black px-6 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                  style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                >
                  <Printer className="w-4 h-4" /> طباعة جدول وعقد التقسيط (A4)
                </button>
                <button onClick={() => setSelectedPlanForPrint(null)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full max-w-[210mm] overflow-x-auto pb-4">
                <div 
                  className="print-paper-sheet min-w-[720px] sm:min-w-0 w-full bg-white text-slate-950 rounded-3xl p-6 sm:p-8 md:p-10 border-2 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-4 font-sans my-auto"
                  style={{ borderColor: primaryCol }}
                >
                  
                  {/* رأس ورقة التقسيط */}
                  {hasLetterhead ? (
                    <div className="w-full border-b pb-3 mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={companySettings.letterhead_url} alt="ترويسة الشركة" className="w-full max-h-32 object-contain" />
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-b-2 pb-3" style={{ borderColor: primaryCol }}>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200">
                          {hasLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                          ) : (
                            <Image src="/logo.png" alt="شركة البرج المتألق" width={58} height={58} className="object-contain" priority />
                          )}
                        </div>
                        <div>
                          <span 
                            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block mb-0.5"
                            style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                          >
                            قسم التجارة العامة • سجل الأقساط
                          </span>
                          <h1 className="text-xl font-black" style={{ color: primaryCol }}>{companySettings.company_name}</h1>
                          <p className="text-xs text-slate-600 font-bold">{companySettings.tagline}</p>
                        </div>
                      </div>
                      <div className="text-left font-mono text-xs">
                        <div 
                          className="border-2 px-3 py-1 font-black rounded-lg inline-block text-white"
                          style={{ backgroundColor: primaryCol, borderColor: primaryCol }}
                        >
                          عقد رقم: {selectedPlanForPrint.id}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">التاريخ: {selectedPlanForPrint.startDate}</p>
                      </div>
                    </div>
                  )}

                  {/* بيانات المشتري والحساب */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                    <div className="space-y-1">
                      <strong className="block border-b border-slate-200 pb-1" style={{ color: primaryCol }}>معلومات المشتري:</strong>
                      <p>الاسم: <strong className="text-slate-950">{selectedPlanForPrint.customerName}</strong></p>
                      <p>الهاتف: <span className="font-mono">{selectedPlanForPrint.customerPhone}</span></p>
                      <p>الهوية / السجل: <span className="font-mono">{selectedPlanForPrint.customerIdCard || '---'}</span></p>
                      <p>العنوان: {selectedPlanForPrint.customerAddress}</p>
                    </div>
                    <div className="space-y-1">
                      <strong className="block border-b border-slate-200 pb-1" style={{ color: primaryCol }}>ملخص الحساب:</strong>
                      <p>المبلغ الإجمالي مع الفائدة: <strong className="font-mono" style={{ color: primaryCol }}>{formatNum(selectedPlanForPrint.totalInstallmentPrice)} د.ع</strong></p>
                      <p>المقدمة المستلمة: <strong className="font-mono text-slate-950">{formatNum(selectedPlanForPrint.downPayment)} د.ع</strong></p>
                      <p>المتبقي بالأقساط: <strong className="font-mono text-rose-700">{formatNum(selectedPlanForPrint.remainingBalance)} د.ع</strong></p>
                      <p>الكفيل الضامن: {selectedPlanForPrint.guarantorName || 'بدون كفيل'} ({selectedPlanForPrint.guarantorPhone || '---'})</p>
                    </div>
                  </div>

                  {/* قائمة المواد والبضائع */}
                  {selectedPlanForPrint.items && selectedPlanForPrint.items.length > 0 && (
                    <div>
                      <strong className="text-xs font-bold block mb-1" style={{ color: primaryCol }}>قائمة المواد والبضائع المدمجة بالعقد:</strong>
                      <div className="border border-slate-300 rounded-xl overflow-hidden">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                            <tr>
                              <th className="p-2">المادة</th>
                              <th className="p-2 text-center">الكمية</th>
                              <th className="p-2">سعر الوحدة</th>
                              <th className="p-2 text-left">الإجمالي النقدي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                            {selectedPlanForPrint.items.map((it: any, iIdx: number) => (
                              <tr key={iIdx}>
                                <td className="p-2 font-sans font-bold text-slate-950">{it.itemName}</td>
                                <td className="p-2 text-center">{it.qty} {it.unit}</td>
                                <td className="p-2">{formatNum(it.price)} د.ع</td>
                                <td className="p-2 text-left font-bold" style={{ color: primaryCol }}>{formatNum(it.total)} د.ع</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* جدول استحقاق الأقساط */}
                  <div>
                    <strong className="text-xs font-bold block mb-1" style={{ color: primaryCol }}>جدول استحقاق الأقساط الشهرية:</strong>
                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs font-mono">
                        <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                          <tr>
                            <th className="p-2 text-center">القسط</th>
                            <th className="p-2">المبلغ المطلوب</th>
                            <th className="p-2">تاريخ الاستحقاق</th>
                            <th className="p-2 text-center">حالة السداد</th>
                            <th className="p-2 text-center">تاريخ السداد / الوصل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {selectedPlanForPrint.installments.map((inst: any) => (
                            <tr key={inst.installmentNumber}>
                              <td className="p-1.5 text-center font-bold">#{inst.installmentNumber}</td>
                              <td className="p-1.5 font-black text-slate-900">{formatNum(inst.amount)} د.ع</td>
                              <td className="p-1.5 text-slate-600">{inst.dueDate}</td>
                              <td className="p-1.5 text-center font-sans">
                                {inst.status === 'PAID' ? (
                                  <span className="text-emerald-700 font-bold">تم السداد ✓</span>
                                ) : (
                                  <span className="font-bold" style={{ color: primaryCol }}>مستحق</span>
                                )}
                              </td>
                              <td className="p-1.5 text-center text-slate-500 text-[10px]">
                                {inst.voucherNo ? `${inst.voucherNo} (${inst.paidAt})` : '---'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* منطقة التواقيع والباركود التوثيقي */}
                  <div className="grid grid-cols-4 gap-4 pt-4 text-center text-xs items-end border-t border-slate-200">
                    <div>
                      <p className="font-bold text-slate-950 text-xs">توقيع المشتري</p>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto mt-6"></div>
                    </div>

                    <div>
                      <p className="font-bold text-slate-950 text-xs">توقيع الكفيل الضامن</p>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto mt-6"></div>
                    </div>

                    {/* الباركود السحابي */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-18 h-18 border border-slate-300 rounded-xl p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={qrCodeApiUrl} 
                          alt="باركود التحقق الإلكتروني وسجل الأقساط" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="font-mono text-[9px] font-bold mt-1 flex items-center gap-0.5" style={{ color: primaryCol }}>
                        <Globe className="w-2.5 h-2.5" /> امسح لسجل الأقساط أونلاين
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-950 text-xs">مصادقة إدارة الشركة</p>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto mt-6"></div>
                    </div>
                  </div>

                  {/* ذيل الورقة */}
                  <div className="text-center text-[10px] text-slate-500 font-semibold border-t border-slate-200 pt-2 flex items-center justify-between font-mono">
                    <span>{companySettings.company_name} - {companySettings.address}</span>
                    <span>هاتف الإدارة: {companySettings.phone_primary} {companySettings.phone_secondary && `| ${companySettings.phone_secondary}`}</span>
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