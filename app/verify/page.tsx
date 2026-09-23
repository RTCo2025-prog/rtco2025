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
  MapPin, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Coins 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const type = searchParams ? searchParams.get('type') || 'doc' : 'doc';
  const no = searchParams ? searchParams.get('no') || '' : '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!no) {
      setError('رقم الوثيقة أو القيد غير محدد في الرابط');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        if (type === 'contract') {
          const res = await fetch('/api/admin/system?action=GET_CONTRACTS', { cache: 'no-store' });
          const json = await res.json();
          if (json.success && Array.isArray(json.contracts)) {
            const found = json.contracts.find((c: any) => c.contractNo === no || c.id === no);
            if (found) {
              setData(found);
            } else {
              setError(`لم يتم العثور على عقد مسجل بالرقم: ${no}`);
            }
          } else {
            setError('تعذر التحقق من سجل العقود السحابي');
          }
        } else if (type === 'installment') {
          const res = await fetch('/api/admin/system?action=GET_INSTALLMENTS', { cache: 'no-store' });
          const json = await res.json();
          if (json.success && Array.isArray(json.installments)) {
            const found = json.installments.find((inst: any) => inst.id === no || inst.customerIdCard === no || inst.customerPhone === no);
            if (found) {
              setData(found);
            } else {
              setError(`لم يتم العثور على خطة تقسيط مسجلة برقم المعرف: ${no}`);
            }
          } else {
            setError('تعذر التحقق من سجل الأقساط السحابي');
          }
        } else {
          const res = await fetch('/api/admin/system?action=GET_OFFICIAL_DOCS', { cache: 'no-store' });
          const json = await res.json();
          if (json.success && Array.isArray(json.documents)) {
            const found = json.documents.find((d: any) => d.docNumber === no || d.id === no);
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
          يرجى مراجعة إدارة شركة البرج المتألق للتأكد من تسجيل البيانات في السجل العام.
        </p>
      </div>
    );
  }

  const isContract = type === 'contract';
  const isInstallment = type === 'installment';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-2xl mx-auto">
      {/* شارة التوثيق الأخضر */}
      <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-slate-800">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-1">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold">
          {isInstallment ? 'خطة بيع بالتقسيط معتمدة ومسجلة بالسجل العام' : 'وثيقة رسمية معتمدة ومسجلة بالسجل العام'}
        </span>
        <h2 className="text-lg font-black text-white pt-1">
          {isInstallment ? `سجل حساب الأقساط: ${data.customerName}` : isContract ? data.title : data.subject}
        </h2>
        <p className="text-xs text-slate-400">
          صادرة عن منظومة شركة البرج المتألق للمقاولات والتجارة والاستثمار العقاري
        </p>
      </div>

      {isInstallment ? (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[11px] block">اسم المشتري:</span>
              <strong className="text-white text-xs font-bold">{data.customerName}</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[11px] block">رقم الهاتف:</span>
              <strong className="text-slate-200 font-mono text-xs">{data.customerPhone || '---'}</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[11px] block">اسم الكفيل الضامن:</span>
              <strong className="text-amber-400 text-xs">{data.guarantorName || 'بدون كفيل'}</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[11px] block mb-1">المبيع / المواد المقسطة:</span>
            <strong className="text-amber-300 text-xs">{data.goodsDescription || 'بضاعة عامة'}</strong>
          </div>

          {/* الكروت المالية الموجزة */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">السعر الكلي</span>
              <strong className="text-xs font-mono text-white font-bold">{formatNum(data.totalInstallmentPrice)} د.ع</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">المقدمة (الواصل)</span>
              <strong className="text-xs font-mono text-emerald-400 font-bold">{formatNum(data.downPayment)} د.ع</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">المسدد من الأقساط</span>
              <strong className="text-xs font-mono text-sky-400 font-bold">{formatNum(data.totalPaid)} د.ع</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">المتبقي الكلي</span>
              <strong className="text-xs font-mono text-rose-400 font-bold">{formatNum(data.remainingBalance)} د.ع</strong>
            </div>
          </div>

          {/* جدول كشف الأقساط وتواريخ السداد */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> كشف الأقساط الشهرية وتواريخ التسديد:
            </span>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">تاريخ الاستحقاق</th>
                    <th className="p-2">مبلغ القسط</th>
                    <th className="p-2 text-center">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {Array.isArray(data.installments) && data.installments.length > 0 ? (
                    data.installments.map((inst: any, idx: number) => {
                      const isPaid = inst.is_paid || inst.status === 'PAID';
                      return (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2 text-slate-300">{inst.due_date || inst.dueDate || '---'}</td>
                          <td className="p-2 text-white font-bold">{formatNum(inst.amount)} د.ع</td>
                          <td className="p-2 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> تم التسديد
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <Clock className="w-3 h-3" /> متبقي بذمة المشتري
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                        تمت جدولة الأقساط بمعدل قسط شهري بقيمة {formatNum(data.monthlyInstallment)} د.ع
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {!isContract && !isInstallment && data.mainLetterUrl && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-center">
          <span className="text-xs font-bold text-sky-400 block text-right">نسخة الكتاب المؤرشفة:</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.mainLetterUrl} alt="الكتاب الرسمي" className="max-h-80 mx-auto rounded-xl border border-slate-800 object-contain" />
        </div>
      )}

      {/* ذيل الصفحة والمعلومات الاتصالية */}
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
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center p-1.5 shadow">
            <Image src="/logo.png" alt="البرج المتألق" width={38} height={38} className="object-contain" priority />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">شركة البرج المتألق</h1>
            <p className="text-[10px] text-slate-400">بوابة التحقق الإلكتروني العام من صحة الصدور والتعاقد</p>
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

      <footer className="max-w-2xl mx-auto w-full text-center text-[10px] text-slate-600 pt-6">
        جميع الحقوق محفوظة © شركة البرج المتألق للمقاولات والتجارة والاستثمار العقاري {new Date().getFullYear()}
      </footer>
    </div>
  );
}