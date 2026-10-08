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
  Edit3,
  Eye, 
  FolderArchive, 
  Award,
  Globe,
  Lock
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';
import { useBranch } from '@/context/BranchContext';

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

async function pushSystemNotification(title: string, message: string, sector: string, link: string) {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sector: sector || 'CONTRACTS',
        action_type: 'ADD',
        title,
        message,
        link
      })
    });
  } catch (e) {
    console.error('Failed to dispatch notification', e);
  }
}

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

function ContractPreviewModal({
  contract,
  companySettings,
  siteOrigin,
  onClose
}: {
  contract: any;
  companySettings: any;
  siteOrigin: string;
  onClose: () => void;
}) {
  const primaryCol = companySettings.primary_color || '#d97706';
  const hasLogo = Boolean(companySettings.logo_url && companySettings.logo_url.trim().length > 10);
  const hasLetterhead = Boolean(companySettings.letterhead_url && companySettings.letterhead_url.trim().length > 10);

  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : (companySettings.website || siteOrigin || 'https://rtco2025.netlify.app');
  const verificationUrl = `${origin}/verify?type=contract&no=${encodeURIComponent(contract.contractNo)}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}`;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-2 sm:p-4 md:p-8 print:p-0 print:bg-white print:static print:overflow-visible print:block print:w-full">
      
      <div className="sticky top-0 z-50 w-full max-w-[210mm] flex items-center justify-between bg-slate-900/95 backdrop-blur-md border border-slate-700 px-5 py-3 rounded-2xl mb-4 sm:mb-6 shadow-2xl print:hidden print-hidden-element">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg cursor-pointer"
            style={{ background: `linear-gradient(90deg, ${primaryCol}, ${companySettings.secondary_color || '#ea580c'})` }}
          >
            <Printer className="w-4 h-4" /> طباعة فورية (Print A4)
          </button>
          <span className="text-xs text-slate-300 font-bold hidden sm:inline">
            معاينة ورقة العقد الرسمية A4
          </span>
        </div>

        <button
          onClick={onClose}
          className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white p-2 rounded-xl transition border border-slate-700 cursor-pointer"
          title="إغلاق المعاينة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-[210mm] overflow-x-auto pb-4 print:pb-0 print:overflow-visible print:max-w-none print:w-full">
        <div 
          className="print-paper-sheet min-w-[720px] sm:min-w-0 print:min-w-0 print:w-full w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 border-2 shadow-2xl print:border-none print:shadow-none print:p-0 print:m-0 space-y-3 print:space-y-2 relative overflow-hidden font-sans my-auto min-h-[1080px] max-h-[1115px] print:min-h-0 flex flex-col justify-between"
          style={{ borderColor: primaryCol }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] z-0">
            {hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={companySettings.logo_url} alt="علامة مائية" width={460} height={460} className="object-contain grayscale" />
            ) : (
              <Image src="/logo.png" alt="علامة مائية" width={460} height={460} className="object-contain grayscale" priority />
            )}
          </div>

          <div className="relative z-10 space-y-3.5 print:space-y-2">
            <div className="h-1.5 w-full rounded-full" style={{ background: `linear-gradient(90deg, #0f172a, ${primaryCol}, #0f172a)` }}></div>

            {/* الهيدر الأصلي المعتمد دون المساس به */}
            {hasLetterhead ? (
              <div className="w-full border-b pb-2 mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={companySettings.letterhead_url} alt="ترويسة الشركة" className="w-full max-h-28 object-contain" />
              </div>
            ) : (
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3.5 text-right">
                  <div className="w-14 h-14 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    {hasLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                    ) : (
                      <Image src="/logo.png" alt="شركة البرج المتألق" width={52} height={52} className="object-contain" priority />
                    )}
                  </div>
                  <div>
                    <span 
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block mb-0.5"
                      style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                    >
                      جمهورية العراق • شركة معتمدة
                    </span>
                    <h1 className="text-lg font-black leading-tight" style={{ color: primaryCol }}>{companySettings.company_name}</h1>
                    <p className="text-[10px] text-slate-600 font-bold">{companySettings.tagline}</p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="inline-block bg-gradient-to-l from-slate-950 via-slate-900 to-slate-950 text-white px-5 py-1.5 rounded-2xl shadow-md">
                    <h2 className="text-base font-black tracking-wide font-serif">عَـقْـدُ الشَّــارِي</h2>
                    <span className="text-[8px] text-amber-400 font-mono tracking-widest uppercase block mt-0.5">
                      {!contract.isRent ? 'OFFICIAL SALE CONTRACT' : 'OFFICIAL LEASE CONTRACT'}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono text-xs space-y-0.5">
                  <div className="border border-slate-300 bg-slate-50 px-2.5 py-1 rounded-xl font-black text-slate-950 inline-block text-[10px]">
                    REF: <span style={{ color: primaryCol }}>{contract.contractNo}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans">تاريخ التحرير: <strong className="text-slate-900 font-mono">{contract.contractDate}</strong></p>
                </div>
              </div>
            )}

            {/* شريط التوثيق والفرع تحت الهيدر مباشرة: في اليمين العدد، في المنتصف اسم الفرع فقط مأطر، وفي اليسار التاريخ */}
            <div className="flex items-center justify-between bg-slate-100/90 border border-slate-300 rounded-xl px-4 py-1.5 font-cairo shadow-xs text-xs font-bold text-slate-800">
              {/* اليمين: العدد ورقم العقد */}
              <div className="flex items-center gap-1.5" dir="rtl">
                <span className="text-slate-500 font-bold">العدد :</span>
                <span className="font-mono text-slate-950 text-sm tracking-wide">
                  ع/ {contract.contractNo} / 2026
                </span>
              </div>

              {/* المنتصف: اسم الفرع فقط مأطر بمفرده بدون أي إضافات */}
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center px-4 py-0.5 rounded-lg bg-white border border-amber-600/60 text-slate-950 font-black text-xs shadow-xs">
                  {contract.branch_name || 'فرع الاستثمارات العقارية'}
                </span>
              </div>

              {/* اليسار: التاريخ */}
              <div className="flex items-center gap-1.5" dir="rtl">
                <span className="text-slate-500 font-bold">التاريخ :</span>
                <span className="font-mono text-slate-950 text-sm tracking-wider">{contract.contractDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-200 p-2.5 rounded-2xl bg-slate-50/70 space-y-1 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-950"></span>
                    الطرف الأول ({contract.isRent ? 'المؤجر' : 'البائع / المالك الشرعي'})
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">FIRST PARTY</span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <p className="text-slate-600">الاسم الكامل: <strong className="text-slate-950 font-bold font-sans">{contract.sellerName || '---'}</strong></p>
                  <p className="text-slate-600">رقم البطاقة الوطنية / الهوية: <strong className="font-sans text-slate-900">{contract.sellerId || '---'}</strong></p>
                  <p className="text-slate-600">رقم الهاتف المعتمد: <strong className="font-sans text-slate-900">{contract.sellerPhone || '---'}</strong></p>
                  <p className="text-slate-600">العنوان ومحل الإقامة: <span className="text-slate-800 font-sans">{contract.sellerAddress}</span></p>
                </div>
              </div>

              <div className="border border-slate-200 p-2.5 rounded-2xl bg-slate-50/70 space-y-1 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryCol }}></span>
                    الطرف الثاني ({contract.isRent ? 'المستأجر' : 'المشتري'})
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">SECOND PARTY</span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <p className="text-slate-600">الاسم الكامل: <strong className="text-slate-950 font-bold font-sans">{contract.buyerName || '---'}</strong></p>
                  <p className="text-slate-600">رقم البطاقة الوطنية / الهوية: <strong className="font-sans text-slate-900">{contract.buyerId || '---'}</strong></p>
                  <p className="text-slate-600">رقم الهاتف المعتمد: <strong className="font-sans text-slate-900">{contract.buyerPhone || '---'}</strong></p>
                  <p className="text-slate-600">العنوان ومحل الإقامة: <span className="text-slate-800 font-sans">{contract.buyerAddress}</span></p>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 p-3 rounded-2xl bg-white shadow-sm space-y-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 text-xs font-bold">
                <span className="text-slate-950 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" style={{ color: primaryCol }} />
                  مواصفات المبيع المتفق عليه وتفاصيله الفنية:
                </span>
                <span className="text-[9px] text-slate-400 font-mono">SPECIFICATIONS</span>
              </div>

              {contract.isVehicle ? (
                <div className="grid grid-cols-3 gap-2 text-xs pt-0.5 font-sans">
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">الماركة والنوع:</span>
                    <strong className="text-slate-950 text-xs font-bold">{contract.vehicleBrand}</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">سنة الصنع / الموديل:</span>
                    <strong className="text-slate-950 text-xs font-bold">{contract.vehicleModel}</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">رقم اللوحة والتسجيل:</span>
                    <strong className="text-slate-950 text-xs font-bold">{contract.vehiclePlate}</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">اللون الخارجي:</span>
                    <strong className="text-slate-950 text-xs font-bold">{contract.vehicleColor}</strong>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">رقم الشاصي (VIN):</span>
                    <strong className="text-slate-950 text-xs font-mono uppercase font-bold">{contract.vehicleVin || 'غير محدد'}</strong>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-xs pt-0.5 font-sans">
                  <div className="col-span-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">وصف العقار / الدار:</span>
                    <strong className="text-slate-950 text-xs font-bold">{contract.propertyTitle}</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">المساحة الإجمالية:</span>
                    <strong className="text-slate-950 text-xs font-bold">{contract.propertyArea} م²</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">رقم القطعة والمقاطعة:</span>
                    <strong className="text-slate-950 text-xs font-bold">{contract.propertyPlot}</strong>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-500 block">الموقع الجغرافي:</span>
                    <strong className="text-slate-950 text-xs font-bold">{contract.propertyLocation}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 p-3 rounded-2xl bg-gradient-to-l from-slate-50 to-white space-y-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-xs font-bold text-slate-950 font-sans">الثمن والبدل المالي المتفق عليه:</span>
                <span className="text-xs font-black font-sans text-slate-950 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-sm">
                  {formatNum(contract.totalAmount)} د.ع
                </span>
              </div>
              
              <p className="text-[10px] font-bold text-slate-800 leading-snug font-sans">
                كتابة وتفقيطاً: <span className="font-bold" style={{ color: primaryCol }}>{numberToArabicWords(Number(contract.totalAmount) || 0)}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-3 pt-1 font-sans text-xs border-t border-slate-100 text-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 text-[11px]">الواصل نقداً (العربون):</span>
                  <strong className="text-emerald-700 font-bold font-sans text-xs">{formatNum(contract.paidDeposit)} د.ع</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 text-[11px]">المتبقي بذمة المشتري:</span>
                  <strong className="text-rose-700 font-bold font-sans text-xs">{formatNum(contract.remainingBalance)} د.ع</strong>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 p-2.5 rounded-2xl bg-slate-50/50 space-y-0.5 text-[10px] text-slate-600 leading-relaxed font-sans">
              <strong className="text-slate-950 block text-[11px] mb-0.5 font-bold">الشروط والأحكام والالتزامات القانونية:</strong>
              <p className="whitespace-pre-line text-justify">{contract.extraConditions}</p>
            </div>
          </div>

          <div className="relative z-10 pt-1 space-y-2">
            <div className="grid grid-cols-4 gap-3 text-center text-xs items-end border-t border-slate-200 pt-2.5">
              <div>
                <p className="font-black text-slate-950 text-xs">توقيع الطرف الأول</p>
                <p className="text-[9px] text-slate-400">({contract.isRent ? 'المؤجر' : 'البائع'})</p>
                <div className="border-b-2 border-dashed border-slate-400 w-20 mx-auto mt-5"></div>
              </div>

              <div>
                <p className="font-black text-slate-950 text-xs">توقيع الطرف الثاني</p>
                <p className="text-[9px] text-slate-400">({contract.isRent ? 'المستأجر' : 'المشتري'})</p>
                <div className="border-b-2 border-dashed border-slate-400 w-20 mx-auto mt-5"></div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-13 h-13 border border-slate-300 rounded-xl p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={qrCodeApiUrl} 
                    alt="باركود التحقق الإلكتروني" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-mono text-[8px] font-bold mt-0.5 flex items-center gap-0.5" style={{ color: primaryCol }}>
                  <Globe className="w-2.5 h-2.5" /> تحقق رسمي
                </span>
              </div>

              <div>
                <p className="font-black text-slate-950 text-xs">مصادقة إدارة الشركة</p>
                <p className="text-[9px] text-slate-400">الختم والتوثيق المعتمد</p>
                <div className="border-b-2 border-dashed border-slate-400 w-20 mx-auto mt-5"></div>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-500 font-semibold border-t border-slate-200 pt-1.5 flex items-center justify-between font-mono">
              <span>{companySettings.company_name} - {companySettings.address}</span>
              <span>هاتف: {companySettings.phone_primary} {companySettings.phone_secondary && `| ${companySettings.phone_secondary}`}</span>
            </div>
          </div>

        </div>
      </div>

      <div className="h-10 print:hidden print-hidden-element"></div>

    </div>
  );
}

export default function ElectronicContractsPage() {
  const { selectedBranchId, branches } = useBranch();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    tagline: 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    phone_primary: '07868006699',
    phone_secondary: '07738006699',
    email: '',
    website: '',
    address: 'العراق - النجف الأشرف - حي الفرات',
    logo_url: '',
    letterhead_url: '',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  const [selectedCategory, setSelectedCategory] = useState<ContractCategory>('REALESTATE_SALE');

  const [savedContracts, setSavedContracts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteOrigin, setSiteOrigin] = useState('');

  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [contractBranchId, setContractBranchId] = useState<string>('BR-HQ-01');

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

  const isRestrictedBranch = useMemo(() => {
    return Boolean(
      currentUser && 
      !currentUser.is_super_admin && 
      currentUser.role !== 'ADMIN' && 
      currentUser.username !== 'admin' && 
      currentUser.assigned_branch_id && 
      currentUser.assigned_branch_id !== 'ALL'
    );
  }, [currentUser]);

  const resolveBranchName = (bId?: string): string => {
    if (!bId || bId === 'ALL' || bId === 'BR-HQ-01') {
      return 'المقر الرئيسي (النجف الأشرف)';
    }
    const cleanId = String(bId).trim().toUpperCase();
    if (cleanId === 'TRD-01' || cleanId === 'BR-TRADE-03' || cleanId.includes('TRD') || cleanId.includes('TRADE')) {
      return 'فرع التجارة العامة';
    }
    if (cleanId === 'CNT-01' || cleanId === 'BR-CONST-02' || cleanId.includes('CNT') || cleanId.includes('CONST')) {
      return 'فرع المقاولات العامة';
    }
    if (cleanId === 'FLT-01' || cleanId === 'BR-TRANS-04' || cleanId.includes('FLT') || cleanId.includes('TRANS')) {
      return 'فرع النقل العام';
    }
    if (cleanId === 'EST-01' || cleanId === 'BR-RE-05' || cleanId.includes('EST') || cleanId.includes('RE')) {
      return 'فرع الاستثمارات العقارية';
    }
    if (cleanId === 'STR-01' || cleanId.includes('STR') || cleanId.includes('WAREHOUSE')) {
      return 'فرع المخازن';
    }
    if (cleanId === 'HQ-01' || cleanId === 'BR-HQ-01') {
      return 'المقر الرئيسي';
    }

    const found = (branches || []).find((b: any) => 
      String(b.branch_id).trim().toUpperCase() === cleanId || 
      String(b.branch_code).trim().toUpperCase() === cleanId
    );
    return found?.name_ar || `فرع ${bId}`;
  };

  const currentActiveBranchName = useMemo(() => {
    if (isRestrictedBranch && currentUser?.assigned_branch_id) {
      return resolveBranchName(currentUser.assigned_branch_id);
    }
    return resolveBranchName(selectedBranchId);
  }, [selectedBranchId, branches, isRestrictedBranch, currentUser]);

  useEffect(() => {
    if (isRestrictedBranch && currentUser?.assigned_branch_id) {
      setContractBranchId(currentUser.assigned_branch_id);
    } else {
      const active = selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : 'EST-01';
      setContractBranchId(active);
    }
  }, [selectedBranchId, isRestrictedBranch, currentUser]);

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

  const loadContractsData = async () => {
    let localContracts: any[] = [];
    const storedContracts = localStorage.getItem('rtco_electronic_contracts');
    if (storedContracts) {
      try {
        localContracts = JSON.parse(storedContracts);
      } catch {}
    }

    try {
      const res = await fetch(`/api/admin/system?action=GET_CONTRACTS`, { cache: 'no-store' });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.contracts)) {
        const mergedContracts = data.contracts.map((remoteContract: any) => {
          const match = localContracts.find((lc) => lc.id === remoteContract.id || lc.contractNo === remoteContract.contractNo);
          const bId = remoteContract.branch_id || remoteContract.branchId || match?.branch_id || match?.branchId || 'EST-01';
          return {
            ...remoteContract,
            branch_id: bId,
            branch_name: resolveBranchName(bId)
          };
        });

        localContracts.forEach((lc) => {
          if (!mergedContracts.some((mc: any) => mc.id === lc.id)) {
            const bId = lc.branch_id || lc.branchId || 'EST-01';
            mergedContracts.unshift({
              ...lc,
              branch_id: bId,
              branch_name: resolveBranchName(bId)
            });
          }
        });

        setSavedContracts(mergedContracts);
        localStorage.setItem('rtco_electronic_contracts', JSON.stringify(mergedContracts));
      } else {
        setSavedContracts(localContracts);
      }
    } catch {
      setSavedContracts(localContracts);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteOrigin(window.location.origin);
    }

    loadSettings();
    loadContractsData();

    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setCurrentUser(u);

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
  }, []);

  const isSuperAdmin = useMemo(() => {
    return Boolean(currentUser?.is_super_admin || currentUser?.role === 'ADMIN');
  }, [currentUser]);

  const canAdd = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'contracts', 'add'));
  }, [currentUser, isSuperAdmin]);

  const canEdit = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'contracts', 'edit'));
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

  const handleEditContract = (contract: any) => {
    if (!canEdit) {
      alert('ليس لديك صلاحية لتعديل العقود المحفوظة.');
      return;
    }
    setEditingContractId(contract.id);
    setSelectedCategory(contract.category || 'REALESTATE_SALE');
    setContractBranchId(contract.branch_id || (isRestrictedBranch ? currentUser.assigned_branch_id : 'EST-01'));
    setContractNo(contract.contractNo || '');
    setContractDate(contract.contractDate || new Date().toISOString().substring(0, 10));

    setSellerName(contract.sellerName || '');
    setSellerId(contract.sellerId || '');
    setSellerPhone(contract.sellerPhone || '');
    setSellerAddress(contract.sellerAddress || 'النجف الأشرف');

    setBuyerName(contract.buyerName || '');
    setBuyerId(contract.buyerId || '');
    setBuyerPhone(contract.buyerPhone || '');
    setBuyerAddress(contract.buyerAddress || 'النجف الأشرف');

    setVehicleBrand(contract.vehicleBrand || 'كيا سيراتو');
    setVehicleModel(contract.vehicleModel || '2023');
    setVehiclePlate(contract.vehiclePlate || '');
    setVehicleVin(contract.vehicleVin || '');
    setVehicleColor(contract.vehicleColor || 'أبيض');

    setPropertyTitle(contract.propertyTitle || 'دار سكني طابقين بناء حديث');
    setPropertyArea(contract.propertyArea || '200');
    setPlotNumber(contract.propertyPlot || '');
    setPropertyLocation(contract.propertyLocation || 'النجف الأشرف - حي الفرات');

    setTotalAmount(String(contract.totalAmount || '0'));
    setPaidDeposit(String(contract.paidDeposit || '0'));
    setExtraConditions(contract.extraConditions || '');

    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSaveAndPrintContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingContractId && !canAdd) {
      alert('ليس لديك صلاحية لإنشاء وإصدار عقود جديدة');
      return;
    }
    if (editingContractId && !canEdit) {
      alert('ليس لديك صلاحية لتعديل العقود');
      return;
    }

    let assignedBranchId = contractBranchId;
    if (isRestrictedBranch && currentUser?.assigned_branch_id) {
      assignedBranchId = currentUser.assigned_branch_id;
    } else if (!assignedBranchId || assignedBranchId === 'ALL') {
      assignedBranchId = selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : 'EST-01';
    }

    const assignedBranchName = resolveBranchName(assignedBranchId);

    const contractPayload = {
      id: editingContractId || Date.now().toString(),
      branch_id: assignedBranchId,
      branch_name: assignedBranchName,
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
      createdAt: editingContractId 
        ? (savedContracts.find(c => c.id === editingContractId)?.createdAt || new Date().toISOString())
        : new Date().toISOString()
    };

    const updatedList = editingContractId
      ? savedContracts.map(c => c.id === editingContractId ? contractPayload : c)
      : [contractPayload, ...savedContracts];

    setSavedContracts(updatedList);
    localStorage.setItem('rtco_electronic_contracts', JSON.stringify(updatedList));

    const cloudPayload = {
      id: contractPayload.id,
      branch_id: assignedBranchId,
      contractType: contractPayload.category,
      contractNumber: contractPayload.contractNo,
      contractDate: contractPayload.contractDate,
      sellerName: contractPayload.sellerName,
      buyerName: contractPayload.buyerName,
      itemDescription: isVehicle ? `${contractPayload.vehicleBrand} (${contractPayload.vehiclePlate})` : `${contractPayload.propertyTitle} (${contractPayload.propertyPlot})`,
      price: Number(contractPayload.totalAmount) || 0,
      paidAmount: Number(contractPayload.paidDeposit) || 0,
      remainingAmount: Number(contractPayload.remainingBalance) || 0,
      details: contractPayload
    };
    await syncContractToCloud(cloudPayload);

    await pushSystemNotification(
      `${editingContractId ? 'تعديل' : 'إصدار'} ${contractPayload.title}: ${contractPayload.contractNo}`,
      `تم ${editingContractId ? 'تعديل' : 'توثيق'} ${contractPayload.title} ذي الرقم (${contractPayload.contractNo}) في فرع (${contractPayload.branch_name}) بين الطرفين (${contractPayload.sellerName}) و (${contractPayload.buyerName}) بقيمة ${formatNum(contractPayload.totalAmount)} د.ع`,
      'CONTRACTS',
      '/real-estate/contracts'
    );

    setSelectedContractForPrint(contractPayload);
    setShowPreviewModal(true);

    setEditingContractId(null);
    setContractNo(`9577${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleOpenExistingContract = async (contract: any) => {
    await loadSettings();
    setSelectedContractForPrint({
      ...contract,
      branch_name: resolveBranchName(contract.branch_id || contract.branchId)
    });
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

    try {
      await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_CONTRACT', contractId: id })
      });
    } catch {}

    await pushSystemNotification(
      `حذف عقد من الأرشيف: ${targetContract.contractNo}`,
      `تم حذف ${targetContract.title} رقم (${targetContract.contractNo}) الخاص بالطرفين (${targetContract.sellerName}) و (${targetContract.buyerName})`,
      'CONTRACTS',
      '/real-estate/contracts'
    );
  };

  const filteredContracts = useMemo(() => {
    let list = savedContracts;
    
    if (isRestrictedBranch && currentUser?.assigned_branch_id) {
      const assignedId = String(currentUser.assigned_branch_id).trim().toUpperCase();
      const assignedName = resolveBranchName(assignedId).trim();
      list = list.filter(c => {
        const cBId = String(c.branch_id || '').trim().toUpperCase();
        const cBName = String(c.branch_name || '').trim();
        return cBId === assignedId || (cBName && cBName.includes(assignedName));
      });
    } else if (selectedBranchId && selectedBranchId !== 'ALL') {
      const activeBId = String(selectedBranchId).trim().toUpperCase();
      const activeBName = currentActiveBranchName.trim();

      list = list.filter(c => {
        const cBId = String(c.branch_id || '').trim().toUpperCase();
        const cBName = String(c.branch_name || '').trim();

        return (
          cBId === activeBId ||
          (cBName && cBName.includes(activeBName)) ||
          (cBName && cBName.includes(activeBId))
        );
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(c => 
      c.contractNo.toLowerCase().includes(q) ||
      c.sellerName.toLowerCase().includes(q) ||
      c.buyerName.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q)
    );
  }, [savedContracts, searchQuery, selectedBranchId, currentActiveBranchName, isRestrictedBranch, currentUser]);

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';

  return (
    <AuthGuard moduleName="contracts" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0">
        
        <style jsx global>{`
          @media screen and (max-width: 768px) {
            .print-paper-sheet {
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
              width: 100% !important;
              height: auto !important;
            }
            header, nav, aside, .print-hidden-element, div[class*="backdrop-blur"], div[class*="fixed inset-0 bg-black/90"] > div:first-child {
              display: none !important;
              visibility: hidden !important;
            }
            .print-paper-sheet {
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: 210mm !important;
              height: 282mm !important;
              max-height: 282mm !important;
              min-height: 0 !important;
              padding: 6mm 10mm !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: auto !important;
              break-after: auto !important;
            }
          }
        `}</style>

        {/* الترويسة الرئيسية */}
        <div className="max-w-5xl mx-auto pb-6 border-b border-slate-800/80 print:hidden print-hidden-element">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
            
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 p-3 rounded-2xl text-slate-950 font-black shadow-xl shrink-0 flex items-center justify-center transition-all"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryCol}, ${secondaryCol})`,
                  boxShadow: `0 10px 25px -5px ${primaryCol}40`
                }}
              >
                <Image src="/logo.png" alt={companySettings.company_name} width={48} height={48} className="object-contain" priority />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                    منظومة العقود الإلكترونية الرسمية
                  </h1>
                  <span 
                    className="inline-flex items-center gap-1.5 border text-[11px] font-bold px-3 py-0.5 rounded-full shadow-inner font-mono"
                    style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                  >
                    <Sparkles className="w-3 3-3" />
                    أرشيف العقود • باركود تحقق مباشر
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {companySettings.company_name} • نطاق العرض: <strong className="text-amber-400">{currentActiveBranchName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap self-end sm:self-auto">
              <Link
                href="/real-estate"
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" /> العقارات
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

        {/* شبكة الكروت البصرية لاختيار العقد */}
        <div className="max-w-5xl mx-auto mt-6 print:hidden print-hidden-element space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">اختر نوع العقد الإلكتروني المراد إنشاؤه:</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: primaryCol }}>
              النمط النشط: {getContractTitle()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div 
              onClick={() => {
                setEditingContractId(null);
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
                setEditingContractId(null);
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
                setEditingContractId(null);
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
                setEditingContractId(null);
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
                setEditingContractId(null);
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
                setEditingContractId(null);
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

        {/* استمارة تحرير / تعديل العقد */}
        <div className="max-w-5xl mx-auto mt-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 print:hidden print-hidden-element">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4" style={{ color: primaryCol }} />
              {editingContractId ? `تعديل بيانات ${getContractTitle()}` : `بيانات ومواصفات ${getContractTitle()}`}
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">رقم العقد:</span>
              <span className="font-bold" style={{ color: primaryCol }}>{contractNo}</span>
              {editingContractId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingContractId(null);
                    setContractNo(`9577${Math.floor(100000 + Math.random() * 900000)}`);
                  }}
                  className="mr-3 px-2 py-0.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg border border-rose-500/30 transition text-[10px]"
                >
                  إلغاء التعديل ✕
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveAndPrintContract} className="space-y-4 text-xs">
            {/* اختيار وتثبيت الفرع صراحة */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30">
              <label className="block text-amber-400 mb-1 font-bold">الفرع الصادر منه العقد رسمياً *</label>
              {isRestrictedBranch ? (
                <div className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-2.5 text-amber-300 font-bold flex items-center justify-between">
                  <span>📍 {currentActiveBranchName}</span>
                  <span className="text-[10px] bg-slate-950 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                    <Lock className="w-2.5 h-2.5 text-amber-400" /> مقيد
                  </span>
                </div>
              ) : (
                <select
                  value={contractBranchId}
                  onChange={(e) => setContractBranchId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold outline-none cursor-pointer"
                >
                  <option value="EST-01">فرع الاستثمارات العقارية (النجف الأشرف)</option>
                  <option value="CNT-01">فرع المقاولات العامة (النجف الأشرف)</option>
                  <option value="FLT-01">فرع النقل العام (النجف الأشرف)</option>
                  <option value="TRD-01">فرع التجارة العامة (النجف الأشرف)</option>
                  <option value="STR-01">فرع المخازن (النجف الأشرف)</option>
                  <option value="HQ-01">المقر الرئيسي (النجف الأشرف)</option>
                </select>
              )}
            </div>

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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono font-bold outline-none"
                  style={{ color: primaryCol }}
                />
              </div>
            </div>

            {/* الطرف الأول */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: primaryCol }}>
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
                    <label className="block text-slate-400 mb-1">رقم اللوحة والتسجيل *</label>
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
                <span className="text-[11px] mt-1 block font-mono" style={{ color: primaryCol }}>
                  المتبقي بذمة المشتري: {formatNum(remainingBalance)} د.ع
                </span>
              </div>
            </div>

            {/* الشروط */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">الشروط والأحكام والالتزامات القانونية:</label>
              <textarea
                rows={3}
                value={extraConditions}
                onChange={(e) => setExtraConditions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              {editingContractId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingContractId(null);
                    setContractNo(`9577${Math.floor(100000 + Math.random() * 900000)}`);
                  }}
                  className="px-6 py-3 bg-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-bold cursor-pointer transition"
                >
                  إلغاء التعديل
                </button>
              )}
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
                style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
              >
                <Printer className="w-4 h-4" /> {editingContractId ? 'حفظ تعديلات العقد وإعادة الطباعة A4' : 'حفظ وإصدار ورقة العقد الرسمية (عقد الشاري A4)'}
              </button>
            </div>
          </form>
        </div>

        {/* سجل العقود والأرشيف */}
        <div className="max-w-5xl mx-auto mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 print:hidden print-hidden-element">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">سجل وأرشيف العقود الصادرة</h3>
                <p className="text-[11px] text-slate-400">مراجعة العقود، تعديلها، إعادة طباعتها A4، أو حذفها</p>
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
                      لا توجد عقود مسجلة لهذا الفرع حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c) => {
                    const cBranchDisplay = c.branch_name || resolveBranchName(c.branch_id);

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition font-sans">
                        <td className="p-3 font-mono font-bold" style={{ color: primaryCol }}>{c.contractNo}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {c.title}
                          </span>
                          <span className="block text-[9px] text-amber-400 font-normal mt-0.5">
                            ({cBranchDisplay})
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
                              title="معاينة وطباعة العقد A4"
                            >
                              <Printer className="w-3.5 h-3.5" /> طباعة
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => handleEditContract(c)}
                                className="p-1.5 bg-sky-500/10 hover:bg-sky-600 text-sky-400 hover:text-white rounded-lg border border-sky-500/30 transition cursor-pointer"
                                title="تعديل بيانات العقد"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showPreviewModal && selectedContractForPrint && (
          <ContractPreviewModal
            contract={selectedContractForPrint}
            companySettings={companySettings}
            siteOrigin={siteOrigin}
            onClose={() => setShowPreviewModal(false)}
          />
        )}

      </div>
    </AuthGuard>
  );
}