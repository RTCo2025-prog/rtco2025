'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  ArrowLeft, 
  Printer, 
  FileText, 
  PlusCircle, 
  Search, 
  Trash2, 
  Calendar, 
  Send, 
  Inbox, 
  FileCheck, 
  Eye, 
  X, 
  Globe, 
  MapPin, 
  Phone, 
  Bookmark, 
  FileSpreadsheet, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Award, 
  Clock, 
  Briefcase, 
  Camera, 
  Upload, 
  FileImage, 
  Paperclip, 
  Layers, 
  ChevronDown, 
  AlertTriangle, 
  Plus, 
  FileCode, 
  Zap, 
  Home
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

interface OfficialDoc {
  id: string;
  type: 'OUTGOING' | 'INCOMING' | 'INTERNAL_ORDER';
  priority: 'NORMAL' | 'URGENT' | 'TOP_SECRET';
  status: 'PENDING' | 'COMPLETED' | 'ARCHIVED';
  docNumber: string;
  docDate: string;
  senderDocNumber?: string;
  senderDocDate?: string;
  partyName: string;
  subject: string;
  content?: string;
  attachments?: string;
  carbonCopy?: string;
  signatoryTitle?: string;
  signatoryName?: string;
  mainLetterUrl?: string;
  scannedFileUrls?: string[];
  notes?: string;
  createdAt: string;
}

// ضغط الصور بذكاء لتقليل الحجم بأكثر من 80% مع بقاء المستندات واضحة تماماً
async function compressImage(file: File, maxWidth = 900, quality = 0.55): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// إرسال الإشعار المركزي الموحد
async function pushSystemNotification(title: string, message: string, sector: string, link: string, actionType: string = 'ADD') {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_NOTIFICATION',
        action_type: actionType,
        title,
        message,
        sector: sector || 'ADMIN_DOCS',
        link: link || '/admin/documents'
      })
    });
  } catch (e) {
    console.error(e);
  }
}

// ترحيل ومزامنة الوثيقة للسيرفر وقاعدة البيانات السحابية
async function syncDocToCloud(doc: OfficialDoc) {
  try {
    await fetch('/api/admin/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_OFFICIAL_DOC', doc })
    });
  } catch (e) {
    console.error('Failed to sync official document to cloud:', e);
  }
}

