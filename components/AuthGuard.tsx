'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  moduleName?: string; // اسم القسم: fleet, hr, vouchers, contracting, realestate, inventory...
  requiredAction?: 'view' | 'add' | 'edit' | 'delete';
}

/**
 * دالة التحقق من الصلاحيات بناءً على النظام الحديث (system_users و JSONB)
 * مع دعم المرونة للأنماط النصية المباشرة
 */
export function hasPermission(
  user: any,
  moduleName?: string,
  action: 'view' | 'add' | 'edit' | 'delete' = 'view'
): boolean {
  if (!user) return false;
  
  // المدير المفوض أو الحساب الشامل يمتلك كافة الصلاحيات تلقائياً
  if (
    user.is_super_admin || 
    user.username === 'admin' || 
    user.role === 'ADMIN' || 
    user.role === 'SUPER_ADMIN' ||
    user.role === 'admin'
  ) {
    return true;
  }
  
  if (!moduleName) return true;

  const perms = user.permissions || {};

  // التحقق من الصلاحيات إذا كانت مخزنة في صيغة مصفوفة أذونات نصية
  if (Array.isArray(perms)) {
    return perms.includes('all') || perms.includes(moduleName) || perms.includes(`${moduleName}:${action}`);
  }

  // التحقق من الصلاحية الشاملة أو الخاصة بالقسم بناء على هيكل الكائن (JSONB Object)
  if (perms.all && (perms.all === true || perms.all[action])) return true;
  
  if (perms[moduleName]) {
    if (typeof perms[moduleName] === 'boolean') return perms[moduleName];
    if (typeof perms[moduleName] === 'object') return !!perms[moduleName][action];
  }

  return false;
}

export default function AuthGuard({ children, moduleName, requiredAction = 'view' }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifySecureSession = async () => {
      try {
        // التحقق السري والآمن من السيرفر مباشرة (منع التلاعب نهائياً)
        const res = await fetch('/api/auth/verify');
        const data = await res.json();
        
        if (!res.ok || data.valid === false) {
          // إذا كان التوكن مزيفاً، امسح كل شيء واطرد المتلاعب إلى شاشة الدخول
          localStorage.clear();
          if (isMounted) {
            setAuthorized(false);
            window.location.href = '/login';
          }
          return;
        }

        // إذا كان الدخول سليماً 100%، نقوم بمزامنة الواجهة بصمت
        const user = data.user;
        localStorage.setItem('erp_user', JSON.stringify(user));
        
        if (isMounted) {
          if (hasPermission(user, moduleName, requiredAction)) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        }
      } catch (error) {
        localStorage.clear();
        if (isMounted) {
          setAuthorized(false);
          window.location.href = '/login';
        }
      }
    };

    verifySecureSession();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'erp_user') {
        verifySecureSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [moduleName, requiredAction]);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-cairo">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">جاري التحقق الآمن والمشفر...</span>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-cairo text-right">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">غير مصرح لك بالوصول</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            عذراً، لا تمتلك الصلاحية الكافية للدخول إلى هذا القسم ({moduleName || 'هذه الصفحة'}). يرجى مراجعة المدير المفوض لمنحك الصلاحية المحددة.
          </p>
          <div className="flex gap-2 pt-2">
            <Link
              href="/"
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              الرئيسية
            </Link>
            <Link
              href="/login"
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              تبديل الحساب
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}