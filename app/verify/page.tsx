'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Calendar, 
  Building2, 
  AlertCircle, 
  UserCheck, 
  Hash,
  Phone,
  MapPin
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function VerifyContent() {
  const searchParams = useSearchParams();
  const type = searchParams ? searchParams.get('type') || 'doc' : 'doc';
  const no = searchParams ? searchParams.get('no') || '' : '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!no) {
      setError('رقم الوثيقة أو العقد غير محدد في الرابط');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        if (type === 'contract') {
          const res = await fetch('/api/admin/system?action=GET_CONTRACTS', { cache: 'no-store' });
          const json = await res.json();
          if (json.success && Array.isArray(json.contracts)) {
            const found = json.contracts.find((c: any) => c.contractNo === no);
            if (found) {
              setData(found);
            } else {
              setError(`لم يتم العثور على عقد مسجل بالرقم: ${no}`);
            }
          } else {
            setError('تعذر التحقق من سجل العقود السحابي');
          }
        } else {
          const res = await fetch('/api/admin/system?action=GET_OFFICIAL_DOCS', { cache: 'no-store' });
          const json = await res.json();
          if (json.success && Array.isArray(json.documents)) {
            const found = json.documents.find((d: any) => d.docNumber === no);
            if (found) {
              setData(found);
            } else {
              setError(`لم يتم العثور على كتاب رسمي مسجل بالعدد: ${no}`);
            }
          } else {
            setError('تعذر التحقق من سجل الوثائق السحابي');
          }
        }
      } catch {
        setError('حدث خطأ أثناء الاتصال بقاعدة البيانات المركزية');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, no]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-300">جاري التحقق من السجل الرقمي المعتمد...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-white">تعذر إثبات صحة الصدور</h2>
        <p className="text-xs text-rose-300 leading-relaxed font-semibold">{error}</p>
        <p className="text-[11px] text-slate-500">
          يرجى مراجعة إدارة شركة البرج المتألق للتأكد من تسجيل الوثيقة برقمها المعتمد.
        </p>
      </div>
    );
  }

  const isContract = type === 'contract';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-slate-800">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-1">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold">
          وثيقة رسمية معتمدة ومسجلة بالسجل العام
        </span>
        <h2 className="text-lg font-black text-white pt-1">
          {isContract ? data.title : data.subject}
        </h2>
        <p className="text-xs text-slate-400">
          صادرة عن منظومة شركة البرج المتألق للمقاولات والتجارة والاستثمار العقاري
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            {isContract ? 'رقم وثيقة العقد' : 'العدد الإداري'}
          </span>
          <p className="font-mono font-bold text-amber-400 text-sm">
            {isContract ? data.contractNo : data.docNumber}
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            تاريخ التوثيق الرسمي
          </span>
          <p className="font-mono font-bold text-slate-200 text-sm">
            {isContract ? data.contractDate : data.docDate}
          </p>
        </div>

        {isContract ? (
          <>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                الطرف الأول ({data.isRent ? 'المؤجر' : 'البائع'})
              </span>
              <p className="font-bold text-white text-xs">{data.sellerName}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                الطرف الثاني ({data.isRent ? 'المستأجر' : 'المشتري'})
              </span>
              <p className="font-bold text-white text-xs">{data.buyerName}</p>
            </div>

            <div className="sm:col-span-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-bold">المبيع المتفق عليه:</span>
              <p className="font-bold text-amber-300 text-xs">
                {data.isVehicle 
                  ? `${data.vehicleBrand || ''} - موديل ${data.vehicleModel || ''} (${data.vehiclePlate || ''})`
                  : `${data.propertyTitle || ''} - ${data.propertyLocation || ''}`}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="sm:col-span-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                {data.type === 'INCOMING' ? 'من / الجهة الوارد منها' : 'إلى / الجهة المعنية'}
              </span>
              <p className="font-bold text-white text-xs">{data.partyName}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-bold">نوع الوثيقة:</span>
              <p className="font-bold text-amber-400">
                {data.type === 'OUTGOING' ? 'كتاب صادر رسمي' : data.type === 'INCOMING' ? 'كتاب وارد' : 'أمر إداري داخلي'}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] font-bold">المصادقة والتوقيع:</span>
              <p className="font-bold text-white">
                {data.signatoryName || 'إدارة الشركة'} ({data.signatoryTitle || 'المدير المفوض'})
              </p>
            </div>
          </>
        )}
      </div>

      {!isContract && data.mainLetterUrl && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-center">
          <span className="text-xs font-bold text-sky-400 block text-right">نسخة الكتاب المؤرشفة:</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.mainLetterUrl} alt="الكتاب الرسمي" className="max-h-80 mx-auto rounded-xl border border-slate-800 object-contain" />
        </div>
      )}

      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="flex items-center gap-1 font-mono">
          <Phone className="w-3.5 h-3.5 text-slate-400" /> 07868006699
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" /> العراق - النجف الأشرف - حي الفرات
        </span>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 flex flex-col justify-between font-sans">
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center p-1.5 shadow">
            <Image src="/logo.png" alt="البرج المتألق" width={38} height={38} className="object-contain" priority />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">شركة البرج المتألق</h1>
            <p className="text-[10px] text-slate-400">بوابة التحقق الإلكتروني العام من صحة الصدور</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-900 border border-slate-800 text-amber-400 px-2.5 py-1 rounded-full font-mono font-bold">
          E-VERIFY PORTAL
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center py-4">
        <Suspense fallback={<div className="text-xs text-slate-400 text-center">جاري التحميل...</div>}>
          <VerifyContent />
        </Suspense>
      </main>

      <footer className="max-w-xl mx-auto w-full text-center text-[10px] text-slate-600 pt-6">
        جميع الحقوق محفوظة © شركة البرج المتألق للمقاولات والتجارة والاستثمار العقاري {new Date().getFullYear()}
      </footer>
    </div>
  );
}