export default function AdministrativeDocumentsPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [documents, setDocuments] = useState<OfficialDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState<'OUTGOING' | 'INCOMING' | 'INTERNAL_ORDER'>('OUTGOING');
  const [siteOrigin, setSiteOrigin] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // حقول الصادر
  const [outDocNumber, setOutDocNumber] = useState('');
  const [outDocDate, setOutDocDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [outPriority, setOutPriority] = useState<'NORMAL' | 'URGENT' | 'TOP_SECRET'>('NORMAL');
  const [outRecipient, setOutRecipient] = useState('');
  const [outSubject, setOutSubject] = useState('');
  const [outContent, setOutContent] = useState('');
  const [outAttachments, setOutAttachments] = useState('لا يوجد');
  const [outCarbonCopy, setOutCarbonCopy] = useState('مكتب المدير المفوض / المتابعة / الأرشيف');
  const [outSignatoryTitle, setOutSignatoryTitle] = useState('المدير المفوض');
  const [outSignatoryName, setOutSignatoryName] = useState('عامر الطرفي');
  const [outScannedUrls, setOutScannedUrls] = useState<string[]>([]);

  // حقول الوارد
  const [inDocNumber, setInDocNumber] = useState('');
  const [inDocDate, setInDocDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [inSenderNumber, setInSenderNumber] = useState('');
  const [inSenderDate, setInSenderDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [inSenderName, setInSenderName] = useState('');
  const [inSubject, setInSubject] = useState('');
  const [inPriority, setInPriority] = useState<'NORMAL' | 'URGENT' | 'TOP_SECRET'>('NORMAL');
  const [inAttachments, setInAttachments] = useState('لا يوجد');
  const [inMainLetterUrl, setInMainLetterUrl] = useState('');
  const [inScannedUrls, setInScannedUrls] = useState<string[]>([]);
  const [inNotes, setInNotes] = useState('');

  // حقول الأمر الإداري
  const [orderDocNumber, setOrderDocNumber] = useState('');
  const [orderDocDate, setOrderDocDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [orderRecipient, setOrderRecipient] = useState('إلى / كافة الأقسام والمشاريع والكوادر الهندسية');
  const [orderSubject, setOrderSubject] = useState('م / أمر إداري');
  const [orderContent, setOrderContent] = useState('');
  const [orderAttachments, setOrderAttachments] = useState('لا يوجد');
  const [orderSignatoryTitle, setOrderSignatoryTitle] = useState('المدير المفوض');
  const [orderSignatoryName, setOrderSignatoryName] = useState('عامر الطرفي');
  const [orderScannedUrls, setOrderScannedUrls] = useState<string[]>([]);

  const outCameraRef = useRef<HTMLInputElement>(null);
  const outFileRef = useRef<HTMLInputElement>(null);
  const inMainCameraRef = useRef<HTMLInputElement>(null);
  const inMainFileRef = useRef<HTMLInputElement>(null);
  const inAttCameraRef = useRef<HTMLInputElement>(null);
  const inAttFileRef = useRef<HTMLInputElement>(null);
  const orderCameraRef = useRef<HTMLInputElement>(null);
  const orderFileRef = useRef<HTMLInputElement>(null);

  const [selectedDocForPrint, setSelectedDocForPrint] = useState<OfficialDoc | null>(null);
  const [viewScannedImage, setViewScannedImage] = useState<string | null>(null);

  const generateCode = (prefix: 'ص' | 'و' | 'أ.إ') => {
    return `${prefix}/${Math.floor(100 + Math.random() * 900)} / ${new Date().getFullYear()}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteOrigin(window.location.origin);
    }

    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
        if (parsed.full_name) {
          setOutSignatoryName(parsed.full_name);
          setOrderSignatoryName(parsed.full_name);
        }

        // فحص أمني لمنع فتح الحساب في أكثر من جهاز بالوقت نفسه
        if (parsed.user_id && parsed.session_token) {
          fetch(`/api/auth?action=VERIFY_SESSION&user_id=${encodeURIComponent(parsed.user_id)}&session_token=${encodeURIComponent(parsed.session_token)}`)
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

    // جلب من التخزين المحلي أولاً
    const stored = localStorage.getItem('rtco_official_documents');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDocuments(parsed);
      } catch {}
    }

    // مزامنة فورية وجلب الوثائق الرسمية من السيرفر السحابي لتوحيدها بين الأجهزة
    fetch('/api/admin/system?action=GET_OFFICIAL_DOCS', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.documents) && data.documents.length > 0) {
          setDocuments(data.documents);
          try {
            const lightList = data.documents.slice(0, 30);
            localStorage.setItem('rtco_official_documents', JSON.stringify(lightList));
          } catch {}
        }
      })
      .catch(() => {});

    setOutDocNumber(generateCode('ص'));
    setInDocNumber(generateCode('و'));
    setOrderDocNumber(generateCode('أ.إ'));
  }, []);

  const isSuperAdmin = useMemo(() => {
    return Boolean(currentUser?.is_super_admin || currentUser?.role === 'ADMIN');
  }, [currentUser]);

  const canAdd = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'admin_docs', 'add'));
  }, [currentUser, isSuperAdmin]);

  const canDelete = useMemo(() => {
    return Boolean(isSuperAdmin || hasPermission(currentUser, 'admin_docs', 'delete'));
  }, [currentUser, isSuperAdmin]);

  // مكتبة النماذج والصيغ الرسمية الشاملة والموسعة (24 نموذجاً تخصصياً)
  const documentTemplates = useMemo(() => {
    return {
      OUTGOING: [
        {
          label: 'طلب صرف سلفة إنجاز',
          badge: 'مالية وعقود',
          recipient: 'إلى / ديوان محافظة النجف الأشرف - قسم الحسابات وتدقيق العقود',
          subject: 'م / طلب صرف السلفة المرحلية رقم (   )',
          content: 'تحية طيبة واعتزاز...\nإشارةً إلى العقد المبرم معنا المرقم (...........) الخاص بتنفيذ مشروع (................................)، ونظراً لإتمام الأعمال المحددة ضمن الذرعة الحالية ومصادقة دائرة المهندس المقيم عليها.\nيرجى تفضلكم بالموافقة على تدقيق وصرف مبلغ السلفة المرحلية المستحقة والبالغة (............) دينار عراقي، ليتسنى لنا الاستمرار في تمويل وتيرة العمل دون توقف.\n\nشاكرين عالي اهتمامكم وتعاونكم.',
          attachments: 'طياً ذرعة العمل المنجز + كشف الحساب المصادق'
        },
        {
          label: 'تأييد استمرارية خدمة',
          badge: 'موارد بشرية',
          recipient: 'إلى / من يهمه الأمر',
          subject: 'م / تأييد استمرار بالخدمة',
          content: 'تهديكم شركة البرج المتألق للمقاولات والتجارة العامة أطيب التحيات.\nنؤيد لكم بأن السيد/ة (..................) مستمر/ة بالعمل والخدمة الوظيفية لدى شركتنا بصفة (مهندس موقع / إداري) وذلك اعتباراً من تاريخ (   /   / 202  ) ولحد الآن، ويتقاضى راتباً شهرياً قدره (............) دينار عراقي.\nوقد زُوّد بهذا التأييد بناءً على طلبه/ا لتقديمه إلى جهتكم الموقرة دون أدنى مسؤولية مالية أو قانونية مترتبة على شركتنا تجاه الغير.\n\nمع فائق الشكر والتقدير.',
          attachments: 'لا يوجد'
        },
        {
          label: 'إشعار إنجاز وتسليم موقعي',
          badge: 'هندسة وتنفيذ',
          recipient: 'إلى / دائرة المهندس المقيم - مشروع (....................)',
          subject: 'م / إشعار بإنجاز كافة الأعمال التعاقدية وتسليم أولي',
          content: 'تحية طيبة...\nنود إعلامكم بأن شركتنا قد أتمت بنجاح كافة الفقرات والأعمال الإنشائية والخدمية التعاقدية الخاصة بالمشروع المذكور أعلاه، ووفقاً لأرقى المواصفات الفنية وجداول الكميات والشروط العامة للمقاولات.\nيرجى التفضل بمفاتحة الجهة المعنية لتشكيل لجنة الاستلام الأولي للمشروع لإجراء الفحص والتدقيق الموقعي واستلام الأعمال.\n\nتفضلوا بقبول وافر الاحترام.',
          attachments: 'طياً تقرير الإنجاز النهائي + المخططات المنفذة (As-Built)'
        },
        {
          label: 'عرض أسعار وتوريد مواد',
          badge: 'تجارة ومشتريات',
          recipient: 'إلى / السادة إدارة مشتريات ومشاريع (................) المحترمون',
          subject: 'م / تقديم عرض أسعار ومواصفات تجارية',
          content: 'تحية طيبة...\nيسر شركة البرج المتألق للتجارة العامة والمقاولات أن ترفق لكم طياً العرض الفني والمالي الخاص بتجهيز وتوريد المواد المطلوبة لمشروعكم الموقر.\nنحيطكم علماً بأن أسعارنا تشمل التوريد والتوصيل والفحص المختبري مع منح ضمان الجودة وسرعة التجهيز المباشر فور التعاقد.\n\nآملين أن ينال عرضنا ثقتكم وقبولكم.',
          attachments: 'طياً جدول الكميات وعروض الأسعار التنافسية'
        },
        {
          label: 'إصدار / تمديد خطاب ضمان',
          badge: 'مصارف وتأمين',
          recipient: 'إلى / إدارة المصرف (................) - فرع النجف الأشرف',
          subject: 'م / طلب إصدار خطاب ضمان (حسن تنفيذ / سلفة أولية)',
          content: 'تحية طيبة...\nيرجى التفضل بالموافقة على إصدار خطاب ضمان مصرفي (حسن تنفيذ / دفعة أولية) لصالح (اسم الجهة المستفيدة) بمبلغ إجمالي قدره (............) دينار عراقي، وذلك تأييداً لالتزاماتنا التعاقدية الخاصة بمناقصة/مشروع (................).\nنرجو قيد التأمينات والعمولات المصرفية اللازمة على حسابنا الجاري المفتوح لديكم برقم (........).\n\nمع وافر التقدير والامتنان.',
          attachments: 'طياً نسخة من كتاب الإحالة وبيانات المناقصة'
        },
        {
          label: 'إشعار تذكير ومطالبة مالية',
          badge: 'حسابات ومتابعة',
          recipient: 'إلى / السادة إدارة شركة (................) المحترمون',
          subject: 'م / تذكير باستحقاق مالي مترتب',
          content: 'تحية طيبة...\nنود تذكير عنايتكم الكريمة بوجود مستحقات مالية واجبة السداد مترتبة بذمتكم لصالح شركتنا عن تجهيز وتنفيذ أعمال (................) والبالغ قدرها (............) دينار عراقي، والتي مضى على استحقاقها أكثر من (30) يوماً.\nيرجى التكرم بالإيعاز للقسم المالي بإجراء التسوية وصرف المبلغ المتبقي لضمان استمرار الحسابات التعاقدية بين الطرفين بسلاسة.\n\nشاكرين تعاونكم الدائم.',
          attachments: 'طياً نسخة كشف الحساب المالي والفواتير'
        },
        {
          label: 'طلب تمديد مدة تعاقدية',
          badge: 'مشاريع وعقود',
          recipient: 'إلى / ديوان محافظة النجف الأشرف - هيئة الإعمار',
          subject: 'م / طلب تمديد المدة الزمنية للمشروع (تعويض مدد إضافية)',
          content: 'تحية طيبة...\nإشارة إلى العقد المرقم (........) الخاص بمشروع شركتنا، ونظراً للأسباب القاهرة والظروف الموقعية الخارجة عن إرادتنا (تأخر إخلاء الموقع / هطول الأمطار الغزيرة / تأخر استلام المخططات التعديلية) والمثبتة بمحاضر رسمية لدى دائرة المهندس المقيم.\nنرجو تفضلكم بالموافقة على تمديد مدة المقاولة بواقع (   ) يوماً كمدة إضافية مشروعة تعويضاً عن فترات التوقف، مع التزامنا بإكمال العمل بأسرع وقت.\n\nمع فائق الاحترام والتقدير.',
          attachments: 'طياً محاضر توقف العمل وتأييد دائرة المهندس المقيم'
        },
        {
          label: 'تفويض وتخويل مندوب',
          badge: 'قانونية وإدارة',
          recipient: 'إلى / الدوائر والجهات ذات العلاقة المحترمون',
          subject: 'م / كتاب تخويل ومتابعة رسمية',
          content: 'تهديكم شركة البرج المتألق أطيب التحيات.\nنود إعلامكم بأننا خولنا السيد (................) حامل البطاقة الوطنية رقم (................) لمراجعة دائرتكم الموقرة ومتابعة كافة الإجراءات والمعاملات الإدارية والمالية المتعلقة بشركتنا واستلام وتسليم المكاتبات دون توقيع الالتزامات المالية الكبرى، وذلك لمدة (30) يوماً من تاريخه.\n\nشاكرين حسن تعاونكم وتسهيل مهمته.',
          attachments: 'طياً صورة البطاقة الوطنية للمخول'
        },
        {
          label: 'إخطار قانوني للمستأجر',
          badge: 'استثمار وعقارات',
          recipient: 'إلى / السيد (................) المحترم - مستأجر العقار رقم (   )',
          subject: 'م / إخطار وتنبيه بضرورة سداد بدل الإيجار المتأخر',
          content: 'تحية طيبة...\nنظراً لعدم قيامكم بسداد بدل الإيجار الشهري المستحق عن إشغالكم للعقار العائد لشركتنا والكائن في (................) للأشهر (................) بإجمالي مبلغ قدره (............) دينار عراقي.\nننذركم بضرورة مراجعة مقر الشركة وتسديد كامل المبلغ المترتب خلال مدة أقصاها (7) أيام من تاريخ تبليغكم بهذا الكتاب، وتفادياً لاتخاذ الإجراءات القانونية وفسخ عقد الإيجار والمطالبة بالتعويض.\n\nللعلم والإجراء الفوري.',
          attachments: 'طياً نسخة من عقد الإيجار المبرم'
        },
        {
          label: 'طلب مصادقة مخططات استثمارية',
          badge: 'تخطيط وتطوير',
          recipient: 'إلى / هيئة استثمار النجف الأشرف - القسم الفني والهندسي',
          subject: 'م / تقديم التصاميم المعمارية والمخططات التنفيذية للمصادقة',
          content: 'تحية طيبة...\nاستناداً إلى الإجازة الاستثمارية المرقمة (...........) الممنوحة لشركتنا، نرفق طياً التصاميم المعمارية والإنشائية وجداول المواصفات العامة لمشروع (................) والمعدة من قبل المكاتب الاستشارية المعتمدة.\nيرجى تفضلكم بالاطلاع والمصادقة الفنية على المخططات تمهيداً للشروع بإجراءات استلام الأرض والمباشرة الميدانية.\n\nمع التقدير والامتنان.',
          attachments: 'طياً ألبوم المخططات الكامل + قرص ليزري بالتصاميم'
        },
        {
          label: 'اعتذار رسمي عن دخول مناقصة',
          badge: 'مناقصات وعقود',
          recipient: 'إلى / السادة لجنة فتح وتحليل العطاءات المحترمون',
          subject: 'م / اعتذار عن المشاركة في المناقصة المرقمة (   )',
          content: 'تحية طيبة واعتزاز...\nنشكر دعوتكم الكريمة الموجهة إلى شركة البرج المتألق للمشاركة في المناقصة رقم (...........) الخاصة بمشروع (................).\nنود إعلامكم باعتذارنا عن تقديم العطاء لهذه المناقصة في الوقت الراهن لانشغال كوادرنا الهندسية ومعداتنا الثقيلة بعدة مشاريع كبرى قيد التنفيذ، متطلعين إلى دوام التعاون والتنسيق في المشاريع القادمة بإذن الله.\n\nدمتم برعاية الله وحفظه.',
          attachments: 'لا يوجد'
        },
        {
          label: 'تسهيل مهمة كادر ميداني',
          badge: 'عمليات وميدان',
          recipient: 'إلى / قيادة شرطة النجف الأشرف / السيطرات والطرق الخارجية',
          subject: 'م / تسهيل مهمة كادر هندسي وآليات ثقيلة',
          content: 'تحية طيبة واحتراماً...\nنرجو تفضلكم بتسهيل مهمة مرور الكادر الهندسي والفني والآليات الثقيلة (شاحنات، خباطات مركزية، قلابات) التابعة لشركتنا والمكلفة بنقل المواد الإنشائية إلى موقع عمل مشروع (................).\nنرفق طياً جدولاً بأرقام الآليات وأسماء السائقين والكوادر الميدانية المكلفة بالواجب.\n\nشاكرين دعمكم الكبير وحرصكم الدائم على حفظ الأمن ودعم الإعمار.',
          attachments: 'طياً جدول ببيانات الآليات وأسماء الكوادر'
        }
      ],
      INTERNAL_ORDER: [
        {
          label: 'تشكيل لجنة استلام هندسي',
          badge: 'لجان وكوادر',
          recipient: 'إلى / الكوادر الهندسية والفنية المدرجة أسماؤهم أدناه',
          subject: 'م / تشكيل لجنة استلام موقعي وتدقيق أولي',
          content: 'بناءً على الصلاحيات المخولة لنا ولمقتضيات مصلحة العمل في شركة البرج المتألق، تقرر ما يلي:\n\n1. تشكيل لجنة استلام هندسية برئاسة المهندس (................) وعضوية كل من المهندس (................) والمشرف الفني (................).\n2. تتولى اللجنة إجراء الكشف الموقعي الشامل لفقرات مشروع (................) والتأكد من مطابقتها للمواصفات الهندسية القياسية.\n3. تقدم اللجنة تقريرها الفني المفصل وقوائم الملاحظات إن وجدت للإدارة العليا خلال مدة لا تتجاوز (48) ساعة من تاريخ صدور أمرنا.\n\nيُنفذ هذا الأمر اعتباراً من تاريخ صدوره.',
          attachments: 'لا يوجد'
        },
        {
          label: 'أمر تكليف بمهام إدارة موقع',
          badge: 'إدارة وتكليف',
          recipient: 'إلى / المهندس (................) المحترم',
          subject: 'م / أمر تكليف وإدارة موقع العمل',
          content: 'لمقتضيات حسن سير العمل وتنظيمه الميداني بكفاءة، تقرر تكليفكم بمهام (مدير موقع المشروع) لمشروع (................) اعتباراً من تاريخ صدور هذا الأمر.\nتخولون بكافة الصلاحيات التنفيذية لإدارة الكوادر والمعدات والتعامل مع استفسارات دائرة المهندس المقيم والالتزام التام بالجدول الزمني ومعايير السلامة المهنية.\n\nراجين لكم التوفيق والسداد في أداء مهامكم.',
          attachments: 'لا يوجد'
        },
        {
          label: 'كتاب شكر وتقدير ومكافأة',
          badge: 'حوافز وظيفية',
          recipient: 'إلى / كوادر قسم الهندسة والمشاريع المحترمون',
          subject: 'م / شكر وتقدير وتثمين جهود متميزة',
          content: 'نظراً للجهود المتميزة والمخلصة المبذولة من قبلكم في إنجاز الأعمال الموكلة إليكم في مشروع (................) قبل الموعد التعاقدي المحدد وبدقة واحترافية هندسية عالية نالت استحسان الجهات المشرفة.\nلا يسعنا إلا أن نتقدم لكم بوافر الشكر وعظيم الامتنان، مع منحكم مكافأة تشجيعية مجزية تقديراً لعطائكم.\nآملين منكم الاستمرار بهذا النهج المشرف خدمةً لأهداف وتطور شركة البرج المتألق.',
          attachments: 'لا يوجد'
        },
        {
          label: 'لجنة الجرد السنوي للمخازن',
          badge: 'رقابة ومخازن',
          recipient: 'إلى / السادة أعضاء لجنة الجرد المحترمون',
          subject: 'م / تشكيل لجنة الجرد السنوي العام للمخازن والمعدات',
          content: 'لمقتضيات التدقيق الداخلي وإعداد الحسابات الختامية السنوية، تقرر تشكيل لجنة الجرد برئاسة السيد (................) وعضوية السادة (................) و (................).\nتباشر اللجنة مهام الجرد الفعلي لكافة المواد الإنشائية والأجهزة والآليات والعدد المخزنية ومطابقتها مع السجلات الرقمية للنظام المحاسبي.\nتوقف حركة الصرف والإدخال المخزني أثناء فترة الجرد وتقدم النتائج بمحضر رسمي مصادق.',
          attachments: 'لا يوجد'
        },
        {
          label: 'توجيه عقوبة إنذار ولفت نظر',
          badge: 'انضباط وظيفي',
          recipient: 'إلى / الموظف (................) المحترم',
          subject: 'م / عقوبة لفت نظر وتنبيه نهائي',
          content: 'نظراً لتقصيركم في أداء الواجبات الموكلة إليكم والمتمثلة بـ (الغياب دون إشعار مسبق / الإهمال في متابعة صيانة الآليات والمعدات) ومخالفتكم لتعليمات لائحة العمل الداخلي.\nتقرر توجيه عقوبة (لفت نظر / إنذار) لكم مع استقطاع أجر الأيام المهدورة من راتبكم، وننبهكم بضرورة الالتزام مستقبلاً لتفادي اتخاذ عقوبات قانونية أشد تصل لإنهاء التعاقد.\n\nللعلم وتفادي التكرار.',
          attachments: 'لا يوجد'
        },
        {
          label: 'إيقاف مؤقت لأعمال الموقع',
          badge: 'سلامة وميدان',
          recipient: 'إلى / كافة كوادر مشروع (................) المحترمون',
          subject: 'م / إيقاف مؤقت لأعمال التنفيذ لظروف طارئة',
          content: 'نظراً لسوء الأحوال الجوية وهطول الأمطار الغزيرة وتحذيرات الدفاع المدني والأنواء الجوية وحرصاً على سلامة الكوادر والآليات والمعدات وضمان جودة الخرسانة.\nتقرر إيقاف كافة الأعمال الإنشائية في الموقع المذكور اعتباراً من اليوم وحتى إشعار آخر، مع تكليف كادر الحراسة والأمن الصناعي باتخاذ أقصى تدابير الحماية الموقعية.\n\nيُنفذ فوراً.',
          attachments: 'لا يوجد'
        },
        {
          label: 'أمر استئناف العمل بالمشروع',
          badge: 'مشاريع وميدان',
          recipient: 'إلى / الكوادر الهندسية والفنية والتشغيلية المحترمون',
          subject: 'م / استئناف المباشرة بأعمال التنفيذ',
          content: 'نظراً لزوال المانع والظروف الطارئة التي استوجبت إيقاف الأعمال في مشروع (................).\nتقرر استئناف العمل والمباشرة الفورية بكافة الفقرات الإنشائية والخدمية اعتباراً من صباح يوم غدٍ، مع تكثيف الجهود وساعات العمل لتعويض فترة التوقف والالتزام التام بالجدول الزمني المعتمد.\n\nللتنفيذ الفوري كلٌ حسب موقعه.',
          attachments: 'لا يوجد'
        },
        {
          label: 'صرف سلفة تشغيلية ونثرية',
          badge: 'مالية وحسابات',
          recipient: 'إلى / القسم المالي والحسابات المحترمون',
          subject: 'م / تخويل وصرف سلفة تشغيلية نقدية للمشروع',
          content: 'يُخوّل السيد (................) بصفته مسؤول الموقع باستلام سلفة نقدية تشغيلية قدرها (............) دينار عراقي مخصصة للصرف على متطلبات المواد الطارئة وأجور النقل والنثريات لموقع مشروع (................).\nتُسوى هذه السلفة بوصولات وفواتير أصولية معتمدة وفق الضوابط والتعليمات المالية للشركة في نهاية كل أسبوع.\n\nللتنفيذ والصرف أصولياً.',
          attachments: 'لا يوجد'
        }
      ],
      INCOMING: [
        {
          label: 'كتاب إحالة مشروع مقاولة',
          badge: 'إحالات وعقود',
          senderName: 'ديوان محافظة النجف الأشرف - قسم العقود العامة',
          senderNumber: '1092 / ع',
          subject: 'م / إشعار بإحالة مناقصة مشروع (................)',
          notes: 'ورد كتاب الإحالة الرسمي للشركة، يرجى التوجيه بمراجعة ديوان المحافظة لتوقيع العقد وتقديم خطاب ضمان حسن التنفيذ.'
        },
        {
          label: 'كتاب مصادقة مخططات استثمارية',
          badge: 'استثمار وتخطيط',
          senderName: 'هيئة استثمار النجف الأشرف - قسم التخطيط والمصادقات',
          senderNumber: '5421 / ت',
          subject: 'م / المصادقة على المخططات والتصاميم الهندسية',
          notes: 'تمت مصادقة المخططات الفنية للمشروع، يرجى التوجيه للقسم الهندسي بالمباشرة بمراحل التنفيذ الفعلي.'
        },
        {
          label: 'شهادة فحص مختبري إنشائي',
          badge: 'فحوصات وجودة',
          senderName: 'المختبر الإنشائي التخصصي للفحوصات الهندسية',
          senderNumber: '312 / ف',
          subject: 'م / نتائج فحص المكعبات الخرسانية وحديد التسليح',
          notes: 'نتائج الفحص ناجحة ومطابقة للمواصفات القياسية للجهاز المركزي للتقييس والسيطرة النوعية.'
        },
        {
          label: 'إشعار تسليم موقع رسمي',
          badge: 'مشاريع ومواقع',
          senderName: 'دائرة المهندس المقيم - مشروع (................)',
          senderNumber: '784 / م',
          subject: 'م / محضر تسليم الموقع وتحديد نقطة الصفر (Benchmark)',
          notes: 'تم تثبيت محضر تسليم الموقع خالياً من التعارضات وجاهزاً لنزول الآليات الثقيلة والمباشرة بالحفريات.'
        }
      ]
    };
  }, []);

  const handleApplyTemplate = (tpl: any) => {
    if (activeTab === 'OUTGOING') {
      setOutDocNumber(generateCode('ص'));
      setOutRecipient(tpl.recipient || '');
      setOutSubject(tpl.subject || '');
      setOutContent(tpl.content || '');
      setOutAttachments(tpl.attachments || 'لا يوجد');
      setOutScannedUrls([]);
      setShowOutgoingModal(true);
    } else if (activeTab === 'INTERNAL_ORDER') {
      setOrderDocNumber(generateCode('أ.إ'));
      setOrderRecipient(tpl.recipient || 'إلى / كافة الأقسام والمشاريع والكوادر الهندسية');
      setOrderSubject(tpl.subject || 'م / أمر إداري');
      setOrderContent(tpl.content || '');
      setOrderAttachments(tpl.attachments || 'لا يوجد');
      setOrderScannedUrls([]);
      setShowOrderModal(true);
    } else if (activeTab === 'INCOMING') {
      setInDocNumber(generateCode('و'));
      setInSenderName(tpl.senderName || '');
      setInSenderNumber(tpl.senderNumber || '');
      setInSenderDate(new Date().toISOString().substring(0, 10));
      setInSubject(tpl.subject || '');
      setInNotes(tpl.notes || '');
      setInMainLetterUrl('');
      setInScannedUrls([]);
      setShowIncomingModal(true);
    }
  };

  const handleSingleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 900, 0.55);
      setter(compressed);
    } catch {
      alert('حدث خطأ أثناء قراءة الملف، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 900, 0.55);
        compressedList.push(compressed);
      }
      setter((prev) => [...prev, ...compressedList]);
    } catch {
      alert('حدث خطأ أثناء معالجة المرفقات.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const safeSaveToStorage = (updatedDocs: OfficialDoc[]) => {
    try {
      const lightStorageList = updatedDocs.slice(0, 30);
      localStorage.setItem('rtco_official_documents', JSON.stringify(lightStorageList));
      setDocuments(updatedDocs);
      return true;
    } catch {
      setDocuments(updatedDocs);
      return true;
    }
  };

  const handleSaveOutgoing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outRecipient.trim() || !outSubject.trim() || !outContent.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة للكتاب الصادر');
      return;
    }

    const newDoc: OfficialDoc = {
      id: `OUT-${Date.now()}`,
      type: 'OUTGOING',
      priority: outPriority,
      status: 'COMPLETED',
      docNumber: outDocNumber.trim(),
      docDate: outDocDate,
      partyName: outRecipient.trim(),
      subject: outSubject.trim(),
      content: outContent.trim(),
      attachments: outAttachments.trim(),
      carbonCopy: outCarbonCopy.trim(),
      signatoryTitle: outSignatoryTitle.trim(),
      signatoryName: outSignatoryName.trim(),
      scannedFileUrls: outScannedUrls,
      createdAt: new Date().toISOString()
    };

    const updated = [newDoc, ...documents];
    if (safeSaveToStorage(updated)) {
      await syncDocToCloud(newDoc);
      await pushSystemNotification(
        `كتاب صادر رسمي: ${newDoc.docNumber}`,
        `تم إصدار كتاب رسمي موجه إلى (${newDoc.partyName}) بموضوع: ${newDoc.subject}`,
        'ADMIN_DOCS',
        '/admin/documents',
        'ADD'
      );

      setShowOutgoingModal(false);
      setSelectedDocForPrint(newDoc);
      setOutDocNumber(generateCode('ص'));
      setOutRecipient('');
      setOutSubject('');
      setOutContent('');
      setOutScannedUrls([]);
    }
  };

  const handleSaveIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inSenderName.trim() || !inSubject.trim() || !inSenderNumber.trim()) {
      alert('يرجى ملء بيانات الجهة الوارد منها ورقم كتابها وتاريخه');
      return;
    }
    if (!inMainLetterUrl) {
      alert('يرجى تصوير أو رفع صورة الكتاب الرئيسي للصفحة الأولى');
      return;
    }

    const newDoc: OfficialDoc = {
      id: `INC-${Date.now()}`,
      type: 'INCOMING',
      priority: inPriority,
      status: 'COMPLETED',
      docNumber: inDocNumber.trim(),
      docDate: inDocDate,
      senderDocNumber: inSenderNumber.trim(),
      senderDocDate: inSenderDate,
      partyName: inSenderName.trim(),
      subject: inSubject.trim(),
      attachments: inAttachments.trim(),
      mainLetterUrl: inMainLetterUrl,
      scannedFileUrls: inScannedUrls,
      notes: inNotes.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = [newDoc, ...documents];
    if (safeSaveToStorage(updated)) {
      await syncDocToCloud(newDoc);
      await pushSystemNotification(
        `كتاب وارد جديد: ${newDoc.docNumber}`,
        `ورد كتاب رسمي من (${newDoc.partyName}) برقم كتابهم (${newDoc.senderDocNumber}) بموضوع: ${newDoc.subject}`,
        'ADMIN_DOCS',
        '/admin/documents',
        'ADD'
      );

      setShowIncomingModal(false);
      setSelectedDocForPrint(newDoc);
      setInDocNumber(generateCode('و'));
      setInSenderName('');
      setInSenderNumber('');
      setInSubject('');
      setInMainLetterUrl('');
      setInScannedUrls([]);
      setInNotes('');
    }
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSubject.trim() || !orderContent.trim()) {
      alert('يرجى ملء موضوع ونص الأمر الإداري');
      return;
    }

    const newDoc: OfficialDoc = {
      id: `ORD-${Date.now()}`,
      type: 'INTERNAL_ORDER',
      priority: 'NORMAL',
      status: 'COMPLETED',
      docNumber: orderDocNumber.trim(),
      docDate: orderDocDate,
      partyName: orderRecipient.trim(),
      subject: orderSubject.trim(),
      content: orderContent.trim(),
      attachments: orderAttachments.trim(),
      signatoryTitle: orderSignatoryTitle.trim(),
      signatoryName: orderSignatoryName.trim(),
      scannedFileUrls: orderScannedUrls,
      createdAt: new Date().toISOString()
    };

    const updated = [newDoc, ...documents];
    if (safeSaveToStorage(updated)) {
      await syncDocToCloud(newDoc);
      await pushSystemNotification(
        `أمر إداري داخلي: ${newDoc.docNumber}`,
        `تم إصدار أمر إداري جديد بموضوع: ${newDoc.subject}`,
        'ADMIN_DOCS',
        '/admin/documents',
        'ADD'
      );

      setShowOrderModal(false);
      setSelectedDocForPrint(newDoc);
      setOrderDocNumber(generateCode('أ.إ'));
      setOrderSubject('م / أمر إداري');
      setOrderContent('');
      setOrderScannedUrls([]);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    if (!docToDelete) return;

    const docTypeLabel = 
      docToDelete.type === 'OUTGOING' ? 'كتاب صادر' : 
      docToDelete.type === 'INCOMING' ? 'كتاب وارد' : 'أمر إداري';

    if (!confirm(`هل أنت متأكد من حذف ${docTypeLabel} ذي العدد (${docToDelete.docNumber}) من السجل العام؟`)) return;

    const updated = documents.filter(d => d.id !== id);
    if (safeSaveToStorage(updated)) {
      try {
        await fetch('/api/admin/system', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'DELETE_OFFICIAL_DOC', docId: id })
        });
      } catch {}

      await pushSystemNotification(
        `حذف ${docTypeLabel}: ${docToDelete.docNumber}`,
        `تم حذف ${docTypeLabel} ذي العدد (${docToDelete.docNumber}) والخاص بـ (${docToDelete.partyName}) بموضوع: ${docToDelete.subject}`,
        'ADMIN_DOCS',
        '/admin/documents',
        'DELETE'
      );
    }
  };

  // دالة تصدير ملف إكسل رسمي متعدد الأوراق بنظام XML SpreadsheetML الحقيقي
  const exportActiveTabExcel = () => {
    const outgoingDocs = documents.filter(d => d.type === 'OUTGOING');
    const incomingDocs = documents.filter(d => d.type === 'INCOMING');
    const orderDocs = documents.filter(d => d.type === 'INTERNAL_ORDER');

    const escapeXml = (unsafe: any) => {
      if (unsafe === null || unsafe === undefined) return '';
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const buildXmlWorksheet = (sheetName: string, titleArabic: string, headers: string[], rows: any[][]) => {
      let rowsXml = '';

      // سطر الترويسة 1: اسم الشركة الرسمي بحجم 16pt غامق ذهبي
      rowsXml += `
        <Row ss:Height="32">
          <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="sCompanyHeader">
            <Data ss:Type="String">شركة البرج المتألق للمقاولات العامة والاستثمارات العقارية والتجارة والنقل العام</Data>
          </Cell>
        </Row>
      `;

      // سطر الترويسة 2: عنوان السجل الحالي وتاريخ التصدير
      rowsXml += `
        <Row ss:Height="26">
          <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="sSubHeader">
            <Data ss:Type="String">${escapeXml(titleArabic)}  |  تاريخ التصدير: ${new Date().toISOString().substring(0, 10)}</Data>
          </Cell>
        </Row>
      `;

      // سطر فارغ فاصل
      rowsXml += `<Row ss:Height="12" />`;

      // سطر عناوين الأعمدة بحجم خط 14pt ولون كحلي
      rowsXml += `<Row ss:Height="28">`;
      headers.forEach(h => {
        rowsXml += `
          <Cell ss:StyleID="sColHeader">
            <Data ss:Type="String">${escapeXml(h)}</Data>
          </Cell>
        `;
      });
      rowsXml += `</Row>`;

      // سطور البيانات بحجم خط 14pt وتنسيق منسق
      if (rows.length === 0) {
        rowsXml += `
          <Row ss:Height="30">
            <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="sDataCenter">
              <Data ss:Type="String">لا توجد وثائق مسجلة في هذا السجل حالياً.</Data>
            </Cell>
          </Row>
        `;
      } else {
        rows.forEach((row, rIdx) => {
          const isEven = rIdx % 2 === 0;
          const styleId = isEven ? 'sDataRow' : 'sDataRowAlt';
          const styleIdCenter = isEven ? 'sDataCenter' : 'sDataCenterAlt';

          rowsXml += `<Row ss:Height="26">`;
          row.forEach((cellVal, cIdx) => {
            const isCenterCol = cIdx === 0 || cIdx === 1 || cIdx === 2;
            const targetStyle = isCenterCol ? styleIdCenter : styleId;
            rowsXml += `
              <Cell ss:StyleID="${targetStyle}">
                <Data ss:Type="String">${escapeXml(cellVal)}</Data>
              </Cell>
            `;
          });
          rowsXml += `</Row>`;
        });
      }

      return `
        <Worksheet ss:Name="${escapeXml(sheetName)}">
          <Table ss:DefaultColumnWidth="140" ss:DefaultRowHeight="24">
            <Column ss:Width="160" />
            <Column ss:Width="130" />
            <Column ss:Width="110" />
            <Column ss:Width="230" />
            <Column ss:Width="280" />
            <Column ss:Width="180" />
            <Column ss:Width="160" />
            ${rowsXml}
          </Table>
          <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
            <DisplayRightToLeft/>
            <Selected/>
            <Panes>
              <Pane>
                <Number>3</Number>
                <ActiveRow>1</ActiveRow>
              </Pane>
            </Panes>
            <ProtectObjects>False</ProtectObjects>
            <ProtectScenarios>False</ProtectScenarios>
          </WorksheetOptions>
        </Worksheet>
      `;
    };

    // إعداد بيانات السجلات الثلاثة
    const outgoingHeaders = ['العدد الإداري', 'تاريخ الصادر', 'درجة الأسبقية', 'الجهة الموجه إليها', 'موضوع الكتاب', 'المرفقات', 'الموقع على الكتاب'];
    const outgoingRows = outgoingDocs.map(d => [
      d.docNumber,
      d.docDate,
      d.priority === 'URGENT' ? 'عاجل وفوري' : d.priority === 'TOP_SECRET' ? 'سري وشخصي' : 'اعتيادي',
      d.partyName,
      d.subject,
      d.attachments || 'لا يوجد',
      d.signatoryName || 'المدير المفوض'
    ]);

    const incomingHeaders = ['رقم قيد الوارد', 'تاريخ الاستلام', 'عدد كتاب الجهة', 'تاريخ كتاب الجهة', 'الجهة الوارد منها', 'موضوع الكتاب', 'المرفقات'];
    const incomingRows = incomingDocs.map(d => [
      d.docNumber,
      d.docDate,
      d.senderDocNumber || '---',
      d.senderDocDate || '---',
      d.partyName,
      d.subject,
      d.attachments || 'لا يوجد'
    ]);

    const orderHeaders = ['رقم الأمر الإداري', 'تاريخ الأمر', 'الأسبقية', 'الجهة المعنية / الموجه إليها', 'موضوع القرار', 'المرفقات', 'الموقع'];
    const orderRows = orderDocs.map(d => [
      d.docNumber,
      d.docDate,
      'اعتيادي',
      d.partyName,
      d.subject,
      d.attachments || 'لا يوجد',
      d.signatoryName || 'المدير المفوض'
    ]);

    // تجميع مصنف الإكسل المتكامل والمتوافق مع أحدث معايير مايكروسوفت أوفيس
    const excelXmlWorkbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>شركة البرج المتألق</Author>
  <Company>Al Burj Al Mutalaa'iq Co</Company>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:ReadingOrder="RightToLeft" />
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Color="#0F172A" />
  </Style>
  <Style ss:ID="sCompanyHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#D97706" />
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid" />
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D97706" />
   </Borders>
  </Style>
  <Style ss:ID="sSubHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
   <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#334155" />
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid" />
  </Style>
  <Style ss:ID="sColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF" />
   <Interior ss:Color="#0F172A" ss:Pattern="Solid" />
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155" />
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155" />
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155" />
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155" />
   </Borders>
  </Style>
  <Style ss:ID="sDataRow">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" />
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Color="#0F172A" />
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid" />
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
   </Borders>
  </Style>
  <Style ss:ID="sDataRowAlt">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" />
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Color="#0F172A" />
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid" />
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
   </Borders>
  </Style>
  <Style ss:ID="sDataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#B45309" />
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid" />
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
   </Borders>
  </Style>
  <Style ss:ID="sDataCenterAlt">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" />
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#B45309" />
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid" />
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0" />
   </Borders>
  </Style>
 </Styles>
 ${buildXmlWorksheet('سجل الكتب الصادرة', 'سجل الكتب الرسمية الصادرة للشركة', outgoingHeaders, outgoingRows)}
 ${buildXmlWorksheet('سجل الكتب الواردة', 'سجل الكتب والمخاطبات الرسمية الواردة', incomingHeaders, incomingRows)}
 ${buildXmlWorksheet('سجل الأوامر الإدارية', 'سجل الأوامر والقرارات الإدارية الداخلية', orderHeaders, orderRows)}
</Workbook>`;

    const blob = new Blob([excelXmlWorkbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `أرشيف_الكتب_الرسمية_البرج_المتألق_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentTabDocs = useMemo(() => {
    return documents.filter(d => {
      if (d.type !== activeTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        d.docNumber.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        d.partyName.toLowerCase().includes(q) ||
        (d.senderDocNumber && d.senderDocNumber.toLowerCase().includes(q))
      );
    });
  }, [documents, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      outgoing: documents.filter(d => d.type === 'OUTGOING').length,
      incoming: documents.filter(d => d.type === 'INCOMING').length,
      internal: documents.filter(d => d.type === 'INTERNAL_ORDER').length
    };
  }, [documents]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AuthGuard moduleName="admin_docs" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        <style jsx global>{`
          @media screen and (max-width: 768px) {
            .print-official-sheet,
            .print-attachment-sheet {
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
            .print-official-sheet {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
              width: 210mm !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              padding: 0 !important;
              page-break-after: always !important;
            }
            .print-attachment-sheet {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
              width: 210mm !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              page-break-before: always !important;
              page-break-after: always !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
              align-items: center !important;
              padding: 10mm !important;
            }
          }
        `}</style>

        {/* الترويسة الرئيسية المحسنة بتصميم متناسق ومؤطر بالكامل */}
        <div className="max-w-7xl mx-auto pb-6 border-b border-slate-800/80 print:hidden print-hidden-element">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
            
            {/* الطرف الأيمن: الأيقونة والعنوان والشارة */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-3 rounded-2xl text-slate-950 font-black shadow-xl shadow-amber-500/20 shrink-0 flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                    إدارة الوثائق والكتب الرسمية
                  </h1>
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-3 py-1 rounded-full shadow-inner">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    مكتبة النماذج التخصصية ({documentTemplates[activeTab].length} نموذجاً)
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  شركة البرج المتألق • الصادر والوارد والأوامر الإدارية مع المزامنة السحابية الفورية
                </p>
              </div>
            </div>

            {/* الطرف الأيسر: شريط الإجراءات وأزرار التنقل في سطر واحد ثابت */}
            <div className="flex items-center gap-2 flex-nowrap shrink-0 self-end xl:self-auto overflow-x-auto">
              {canAdd && (
                <>
                  <button
                    onClick={() => {
                      setOutDocNumber(generateCode('ص'));
                      setOutScannedUrls([]);
                      setShowOutgoingModal(true);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> صادر جديد +
                  </button>

                  <button
                    onClick={() => {
                      setInDocNumber(generateCode('و'));
                      setInMainLetterUrl('');
                      setInScannedUrls([]);
                      setShowIncomingModal(true);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-sky-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
                  >
                    <Inbox className="w-4 h-4" /> وارد جديد +
                  </button>

                  <button
                    onClick={() => {
                      setOrderDocNumber(generateCode('أ.إ'));
                      setOrderScannedUrls([]);
                      setShowOrderModal(true);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4" /> أمر إداري +
                  </button>
                </>
              )}

              <button
                onClick={exportActiveTabExcel}
                className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer shadow-sm"
                title="تصدير السجل المفتوح حالياً إلى Excel"
              >
                <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
              </button>

              <Link
                href="/"
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" /> الرئيسية
              </Link>
            </div>

          </div>
        </div>

        {/* شريط النماذج والصيغ التخصصية الموسعة */}
        <div className="max-w-7xl mx-auto mt-6 print:hidden print-hidden-element bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-4 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              مكتبة النماذج والصيغ الرسمية الجاهزة ({activeTab === 'OUTGOING' ? 'كتب صادرة' : activeTab === 'INCOMING' ? 'كتب واردة' : 'أوامر إدارية'}):
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              انقر على أي نموذج ليتم استدعاؤه وملء الحقول والنص بالكامل فوراً
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            {documentTemplates[activeTab].map((tpl: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl text-right transition flex flex-col justify-between space-y-2 group cursor-pointer shadow-sm hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {tpl.badge}
                  </span>
                  <Zap className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs group-hover:text-amber-300 transition line-clamp-1">
                    {tpl.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {tpl.subject}
                  </p>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 pt-1 border-t border-slate-900">
                  <span>استدعاء النموذج</span>
                  <span>←</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {isCompressing && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-5 py-2 rounded-2xl shadow-2xl font-bold flex items-center gap-2 animate-bounce text-xs">
            <Sparkles className="w-4 h-4 animate-spin" /> جاري ضغط ومعالجة الصور المرفقة للحفاظ على السرعة والمساحة...
          </div>
        )}

        {/* تبويبات السجلات */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 print:hidden print-hidden-element bg-slate-900/80 border border-slate-800 p-2.5 rounded-3xl">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('OUTGOING')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'OUTGOING'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Send className="w-4 h-4" /> سجل الكتب الصادرة ({counts.outgoing})
            </button>

            <button
              onClick={() => setActiveTab('INCOMING')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'INCOMING'
                  ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Inbox className="w-4 h-4" /> سجل الكتب الواردة والسكنر ({counts.incoming})
            </button>

            <button
              onClick={() => setActiveTab('INTERNAL_ORDER')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'INTERNAL_ORDER'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-4 h-4" /> سجل الأوامر الإدارية ({counts.internal})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث في هذا السجل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
            />
          </div>
        </div>

        {/* جدول السجل النشط */}
        <div className="max-w-7xl mx-auto mt-4 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl print:hidden print-hidden-element">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3.5">العدد الإداري</th>
                  <th className="p-3.5">تاريخ التوثيق</th>
                  {activeTab === 'INCOMING' && (
                    <>
                      <th className="p-3.5">عدد كتاب الجهة</th>
                      <th className="p-3.5">تاريخ كتاب الجهة</th>
                    </>
                  )}
                  <th className="p-3.5">{activeTab === 'INCOMING' ? 'من / الجهة الوارد منها' : 'إلى / الجهة المعنية'}</th>
                  <th className="p-3.5">الموضوع</th>
                  <th className="p-3.5">المرفقات</th>
                  <th className="p-3.5 text-center">المستندات والصفحات</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {currentTabDocs.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'INCOMING' ? 9 : 7} className="p-10 text-center text-slate-500 font-sans">
                      لا توجد وثائق مسجلة في هذا السجل حالياً.
                    </td>
                  </tr>
                ) : (
                  currentTabDocs.map((doc) => {
                    const totalPages = (doc.mainLetterUrl ? 1 : 0) + (doc.scannedFileUrls ? doc.scannedFileUrls.length : 0);

                    return (
                      <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono font-bold text-amber-400">{doc.docNumber}</td>
                        <td className="p-3.5 font-mono text-slate-400">{doc.docDate}</td>
                        
                        {activeTab === 'INCOMING' && (
                          <>
                            <td className="p-3.5 font-mono font-bold text-sky-400">{doc.senderDocNumber || '---'}</td>
                            <td className="p-3.5 font-mono text-slate-400">{doc.senderDocDate || '---'}</td>
                          </>
                        )}

                        <td className="p-3.5 font-bold text-white max-w-[180px] truncate">{doc.partyName}</td>
                        <td className="p-3.5 text-slate-300 font-semibold max-w-[220px] truncate">{doc.subject}</td>
                        <td className="p-3.5 text-slate-400 max-w-[140px] truncate">{doc.attachments || 'لا يوجد'}</td>

                        <td className="p-3.5 text-center">
                          {totalPages > 0 ? (
                            <button
                              onClick={() => setSelectedDocForPrint(doc)}
                              className="px-2.5 py-1 bg-sky-500/15 text-sky-300 hover:bg-sky-500 hover:text-white rounded-lg border border-sky-500/30 transition text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" /> ({totalPages}) صفحات
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[11px]">بدون ملفات</span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedDocForPrint(doc)}
                              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-xl border border-amber-500/30 font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                              title="معاينة وطباعة الكتاب مع المرفقات"
                            >
                              <Printer className="w-3.5 h-3.5" /> تصفح ومعاينة
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/30 transition cursor-pointer"
                                title="حذف الوثيقة"
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

        {/* نافذة إنشاء كتاب صادر */}
        {showOutgoingModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-6 shadow-2xl text-right space-y-4 my-8 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">تحرير كتاب صادر رسمي (إرفاق صور ومستندات متعددة)</h3>
                    <p className="text-[11px] text-slate-400">ستطبع المرفقات في صفحات ثانية ولاحقة مستقلة وبدقة عالية وكبيرة</p>
                  </div>
                </div>
                <button onClick={() => setShowOutgoingModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveOutgoing} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">عدد كتاب الصادر *</label>
                    <input
                      type="text"
                      required
                      value={outDocNumber}
                      onChange={(e) => setOutDocNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">تاريخ الصادر *</label>
                    <input
                      type="date"
                      required
                      value={outDocDate}
                      onChange={(e) => setOutDocDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">درجة الأسبقية</label>
                    <select
                      value={outPriority}
                      onChange={(e) => setOutPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    >
                      <option value="NORMAL">اعتيادي</option>
                      <option value="URGENT">عاجل وفوري</option>
                      <option value="TOP_SECRET">سري وشخصي</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">إلى / الجهة الموجه إليها الكتاب الصادر *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إلى / ديوان محافظة النجف الأشرف - قسم العقود والإعمار"
                    value={outRecipient}
                    onChange={(e) => setOutRecipient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">م / موضوع الكتاب الصادر *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: م / طلب فحص ومعالجة موقعية"
                    value={outSubject}
                    onChange={(e) => setOutSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">نص ومضمون الكتاب الصادر يدوياً *</label>
                  <textarea
                    rows={7}
                    required
                    placeholder="اكتب تفاصيل المخاطبة الرسمية هنا..."
                    value={outContent}
                    onChange={(e) => setOutContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none resize-none leading-relaxed text-xs"
                  />
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1 text-xs">
                      <Paperclip className="w-4 h-4" /> إرفاق مستندات وصفحات المرفقات:
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      تم إدراج ({outScannedUrls.length}) صفحات مرفقة
                    </span>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={outCameraRef}
                    onChange={(e) => handleMultipleFilesUpload(e, setOutScannedUrls)}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    ref={outFileRef}
                    onChange={(e) => handleMultipleFilesUpload(e, setOutScannedUrls)}
                    className="hidden"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => outCameraRef.current?.click()}
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-sky-400" /> + تصوير صفحة بالكاميرا (موبايل)
                    </button>
                    <button
                      type="button"
                      onClick={() => outFileRef.current?.click()}
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" /> + اختيار وتحديد عدة صور معاً (حاسبة/استوديو)
                    </button>
                  </div>

                  {outScannedUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {outScannedUrls.map((url, idx) => (
                        <div key={idx} className="relative bg-slate-900 p-2 rounded-xl border border-slate-700 group flex flex-col items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`مرفق ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <span className="text-[10px] text-slate-300 mt-1 font-bold">صفحة مرفق #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx, setOutScannedUrls)}
                            className="absolute top-1 left-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow cursor-pointer"
                            title="حذف هذا المرفق"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المرفقات (بيان نصي في ذيل الصفحة الأولى)</label>
                    <input
                      type="text"
                      placeholder="مثال: طياً تقرير الفحص الفني وجدول الكميات"
                      value={outAttachments}
                      onChange={(e) => setOutAttachments(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نسخة منه إلى</label>
                    <input
                      type="text"
                      placeholder="مثال: مكتب المدير المفوض / الإدارة المالية / الأرشيف"
                      value={outCarbonCopy}
                      onChange={(e) => setOutCarbonCopy(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">اسم الشخص الموقّع *</label>
                    <input
                      type="text"
                      required
                      value={outSignatoryName}
                      onChange={(e) => setOutSignatoryName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الصفة الوظيفية *</label>
                    <input
                      type="text"
                      required
                      value={outSignatoryTitle}
                      onChange={(e) => setOutSignatoryTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowOutgoingModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer">
                    اعتماد وإصدار الكتاب الصادر مع المرفقات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة تسجيل كتاب وارد */}
        {showIncomingModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-6 shadow-2xl text-right space-y-4 my-8 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">تسجيل كتاب وارد (الكتاب الرئيسي + المرفقات المتعددة)</h3>
                    <p className="text-[11px] text-slate-400">سيدرج الكتاب الرئيسي داخل إطار الصفحة الأولى، وتدرج كافة المرفقات في الصفحات اللاحقة</p>
                  </div>
                </div>
                <button onClick={() => setShowIncomingModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveIncoming} className="space-y-4 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <span className="font-bold text-amber-400 block text-xs">بيانات قيد الوارد لدى شركة البرج المتألق:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">رقم قيد الوارد (العدد) *</label>
                      <input
                        type="text"
                        required
                        value={inDocNumber}
                        onChange={(e) => setInDocNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">تاريخ استلام الوارد *</label>
                      <input
                        type="date"
                        required
                        value={inDocDate}
                        onChange={(e) => setInDocDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-sky-500/30 space-y-2.5">
                  <span className="font-bold text-sky-400 block text-xs">بيانات كتاب الجهة المرسلة (الأصلية):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">عدد كتاب الجهة المرسلة *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: 5432 / أ"
                        value={inSenderNumber}
                        onChange={(e) => setInSenderNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">تاريخ كتاب الجهة المرسلة *</label>
                      <input
                        type="date"
                        required
                        value={inSenderDate}
                        onChange={(e) => setInSenderDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">من / اسم الجهة الوارد منها الكتاب *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: محافظة النجف الأشرف - هيئة الإعمار والتطوير"
                      value={inSenderName}
                      onChange={(e) => setInSenderName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">م / موضوع الكتاب الوارد *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: م / المصادقة على المخططات الفنية"
                      value={inSubject}
                      onChange={(e) => setInSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المرفقات الواردة مع الكتاب (بيان نصي)</label>
                    <input
                      type="text"
                      placeholder="مثال: طياً قرص ليزري + 3 مخططات"
                      value={inAttachments}
                      onChange={(e) => setInAttachments(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border-2 border-sky-500/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sky-400 flex items-center gap-1.5 text-xs">
                      <Camera className="w-4 h-4" /> (1) صورة الكتاب الوارد الرئيسي (سيدرج في الصفحة الأولى) *
                    </span>
                    {inMainLetterUrl && (
                      <button
                        type="button"
                        onClick={() => setInMainLetterUrl('')}
                        className="text-rose-400 hover:underline text-[11px]"
                      >
                        إلغاء الكتاب الرئيسي ✕
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={inMainCameraRef}
                    onChange={(e) => handleSingleFileUpload(e, setInMainLetterUrl)}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    ref={inMainFileRef}
                    onChange={(e) => handleSingleFileUpload(e, setInMainLetterUrl)}
                    className="hidden"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => inMainCameraRef.current?.click()}
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-sky-400" /> تصوير الكتاب الرئيسي بالكاميرا (موبايل)
                    </button>

                    <button
                      type="button"
                      onClick={() => inMainFileRef.current?.click()}
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-sky-400" /> رفع صورة الكتاب الرئيسي سكنر (حاسبة)
                    </button>
                  </div>

                  {inMainLetterUrl && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-sky-500/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={inMainLetterUrl} alt="الكتاب الرئيسي" className="w-14 h-14 object-cover rounded-lg border border-slate-700" />
                        <div>
                          <p className="text-white font-bold text-xs">تم تحديد صورة الكتاب الرئيسي للصفحة الأولى ✓</p>
                          <p className="text-[11px] text-emerald-400">جاهز للتضمين المباشر في الإطار الرسمي</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewScannedImage(inMainLetterUrl)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        معاينة
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                      <Paperclip className="w-4 h-4" /> (2) مرفقات الكتاب الوارد:
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({inScannedUrls.length}) مرفقات مضافة
                    </span>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={inAttCameraRef}
                    onChange={(e) => handleMultipleFilesUpload(e, setInScannedUrls)}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    ref={inAttFileRef}
                    onChange={(e) => handleMultipleFilesUpload(e, setInScannedUrls)}
                    className="hidden"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => inAttCameraRef.current?.click()}
                      className="p-3.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" /> + تصوير صفحة مرفقة بالكاميرا (موبايل)
                    </button>

                    <button
                      type="button"
                      onClick={() => inAttFileRef.current?.click()}
                      className="p-3.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" /> + اختيار وتحديد عدة صور معاً (حاسبة/استوديو)
                    </button>
                  </div>

                  {inScannedUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {inScannedUrls.map((url, idx) => (
                        <div key={idx} className="relative bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`مرفق ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <span className="text-[10px] text-slate-300 mt-1 font-bold">صفحة مرفق #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx, setOrderScannedUrls)}
                            className="absolute top-1 left-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow cursor-pointer"
                            title="حذف هذا المرفق"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ملاحظات وتوجيه الإدارة بخصوص الكتاب الوارد</label>
                  <textarea
                    rows={2}
                    placeholder="التوجيه الإداري، المتابعة الميدانية..."
                    value={inNotes}
                    onChange={(e) => setInNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none resize-none text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowIncomingModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer">
                    حفظ وأرشفة الكتاب الوارد
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة إنشاء أمر إداري */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-6 shadow-2xl text-right space-y-4 my-8 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">إصدار أمر إداري داخلي</h3>
                    <p className="text-[11px] text-slate-400">تشكيل لجان، استلام مواقع، وتكليف مهندسين</p>
                  </div>
                </div>
                <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">العدد (رقم الأمر الإداري) *</label>
                    <input
                      type="text"
                      required
                      value={orderDocNumber}
                      onChange={(e) => setOrderDocNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">التاريخ الرسمي *</label>
                    <input
                      type="date"
                      required
                      value={orderDocDate}
                      onChange={(e) => setOrderDocDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">إلى / الجهة الموجه إليها الأمر *</label>
                  <input
                    type="text"
                    required
                    value={orderRecipient}
                    onChange={(e) => setOrderRecipient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">م / موضوع الأمر الإداري *</label>
                  <input
                    type="text"
                    required
                    value={orderSubject}
                    onChange={(e) => setOrderSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-emerald-300 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">نص وقرار الأمر الإداري *</label>
                  <textarea
                    rows={8}
                    required
                    placeholder="اكتب تفاصيل القرار الإداري والتكليف هنا..."
                    value={orderContent}
                    onChange={(e) => setOrderContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none resize-none leading-relaxed text-xs"
                  />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1 text-xs">
                      <Paperclip className="w-4 h-4" /> إرفاق مستندات طي الأمر الإداري:
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({orderScannedUrls.length}) صفحات
                    </span>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={orderCameraRef}
                    onChange={(e) => handleMultipleFilesUpload(e, setOrderScannedUrls)}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    ref={orderFileRef}
                    onChange={(e) => handleMultipleFilesUpload(e, setOrderScannedUrls)}
                    className="hidden"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => orderCameraRef.current?.click()}
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-sky-400" /> + تصوير مرفق بالكاميرا (موبايل)
                    </button>
                    <button
                      type="button"
                      onClick={() => orderFileRef.current?.click()}
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 font-bold transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" /> + رفع عدة صور معاً (حاسبة/استوديو)
                    </button>
                  </div>

                  {orderScannedUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {orderScannedUrls.map((url, idx) => (
                        <div key={idx} className="relative bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`مرفق ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <span className="text-[10px] text-slate-300 mt-1 font-bold">صفحة مرفق #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx, setOrderScannedUrls)}
                            className="absolute top-1 left-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow cursor-pointer"
                            title="حذف هذا المرفق"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الموقّع على الأمر *</label>
                    <input
                      type="text"
                      required
                      value={orderSignatoryName}
                      onChange={(e) => setOrderSignatoryName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الصفة الوظيفية *</label>
                    <input
                      type="text"
                      required
                      value={orderSignatoryTitle}
                      onChange={(e) => setOrderSignatoryTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer">
                    اعتماد وإصدار الأمر الإداري A4
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* تكبير المرفق */}
        {viewScannedImage && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 p-2 rounded-2xl border border-slate-700 flex flex-col items-center">
              <button
                onClick={() => setViewScannedImage(null)}
                className="absolute -top-4 -right-4 bg-rose-600 text-white p-2 rounded-full shadow-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewScannedImage} alt="المستند الممسوح ضوئياً" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            </div>
          </div>
        )}

        {/* ورقة المعاينة والطباعة الكاملة */}
        {selectedDocForPrint && (() => {
          const doc = selectedDocForPrint;
          const isIncoming = doc.type === 'INCOMING';
          const isOrder = doc.type === 'INTERNAL_ORDER';
          
          const activeOrigin = typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : (siteOrigin || 'https://rtco2025.netlify.app');

          const verificationUrl = `${activeOrigin}/verify?type=doc&no=${encodeURIComponent(doc.docNumber)}`;
          const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}`;
          const attachmentsList = doc.scannedFileUrls || [];

          return (
            <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-2 sm:p-4 md:p-8 print:p-0 print:bg-white print:static print:overflow-visible">
              
              <div className="sticky top-0 z-50 w-full max-w-[210mm] flex flex-col sm:flex-row items-center justify-between bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 sm:px-5 sm:py-3 rounded-2xl mb-4 sm:mb-6 shadow-2xl print:hidden print-hidden-element gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> أمر الطباعة الآن (Print A4)
                  </button>

                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md py-1">
                    <button
                      onClick={() => scrollToSection('page-first')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold shrink-0 border border-slate-700 cursor-pointer"
                    >
                      {isIncoming ? 'الكتاب الرئيسي (ص 1)' : 'الكتاب الصادر'}
                    </button>
                    {attachmentsList.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => scrollToSection(`att-${i}`)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-bold shrink-0 border border-slate-700 cursor-pointer"
                      >
                        مرفق #{i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-xs text-slate-300 font-bold hidden md:inline">
                    إجمالي الصفحات: {attachmentsList.length + 1}
                  </span>
                  <button
                    onClick={() => setSelectedDocForPrint(null)}
                    className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white p-2 rounded-xl transition border border-slate-700 cursor-pointer"
                    title="إغلاق المعاينة"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* حاوية متجاوبة بعرض قياسي A4 موحد لجميع الشاشات */}
              <div className="w-full max-w-[210mm] overflow-x-auto pb-6">
                <div className="w-full min-w-[720px] sm:min-w-0 flex flex-col items-center space-y-8 print:space-y-0">
                  <div 
                    id="page-first"
                    className="print-official-sheet w-full bg-white text-slate-950 shadow-2xl print:shadow-none relative overflow-hidden font-sans flex flex-col justify-between min-h-[1120px] border border-slate-300 print:border-none print:m-0 print:p-0"
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      <div className="w-[460px] h-[460px] rounded-full border-[6px] border-[#e2e8f0] flex flex-col items-center justify-center opacity-25 relative p-6">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Image 
                            src="/logo.png" 
                            alt="شركة البرج المتألق" 
                            width={270} 
                            height={270} 
                            className="object-contain grayscale opacity-60" 
                            priority 
                          />
                        </div>
                        <div className="text-center mt-44 text-[#64748b] text-[11px] font-bold tracking-wider">
                          Al Burj Al Mutalaa'iq General Contracting Company
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col flex-1">
                      <div className="h-6 w-full bg-[#71717a]"></div>

                      {/* الترويسة المحدثة والمطابقة للصورة المطلوبة تماماً */}
                      <div className="px-10 pt-4 pb-3 flex items-center justify-between border-b border-slate-200">
                        <div className="text-right flex-1 font-sans">
                          <h1 className="text-xl md:text-2xl font-black text-[#d97706] tracking-wide leading-none">
                            شركة البرج المتألق
                          </h1>
                          <p className="text-[10px] font-black text-slate-900 tracking-wide mt-1.5 leading-snug">
                            للمقاولات العامة والاستثمارات العقارية<br />والتجارة العامة والنقل العام
                          </p>
                        </div>

                        <div className="w-20 h-20 relative flex items-center justify-center shrink-0 mx-4">
                          <Image 
                            src="/logo.png" 
                            alt="شعار شركة البرج المتألق" 
                            width={75} 
                            height={75} 
                            className="object-contain" 
                            priority 
                          />
                        </div>

                        <div className="text-left flex-1 font-sans text-[10px] text-slate-700 leading-tight space-y-0.5">
                          <p className="font-bold text-slate-900 text-[11px]">Resplendently Tower Co</p>
                          <p className="text-[#d97706] font-semibold">General Contracting</p>
                          <p className="text-[#d97706] font-semibold">General Trading</p>
                          <p className="text-[#d97706] font-semibold">General Transport</p>
                          <p className="text-[#d97706] font-semibold">Real Estate Investments</p>
                        </div>
                      </div>

                      <div className="mx-10 mt-3 bg-[#e4e4e7] px-6 py-2 rounded-sm flex items-center justify-between font-black text-xs text-slate-900 border border-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold">{isIncoming ? 'تاريخ استلام الوارد :' : 'التاريخ :'}</span>
                          <span className="font-mono text-sm tracking-widest">{doc.docDate}</span>
                        </div>

                        <div className="border border-slate-800 bg-white text-slate-950 px-3 py-0.5 rounded text-[11px] font-black">
                          {isIncoming ? 'سجل الكتب الواردة' : isOrder ? 'أمر إداري داخلي' : 'كتاب صادر رسمي'}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold">{isIncoming ? 'رقم قيد الوارد :' : 'الـعــدد :'}</span>
                          <span className="font-mono text-sm tracking-wider">{doc.docNumber}</span>
                        </div>
                      </div>

                      {isIncoming && (
                        <div className="mx-10 mt-3 p-3 bg-slate-50 border border-slate-300 rounded-xl grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <span className="text-slate-500 block text-[11px]">عدد كتاب الجهة المرسلة:</span>
                            <strong className="font-mono text-slate-950 text-sm">{doc.senderDocNumber || '---'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">تاريخ كتاب الجهة المرسلة:</span>
                            <strong className="font-mono text-slate-950 text-sm">{doc.senderDocDate || '---'}</strong>
                          </div>
                        </div>
                      )}

                      <div className="px-14 py-4 space-y-4 flex-1 text-slate-900 flex flex-col">
                        <div className="text-center font-black text-base text-slate-950 pt-2">
                          {isIncoming ? `من / ${doc.partyName}` : `إلى / ${doc.partyName}`}
                        </div>

                        <div className="text-center font-black text-sm text-slate-900 pt-1">
                          <span className="border-b-2 border-slate-900 pb-0.5 px-4 inline-block">
                            {doc.subject}
                          </span>
                        </div>

                        {!isIncoming && doc.content && (
                          <div className="text-[14px] leading-[2.6] font-medium text-slate-900 text-justify whitespace-pre-line pt-2">
                            {doc.content}
                          </div>
                        )}

                        {isIncoming && doc.mainLetterUrl && (
                          <div className="w-full flex-1 flex flex-col items-center justify-center p-2 relative group min-h-[580px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={doc.mainLetterUrl} 
                              alt="الكتاب الوارد الرئيسي" 
                              className="max-h-[640px] max-w-full w-auto h-auto object-contain rounded-xl border-2 border-slate-300 shadow-md"
                            />
                            <button
                              onClick={() => setViewScannedImage(doc.mainLetterUrl!)}
                              className="absolute bottom-3 left-3 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur print:hidden cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-sky-400" /> عرض الكتاب بالحجم الكامل
                            </button>
                          </div>
                        )}

                        {!isIncoming && (
                          <>
                            <div className="text-center pt-6 text-base font-black text-slate-900">
                              ... مع فائق الشكر والتقدير
                            </div>

                            <div className="flex justify-between items-end pt-4 px-2">
                              <div className="flex flex-col items-center">
                                <div className="w-16 h-16 border border-slate-300 rounded-lg p-1 bg-white flex items-center justify-center shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={qrCodeApiUrl} alt="باركود التحقق" className="w-full h-full object-contain" />
                                </div>
                                <span className="font-mono text-[9px] text-slate-500 mt-1">DOC VERIFIED</span>
                              </div>

                              <div className="text-center space-y-1 min-w-[220px]">
                                <p className="font-black text-base text-slate-950">{doc.signatoryName}</p>
                                <p className="text-xs font-bold text-slate-700">{doc.signatoryTitle}</p>
                                <p className="text-[11px] text-slate-500">شركة البرج المتألق</p>
                                
                                <div className="h-16 flex items-center justify-center relative">
                                  <div className="border-2 border-dashed border-red-700/60 rounded-full w-20 h-20 flex flex-col items-center justify-center rotate-[-12deg] p-1 text-red-700/80 pointer-events-none absolute">
                                    <span className="text-[8px] font-black">البرج المتألق</span>
                                    <span className="text-[7px] font-bold">مصادق رسمياً</span>
                                    <span className="text-[7px] font-mono">{doc.docDate}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                      </div>
                    </div>

                    {/* الجزء الثابت أسفل الصفحة (المرفقات ونسخة منه إلى) */}
                    <div className="relative z-10 w-full bg-white mt-auto">
                      <div className="mx-10 pt-3 pb-2 border-t border-slate-300 text-[11px] text-slate-700 space-y-1 font-medium">
                        <div className="flex items-center justify-between">
                          <p>
                            <strong>المرفقات: </strong> {doc.attachments || 'لا يوجد'} 
                            {attachmentsList.length > 0 && ` (مرفق طياً في الصفحات التالية عدد ${attachmentsList.length} صفحة)`}
                          </p>
                          {attachmentsList.length > 0 && (
                            <button
                              onClick={() => scrollToSection('att-0')}
                              className="text-amber-700 font-bold hover:underline flex items-center gap-1 print:hidden cursor-pointer"
                            >
                              <span>تصفح المرفقات في الصفحات التالية</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {doc.carbonCopy && (
                          <p><strong>نسخة منه إلى: </strong> {doc.carbonCopy}</p>
                        )}
                      </div>

                      <div className="px-10 pb-3 flex items-center justify-between text-xs font-bold text-slate-800 border-t border-slate-200 pt-2">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 dir-ltr">
                          <div className="w-6 h-6 rounded-md bg-[#27272a] text-white flex items-center justify-center shrink-0">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <span className="hover:underline">{activeOrigin}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-800">
                          <div className="w-6 h-6 rounded-md bg-[#27272a] text-white flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span>العراق - النجف الأشرف - حي الفرات</span>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800">
                          <div className="w-6 h-6 rounded-md bg-[#27272a] text-white flex items-center justify-center shrink-0">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold">07868006699 - 07737006699</span>
                        </div>
                      </div>

                      <div className="h-1 w-full bg-[#71717a] mb-2"></div>

                      <div className="relative h-12 w-full">
                        <div className="absolute bottom-0 left-0 w-32 h-10 bg-[#ea580c] rounded-tr-[50px] opacity-90"></div>
                        <div className="absolute bottom-0 right-0 w-36 h-12 bg-[#f97316] rounded-tl-[70px]"></div>
                      </div>
                    </div>

                  </div>

                  {attachmentsList.map((attUrl, aIdx) => (
                    <div 
                      id={`att-${aIdx}`}
                      key={aIdx} 
                      className="print-attachment-sheet w-full bg-white text-slate-950 shadow-2xl print:shadow-none relative overflow-hidden font-sans p-6 md:p-10 border border-slate-300 flex flex-col justify-start items-center min-h-[1120px] print:border-none print:m-0"
                    >
                      <div className="w-full flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative flex items-center justify-center">
                            <Image src="/logo.png" alt="شركة البرج المتألق" width={40} height={40} className="object-contain" priority />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm">شركة البرج المتألق للمقاولات العامة</h4>
                            <p className="text-[10px] text-amber-700 font-bold">ملف مرفق طي الوثيقة الرسمية</p>
                          </div>
                        </div>

                        <div className="text-left font-mono text-xs space-y-0.5">
                          <span className="bg-slate-950 text-white px-2.5 py-0.5 rounded font-bold text-[10px]">
                            صفحة المرفق ({aIdx + 1} من {attachmentsList.length})
                          </span>
                          <p className="text-[10px] text-slate-600 font-sans">
                            تابع للوثيقة: <strong className="font-mono text-slate-900">{doc.docNumber}</strong> بتاريخ: <strong className="font-mono">{doc.docDate}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="w-full flex-1 flex flex-col items-center justify-center p-2 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={attUrl} 
                          alt={`مرفق ${aIdx + 1}`} 
                          className="max-w-full max-h-[920px] w-auto h-auto object-contain border border-slate-200 rounded-xl shadow-lg"
                        />
                        
                        <button
                          onClick={() => setViewScannedImage(attUrl)}
                          className="absolute bottom-4 left-4 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur print:hidden cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-sky-400" /> عرض بدقة الشاشة الكاملة
                        </button>
                      </div>

                      <div className="w-full text-center text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-3 mt-4 flex items-center justify-between">
                        <span>وثيقة مؤرشفة إلكترونياً • نظام الأرشفة والوثائق المركزي</span>
                        <span>صفحة مرفق تابعة للمخاطبة</span>
                      </div>
                    </div>
                  ))}

                </div>
              </div>

              <div className="h-16 print:hidden print-hidden-element"></div>

            </div>
          );
        })()}

      </div>
    </AuthGuard>
  );
}