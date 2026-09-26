'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  Globe, 
  Phone, 
  MapPin, 
  Mail, 
  Upload, 
  Image as ImageIcon,
  Printer,
  Palette,
  Sparkles,
  Database,
  Code2,
  Copy,
  CheckCheck,
  X,
  AlertTriangle,
  Server,
  HelpCircle,
  Wand2
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

const FULL_SQL_SCHEMA = `-- 1. جدول الفروع والقطاعات التشغيلية
CREATE TABLE IF NOT EXISTS branches (
    branch_id VARCHAR(50) PRIMARY KEY,
    branch_code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    branch_type VARCHAR(255),
    manager_name VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول المستخدمين والصلاحيات
CREATE TABLE IF NOT EXISTS system_users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    is_super_admin BOOLEAN DEFAULT FALSE,
    permissions JSONB,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    session_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول المشاريع والمقاولات
CREATE TABLE IF NOT EXISTS projects (
    project_id VARCHAR(50) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    contract_value NUMERIC(18, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'IQD',
    start_date DATE,
    expected_end_date DATE,
    completion_rate NUMERIC(5, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    subcontractors JSONB,
    operating_expenses JSONB,
    materials JSONB,
    payment_terms JSONB,
    milestones JSONB,
    site_logs JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول مواد ومستلزمات المشاريع
CREATE TABLE IF NOT EXISTS project_materials (
    material_id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) DEFAULT 'طن',
    quantity_required NUMERIC(18, 2) DEFAULT 0,
    quantity_received NUMERIC(18, 2) DEFAULT 0,
    unit_price NUMERIC(18, 2) DEFAULT 0,
    supplier_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول السندات والقيود المالية المركزية
CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id VARCHAR(50) PRIMARY KEY,
    voucher_number VARCHAR(100) UNIQUE NOT NULL,
    branch_id VARCHAR(50),
    project_id VARCHAR(50),
    voucher_type VARCHAR(50) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IQD',
    notes TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    issue_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. جدول الموظفين والموارد البشرية
CREATE TABLE IF NOT EXISTS hr_employees (
    employee_id VARCHAR(50) PRIMARY KEY,
    emp_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    base_salary NUMERIC NOT NULL DEFAULT 0,
    allowances NUMERIC DEFAULT 0,
    phone VARCHAR(50),
    national_id VARCHAR(50),
    avatar_url TEXT,
    annual_leave_balance NUMERIC DEFAULT 21,
    hire_date DATE DEFAULT CURRENT_DATE,
    contract_end_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    bank_account VARCHAR(100),
    notes TEXT,
    cv_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. جدول الحركات المالية للموظفين
CREATE TABLE IF NOT EXISTS hr_adjustments (
    adj_id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    adj_type VARCHAR(50) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    hours_count NUMERIC(5, 2) DEFAULT 0,
    installments_count INTEGER DEFAULT 1,
    monthly_installment NUMERIC(18, 2) DEFAULT 0,
    reason TEXT,
    effective_month VARCHAR(20),
    is_settled BOOLEAN DEFAULT FALSE,
    leave_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. جدول إجازات الموظفين
CREATE TABLE IF NOT EXISTS hr_leaves (
    leave_id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    days_count INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'APPROVED',
    is_deducted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. جدول مسير الرواتب المعتمد
CREATE TABLE IF NOT EXISTS hr_payroll_runs (
    run_id VARCHAR(50) PRIMARY KEY,
    payroll_month VARCHAR(20) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    base_salary NUMERIC(18, 2) DEFAULT 0,
    allowances NUMERIC(18, 2) DEFAULT 0,
    bonuses NUMERIC(18, 2) DEFAULT 0,
    overtime_amount NUMERIC(18, 2) DEFAULT 0,
    loans_deducted NUMERIC(18, 2) DEFAULT 0,
    penalties NUMERIC(18, 2) DEFAULT 0,
    deduction_reasons TEXT,
    net_salary NUMERIC(18, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. جدول التقييمات والجزاءات
CREATE TABLE IF NOT EXISTS hr_penalties_appraisals (
    record_id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    details TEXT,
    rating_score INTEGER DEFAULT 5,
    record_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. جدول أصناف المخزن والتجارة العامة
CREATE TABLE IF NOT EXISTS inventory_items (
    item_id VARCHAR(50) PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    item_name VARCHAR(255),
    category VARCHAR(255) DEFAULT 'مواد إنشائية وبناء',
    unit VARCHAR(50) DEFAULT 'طن',
    quantity_on_hand NUMERIC(18, 2) DEFAULT 0,
    current_qty NUMERIC(18, 2) DEFAULT 0,
    unit_cost NUMERIC(18, 2) DEFAULT 0,
    selling_price NUMERIC(18, 2) DEFAULT 0,
    min_reorder_level NUMERIC(18, 2) DEFAULT 5,
    min_qty NUMERIC(18, 2) DEFAULT 5,
    location VARCHAR(255) DEFAULT 'المخزن المركزي الرئيسي - النجف',
    warehouse_location VARCHAR(255) DEFAULT 'المخزن المركزي الرئيسي - النجف',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. جدول حركات المخزن
CREATE TABLE IF NOT EXISTS inventory_transactions (
    trans_id VARCHAR(50) PRIMARY KEY,
    trans_code VARCHAR(100),
    item_id VARCHAR(50) NOT NULL,
    trans_type VARCHAR(20) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'PURCHASE',
    quantity NUMERIC(18, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18, 2) DEFAULT 0,
    total_amount NUMERIC(18, 2) DEFAULT 0,
    project_id VARCHAR(50),
    project_name VARCHAR(255),
    supplier_or_recipient VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. جدول الوحدات العقارية
CREATE TABLE IF NOT EXISTS real_estate_units (
    unit_id VARCHAR(50) PRIMARY KEY,
    unit_code VARCHAR(50),
    title VARCHAR(255),
    unit_name VARCHAR(255),
    property_type VARCHAR(100) DEFAULT 'شقة سكنية',
    unit_type VARCHAR(100) DEFAULT 'شقة سكنية',
    area_sqm NUMERIC(10, 2) DEFAULT 0,
    area NUMERIC(10, 2) DEFAULT 0,
    price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    base_price NUMERIC(18, 2) DEFAULT 0,
    city VARCHAR(100) DEFAULT 'النجف الأشرف',
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    buyer_name VARCHAR(255),
    buyer_phone VARCHAR(50),
    total_paid NUMERIC(18, 2) DEFAULT 0,
    total_remaining NUMERIC(18, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. جدول أقساط الوحدات العقارية
CREATE TABLE IF NOT EXISTS real_estate_installments (
    installment_id VARCHAR(50) PRIMARY KEY,
    unit_id VARCHAR(50) NOT NULL,
    installment_title VARCHAR(150) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. جدول أسطول النقل
CREATE TABLE IF NOT EXISTS fleet_vehicles (
    vehicle_id VARCHAR(50) PRIMARY KEY,
    vehicle_name VARCHAR(255) NOT NULL,
    plate_number VARCHAR(100) UNIQUE NOT NULL,
    vehicle_type VARCHAR(100),
    ownership_type VARCHAR(50) DEFAULT 'COMPANY',
    assigned_driver VARCHAR(255),
    driver_phone VARCHAR(50),
    current_location VARCHAR(255),
    current_mileage NUMERIC(12, 2) DEFAULT 0,
    last_oil_change_mileage NUMERIC(12, 2) DEFAULT 0,
    oil_change_interval_km NUMERIC(12, 2) DEFAULT 5000,
    current_fuel_pct INTEGER DEFAULT 100,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. جدول رحلات النقل
CREATE TABLE IF NOT EXISTS fleet_trips (
    trip_id VARCHAR(50) PRIMARY KEY,
    trip_code VARCHAR(100),
    truck_source_type VARCHAR(50) DEFAULT 'INTERNAL',
    vehicle_id VARCHAR(50),
    external_truck_info TEXT,
    external_driver_name VARCHAR(255),
    external_driver_phone VARCHAR(50),
    external_rental_cost NUMERIC(18, 2) DEFAULT 0,
    cargo_description TEXT,
    origin VARCHAR(255),
    destination VARCHAR(255),
    cargo_weight_tons NUMERIC(10, 2),
    captain_name VARCHAR(255),
    estimated_hours NUMERIC(6, 2),
    departure_time TIMESTAMP,
    trip_cost NUMERIC(18, 2) DEFAULT 0,
    trip_status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    manifest_doc_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. جدول صيانة الأسطول
CREATE TABLE IF NOT EXISTS fleet_maintenance (
    log_id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    log_type VARCHAR(50) NOT NULL,
    description TEXT,
    cost NUMERIC(18, 2) DEFAULT 0,
    mileage_at_service NUMERIC(12, 2) DEFAULT 0,
    performed_by VARCHAR(255),
    service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. جدول إعدادات النظام وهوية الشركة
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) DEFAULT 'شركة البرج المتألق',
    tagline VARCHAR(255) DEFAULT 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    phone_primary VARCHAR(50) DEFAULT '',
    phone_secondary VARCHAR(50) DEFAULT '',
    email VARCHAR(100) DEFAULT '',
    website VARCHAR(100) DEFAULT '',
    address VARCHAR(255) DEFAULT 'العراق - النجف الأشرف - حي الفرات',
    logo_url TEXT DEFAULT '',
    letterhead_url TEXT DEFAULT '',
    primary_color VARCHAR(30) DEFAULT '#d97706',
    secondary_color VARCHAR(30) DEFAULT '#ea580c',
    database_url TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. جدول الإشعارات المركزية
CREATE TABLE IF NOT EXISTS system_notifications (
    notification_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sector VARCHAR(100),
    action_type VARCHAR(50),
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. جدول سجل التدقيق الرقابي
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    user_name VARCHAR(255),
    action_type VARCHAR(100),
    sector VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. جدول الفترات المالية المقفلة
CREATE TABLE IF NOT EXISTS closed_financial_periods (
    period_id VARCHAR(50) PRIMARY KEY,
    period_month VARCHAR(20) UNIQUE NOT NULL,
    closed_by VARCHAR(255),
    closure_notes TEXT,
    closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. فك القيود المرتبطة بالموظفين وتغيير المعرف إلى VARCHAR(50)
ALTER TABLE hr_adjustments DROP CONSTRAINT IF EXISTS hr_adjustments_employee_id_fkey;
ALTER TABLE hr_leaves DROP CONSTRAINT IF EXISTS hr_leaves_employee_id_fkey;
ALTER TABLE hr_payroll_runs DROP CONSTRAINT IF EXISTS hr_payroll_runs_employee_id_fkey;
ALTER TABLE hr_penalties_appraisals DROP CONSTRAINT IF EXISTS hr_penalties_appraisals_employee_id_fkey;

ALTER TABLE hr_employees ALTER COLUMN employee_id TYPE VARCHAR(50);
ALTER TABLE hr_adjustments ALTER COLUMN employee_id TYPE VARCHAR(50);
ALTER TABLE hr_adjustments ALTER COLUMN adj_id TYPE VARCHAR(50);
ALTER TABLE hr_leaves ALTER COLUMN employee_id TYPE VARCHAR(50);
ALTER TABLE hr_leaves ALTER COLUMN leave_id TYPE VARCHAR(50);
ALTER TABLE hr_payroll_runs ALTER COLUMN employee_id TYPE VARCHAR(50);
ALTER TABLE hr_payroll_runs ALTER COLUMN run_id TYPE VARCHAR(50);
ALTER TABLE hr_penalties_appraisals ALTER COLUMN employee_id TYPE VARCHAR(50);
ALTER TABLE hr_penalties_appraisals ALTER COLUMN record_id TYPE VARCHAR(50);

-- 23. إضافة وتأكيد الحقول الإلزامية الخاصة بالمخزن والموارد البشرية
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE hr_leaves ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'APPROVED';
ALTER TABLE hr_leaves ADD COLUMN IF NOT EXISTS is_deducted BOOLEAN DEFAULT FALSE;
ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT FALSE;
ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS leave_id VARCHAR(50);
ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS installments_count INT DEFAULT 1;
ALTER TABLE hr_adjustments ADD COLUMN IF NOT EXISTS monthly_installment NUMERIC DEFAULT 0;`;

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    tagline: '',
    phone_primary: '',
    phone_secondary: '',
    email: '',
    website: '',
    address: '',
    logo_url: '',
    letterhead_url: '',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  // حالات إدارة الداتابيس
  const [showDbModal, setShowDbModal] = useState(false);
  const [showSqlGuideModal, setShowSqlGuideModal] = useState(false);
  
  // حقول روابط نيون
  const [rawNeonUrl, setRawNeonUrl] = useState('');
  const [cleanNeonUrl, setCleanNeonUrl] = useState('');

  const [copiedSql, setCopiedSql] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);

  const colorPresets = [
    { name: 'الذهبي والبرتقالي الملكي (الافتراضي)', primary: '#d97706', secondary: '#ea580c' },
    { name: 'الأزرق الداكن والفيروزي المؤسسي', primary: '#0284c7', secondary: '#0d9488' },
    { name: 'الزمردي الراقي والأخضر الداكن', primary: '#059669', secondary: '#10b981' },
    { name: 'العنابي والذهبي الفاخر', primary: '#b91c1c', secondary: '#d97706' },
    { name: 'الأرجواني والنيلي الحديث', primary: '#7c3aed', secondary: '#4f46e5' },
    { name: 'الرمادي التيتانيوم والكحلي', primary: '#334155', secondary: '#1e293b' }
  ];

  const fetchSettings = () => {
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setFormData({
            ...data.settings,
            primary_color: data.settings.primary_color || '#d97706',
            secondary_color: data.settings.secondary_color || '#ea580c'
          });
          if (data.settings.database_url) {
            setCleanNeonUrl(data.settings.database_url);
            setRawNeonUrl(data.settings.database_url);
          }
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // دالة المعالجة التلقائية للرابط وحذف الجزء الزائد
  const handleRawUrlChange = (val: string) => {
    setRawNeonUrl(val);
    let processed = val.trim();
    // إزالة &channel_binding=require تلقائياً
    processed = processed.replace('&channel_binding=require', '').replace('?channel_binding=require', '');
    setCleanNeonUrl(processed);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'letterhead_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, [field]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('تم حفظ وتحديث بيانات وألوان هوية الشركة بنجاح! تم تعميم اللونين على النظام والكتب الرسمية.');
        fetchSettings();
      } else {
        alert(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (err: any) {
      alert(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDatabaseUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    // الاعتماد حصراً على الرابط الثاني (cleanNeonUrl) المعالج تلقائياً
    const targetUrl = cleanNeonUrl.trim();

    if (!targetUrl.startsWith('postgres')) {
      alert('يرجى التأكد من كتابة رابط اتصال صحيح يبدأ بـ postgresql://');
      return;
    }
    if (!confirm('تنبيه أمني: سيتم اختبار الاتصال بقاعدة البيانات الجديدة وتفعيلها فوراً. هل تريد المتابعة؟')) {
      return;
    }

    setDbSaving(true);
    try {
      const res = await fetch('/api/admin/switch-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_database_url: targetUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم فحص الاتصال وتعيين قاعدة البيانات الجديدة بنجاح! سيتم تحديث الصفحة الآن.');
        setShowDbModal(false);
        window.location.reload();
      } else {
        alert('فشل التحويل: ' + (data.error || 'خطأ في الاتصال بالرابط الجديد'));
      }
    } catch (err: any) {
      alert('خطأ أثناء حفظ الرابط: ' + err.message);
    } finally {
      setDbSaving(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(FULL_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <AuthGuard>
      <div dir="rtl" className="min-h-screen bg-[#06080e] text-slate-100 p-4 md:p-8 font-cairo">
        
        {/* الترويسة العلوية */}
        <div className="max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">إعدادات الهوية والألوان وترويسة الطباعة الرسمية</h1>
              <p className="text-xs text-slate-400 mt-0.5">خاصة بالمدير المفوض: التحكم باسم الشركة، العناوين، الهواتف، الشعار، واللونين المعتمدين في النظام</p>
            </div>
          </div>
          <Link href="/" className="bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition">
            <ArrowLeft className="w-4 h-4" /> العودة للرئيسية
          </Link>
        </div>

        <div className="max-w-5xl mx-auto mt-8 bg-[#0b101d] border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs font-bold shadow-lg">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* قسم إدارة البنية التحتية والربط السحابي لقاعدة البيانات */}
          <div className="bg-[#0b132b] border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    إدارة البنية التحتية والربط السحابي لقاعدة البيانات
                    <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      Neon / PostgreSQL Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">التحويل بين نسخ وقواعد البيانات السحابية واستخراج أكواد الإنشاء</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowSqlGuideModal(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-855 border border-slate-700 text-cyan-300 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer text-xs shadow-md"
                >
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  ملاحظات وكودات إنشاء قاعدة جديدة
                </button>

                <button
                  type="button"
                  onClick={() => setShowDbModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition cursor-pointer text-xs shadow-lg shadow-cyan-500/20"
                >
                  <Server className="w-4 h-4" />
                  تعديل رابط قاعدة البيانات (Switch DB)
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              يمكنك بكل سهولة إنشاء قاعدة بيانات سحابية جديدة على <strong className="text-white">Neon.tech</strong> أو أي سيرفر PostgreSQL، ثم نسخ كود الـ SQL الجاهز الذي يحتوي على كافة الجداول والأعمدة للمنظومة، وإدخال رابط الاتصال الجديد ليتم الانتقال إليها فوراً.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            
            {/* 1. قسم اختيار واعتماد اللونين الرسميين للنظام والمطبوعات */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/90 space-y-5 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  ألوان الهوية البصرية الرسمية للشركة (Corporate Color Palette)
                </span>
                <span className="text-[11px] text-slate-500">تعتمد في كافة الكتب الرسمية، الترويسات، الأزرار، والواجهات</span>
              </div>

              {/* بطاقة المعاينة الحية للونين */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-[#070b14] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center font-bold text-white text-xs border border-white/20"
                    style={{ background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})` }}
                  >
                    RTCO
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">معاينة التدرج اللوني المعتمد</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      اللون الأساسي: <span className="font-mono text-amber-400 font-bold">{formData.primary_color}</span> | اللون الثانوي: <span className="font-mono text-sky-400 font-bold">{formData.secondary_color}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white text-slate-950 px-4 py-2 rounded-xl text-center shadow-lg border border-slate-300 w-full md:w-auto">
                  <div className="text-[11px] font-black" style={{ color: formData.primary_color }}>شركة البرج المتألق</div>
                  <div className="w-24 h-1 mx-auto my-1 rounded-full" style={{ backgroundColor: formData.secondary_color }}></div>
                  <div className="text-[9px] text-slate-600 font-medium">نموذج ترويسة الكتب الرسمية</div>
                </div>
              </div>

              {/* منتقي الألوان */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <label className="block text-slate-300 font-bold flex items-center justify-between">
                    <span>(1) اللون الأساسي (Primary Color):</span>
                    <span className="font-mono text-amber-400 text-xs">{formData.primary_color}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-12 h-12 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.primary_color}
                      onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">يستخدم للعناوين الرئيسية، الشارات، اسم الشركة، وحدود الجداول.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <label className="block text-slate-300 font-bold flex items-center justify-between">
                    <span>(2) اللون الثانوي (Secondary Color):</span>
                    <span className="font-mono text-sky-400 text-xs">{formData.secondary_color}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-12 h-12 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.secondary_color}
                      onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">يستخدم للخطوط التزيينية، التدرجات الخلفية، أزرار التفاعل، والزخارف.</p>
                </div>
              </div>

              {/* نماذج سريعة جاهزة */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-400 font-semibold block mb-2">أو اختر أحد النماذج الموصى بها مسبقاً:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {colorPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, primary_color: preset.primary, secondary_color: preset.secondary })}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-855 border border-slate-800 hover:border-slate-700 transition flex items-center gap-2 text-right cursor-pointer"
                    >
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span className="w-4 h-4 rounded-full border border-slate-800" style={{ backgroundColor: preset.primary }}></span>
                        <span className="w-4 h-4 rounded-full border border-slate-800" style={{ backgroundColor: preset.secondary }}></span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. قسم ترويسة الطباعة الرسمية والشعار */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  ترويسة الطباعة الرسمية والشعار (Letterhead & Logo)
                </span>
                <span className="text-[11px] text-slate-500">تُدرج تلقائياً في أعلى الكتب الرسمية والتقارير وعقود البيع والسندات</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-slate-300 font-bold">صورة ترويسة الكتب الرسمية (Header Image A4):</label>
                  <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 text-center space-y-3 transition bg-slate-900/40">
                    {formData.letterhead_url ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.letterhead_url} alt="ترويسة الشركة" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="py-6 text-slate-500 flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span>لم يتم رفع صورة ترويسة رسمية بعد</span>
                      </div>
                    )}

                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer font-bold text-xs transition">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{formData.letterhead_url ? 'تغيير صورة الترويسة' : 'رفع صورة الترويسة'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'letterhead_url')} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-slate-300 font-bold">شعار الشركة الرسمي (Logo):</label>
                  <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 text-center space-y-3 transition bg-slate-900/40">
                    {formData.logo_url ? (
                      <div className="relative w-24 h-24 mx-auto rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.logo_url} alt="شعار الشركة" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="py-6 text-slate-500 flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span>لم يتم تعيين شعار مخصص</span>
                      </div>
                    )}

                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer font-bold text-xs transition">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{formData.logo_url ? 'تغيير الشعار' : 'رفع الشعار'}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. بيانات الشركة الرسمية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">اسم الشركة الرسمي:</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold">الوصف الرسمي للنشاط:</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" /> رقم الهاتف الرئيسي:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="+964..."
                  value={formData.phone_primary}
                  onChange={e => setFormData({ ...formData, phone_primary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 text-right"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" /> رقم الهاتف الإضافي (اختياري):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="+964..."
                  value={formData.phone_secondary}
                  onChange={e => setFormData({ ...formData, phone_secondary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-sky-400" /> البريد الإلكتروني الرسمي:
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 text-right"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-sky-400" /> الموقع الإلكتروني:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500 text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-bold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" /> العنوان المعتمد للمركز الرئيسي:
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {loading ? 'جاري حفظ الإعدادات...' : 'حفظ وتعميم التحديثات والألوان على كافة أنظمة الشركة'}
              </button>
            </div>
          </form>

        </div>

        {/* نافذة تعديل رابط قاعدة البيانات السحابية (Switch DB Modal) */}
        {showDbModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b132b] border border-cyan-500/40 w-full max-w-xl rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Server className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-white">تعديل رابط قاعدة البيانات السحابية (Switch Database)</h3>
                </div>
                <button onClick={() => setShowDbModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDatabaseUrl} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    تعليمات مهمة جداً قبل التحويل:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    1. الصق رابط Neon الخام في المربع الأول أدناه.
                    <br />
                    2. سيقوم النظام بمعالجته تلقائياً في المربع الثاني (حذف `&channel_binding=require`) لضمان نجاح الاتصال وعدم انتهاء المهلة (Timeout).
                  </p>
                </div>

                {/* التكست الأول: إدخال الرابط الخام من نيون */}
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">
                    (1) الصق الرابط المنسوخ من Neon هنا:
                  </label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    placeholder="postgresql://user:pass@host/dbname?sslmode=require&channel_binding=require"
                    value={rawNeonUrl}
                    onChange={(e) => handleRawUrlChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-300 font-mono text-xs outline-none focus:border-cyan-400 leading-relaxed resize-none"
                  />
                </div>

                {/* التكست الثاني: الرابط المعالج تلقائياً والذي يتم الاعتماد عليه عند الضغط */}
                <div>
                  <label className="block text-cyan-300 mb-1.5 font-bold flex items-center gap-1">
                    <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                    (2) الرابط النظيف والمعالج تلقائياً (الذي سيتم الاعتماد عليه):
                  </label>
                  <textarea
                    required
                    rows={2}
                    dir="ltr"
                    value={cleanNeonUrl}
                    onChange={(e) => setCleanNeonUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/60 rounded-xl p-2.5 text-cyan-300 font-mono text-xs outline-none focus:border-cyan-400 leading-relaxed resize-none bg-cyan-950/20"
                  />
                  <span className="text-[10px] text-cyan-400/80 block mt-1">
                    * يتم اعتماد هذا الرابط حصراً عند الضغط على زر الحفظ والتفعيل.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowDbModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={dbSaving}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                  >
                    {dbSaving ? 'جاري الفحص والتفعيل...' : 'تأكيد وحفظ الرابط المعالج'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة دليل إنشاء الداتابيس وكودات الـ SQL (SQL Guide Modal) */}
        {showSqlGuideModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b132b] border border-cyan-500/40 w-full max-w-4xl max-h-[90vh] rounded-3xl p-6 shadow-2xl text-right flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 shrink-0">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Code2 className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-white">دليل إنشاء قاعدة بيانات جديدة وأكواد الجداول</h3>
                </div>
                <button onClick={() => setShowSqlGuideModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1 text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    خطوات إنشاء الداتابيس الجديدة على Neon.tech:
                  </span>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                    <li>قم بزيارة موقع <strong>Neon.tech</strong> واضغط على <strong>Create Project</strong>.</li>
                    <li>اختر اسم المشروع وسيرفر التخزين الأقرب (مثال: Frankfurt أو Ohio).</li>
                    <li>بعد إنشاء المشروع، انسخ رابط <strong>Connection String</strong> من لوحة Neon الرئيسية.</li>
                    <li>ادخل إلى تبويب <strong>SQL Editor</strong> في لوحة تحكم Neon.</li>
                    <li>انسخ كود الـ SQL الموضح أدناه والصقه كاملاً في المحرر، ثم اضغط <strong>Run</strong>.</li>
                    <li>ارجع إلى هذه الصفحة واضغط زر <strong>تعديل رابط قاعدة البيانات</strong> والصق الرابط الجديد!</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-cyan-400" />
                      أكواد SQL لإنشاء وتهيئة الجداول بالكامل:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
                    >
                      {copiedSql ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          تم النسخ بنجاح!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          نسخ كود الـ SQL كاملاً
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <pre dir="ltr" className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-cyan-300 max-h-72 overflow-y-auto leading-relaxed select-all">
                      {FULL_SQL_SCHEMA}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSqlGuideModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition cursor-pointer text-xs"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}