'use client';

import React, { useEffect, useMemo } from 'react';
import { useBranch } from '@/context/BranchContext';

export default function BranchSwitcher() {
  const { selectedBranchId, setSelectedBranchId, branches } = useBranch();

  // الفروع الرسمية المعتمدة لشركة البرج المتألق
  const defaultBranches = useMemo(() => [
    { branch_id: 'BR-HQ-01', name_ar: 'المقر الرئيسي (النجف الأشرف)', city: 'حي الفرات' },
    { branch_id: 'BR-CONST-02', name_ar: 'فرع المقاولات والمشاريع الهندسية', city: 'النجف الأشرف' },
    { branch_id: 'BR-TRADE-03', name_ar: 'فرع التجارة العامة والمخازن', city: 'النجف الأشرف' },
    { branch_id: 'BR-TRANS-04', name_ar: 'فرع النقل العام واللوجستيات', city: 'النجف الأشرف' },
    { branch_id: 'BR-RE-05', name_ar: 'فرع الاستثمارات والتطوير العقاري', city: 'النجف الأشرف' }
  ], []);

  // دمج الفروع القادمة من الـ API مع القائمة الافتراضية لضمان عدم بقاء القائمة فارغة نهائياً
  const allAvailableBranches = useMemo(() => {
    if (Array.isArray(branches) && branches.length > 0) {
      return branches;
    }
    return defaultBranches;
  }, [branches, defaultBranches]);

  // الحفاظ على الفرع المختار بعد تحديث الصفحة
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rtco_selected_branch_id');
      if (saved && saved !== selectedBranchId) {
        setSelectedBranchId(saved);
      }
    } catch {}
  }, [selectedBranchId, setSelectedBranchId]);

  const handleChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    try {
      localStorage.setItem('rtco_selected_branch_id', newBranchId);
      document.cookie = `rtco_selected_branch_id=${encodeURIComponent(newBranchId)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  return (
    <div className="flex items-center gap-2 bg-[#0c1424] hover:bg-[#101b30] border border-slate-700/80 hover:border-amber-500/50 rounded-2xl px-3 py-1.5 shadow-lg transition duration-200">
      <span className="text-amber-400 text-sm">🏢</span>
      <label className="text-xs text-slate-400 font-bold hidden sm:inline whitespace-nowrap">نطاق العمل:</label>
      <select
        value={selectedBranchId || 'ALL'}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-transparent text-xs font-black text-amber-300 focus:outline-none cursor-pointer py-0.5 dir-rtl"
      >
        <option value="ALL" className="bg-[#0c1424] text-amber-400 font-bold">
          🌐 المقر الرئيسي (عرض المنظومة الموحدة)
        </option>
        {allAvailableBranches
          .filter((b: any) => b.branch_id !== 'ALL')
          .map((b: any) => (
            <option key={b.branch_id} value={b.branch_id} className="bg-[#0c1424] text-slate-100 font-bold">
              📍 {b.name_ar} {b.city ? `(${b.city})` : ''}
            </option>
          ))}
      </select>
    </div>
  );
}