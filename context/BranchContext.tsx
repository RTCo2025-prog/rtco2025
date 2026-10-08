'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export interface BranchInfo {
  branch_id: string;
  branch_code?: string;
  name_ar: string;
  city?: string;
}

interface BranchContextType {
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  branches: BranchInfo[];
  currentBranch: BranchInfo | null;
  refreshBranches: () => Promise<void>;
  isBranchRestricted: boolean;
}

const BranchContext = createContext<BranchContextType>({
  selectedBranchId: 'ALL',
  setSelectedBranchId: () => {},
  branches: [],
  currentBranch: null,
  refreshBranches: async () => {},
  isBranchRestricted: false
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranchId, setSelectedBranchIdState] = useState<string>('ALL');
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [isBranchRestricted, setIsBranchRestricted] = useState<boolean>(false);

  const fallbackBranches: BranchInfo[] = useMemo(() => [
    { branch_id: 'BR-HQ-01', branch_code: 'HQ-01', name_ar: 'المقر الرئيسي (النجف الأشرف)', city: 'حي الفرات' },
    { branch_id: 'BR-CONST-02', branch_code: 'CONST-02', name_ar: 'فرع المقاولات والمشاريع الهندسية', city: 'النجف الأشرف' },
    { branch_id: 'BR-TRADE-03', branch_code: 'TRADE-03', name_ar: 'فرع التجارة العامة والمخازن', city: 'النجف الأشرف' },
    { branch_id: 'BR-TRANS-04', branch_code: 'TRANS-04', name_ar: 'فرع النقل العام واللوجستيات', city: 'النجف الأشرف' },
    { branch_id: 'BR-RE-05', branch_code: 'RE-05', name_ar: 'فرع الاستثمارات والتطوير العقاري', city: 'النجف الأشرف' }
  ], []);

  // دالة حاسمة لفحص وتطبيق قيد المستخدم فوراً
  const applyUserRestriction = useCallback((): string | null => {
    try {
      const raw = localStorage.getItem('erp_user');
      if (raw) {
        const u = JSON.parse(raw);
        const isSuper = Boolean(u.is_super_admin || u.role === 'ADMIN' || u.username === 'admin');
        const assigned = u.assigned_branch_id;

        if (!isSuper && assigned && assigned !== 'ALL') {
          setIsBranchRestricted(true);
          setSelectedBranchIdState(assigned);
          localStorage.setItem('rtco_selected_branch_id', assigned);
          localStorage.setItem('active_branch_id', assigned);
          document.cookie = `rtco_selected_branch_id=${encodeURIComponent(assigned)}; path=/; max-age=31536000; SameSite=Lax`;
          return assigned;
        }
      }
    } catch {}
    setIsBranchRestricted(false);
    return null;
  }, []);

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.branches) && data.branches.length > 0) {
        setBranches(data.branches);
        return;
      }
    } catch {
    }
    setBranches(fallbackBranches);
  };

  useEffect(() => {
    // 1. تطبيق القيد أولاً لمنع الرجوع للمقر الرئيسي
    const forced = applyUserRestriction();

    if (!forced) {
      const saved = localStorage.getItem('rtco_selected_branch_id') || localStorage.getItem('active_branch_id');
      if (saved) {
        setSelectedBranchIdState(saved);
      }
    }

    loadBranches();
  }, [applyUserRestriction]);

  const setSelectedBranchId = (id: string) => {
    // إذا كان الموظف مقيداً بفرع، يتم رفض أي محاولة تغيير بشكل صارم
    if (isBranchRestricted) {
      const forced = applyUserRestriction();
      if (forced) return;
    }

    setSelectedBranchIdState(id);
    localStorage.setItem('rtco_selected_branch_id', id);
    localStorage.setItem('active_branch_id', id);
    document.cookie = `rtco_selected_branch_id=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const currentBranch = (branches.length > 0 ? branches : fallbackBranches).find(
    (b) => b.branch_id === selectedBranchId
  ) || null;

  return (
    <BranchContext.Provider
      value={{
        selectedBranchId,
        setSelectedBranchId,
        branches: branches.length > 0 ? branches : fallbackBranches,
        currentBranch,
        refreshBranches: loadBranches,
        isBranchRestricted
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);