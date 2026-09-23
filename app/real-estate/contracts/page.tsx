'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  ArrowLeft, 
  Printer, 
  Car, 
  Home, 
  Bike, 
  KeyRound, 
  User, 
  Phone, 
  MapPin, 
  Coins, 
  FileCheck, 
  Calendar, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  QrCode, 
  Sparkles, 
  Search, 
  Trash2, 
  Eye, 
  FolderArchive, 
  Award,
  Globe
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

type ContractCategory = 
  | 'CAR_SALE' 
  | 'CAR_RENT' 
  | 'BIKE_SALE' 
  | 'BIKE_RENT' 
  | 'REALESTATE_SALE' 
  | 'REALESTATE_RENT';

// دالة إرسال الإشعار المركزي للمنظومة
async function pushSystemNotification(title: string, message: string, sector: string, link: string) {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_NOTIFICATION',
        title,
        message,
        sector,
        link
      })
    });
  } catch (e) {
    console.error('Failed to dispatch notification', e);
  }
}

// دالة ترحيل ومزامنة العقد مع السيرفر السحابي
async function syncContractToCloud(contract: any) {
  try {
    await fetch('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_CONTRACT', contract })
    });
  } catch (e) {
    console.error('Failed to sync contract to cloud:', e);
  }
}

export default function ElectronicContractsPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ContractCategory>('REALESTATE_SALE');

  const [savedContracts, setSavedContracts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteOrigin, setSiteOrigin] = useState('');

  const [contractNo, setContractNo] = useState(() => `9577${Math.floor(100000 + Math.random() * 900000)}`);
  const [contractDate, setContractDate] = useState(() => new Date().toISOString().substring(0, 10));

  const [sellerName, setSellerName] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerAddress, setSellerAddress] = useState('النجف الأشرف');

  const [buyerName, setBuyerName] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('النجف الأشرف');

  const [vehicleBrand, setVehicleBrand] = useState('كيا سيراتو');
  const [vehicleModel, setVehicleModel] = useState('2023');
  const [vehiclePlate, setVehiclePlate] = useState('12345 / أ / النجف');
  const [vehicleVin, setVehicleVin] = useState('');
  const [vehicleColor, setVehicleColor] = useState('أبيض');

  const [propertyTitle, setPropertyTitle] = useState('دار سكني طابقين بناء حديث');
  const [propertyArea, setPropertyArea] = useState('200');
  const [propertyPlot, setPlotNumber] = useState('قطعة 24 / مقاطعة 4');
  const [propertyLocation, setPropertyLocation] = useState('النجف الأشرف - حي الفرات');

  const [totalAmount, setTotalAmount] = useState('185000000');
  const [paidDeposit, setPaidDeposit] = useState('50000000');
  const [extraConditions, setExtraConditions] = useState(
    '1. أقر الطرف الأول بأنه المالك الشرعي والقانوني وخلو المبيع من أي رهن أو حجز أو إشكال قضائي.\n' +
    '2. عاين الطرف الثاني المبيع المعاينة التامة النافية للجهالة وقبل به بحالته الراهنة.\n' +
    '3. تم الاتفاق برضا واختيار كاملين بين الطرفين أمام الشهود.'
  );

  const [selectedContractForPrint, setSelectedContractForPrint] = useState<any | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteOrigin(window.location.origin);
    }

    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setCurrentUser(u);

        // التحقق من صلاحية الجلسة الحصرية ضد أي تسجيل دخول بجهاز آخر
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

    const storedContracts = localStorage.getItem('rtco_electronic_contracts');
    if (storedContracts) {
      try {
        const parsed = JSON.parse(storedContracts);
        setSavedContracts(parsed);

        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const viewContractNo = urlParams.get('view');
          if (viewContractNo) {
            const found = parsed.find((c: any) => c.contractNo === viewContractNo);
            if (found) {
              setSelectedContractForPrint(found);
              setShowPreviewModal(true);
            }
          }
        }
      } catch {}
    }
  }, []);

  const isSuperAdmin = useMemo(() => {
    return Boolean(currentUser?.is_super_admin || currentUser?.role === 'ADMIN');
  }, [currentUser]);

  const canAdd = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'contracts', 'add'));
  }, [currentUser, isSuperAdmin]);

  const canDelete = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'contracts', 'delete'));
  }, [currentUser, isSuperAdmin]);

  const remainingBalance = Math.max(0, (Number(totalAmount) || 0) - (Number(paidDeposit) || 0));
  const isVehicle = selectedCategory.startsWith('CAR') || selectedCategory.startsWith('BIKE');
  const isRent = selectedCategory.endsWith('RENT');

  const getContractTitle = (cat?: ContractCategory) => {
    const target = cat || selectedCategory;
    switch (target) {
      case 'CAR_SALE': return 'عقد بيع سيارة';
      case 'CAR_RENT': return 'عقد إيجار سيارة';
      case 'BIKE_SALE': return 'عقد بيع دراجة';
      case 'BIKE_RENT': return 'عقد إيجار دراجة';
      case 'REALESTATE_SALE': return 'عقد بيع دار سكني';
      case 'REALESTATE_RENT': return 'عقد إيجار دار سكني';
    }
  };

  const handleSaveAndPrintContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canAdd) {
      alert('ليس لديك صلاحية لإنشاء وإصدار عقود جديدة');
      return;
    }

    const newContractData = {
      id: Date.now().toString(),
      contractNo,
      contractDate,
      category: selectedCategory,
      title: getContractTitle(selectedCategory),
      isVehicle,
      isRent,
      sellerName,
      sellerId,
      sellerPhone,
      sellerAddress,
      buyerName,
      buyerId,
      buyerPhone,
      buyerAddress,
      vehicleBrand,
      vehicleModel,
      vehiclePlate,
      vehicleVin,
      vehicleColor,
      propertyTitle,
      propertyArea,
      propertyPlot,
      propertyLocation,
      totalAmount,
      paidDeposit,
      remainingBalance,
      extraConditions,
      createdAt: new Date().toISOString()
    };

    const updatedList = [newContractData, ...savedContracts];
    setSavedContracts(updatedList);
    localStorage.setItem('rtco_electronic_contracts', JSON.stringify(updatedList));

    // إرسال ومزامنة العقد للسيرفر المركزي لشموله بالنسخ الاحتياطي
    const cloudPayload = {
      id: newContractData.id,
      contractType: newContractData.category,
      contractNumber: newContractData.contractNo,
      contractDate: newContractData.contractDate,
      sellerName: newContractData.sellerName,
      buyerName: newContractData.buyerName,
      itemDescription: isVehicle ? `${newContractData.vehicleBrand} (${newContractData.vehiclePlate})` : `${newContractData.propertyTitle} (${newContractData.propertyPlot})`,
      price: Number(newContractData.totalAmount) || 0,
      paidAmount: Number(newContractData.paidDeposit) || 0,
      remainingAmount: Number(newContractData.remainingBalance) || 0,
      details: newContractData
    };
    await syncContractToCloud(cloudPayload);

    // إرسال إشعار فوري عند إصدار العقد
    await pushSystemNotification(
      `عقد جديد: ${newContractData.title}`,
      `تم إصدار ${newContractData.title} رقم (${newContractData.contractNo}) بين الطرفين (${newContractData.sellerName}) و (${newContractData.buyerName}) بقيمة ${formatNum(newContractData.totalAmount)} د.ع`,
      'CONTRACTS',
      '/real-estate/contracts'
    );

    setSelectedContractForPrint(newContractData);
    setShowPreviewModal(true);

    setContractNo(`9577${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleOpenExistingContract = (contract: any) => {
    setSelectedContractForPrint(contract);
    setShowPreviewModal(true);
  };

  const handleDeleteSavedContract = async (id: string) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية لحذف العقود من الأرشيف');
      return;
    }

    const targetContract = savedContracts.find(c => c.id === id);
    if (!targetContract) return;

    if (!confirm(`هل تريد بالتأكيد حذف ${targetContract.title} رقم (${targetContract.contractNo}) من سجل الأرشيف؟`)) return;

    const updated = savedContracts.filter(c => c.id !== id);
    setSavedContracts(updated);
    localStorage.setItem('rtco_electronic_contracts', JSON.stringify(updated));

    await pushSystemNotification(
      `حذف عقد: ${targetContract.contractNo}`,
      `تم حذف ${targetContract.title} ذي الرقم (${targetContract.contractNo}) الخاص بالطرفين (${targetContract.sellerName}) و (${targetContract.buyerName}) من الأرشيف`,
      'CONTRACTS',
      '/real-estate/contracts'
    );
  };

  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return savedContracts;
    const q = searchQuery.toLowerCase().trim();
    return savedContracts.filter(c => 
      c.contractNo.toLowerCase().includes(q) ||
      c.sellerName.toLowerCase().includes(q) ||
      c.buyerName.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q)
    );
  }, [savedContracts, searchQuery]);

  const getVerificationUrl = (cNo: string) => {
    // تحديد رابط الموقع الحي بدقة سواء محلياً أو على النطاق السحابي
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : (siteOrigin || 'https://rtco.app');
    return `${origin}/real-estate/contracts?view=${encodeURIComponent(cNo)}`;
  };

  return (
    <AuthGuard moduleName="contracts" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0">
        
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body, html {
              background-color: #ffffff !important;
              color: #0f172a !important;
            }
            .print-hidden-element {
              display: none !important;
            }
            .print-paper-sheet {
              box-shadow: none !important;
              border: 2px solid #0f172a !important;
              border-radius: 16px !important;
              padding: 24px !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
          }
        `}</style>

        {/* الترويسة الرئيسية */}
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4 print:hidden print-hidden-element">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative rounded-2xl overflow-hidden bg-slate-900 border border-purple-500/30 flex items-center justify-center shrink-0 p-1 shadow-lg shadow-purple-500/10">
              <Image src="/logo.png" alt="شركة البرج المتألق" width={40} height={40} className="object-contain" priority />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">منظومة العقود الإلكترونية الرسمية</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  أرشيف العقود • باركود تحقق مباشر
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">عقود معتمدة لبيع وإيجار السيارات، الدراجات، والدور السكنية والأملاك</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/real-estate"
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs hover:bg-slate-800 transition text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" /> العودة للعقارات
            </Link>
          </div>
        </div>

        {/* شبكة الكروت البصرية لاختيار العقد */}
        <div className="max-w-5xl mx-auto mt-6 print:hidden print-hidden-element space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">اختر نوع العقد الإلكتروني المراد إنشاؤه:</span>
            <span className="text-[11px] text-amber-400 font-mono font-bold">
              النمط النشط: {getContractTitle()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div 
              onClick={() => {
                setSelectedCategory('CAR_SALE');
                setTotalAmount('24000000');
                setPaidDeposit('10000000');
              }}
              className={`cursor-pointer p-4 rounded-3xl border transition flex flex-col items-center justify-center text-center space-y-2 relative shadow-lg ${
                selectedCategory === 'CAR_SALE'
                  ? 'bg-gradient-to-b from-orange-500/20 via-slate-900 to-slate-950 border-orange-500 shadow-orange-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-14 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-xs font-bold text-white">عقد بيع سيارة</h3>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-orange-300 font-bold">
                إنشاء عقد جديد +
              </span>
            </div>

            <div 
              onClick={() => {
                setSelectedCategory('CAR_RENT');
                setTotalAmount('600000');
                setPaidDeposit('600000');
              }}
              className={`cursor-pointer p-4 rounded-3xl border transition flex flex-col items-center justify-center text-center space-y-2 relative shadow-lg ${
                selectedCategory === 'CAR_RENT'
                  ? 'bg-gradient-to-b from-emerald-500/20 via-slate-900 to-slate-950 border-emerald-500 shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-14 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-white">عقد إيجار سيارة</h3>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-emerald-300 font-bold">
                إنشاء عقد جديد +
              </span>
            </div>

            <div 
              onClick={() => {
                setSelectedCategory('BIKE_SALE');
                setTotalAmount('1800000');
                setPaidDeposit('1800000');
              }}
              className={`cursor-pointer p-4 rounded-3xl border transition flex flex-col items-center justify-center text-center space-y-2 relative shadow-lg ${
                selectedCategory === 'BIKE_SALE'
                  ? 'bg-gradient-to-b from-purple-500/20 via-slate-900 to-slate-950 border-purple-500 shadow-purple-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-14 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Bike className="w-7 h-7" />
              </div>
              <h3 className="text-xs font-bold text-white">عقد بيع دراجة</h3>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-purple-300 font-bold">
                إنشاء عقد جديد +
              </span>
            </div>

            <div 
              onClick={() => {
                setSelectedCategory('BIKE_RENT');
                setTotalAmount('150000');
                setPaidDeposit('150000');
              }}
              className={`cursor-pointer p-4 rounded-3xl border transition flex flex-col items-center justify-center text-center space-y-2 relative shadow-lg ${
                selectedCategory === 'BIKE_RENT'
                  ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-amber-500 shadow-amber-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-14 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Bike className="w-7 h-7" />
              </div>
              <h3 className="text-xs font-bold text-white">عقد إيجار دراجة</h3>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-amber-300 font-bold">
                إنشاء عقد جديد +
              </span>
            </div>

            <div 
              onClick={() => {
                setSelectedCategory('REALESTATE_SALE');
                setTotalAmount('185000000');
                setPaidDeposit('50000000');
              }}
              className={`cursor-pointer p-4 rounded-3xl border transition flex flex-col items-center justify-center text-center space-y-2 relative shadow-lg ${
                selectedCategory === 'REALESTATE_SALE'
                  ? 'bg-gradient-to-b from-blue-500/20 via-slate-900 to-slate-950 border-blue-500 shadow-blue-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-14 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-white">عقد بيع دار سكني</h3>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-blue-300 font-bold">
                إنشاء عقد جديد +
              </span>
            </div>

            <div 
              onClick={() => {
                setSelectedCategory('REALESTATE_RENT');
                setTotalAmount('700000');
                setPaidDeposit('700000');
              }}
              className={`cursor-pointer p-4 rounded-3xl border transition flex flex-col items-center justify-center text-center space-y-2 relative shadow-lg ${
                selectedCategory === 'REALESTATE_RENT'
                  ? 'bg-gradient-to-b from-teal-500/20 via-slate-900 to-slate-950 border-teal-500 shadow-teal-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-14 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-white">عقد إيجار دار سكني</h3>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-teal-300 font-bold">
                إنشاء عقد جديد +
              </span>
            </div>
          </div>
        </div>

        {/* استمارة تحرير العقد */}
        <div className="max-w-5xl mx-auto mt-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 print:hidden print-hidden-element">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              بيانات ومواصفات {getContractTitle()}
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">رقم العقد:</span>
              <span className="font-bold text-amber-400">{contractNo}</span>
            </div>
          </div>

          <form onSubmit={handleSaveAndPrintContract} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">تاريخ تحرير العقد *</label>
                <input
                  type="date"
                  required
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">رقم وثيقة العقد الرسمية</label>
                <input
                  type="text"
                  value={contractNo}
                  onChange={(e) => setContractNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-mono font-bold outline-none"
                />
              </div>
            </div>

            {/* الطرف الأول */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <User className="w-4 h-4" /> الطرف الأول ({isRent ? 'المؤجر' : 'البائع / المالك الشرعي'}) *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="الاسم الثلاثي واللقب"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-bold"
                />
                <input
                  type="text"
                  placeholder="رقم البطاقة الموحدة / الهوية"
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                />
                <input
                  type="text"
                  placeholder="رقم الهاتف"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                />
              </div>
            </div>

            {/* الطرف الثاني */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <User className="w-4 h-4" /> الطرف الثاني ({isRent ? 'المستأجر' : 'المشتري'}) *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="الاسم الثلاثي واللقب"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-bold"
                />
                <input
                  type="text"
                  placeholder="رقم البطاقة الموحدة / الهوية"
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                />
                <input
                  type="text"
                  placeholder="رقم الهاتف"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                />
              </div>
            </div>

            {/* مواصفات المبيع */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                {isVehicle ? <Car className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                مواصفات المبيع المتفق عليه بالتفصيل:
              </span>

              {isVehicle ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">الماركة والنوع *</label>
                    <input
                      type="text"
                      required
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      placeholder="كيا، تويوتا، دوج..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">الموديل / سنة الصنع</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="2023"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">رقم اللوحة والمحافظة *</label>
                    <input
                      type="text"
                      required
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="12345 / نجف"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">رقم الشاصي (VIN)</label>
                    <input
                      type="text"
                      value={vehicleVin}
                      onChange={(e) => setVehicleVin(e.target.value)}
                      placeholder="رقم شاصي الآلية"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">اللون الخارجي</label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      placeholder="أبيض، رصاصي، أسود..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">وصف الدار / العقار *</label>
                    <input
                      type="text"
                      required
                      value={propertyTitle}
                      onChange={(e) => setPropertyTitle(e.target.value)}
                      placeholder="دار سكني طابقين بناء حديث..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">المساحة (م²)</label>
                    <input
                      type="number"
                      value={propertyArea}
                      onChange={(e) => setPropertyArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">رقم القطعة والسند</label>
                    <input
                      type="text"
                      value={propertyPlot}
                      onChange={(e) => setPlotNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">الموقع الجغرافي</label>
                    <input
                      type="text"
                      value={propertyLocation}
                      onChange={(e) => setPropertyLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* المبالغ والتفقيط */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  {isRent ? 'بدل الإيجار الإجمالي (د.ع) *' : 'المبلغ الإجمالي المتفق عليه (د.ع) *'}
                </label>
                <input
                  type="number"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-sm outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {numberToArabicWords(Number(totalAmount) || 0)}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">المبلغ الواصل نقداً / العربون (د.ع)</label>
                <input
                  type="number"
                  value={paidDeposit}
                  onChange={(e) => setPaidDeposit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold text-sm outline-none"
                />
                <span className="text-[11px] text-amber-400 mt-1 block font-mono">
                  المتبقي بذمة المشتري: {formatNum(remainingBalance)} د.ع
                </span>
              </div>
            </div>

            {/* الشروط */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">الشروط والبنود الإضافية:</label>
              <textarea
                rows={3}
                value={extraConditions}
                onChange={(e) => setExtraConditions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> حفظ وإصدار ورقة العقد الرسمية (عقد الشاري A4)
              </button>
            </div>
          </form>
        </div>

        {/* سجل العقود */}
        <div className="max-w-5xl mx-auto mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 print:hidden print-hidden-element">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">سجل وأرشيف العقود الصادرة</h3>
                <p className="text-[11px] text-slate-400">مراجعة العقود، إعادة طباعتها A4، أو حذفها</p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث برقم العقد، البائع، أو المشتري..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">رقم العقد</th>
                  <th className="p-3">نوع العقد</th>
                  <th className="p-3">الطرف الأول (البائع/المؤجر)</th>
                  <th className="p-3">الطرف الثاني (المشتري/المستأجر)</th>
                  <th className="p-3">المبلغ الكلي</th>
                  <th className="p-3">تاريخ التحرير</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                      لا توجد عقود صادرة محفوظة حتى الآن. عند ملء الاستمارة والضغط على حفظ ستظهر هنا تلقائياً.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition font-sans">
                      <td className="p-3 font-mono font-bold text-amber-400">{c.contractNo}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {c.title}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">{c.sellerName || '---'}</td>
                      <td className="p-3 font-bold text-slate-200">{c.buyerName || '---'}</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">{formatNum(c.totalAmount)} د.ع</td>
                      <td className="p-3 text-slate-400 font-mono">{c.contractDate}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenExistingContract(c)}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-lg border border-emerald-500/30 transition shadow flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="إعادة المعاينة والطباعة A4"
                          >
                            <Printer className="w-3.5 h-3.5" /> طباعة
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteSavedContract(c.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/30 transition cursor-pointer"
                              title="حذف من الأرشيف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* نافذة المعاينة والطباعة */}
        {showPreviewModal && selectedContractForPrint && (() => {
          const c = selectedContractForPrint;
          const verificationUrl = getVerificationUrl(c.contractNo);
          const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}`;

          return (
            <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-2 sm:p-4 md:p-8 print:p-0 print:bg-white print:static">
              
              <div className="sticky top-0 z-50 w-full max-w-[210mm] flex items-center justify-between bg-slate-900/95 backdrop-blur-md border border-slate-700 px-5 py-3 rounded-2xl mb-4 sm:mb-6 shadow-2xl print:hidden print-hidden-element">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> طباعة فورية (Print A4)
                  </button>
                  <span className="text-xs text-slate-300 font-bold hidden sm:inline">
                    معاينة ورقة العقد الرسمية A4
                  </span>
                </div>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white p-2 rounded-xl transition border border-slate-700 cursor-pointer"
                  title="إغلاق المعاينة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* حاوية A4 موحدة تمنع تشوه التصميم بين الهواتف والكمبيوتر */}
              <div className="w-full max-w-[210mm] overflow-x-auto pb-4">
                <div className="print-paper-sheet min-w-[650mm] sm:min-w-0 w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 md:p-12 border-2 border-slate-900 shadow-2xl print:border-2 print:border-slate-900 print:shadow-none print:p-0 print:m-0 space-y-5 relative overflow-hidden font-sans my-auto">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] z-0">
                    <Image src="/logo.png" alt="علامة مائية" width={480} height={480} className="object-contain" priority />
                  </div>

                  <div className="h-1.5 w-full bg-gradient-to-r from-slate-950 via-amber-500 to-slate-950 rounded-full"></div>

                  <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-4 text-right">
                      <div className="w-16 h-16 relative flex items-center justify-center p-1.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                        <Image 
                          src="/logo.png" 
                          alt="شعار شركة البرج المتألق" 
                          width={58} 
                          height={58} 
                          className="object-contain" 
                          priority 
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mb-1">
                          جمهورية العراق • شركة معتمدة
                        </span>
                        <h1 className="text-xl font-black text-slate-950 leading-tight">شركة البرج المتألق</h1>
                        <p className="text-[11px] text-slate-600 font-bold">للمقاولات العامة، التجارة، النقل والاستثمار العقاري</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="inline-block bg-gradient-to-l from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-2 rounded-2xl shadow-md">
                        <h2 className="text-lg font-black tracking-wide font-serif">عَـقْـدُ الشَّــارِي</h2>
                        <span className="text-[9px] text-amber-400 font-mono tracking-widest uppercase block mt-0.5">
                          {!c.isRent ? 'OFFICIAL SALE CONTRACT' : 'OFFICIAL LEASE CONTRACT'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-mono text-xs space-y-1">
                      <div className="border border-slate-300 bg-slate-50 px-3 py-1.5 rounded-xl font-black text-slate-950 inline-block text-[11px]">
                        REF: <span className="text-amber-700">{c.contractNo}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans">تاريخ التحرير: <strong className="text-slate-900 font-mono">{c.contractDate}</strong></p>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-950"></span>
                          الطرف الأول ({c.isRent ? 'المؤجر' : 'البائع / المالك الشرعي'})
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">FIRST PARTY</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <p className="text-slate-600">الاسم الكامل: <strong className="text-slate-950 text-xs font-bold font-sans">{c.sellerName || '---'}</strong></p>
                        <p className="text-slate-600">رقم البطاقة الوطنية / الهوية: <strong className="font-sans text-slate-900">{c.sellerId || '---'}</strong></p>
                        <p className="text-slate-600">رقم الهاتف المعتمد: <strong className="font-sans text-slate-900">{c.sellerPhone || '---'}</strong></p>
                        <p className="text-slate-600">العنوان ومحل الإقامة: <span className="text-slate-800 font-sans">{c.sellerAddress}</span></p>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                          الطرف الثاني ({c.isRent ? 'المستأجر' : 'المشتري'})
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">SECOND PARTY</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <p className="text-slate-600">الاسم الكامل: <strong className="text-slate-950 text-xs font-bold font-sans">{c.buyerName || '---'}</strong></p>
                        <p className="text-slate-600">رقم البطاقة الوطنية / الهوية: <strong className="font-sans text-slate-900">{c.buyerId || '---'}</strong></p>
                        <p className="text-slate-600">رقم الهاتف المعتمد: <strong className="font-sans text-slate-900">{c.buyerPhone || '---'}</strong></p>
                        <p className="text-slate-600">العنوان ومحل الإقامة: <span className="text-slate-800 font-sans">{c.buyerAddress}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 border border-slate-200 p-4 rounded-2xl bg-white shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-xs font-bold">
                      <span className="text-slate-950 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        مواصفات المبيع المتفق عليه وتفاصيله الفنية:
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">SPECIFICATIONS</span>
                    </div>

                    {c.isVehicle ? (
                      <div className="grid grid-cols-3 gap-2.5 text-xs pt-1 font-sans">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">الماركة والنوع:</span>
                          <strong className="text-slate-950 text-xs font-bold">{c.vehicleBrand}</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">سنة الصنع / الموديل:</span>
                          <strong className="text-slate-950 text-xs font-bold">{c.vehicleModel}</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">رقم اللوحة والتسجيل:</span>
                          <strong className="text-slate-950 text-xs font-bold">{c.vehiclePlate}</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">اللون الخارجي:</span>
                          <strong className="text-slate-950 text-xs font-bold">{c.vehicleColor}</strong>
                        </div>
                        <div className="col-span-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">رقم الشاصي (VIN):</span>
                          <strong className="text-slate-950 text-xs font-mono uppercase font-bold">{c.vehicleVin || 'غير محدد'}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5 text-xs pt-1 font-sans">
                        <div className="col-span-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">وصف العقار / الدار:</span>
                          <strong className="text-slate-950 text-xs font-bold">{c.propertyTitle}</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">المساحة الإجمالية:</span>
                          <strong className="text-slate-950 text-xs font-bold">{c.propertyArea} م²</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">رقم القطعة والمقاطعة:</span>
                          <strong className="text-slate-950 text-xs font-bold">{c.propertyPlot}</strong>
                        </div>
                        <div className="col-span-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">الموقع الجغرافي:</span>
                          <strong className="text-slate-950 text-xs font-bold">{c.propertyLocation}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 border border-slate-200 p-4 rounded-2xl bg-gradient-to-l from-slate-50 to-white space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-950 font-sans">الثمن والبدل المالي المتفق عليه:</span>
                      <span className="text-sm font-black font-sans text-slate-950 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                        {formatNum(c.totalAmount)} د.ع
                      </span>
                    </div>
                    
                    <p className="text-[11px] font-bold text-slate-800 leading-relaxed font-sans">
                      كتابة وتفقيطاً: <span className="text-amber-800 font-bold">{numberToArabicWords(Number(c.totalAmount) || 0)}</span>
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 font-sans text-xs border-t border-slate-100 text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600">الواصل نقداً ومقبوضاً (العربون):</span>
                        <strong className="text-emerald-700 font-bold font-sans">{formatNum(c.paidDeposit)} د.ع</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600">المتبقي بذمة المشتري:</span>
                        <strong className="text-rose-700 font-bold font-sans">{formatNum(c.remainingBalance)} د.ع</strong>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 border border-slate-200 p-3.5 rounded-2xl bg-slate-50/50 space-y-1 text-[11px] text-slate-600 leading-relaxed font-sans">
                    <strong className="text-slate-950 block text-xs mb-1 font-bold">الشروط والأحكام والالتزامات القانونية:</strong>
                    <p className="whitespace-pre-line text-justify">{c.extraConditions}</p>
                  </div>

                  <div className="relative z-10 grid grid-cols-4 gap-4 pt-4 text-center text-xs items-end border-t border-slate-200">
                    <div>
                      <p className="font-black text-slate-950 text-xs">توقيع الطرف الأول</p>
                      <p className="text-[10px] text-slate-400">({c.isRent ? 'المؤجر' : 'البائع'})</p>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto mt-7"></div>
                    </div>

                    <div>
                      <p className="font-black text-slate-950 text-xs">توقيع الطرف الثاني</p>
                      <p className="text-[10px] text-slate-400">({c.isRent ? 'المستأجر' : 'المشتري'})</p>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto mt-7"></div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="w-18 h-18 border border-slate-300 rounded-xl p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={qrCodeApiUrl} 
                          alt="باركود التحقق الإلكتروني" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="font-mono text-[9px] text-emerald-700 font-bold mt-1 flex items-center gap-0.5">
                        <Globe className="w-2.5 h-2.5" /> امسح للتحقق أونلاين
                      </span>
                    </div>

                    <div>
                      <p className="font-black text-slate-950 text-xs">مصادقة إدارة الشركة</p>
                      <p className="text-[10px] text-slate-400">الختم والتوثيق المعتمد</p>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto mt-7"></div>
                    </div>
                  </div>

                  <div className="relative z-10 text-center text-[10px] text-slate-500 font-semibold border-t border-slate-200 pt-2 flex items-center justify-between">
                    <span>شركة البرج المتألق للمقاولات والتجارة العامة والاستثمار العقاري</span>
                    <span>النجف الأشرف - حي الفرات • هاتف الإدارة: 07868006699</span>
                  </div>

                </div>
              </div>

              <div className="h-10 print:hidden print-hidden-element"></div>

            </div>
          );
        })()}

      </div>
    </AuthGuard>
  );
}