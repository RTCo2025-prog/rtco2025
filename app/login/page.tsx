'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // حفظ بيانات المستخدم وتوكن الجلسة الحصري للجهاز
        localStorage.setItem('erp_user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setErrorMsg(data.error || 'فشل تسجيل الدخول، تأكد من صحة البيانات');
      }
    } catch {
      setErrorMsg('حدث خطأ في الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-cairo">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-slate-950 border border-emerald-500/30 rounded-2xl mx-auto flex items-center justify-center p-2 shadow-lg shadow-emerald-500/10">
            <Image src="/logo.png" alt="شركة البرج المتألق" width={48} height={48} className="object-contain" priority />
          </div>
          <h1 className="text-xl font-black text-white">منظومة شركة البرج المتألق</h1>
          <p className="text-xs text-slate-400">بوابة الدخول الرسمية - الدخول مقيد بالحسابات المعتمدة</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">اسم المستخدم</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="أدخل اسم المستخدم المعتمد..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="أدخل كلمة المرور..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          إنشاء الحسابات وتحديد الصلاحيات يتم حصراً عبر المدير المفوض للشركة.
        </p>
      </div>
    </div>
  );
}