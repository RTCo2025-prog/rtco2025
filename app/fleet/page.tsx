'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  MapPin, 
  Gauge, 
  Fuel, 
  Wrench, 
  User, 
  LogOut, 
  Navigation, 
  X, 
  RefreshCw, 
  Trash2, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  FileText, 
  ExternalLink, 
  TrendingUp, 
  Receipt, 
  Wallet, 
  Coins, 
  ShieldCheck, 
  PieChart,
  Compass,
  CheckCircle2,
  Timer
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function calculateTripProgress(departureTimeStr: string, estimatedHours: number) {
  if (!departureTimeStr || !estimatedHours || estimatedHours <= 0) {
    return { progressPct: 0, elapsedHours: 0, remainingHours: 0, isLate: false };
  }

  const depTime = new Date(departureTimeStr).getTime();
  const now = new Date().getTime();
  const elapsedMs = Math.max(0, now - depTime);
  const elapsedHours = Number((elapsedMs / (1000 * 60 * 60)).toFixed(1));
  const totalHours = Number(estimatedHours);

  let progressPct = Math.min(100, Math.round((elapsedHours / totalHours) * 100));
  const remainingHours = Number(Math.max(0, totalHours - elapsedHours).toFixed(1));
  const isLate = elapsedHours > totalHours;

  if (isLate) progressPct = 100;

  return { progressPct, elapsedHours, remainingHours, isLate };
}

function getCurrentDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function openGoogleMapsDirections(origin: string, destination: string) {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin + ', العراق')}&destination=${encodeURIComponent(destination + ', العراق')}&travelmode=driving`;
  window.open(url, '_blank');
}

export default function FleetPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [activeTab, setActiveTab] = useState<'VEHICLES' | 'FINANCES' | 'MAINTENANCE'>('VEHICLES');

  // نماذج الإدخال
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vehicleName, setVehicleName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('شاحنة نقل ثقيل (قلاب)');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState('النجف الأشرف - ساحة الآليات');
  const [currentMileage, setCurrentMileage] = useState('');
  const [oilInterval, setOilInterval] = useState('5000');
  const [ownershipType, setOwnershipType] = useState<'COMPANY' | 'RENTED'>('COMPANY');

  // نموذج بدء رحلة جديدة (داخلي / مستأجر)
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [truckSourceType, setTruckSourceType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [selectedVehicleForTrip, setSelectedVehicleForTrip] = useState('');
  const [externalTruckInfo, setExternalTruckInfo] = useState('');
  const [externalDriverName, setExternalDriverName] = useState('');
  const [externalDriverPhone, setExternalDriverPhone] = useState('');
  const [externalRentalCost, setExternalRentalCost] = useState('180000');

  const [cargoDesc, setCargoDesc] = useState('');
  const [origin, setOrigin] = useState('ميناء أم قصر - البصرة');
  const [destination, setDestination] = useState('النجف الأشرف - المقر الرئيسي');
  const [cargoWeight, setCargoWeight] = useState('30');
  const [estimatedHours, setEstimatedHours] = useState('6');
  const [departureDateTime, setDepartureDateTime] = useState(getCurrentDateTimeLocal());
  const [tripCost, setTripCost] = useState('250000');
  const [manifestUrl, setManifestUrl] = useState('');

  // نموذج قيد صيانة ووقود
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintVehicleId, setMaintVehicleId] = useState('');
  const [maintType, setMaintType] = useState<'OIL_CHANGE' | 'FUEL' | 'REPAIR' | 'TIRES'>('OIL_CHANGE');
  const [maintDesc, setMaintDesc] = useState('تبديل دهن وفلتر المحرك الأصلي');
  const [maintCost, setMaintCost] = useState('120000');
  const [maintMileage, setMaintMileage] = useState('');
  const [maintPerformedBy, setMaintPerformedBy] = useState('ورشة الشركة المركزية');

  // نموذج تحديث حالة الآلية
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [updateStatus, setUpdateStatus] = useState('AVAILABLE');
  const [updateLocation, setUpdateLocation] = useState('');
  const [updateMileage, setUpdateMileage] = useState('');
  const [updateFuel, setUpdateFuel] = useState('80');

  // تقرير الطباعة
  const [showReportModal, setShowReportModal] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch('/api/fleet', { cache: 'no-store' });
      const data = await res.json();
      if (data.vehicles) setVehicles(data.vehicles);
      if (data.trips) setTrips(data.trips);
      if (data.maintenance) setMaintenanceLogs(data.maintenance);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setCurrentUser(u);
        setAssignedDriver(u.full_name || '');

        const r = String(u.role || '').toUpperCase();
        if (r === 'CAPTAIN' || r.includes('كابتن')) {
          router.push('/fleet/captain');
          return;
        }
      } catch {}
    }
    loadData();

    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    router.push('/login');
  };

  // فحص صلاحيات هذا المستخدم بدقة لقسم النقل والأسطول
  const canAdd = useMemo(() => {
    return hasPermission(currentUser, 'fleet', 'add');
  }, [currentUser]);

  const canEdit = useMemo(() => {
    return hasPermission(currentUser, 'fleet', 'edit');
  }, [currentUser]);

  const canDelete = useMemo(() => {
    return hasPermission(currentUser, 'fleet', 'delete');
  }, [currentUser]);

  const canManageVouchers = useMemo(() => {
    return hasPermission(currentUser, 'vouchers', 'add') || canAdd;
  }, [currentUser, canAdd]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية إضافة آليات جديدة');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_VEHICLE',
          vehicle_name: vehicleName,
          plate_number: plateNumber,
          vehicle_type: vehicleType,
          ownership_type: ownershipType,
          assigned_driver: assignedDriver,
          driver_phone: driverPhone,
          current_location: currentLocation,
          current_mileage: currentMileage,
          oil_change_interval_km: oilInterval
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.vehicle) {
          setVehicles(prev => [data.vehicle, ...prev]);
        }
        setShowAddVehicleModal(false);
        setVehicleName('');
        setPlateNumber('');
        setCurrentMileage('');
        await loadData();
      } else {
        alert(data.error || 'فشلت إضافة المركبة');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (v: any) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الآليات');
      return;
    }
    const vId = v.vehicle_id || v.id;
    if (!confirm(`هل أنت متأكد من حذف الشاحنة (${v.vehicle_name} - ${v.plate_number}) نهائياً؟`)) return;

    try {
      const res = await fetch(`/api/fleet?id=${vId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadData();
      } else {
        alert(data.error || 'فشل حذف الشاحنة');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTrip = async (t: any) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف سجل الرحلات');
      return;
    }
    const tId = t.trip_id || t.id;
    if (!confirm(`هل أنت متأكد من حذف هذه الرحلة (${t.cargo_description || 'رحلة نقل'}) نهائياً من السجل؟`)) return;

    try {
      const res = await fetch(`/api/fleet?trip_id=${tId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      } else {
        alert('فشل حذف رحلة النقل');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenTripModal = () => {
    setDepartureDateTime(getCurrentDateTimeLocal());
    setShowNewTripModal(true);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية إطلاق مهام نقل جديدة');
      return;
    }
    if (truckSourceType === 'INTERNAL' && !selectedVehicleForTrip) {
      alert('يرجى اختيار الشاحنة من الأسطول الداخلي');
      return;
    }
    if (truckSourceType === 'EXTERNAL' && !externalTruckInfo.trim()) {
      alert('يرجى إدخال معلومات الشاحنة الخارجية المستأجرة');
      return;
    }

    setLoading(true);
    try {
      // حسم كلفة الإيجار: 0 حتماً إذا كانت الشاحنة من أسطول الشركة الداخلي
      const rentalCostToSend = truckSourceType === 'EXTERNAL' ? (Number(externalRentalCost) || 0) : 0;

      const res = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_TRIP',
          truck_source_type: truckSourceType,
          vehicle_id: truckSourceType === 'INTERNAL' ? selectedVehicleForTrip : null,
          external_truck_info: externalTruckInfo,
          external_driver_name: externalDriverName,
          external_driver_phone: externalDriverPhone,
          external_rental_cost: rentalCostToSend,
          cargo_description: cargoDesc,
          origin,
          destination,
          cargo_weight_tons: cargoWeight,
          captain_name: truckSourceType === 'INTERNAL' ? (currentUser?.full_name || 'كابتن الأسطول') : externalDriverName,
          estimated_hours: estimatedHours,
          departure_time: departureDateTime,
          trip_cost: tripCost,
          manifest_doc_url: manifestUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowNewTripModal(false);
        setCargoDesc('');
        setSelectedVehicleForTrip('');
        setExternalTruckInfo('');
        setExternalDriverName('');
        setManifestUrl('');
        await loadData();
      } else {
        alert(data.error || 'فشل تسجيل الرحلة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenanceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageVouchers && !canAdd) {
      alert('ليس لديك صلاحية تسجيل قيود الوقود والصيانة');
      return;
    }
    if (!maintVehicleId) {
      alert('يرجى اختيار الآلية');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MAINTENANCE_LOG',
          vehicle_id: maintVehicleId,
          log_type: maintType,
          description: maintDesc,
          cost: maintCost,
          mileage_at_service: maintMileage,
          performed_by: maintPerformedBy
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowMaintenanceModal(false);
        await loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  // تأكيد الوصول وتسليم الشحنة
  const handleCompleteTrip = async (trip: any) => {
    if (!canEdit) {
      alert('ليس لديك صلاحية تعديل حالة الرحلات وتأكيد وصولها');
      return;
    }
    if (!confirm('هل تم وصول الشحنة وتفريغها بنجاح في الموقع؟')) return;
    try {
      const res = await fetch('/api/fleet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE_TRIP',
          trip_id: trip.trip_id,
          vehicle_id: trip.vehicle_id,
          arrival_location: trip.destination
        })
      });
      if (res.ok) await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveVehicleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('ليس لديك صلاحية تعديل حالة الآليات');
      return;
    }
    if (!editingVehicle) return;
    const vId = editingVehicle.vehicle_id || editingVehicle.id;
    try {
      const res = await fetch('/api/fleet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_VEHICLE_STATUS',
          vehicle_id: vId,
          status: updateStatus,
          current_location: updateLocation,
          current_mileage: updateMileage,
          current_fuel_pct: updateFuel
        })
      });
      if (res.ok) {
        setEditingVehicle(null);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportTripsToCSV = () => {
    if (trips.length === 0) {
      alert('لا توجد رحلات مسجلة لتصديرها');
      return;
    }
    const headers = ['الشاحنة', 'النوع', 'المادة المنقولة', 'الانطلاق', 'الوجهة', 'الوزن (طن)', 'أجور العميل (د.ع)', 'كلفة الإيجار (د.ع)', 'صافي الربح', 'الكابتن', 'الحالة'];
    const rows = trips.map(t => {
      const isExt = t.truck_source_type === 'EXTERNAL';
      const rev = Number(t.trip_cost || 0);
      const rent = isExt ? Number(t.external_rental_cost || 0) : 0;
      return [
        `"${t.vehicle_name || t.external_truck_info || ''}"`,
        isExt ? 'مستأجرة خارجية' : 'أسطول داخلي',
        `"${t.cargo_description || ''}"`,
        `"${t.origin || ''}"`,
        `"${t.destination || ''}"`,
        t.cargo_weight_tons || 0,
        rev,
        rent,
        rev - rent,
        `"${t.captain_name || t.external_driver_name || ''}"`,
        t.trip_status === 'COMPLETED' ? 'مكتملة ومسلّمة' : 'في الطريق'
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `حسابات_وارباح_النقل_العام_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const transportFinance = useMemo(() => {
    const totalVehicles = vehicles.length;
    const available = vehicles.filter(v => String(v.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE').length;
    const inTransit = vehicles.filter(v => String(v.status || '').toUpperCase() === 'IN_TRANSIT').length;
    const maintenance = vehicles.filter(v => String(v.status || '').toUpperCase() === 'MAINTENANCE').length;

    const totalTonsMoved = trips.reduce((acc, curr) => acc + Number(curr.cargo_weight_tons || 0), 0);
    const totalRevenue = trips.reduce((acc, curr) => acc + Number(curr.trip_cost || 0), 0);
    const externalRentalExpenses = trips
      .filter(t => t.truck_source_type === 'EXTERNAL')
      .reduce((acc, curr) => acc + Number(curr.external_rental_cost || 0), 0);
    const fuelExpenses = maintenanceLogs.filter(m => m.log_type === 'FUEL').reduce((acc, curr) => acc + Number(curr.cost || 0), 0);
    const maintenanceExpenses = maintenanceLogs.filter(m => m.log_type !== 'FUEL').reduce((acc, curr) => acc + Number(curr.cost || 0), 0);
    
    const totalExpenses = externalRentalExpenses + fuelExpenses + maintenanceExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    return {
      totalVehicles,
      available,
      inTransit,
      maintenance,
      totalTonsMoved,
      totalRevenue,
      externalRentalExpenses,
      fuelExpenses,
      maintenanceExpenses,
      totalExpenses,
      netProfit,
      profitMargin
    };
  }, [vehicles, trips, maintenanceLogs]);

  // حساب أرباح الآليات الداخلية
  const vehicleFinancialMap = useMemo(() => {
    const map = new Map<string, { revenue: number; expenses: number; net: number }>();
    
    vehicles.forEach(v => {
      const vId = String(v.vehicle_id || v.id);
      map.set(vId, { revenue: 0, expenses: 0, net: 0 });
    });

    trips.filter(t => t.truck_source_type !== 'EXTERNAL').forEach(t => {
      const vId = String(t.vehicle_id);
      if (map.has(vId)) {
        const item = map.get(vId)!;
        item.revenue += Number(t.trip_cost || 0);
      }
    });

    maintenanceLogs.forEach(m => {
      const vId = String(m.vehicle_id);
      if (map.has(vId)) {
        const item = map.get(vId)!;
        item.expenses += Number(m.cost || 0);
      }
    });

    map.forEach((val) => {
      val.net = val.revenue - val.expenses;
    });

    return map;
  }, [vehicles, trips, maintenanceLogs]);

  // تجميع وحساب أرباح الشاحنات والتريلات المستأجرة كل على حدة
  const externalTrucksFinancialList = useMemo(() => {
    const map = new Map<string, { truckName: string; driverName: string; driverPhone: string; totalRevenue: number; totalRentalCost: number; netProfit: number; tripsCount: number }>();

    trips.filter(t => t.truck_source_type === 'EXTERNAL').forEach(t => {
      const key = String(t.external_truck_info || 'شاحنة مستأجرة').trim();
      const rev = Number(t.trip_cost || 0);
      const rent = Number(t.external_rental_cost || 0);

      if (!map.has(key)) {
        map.set(key, {
          truckName: key,
          driverName: t.external_driver_name || 'غير محدد',
          driverPhone: t.external_driver_phone || '',
          totalRevenue: 0,
          totalRentalCost: 0,
          netProfit: 0,
          tripsCount: 0
        });
      }

      const item = map.get(key)!;
      item.totalRevenue += rev;
      item.totalRentalCost += rent;
      item.netProfit += (rev - rent);
      item.tripsCount += 1;
    });

    return Array.from(map.values());
  }, [trips]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const name = String(v.vehicle_name || '').toLowerCase();
      const plate = String(v.plate_number || '').toLowerCase();
      const driver = String(v.assigned_driver || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchSearch = !q || name.includes(q) || plate.includes(q) || driver.includes(q);
      const st = String(v.status || 'AVAILABLE').toUpperCase();
      const matchStatus = statusFilter === 'ALL' || st === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  // الشاحنات المستأجرة التي في الطريق حصراً
  const activeExternalTrips = useMemo(() => {
    return trips.filter(t => t.truck_source_type === 'EXTERNAL' && t.trip_status === 'IN_PROGRESS');
  }, [trips]);

  if (!currentUser) return null;

  const roleClean = String(currentUser.role || '').toUpperCase();
  const isSuperAdmin = currentUser?.is_super_admin || roleClean === 'ADMIN' || roleClean.includes('إدارة');

  return (
    <AuthGuard moduleName="fleet" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        {/* الترويسة الرئيسية */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 relative rounded-2xl overflow-hidden bg-slate-900 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10 p-1">
              <Image 
                src="/logo.png" 
                alt="شركة البرج المتألق" 
                width={40} 
                height={40} 
                className="object-contain" 
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">المركز المالي المستقل لقطاع النقل العام واللوجستيات</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                  RTCO Logistics Live
                </span>
              </div>
              <p className="text-[13px] text-slate-400 mt-0.5">منظومة احتساب الإيرادات والمصروفات وصافي أرباح الأسطول المستقلة</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition"
              title="تحديث البيانات لحظياً"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-2xl">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-emerald-500/50 bg-slate-800 flex items-center justify-center">
                {currentUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-tight">{currentUser.full_name}</p>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border inline-block mt-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  {isSuperAdmin ? 'الإدارة العليا' : currentUser.job_title || 'كابتن الأسطول'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition mr-1"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <Link href="/" className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-[14px] hover:bg-slate-800 transition">
              <ArrowLeft className="w-4 h-4" /> الرئيسية
            </Link>
          </div>
        </div>

        {/* بطاقات الموقف المالي لقطاع النقل العام */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 print:hidden">
          <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-3xl relative overflow-hidden shadow-lg shadow-emerald-500/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] text-emerald-300 font-semibold block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> إيرادات النقل العام المحققة
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
                  {formatNum(transportFinance.totalRevenue)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">من واقع أجور نقل الشحنات والمهام المنجزة</p>
          </div>

          <div className="bg-slate-900/90 border border-rose-500/30 p-5 rounded-3xl relative overflow-hidden shadow-lg shadow-rose-500/5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] text-rose-300 font-semibold block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> إجمالي مصروفات النقل والوقود
                </span>
                <div className="text-2xl font-black font-mono text-rose-400 mt-2">
                  {formatNum(transportFinance.totalExpenses)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
              <span>إيجار خارجي: {formatNum(transportFinance.externalRentalExpenses)}</span>
              <span>وقود وصيانة: {formatNum(transportFinance.fuelExpenses + transportFinance.maintenanceExpenses)}</span>
            </div>
          </div>

          <div className={`bg-slate-900/90 border p-5 rounded-3xl relative overflow-hidden shadow-xl ${
            transportFinance.netProfit >= 0 ? 'border-sky-500/50 bg-sky-500/10' : 'border-rose-500/50 bg-rose-500/10'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] text-sky-200 font-bold block flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-sky-400" /> صافي أرباح قطاع النقل المعزول
                </span>
                <div className={`text-2xl font-black font-mono mt-2 ${transportFinance.netProfit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                  {formatNum(transportFinance.netProfit)} <span className="text-xs font-sans text-slate-400">د.ع</span>
                </div>
              </div>
              <div className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded-xl text-xs font-bold font-mono">
                {transportFinance.profitMargin}% هامش
              </div>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 font-sans">معادلة الأرباح معزولة كلياً ومباشرة</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] text-slate-400 font-semibold block">إجمالي المواد المنقولة</span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-2">
                  {formatNum(transportFinance.totalTonsMoved)} <span className="text-xs font-sans text-slate-500">طن</span>
                </div>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              نشطة: <strong className="text-emerald-400">{transportFinance.available}</strong> | في الطريق: <strong className="text-amber-400">{transportFinance.inTransit}</strong> | صيانة: <strong className="text-rose-400">{transportFinance.maintenance}</strong>
            </p>
          </div>
        </div>

        {/* شريط التبويبات والتحكم */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pt-6 pb-3 gap-3 print:hidden">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('VEHICLES')}
              className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition flex items-center gap-2 ${
                activeTab === 'VEHICLES' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" /> بطاقات الشاحنات وموقف الأرباح
            </button>
            <button
              onClick={() => setActiveTab('FINANCES')}
              className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition flex items-center gap-2 ${
                activeTab === 'FINANCES' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <PieChart className="w-4 h-4" /> تقرير الأرباح والحسابات المعزولة
            </button>
            <button
              onClick={() => setActiveTab('MAINTENANCE')}
              className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition flex items-center gap-2 ${
                activeTab === 'MAINTENANCE' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-4 h-4" /> قيود الوقود والصيانة
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4" /> طباعة السجل الرسمي
            </button>

            {canManageVouchers && (
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-purple-600/20"
              >
                <Fuel className="w-4 h-4" /> قيد وقود / صيانة
              </button>
            )}

            {canAdd && (
              <>
                <button
                  onClick={handleOpenTripModal}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
                >
                  <Navigation className="w-4 h-4" /> مهمة نقل جديدة
                </button>

                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                >
                  <PlusCircle className="w-4 h-4" /> إضافة آلية
                </button>
              </>
            )}
          </div>
        </div>

        {/* 1. تبويب بطاقات الشاحنات */}
        {activeTab === 'VEHICLES' && (
          <>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 print:hidden">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input 
                    type="text" 
                    placeholder="ابحث بالشاحنة، رقم اللوحة، أو السائق..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-3 py-2 text-[14px] text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-[14px] text-white outline-none"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="AVAILABLE">جاهزة للخدمة</option>
                  <option value="IN_TRANSIT">في الطريق بمهمة</option>
                  <option value="MAINTENANCE">في الصيانة</option>
                </select>
              </div>

              <button
                onClick={exportTripsToCSV}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> تصدير السجل المالي (CSV)
              </button>
            </div>

            {/* شبكة البطاقات الموحدة والمتطابقة بالشكل تماماً بين الأسطول والشاحنات المستأجرة */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5 print:hidden">
              
              {/* بطاقات الشاحنات المستأجرة النشطة في الطريق (تختفي فور تأكيد الوصول) */}
              {activeExternalTrips.map((extTrip) => {
                const extProgress = calculateTripProgress(extTrip.departure_time, Number(extTrip.estimated_hours || 6));
                const rev = Number(extTrip.trip_cost || 0);
                const rent = Number(extTrip.external_rental_cost || 0);
                const profit = rev - rent;

                return (
                  <div key={extTrip.trip_id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-slate-700 transition shadow-xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{extTrip.external_truck_info}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/15 text-amber-400 border-amber-500/30">
                              في الطريق (مستأجرة)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            السائق: <strong className="text-slate-200">{extTrip.external_driver_name || 'سائق خارجي'}</strong> {extTrip.external_driver_phone ? `• ${extTrip.external_driver_phone}` : ''}
                          </p>
                        </div>

                        <button
                          onClick={() => openGoogleMapsDirections(extTrip.origin, extTrip.destination)}
                          className="text-xs bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-xl border border-sky-500/30 transition flex items-center gap-1 shrink-0"
                        >
                          <Compass className="w-3.5 h-3.5" /> الخريطة
                        </button>
                      </div>

                      {/* جدول أرباح الشاحنة المستأجرة المطابق لبطاقات الأسطول */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs font-mono text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">أجور العميل</span>
                          <span className="font-bold text-emerald-400 text-[11px]">+{formatNum(rev)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">كلفة الإيجار</span>
                          <span className="font-bold text-rose-400 text-[11px]">-{formatNum(rent)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">صافي الربح</span>
                          <span className="font-bold text-[11px] text-sky-400">+{formatNum(profit)}</span>
                        </div>
                      </div>

                      {/* الموقع الميداني ومسار النقل */}
                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <MapPin className="w-3 h-3 text-emerald-400" /> مسار النقل المباشر:
                          </span>
                          <span className="font-mono text-amber-400 font-bold">{extTrip.cargo_weight_tons} طن</span>
                        </div>
                        <p className="text-[13px] font-bold text-slate-200 truncate">
                          {extTrip.origin} <span className="text-slate-500">➔</span> <span className="text-emerald-400">{extTrip.destination}</span>
                        </p>
                        <div className="pt-1.5 border-t border-slate-800/80 text-xs text-amber-300 flex items-center justify-between">
                          <span className="truncate">الحمولة: <strong>{extTrip.cargo_description}</strong></span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold font-sans">بمهمة</span>
                        </div>
                      </div>

                      {/* شريط المسار التنازلي للشاحنة المستأجرة */}
                      <div className="bg-slate-950/90 p-3 rounded-2xl border border-amber-500/30 space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5 animate-pulse text-amber-400" /> مسار الوصول التنازلي
                          </span>
                          <span className="font-mono font-bold text-slate-200">
                            {extProgress.progressPct}% من المسار
                          </span>
                        </div>

                        <div className="relative w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-400 transition-all duration-700" 
                            style={{ width: `${extProgress.progressPct}%` }}
                          ></div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono pt-1 text-slate-400 border-t border-slate-800/80">
                          <div>
                            <span>مضى: </span>
                            <strong className="text-white">{extProgress.elapsedHours} س</strong>
                          </div>
                          <div className="text-left">
                            <span>المتبقي: </span>
                            <strong className={extProgress.isLate ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'}>
                              {extProgress.isLate ? 'متأخرة' : `${extProgress.remainingHours} س`}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => handleCompleteTrip(extTrip)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 mt-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> تأكيد وصول وتسليم الشحنة
                      </button>
                    )}
                  </div>
                );
              })}

              {/* بطاقات شاحنات أسطول الشركة الداخلي */}
              {filteredVehicles.map((v) => {
                const currentSt = String(v.status || 'AVAILABLE').toUpperCase();
                const isInTransit = currentSt === 'IN_TRANSIT';
                const isMaintenance = currentSt === 'MAINTENANCE';

                const statusBadge = isInTransit
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : isMaintenance
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

                const statusTitle = isInTransit ? 'في الطريق (بمهمة)' : isMaintenance ? 'في الصيانة' : 'جاهزة للخدمة';

                const fuelPct = Number(v.current_fuel_pct) || 100;
                const fuelColor = fuelPct > 50 ? 'bg-emerald-500' : fuelPct > 25 ? 'bg-amber-500' : 'bg-rose-500';

                const mileage = Number(v.current_mileage) || 0;
                const lastOil = Number(v.last_oil_change_mileage) || 0;
                const interval = Number(v.oil_change_interval_km) || 5000;
                const nextOilKm = lastOil + interval;
                const remainingKmToService = Math.max(0, nextOilKm - mileage);
                const isOilDue = mileage >= nextOilKm;

                const vId = String(v.vehicle_id || v.id);
                const vFinance = vehicleFinancialMap.get(vId) || { revenue: 0, expenses: 0, net: 0 };

                const activeTrip = trips.find(t => 
                  (t.vehicle_id === v.vehicle_id || t.vehicle_id === v.id) && t.trip_status === 'IN_PROGRESS'
                );

                const tripProgress = activeTrip 
                  ? calculateTripProgress(activeTrip.departure_time, Number(activeTrip.estimated_hours || 6))
                  : null;

                return (
                  <div key={v.vehicle_id || v.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-slate-700 transition shadow-xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{v.vehicle_name}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                              {statusTitle}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            لوحة: <strong className="text-slate-200">{v.plate_number}</strong> • {v.vehicle_type}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingVehicle(v);
                                setUpdateStatus(v.status || 'AVAILABLE');
                                setUpdateLocation(v.current_location || '');
                                setUpdateMileage(v.current_mileage?.toString() || '');
                                setUpdateFuel(v.current_fuel_pct?.toString() || '100');
                              }}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl border border-slate-700 transition"
                              title="تحديث الحالة الميدانية"
                            >
                              تحديث
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteVehicle(v)}
                              className="text-xs bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white p-2 rounded-xl border border-rose-500/20 transition"
                              title="حذف الآلية"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* موقف الأرباح للشاحنة */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs font-mono text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">الإيراد المستقل</span>
                          <span className="font-bold text-emerald-400 text-[11px]">{formatNum(vFinance.revenue)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">المصروف والوقود</span>
                          <span className="font-bold text-rose-400 text-[11px]">{formatNum(vFinance.expenses)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">صافي الأرباح</span>
                          <span className={`font-bold text-[11px] ${vFinance.net >= 0 ? 'text-sky-400' : 'text-rose-500'}`}>
                            {formatNum(vFinance.net)}
                          </span>
                        </div>
                      </div>

                      {/* الموقع والمهمة */}
                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <MapPin className="w-3 h-3 text-emerald-400" /> الموقع الميداني:
                          </span>
                          <span className="font-mono text-slate-500">محدث لايف</span>
                        </div>
                        <p className="text-[13px] font-bold text-slate-200 truncate">{v.current_location}</p>

                        {activeTrip && (
                          <div className="pt-1.5 border-t border-slate-800/80 text-xs text-amber-300 flex items-center justify-between">
                            <span className="truncate">الحمولة: <strong>{activeTrip.cargo_description}</strong> ({activeTrip.cargo_weight_tons} طن)</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold font-sans">بمهمة</span>
                          </div>
                        )}
                      </div>

                      {/* العداد والوقود والسائق */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 font-sans block">العداد</span>
                          <span className="font-bold text-white text-[12px]">{formatNum(v.current_mileage)} كم</span>
                        </div>
                        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 font-sans block">الوقود</span>
                          <span className="font-bold text-emerald-400 text-[12px]">{fuelPct}%</span>
                        </div>
                        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 font-sans block">الكابتن المسؤول</span>
                          <span className="font-bold text-amber-400 text-[12px] truncate block">{v.assigned_driver || 'كابتن'}</span>
                        </div>
                      </div>

                      {/* شريط مستوى الوقود الرسومي */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5 text-slate-500" /> مستوى الوقود</span>
                          <span className="font-mono text-slate-300">{fuelPct}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div className={`h-full transition-all duration-500 ${fuelColor}`} style={{ width: `${fuelPct}%` }}></div>
                        </div>
                      </div>

                      {/* شريط المسار إذا كانت الآلية في الطريق */}
                      {isInTransit && activeTrip && tripProgress ? (
                        <div className="bg-slate-950/90 p-3 rounded-2xl border border-amber-500/30 space-y-2 mt-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Navigation className="w-3.5 h-3.5 animate-pulse text-amber-400" /> الآلية الآن بالطريق
                            </span>
                            <span className="font-mono font-bold text-slate-200">
                              {tripProgress.progressPct}% من المسار
                            </span>
                          </div>

                          <div className="relative w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-400 transition-all duration-700" 
                              style={{ width: `${tripProgress.progressPct}%` }}
                            ></div>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono pt-1 text-slate-400 border-t border-slate-800/80">
                            <div>
                              <span>مضى: </span>
                              <strong className="text-white">{tripProgress.elapsedHours} س</strong>
                            </div>
                            <div className="text-left">
                              <span>المتبقي: </span>
                              <strong className={tripProgress.isLate ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'}>
                                {tripProgress.isLate ? 'متأخرة' : `${tripProgress.remainingHours} س`}
                              </strong>
                            </div>
                          </div>

                          <button
                            onClick={() => openGoogleMapsDirections(activeTrip.origin, activeTrip.destination)}
                            className="w-full bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 transition mt-2"
                          >
                            <Compass className="w-3.5 h-3.5" /> فتح مسار الخريطة في Google Maps
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-xs pt-2 font-mono border-t border-slate-800/60">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5 text-slate-400" /> موعد تبديل الدهن:
                          </span>
                          <span className={`font-bold px-2 py-0.5 rounded ${
                            isOilDue ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' :
                            remainingKmToService < 500 ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'
                          }`}>
                            {isOilDue ? 'مستحق التبديل فوراً!' : `بعد ${remainingKmToService} كم`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* جدول سجل العمليات المنفذة المنسق والموزع */}
            <div className="max-w-7xl mx-auto mt-8 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 print:hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-amber-400" /> سجل أجور وعمليات النقل العام المنفذة
                  </h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">أجور الشحنات المحصلة لحساب قطاع النقل العام</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">العدد: {trips.length} رحلة</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-3">الشاحنة</th>
                      <th className="p-3">المادة / الحمولة</th>
                      <th className="p-3">مسار التحرك والخرائط</th>
                      <th className="p-3 text-center">الوزن</th>
                      <th className="p-3">أجور النقل</th>
                      <th className="p-3">كلفة الإيجار</th>
                      <th className="p-3">صافي الربح</th>
                      <th className="p-3">الكابتن</th>
                      <th className="p-3">المنافيست</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-sans text-xs">
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-slate-500 font-sans">لا توجد رحلات أو مهام نقل مسجلة حتى الآن.</td>
                      </tr>
                    ) : (
                      trips.map((t) => {
                        const isCompleted = t.trip_status === 'COMPLETED';
                        const isExt = t.truck_source_type === 'EXTERNAL';
                        const rev = Number(t.trip_cost || 0);
                        const rentCost = isExt ? Number(t.external_rental_cost || 0) : 0;
                        const netProfit = rev - rentCost;

                        return (
                          <tr key={t.trip_id} className="hover:bg-slate-800/30 transition">
                            <td className="p-3 font-bold text-white whitespace-nowrap">
                              {t.vehicle_name || t.external_truck_info} 
                              {isExt ? (
                                <span className="text-[10px] text-amber-400 font-normal block font-sans">(مستأجرة خارجية)</span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-normal block font-sans">({t.plate_number})</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-200">{t.cargo_description}</td>
                            <td className="p-3 text-slate-300">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{t.origin}</span>
                                <span className="text-slate-500">➔</span>
                                <span className="text-emerald-400 font-bold">{t.destination}</span>
                                <button
                                  onClick={() => openGoogleMapsDirections(t.origin, t.destination)}
                                  className="text-[11px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition shrink-0 mr-1"
                                  title="فتح المسار في Google Maps"
                                >
                                  <Compass className="w-3.5 h-3.5" /> الخريطة
                                </button>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-white text-center whitespace-nowrap font-mono">{t.cargo_weight_tons} طن</td>
                            <td className="p-3 font-bold text-emerald-400 whitespace-nowrap font-mono">+{formatNum(rev)} د.ع</td>
                            <td className="p-3 font-bold text-rose-400 whitespace-nowrap font-mono">
                              {isExt && rentCost > 0 ? `-${formatNum(rentCost)} د.ع` : '0 (أسطول)'}
                            </td>
                            <td className="p-3 font-black text-sky-400 whitespace-nowrap font-mono">
                              {formatNum(netProfit)} د.ع
                            </td>
                            <td className="p-3 text-slate-300 whitespace-nowrap">{t.captain_name || t.external_driver_name}</td>
                            <td className="p-3 whitespace-nowrap">
                              {t.manifest_doc_url ? (
                                <a href={t.manifest_doc_url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-1 text-xs">
                                  عرض <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <span className="text-slate-500">---</span>
                              )}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                              }`}>
                                {isCompleted ? 'تم التسليم ✓' : 'في الطريق 🚚'}
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {!isCompleted && canEdit && (
                                  <button
                                    onClick={() => handleCompleteTrip(t)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-1 rounded-xl text-xs transition shadow"
                                  >
                                    تأكيد الوصول
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteTrip(t)}
                                    className="bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white p-1.5 rounded-xl border border-rose-500/30 transition"
                                    title="حذف سجل الرحلة"
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
          </>
        )}

        {/* 2. تبويب تقرير الأرباح والحسابات المعزولة (جدول أسطول الشركة + جدول التريلات المستأجرة كل على حدة) */}
        {activeTab === 'FINANCES' && (
          <div className="max-w-7xl mx-auto space-y-6 mt-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" /> بيان الأرباح والخسائر المستقل لقطاع النقل العام
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">حسابات أسطول النقل اللوجستي والشاحنات المستأجرة منفصلة تماماً</p>
                </div>
                <button
                  onClick={exportTripsToCSV}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> تصدير تقرير الأرباح
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold block mb-1">1. إجمالي إيرادات النقل المكتسبة</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{formatNum(transportFinance.totalRevenue)} د.ع</div>
                  <span className="text-[11px] text-slate-500 mt-1 block">إجمالي أجور {trips.length} رحلة نقل منجزة ومجدولة</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold block mb-1">2. إجمالي مصروفات التشغيل والإيجار</span>
                  <div className="text-2xl font-black text-rose-400 font-mono">{formatNum(transportFinance.totalExpenses)} د.ع</div>
                  <span className="text-[11px] text-slate-500 mt-1 block">إيجار خارجي ({formatNum(transportFinance.externalRentalExpenses)}) + وقود وصيانة ({formatNum(transportFinance.fuelExpenses + transportFinance.maintenanceExpenses)})</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5">
                  <span className="text-xs text-sky-300 font-bold block mb-1">3. صافي أرباح قطاع النقل الصافية</span>
                  <div className={`text-2xl font-black font-mono ${transportFinance.netProfit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                    {formatNum(transportFinance.netProfit)} د.ع
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">نسبة هامش الربح التشغيلي: {transportFinance.profitMargin}%</span>
                </div>
              </div>

              {/* جدول أرباح شاحنات الأسطول الداخلي */}
              <div>
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-400" /> تفصيل الأرباح التشغيلية لشاحنات أسطول الشركة الداخلي
                </h4>
                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-[14px]">
                    <thead className="bg-slate-800/80 text-slate-400 text-[12px]">
                      <tr>
                        <th className="p-3.5">الآلية واللوحة</th>
                        <th className="p-3.5">السائق المكلف</th>
                        <th className="p-3.5">إجمالي الإيرادات</th>
                        <th className="p-3.5">إجمالي المصروفات</th>
                        <th className="p-3.5">صافي الأرباح</th>
                        <th className="p-3.5 text-center">التقييم الربحي</th>
                        <th className="p-3.5 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[13px]">
                      {vehicles.map(v => {
                        const vId = String(v.vehicle_id || v.id);
                        const f = vehicleFinancialMap.get(vId) || { revenue: 0, expenses: 0, net: 0 };
                        return (
                          <tr key={vId} className="hover:bg-slate-800/30">
                            <td className="p-3.5 font-bold text-white font-sans">{v.vehicle_name} ({v.plate_number})</td>
                            <td className="p-3.5 font-sans text-slate-300">{v.assigned_driver}</td>
                            <td className="p-3.5 text-emerald-400 font-bold">{formatNum(f.revenue)} د.ع</td>
                            <td className="p-3.5 text-rose-400 font-bold">{formatNum(f.expenses)} د.ع</td>
                            <td className={`p-3.5 font-black ${f.net >= 0 ? 'text-sky-400' : 'text-rose-500'}`}>
                              {formatNum(f.net)} د.ع
                            </td>
                            <td className="p-3.5 text-center font-sans">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                f.net > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                f.net === 0 ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}>
                                {f.net > 0 ? 'رابحة ومجدية' : f.net === 0 ? 'متعادلة' : 'تتطلب مراجعة'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-sans">
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteVehicle(v)}
                                  className="bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white p-2 rounded-xl border border-rose-500/30 transition"
                                  title="حذف سجل وتفاصيل هذه الآلية"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* جدول مستقل تماماً خاص بالشاحنات والتريلات الخارجية المستأجرة كلٌ على حدة */}
              <div>
                <h4 className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" /> تفصيل الأرباح التشغيلية للتريلات والشاحنات المستأجرة (كل آلية على حدة)
                </h4>
                <div className="border border-amber-500/30 rounded-2xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-right text-[14px]">
                    <thead className="bg-amber-500/10 text-amber-300 text-[12px] border-b border-amber-500/20">
                      <tr>
                        <th className="p-3.5">وصف الشاحنة ورقم اللوحة</th>
                        <th className="p-3.5">السائق / جهة التأجير</th>
                        <th className="p-3.5 text-center">عدد النقلات</th>
                        <th className="p-3.5">أجور العميل (الإيراد)</th>
                        <th className="p-3.5">كلفة الإيجار (المصروف)</th>
                        <th className="p-3.5">صافي ربح الشركة</th>
                        <th className="p-3.5 text-center">التقييم الربحي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[13px]">
                      {externalTrucksFinancialList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500 font-sans text-xs">لا توجد شاحنات أو سيارات مستأجرة مسجلة بعد.</td>
                        </tr>
                      ) : (
                        externalTrucksFinancialList.map((ext, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="p-3.5 font-bold text-white font-sans">{ext.truckName}</td>
                            <td className="p-3.5 font-sans text-slate-300">
                              {ext.driverName} {ext.driverPhone ? `(${ext.driverPhone})` : ''}
                            </td>
                            <td className="p-3.5 text-white font-bold text-center font-mono">{ext.tripsCount} نقلة</td>
                            <td className="p-3.5 text-emerald-400 font-bold">+{formatNum(ext.totalRevenue)} د.ع</td>
                            <td className="p-3.5 text-rose-400 font-bold">-{formatNum(ext.totalRentalCost)} د.ع</td>
                            <td className="p-3.5 text-sky-400 font-black">+{formatNum(ext.netProfit)} د.ع</td>
                            <td className="p-3.5 text-center font-sans">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                وساطة ناجحة ✓
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. تبويب قيود الوقود والصيانة */}
        {activeTab === 'MAINTENANCE' && (
          <div className="max-w-7xl mx-auto space-y-6 mt-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-400" /> سجل قيود الصيانة وتكاليف الوقود المستقلة
                  </h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">تُخصم هذه المبالغ حصراً من إيرادات النقل العام لاحتساب صافي الربح</p>
                </div>
                {canManageVouchers && (
                  <button
                    onClick={() => setShowMaintenanceModal(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-lg shadow-purple-600/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> تسجيل قيد صيانة جديد
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-[14px]">
                  <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 text-[12px]">
                    <tr>
                      <th className="p-3">الشاحنة</th>
                      <th className="p-3">نوع القيد</th>
                      <th className="p-3">البيان والتفاصيل</th>
                      <th className="p-3">المبلغ المصروف</th>
                      <th className="p-3">العداد عند الخدمة</th>
                      <th className="p-3">المحطة / الورشة</th>
                      <th className="p-3">تاريخ القيد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[13px]">
                    {maintenanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">لا توجد قيود صيانة أو وقود مسجلة بعد.</td>
                      </tr>
                    ) : (
                      maintenanceLogs.map((m) => {
                        const isOil = m.log_type === 'OIL_CHANGE';
                        const isFuel = m.log_type === 'FUEL';
                        return (
                          <tr key={m.log_id} className="hover:bg-slate-800/30 transition">
                            <td className="p-3.5 font-bold text-white font-sans">{m.vehicle_name} ({m.plate_number})</td>
                            <td className="p-3.5 font-sans">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isOil ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                isFuel ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}>
                                {isOil ? 'تبديل دهن وفلاتر' : isFuel ? 'وقود' : 'صيانة وقطع غيار'}
                              </span>
                            </td>
                            <td className="p-3.5 font-sans text-slate-200">{m.description}</td>
                            <td className="p-3.5 font-bold text-rose-400">{formatNum(m.cost)} د.ع</td>
                            <td className="p-3.5 text-slate-300">{formatNum(m.mileage_at_service)} كم</td>
                            <td className="p-3.5 font-sans text-slate-400">{m.performed_by}</td>
                            <td className="p-3.5 text-slate-500 text-[11px]">{String(m.service_date || '').split('T')[0]}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تسجيل مهمة جديدة */}
        {showNewTripModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-400" /> إطلاق مهمة نقل وتسجيل إيراد مستقل
                </h3>
                <button onClick={() => setShowNewTripModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTrip} className="space-y-3.5 text-[14px]">
                {/* اختيار نوع الشاحنة */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-bold text-xs">مصدر الشاحنة المنفذة للمهمة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                      truckSourceType === 'INTERNAL' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <input 
                        type="radio" 
                        name="sourceType" 
                        checked={truckSourceType === 'INTERNAL'} 
                        onChange={() => setTruckSourceType('INTERNAL')}
                        className="accent-emerald-500" 
                      />
                      <span className="font-bold">شاحنة من أسطول الشركة</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                      truckSourceType === 'EXTERNAL' ? 'bg-amber-500/10 border-amber-500/50 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <input 
                        type="radio" 
                        name="sourceType" 
                        checked={truckSourceType === 'EXTERNAL'} 
                        onChange={() => setTruckSourceType('EXTERNAL')}
                        className="accent-amber-500" 
                      />
                      <span className="font-bold">شاحنة خارجية مستأجرة</span>
                    </label>
                  </div>
                </div>

                {truckSourceType === 'INTERNAL' ? (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-xs">اختر الشاحنة المتاحة *</label>
                    <select
                      required
                      value={selectedVehicleForTrip}
                      onChange={(e) => setSelectedVehicleForTrip(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                    >
                      <option value="">-- اضغط لاختيار شاحنة جاهزة --</option>
                      {vehicles
                        .filter(v => String(v.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE')
                        .map(v => (
                          <option key={v.vehicle_id || v.id} value={v.vehicle_id || v.id}>
                            {v.vehicle_name} ({v.plate_number}) - السائق: {v.assigned_driver}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 border border-amber-500/30 p-3 rounded-2xl space-y-2.5 text-xs">
                    <span className="text-amber-400 font-bold block text-[11px]">بيانات الشاحنة المستأجرة وحساب الكلفة:</span>
                    <div>
                      <label className="block text-slate-400 mb-1">وصف الشاحنة ورقم اللوحة *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: تريلة مرسيدس بيضاء - لوحة 88921 بغداد"
                        value={externalTruckInfo}
                        onChange={(e) => setExternalTruckInfo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-amber-400 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">اسم السائق الخارجي</label>
                        <input
                          type="text"
                          placeholder="اسم السائق"
                          value={externalDriverName}
                          onChange={(e) => setExternalDriverName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-amber-400 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">هاتف السائق</label>
                        <input
                          type="text"
                          placeholder="078..."
                          value={externalDriverPhone}
                          onChange={(e) => setExternalDriverPhone(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono outline-none focus:border-amber-400 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-rose-400 mb-1 font-bold">كلفة استئجار الشاحنة (المدفوع للسائق) *</label>
                      <input
                        type="number"
                        required
                        value={externalRentalCost}
                        onChange={(e) => setExternalRentalCost(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-rose-400 font-mono font-bold outline-none focus:border-rose-500 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">المادة / الشحنة المحمولة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 30 طن سمنت مقاوم أو حديد تسليح"
                    value={cargoDesc}
                    onChange={(e) => setCargoDesc(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نقطة الانطلاق (التحميل) *</label>
                    <input
                      type="text"
                      required
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نقطة الوصول (الموقع) *</label>
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">أجور النقل من العميل (د.ع) *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="250000"
                      value={tripCost}
                      onChange={(e) => setTripCost(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500 text-emerald-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الوزن الصافي (طن)</label>
                    <input
                      type="number"
                      step="any"
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">ساعات الطريق المقدرة *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="6"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">ساعة الانطلاق *</label>
                    <input
                      type="datetime-local"
                      required
                      value={departureDateTime}
                      onChange={(e) => setDepartureDateTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                {truckSourceType === 'EXTERNAL' && (
                  <div className="bg-sky-500/10 border border-sky-500/30 p-2.5 rounded-xl text-sky-300 text-xs flex justify-between items-center font-bold">
                    <span>صافي ربح الشركة المتوقع من هذه النقلة:</span>
                    <span className="font-mono text-sm">
                      {formatNum(Math.max(0, (Number(tripCost) || 0) - (Number(externalRentalCost) || 0)))} د.ع
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">رابط صورة المنافيست / وصل التحميل (اختياري)</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="https://..."
                    value={manifestUrl}
                    onChange={(e) => setManifestUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTripModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
                  >
                    {loading ? 'جاري الإطلاق...' : 'بدء الرحلة وتحريك الآلية'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة قيد صيانة ووقود */}
        {showMaintenanceModal && canManageVouchers && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-purple-400" /> قيد صيانة / وقود في حسابات النقل
                </h3>
                <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMaintenanceLog} className="space-y-3.5 text-[14px]">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">اختر الشاحنة *</label>
                  <select
                    required
                    value={maintVehicleId}
                    onChange={(e) => setMaintVehicleId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-purple-500 text-xs"
                  >
                    <option value="">-- اضغط لاختيار الشاحنة --</option>
                    {vehicles.map(v => (
                      <option key={v.vehicle_id || v.id} value={v.vehicle_id || v.id}>
                        {v.vehicle_name} ({v.plate_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نوع الإجراء</label>
                    <select
                      value={maintType}
                      onChange={(e: any) => setMaintType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    >
                      <option value="OIL_CHANGE">تبديل دهن وفلاتر</option>
                      <option value="FUEL">تزويد وقود (فل)</option>
                      <option value="REPAIR">تصليح وميكانيك</option>
                      <option value="TIRES">تبديل إطارات</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الكلفة الإجمالية (د.ع) *</label>
                    <input
                      type="number"
                      required
                      placeholder="120000"
                      value={maintCost}
                      onChange={(e) => setMaintCost(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">البيان والتفاصيل *</label>
                  <input
                    type="text"
                    required
                    placeholder="تفاصيل الصيانة أو لترات الوقود"
                    value={maintDesc}
                    onChange={(e) => setMaintDesc(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-purple-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">قراءة العداد الحالية (كم)</label>
                    <input
                      type="number"
                      placeholder="35000"
                      value={maintMileage}
                      onChange={(e) => setMaintMileage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المحطة / المنفذ</label>
                    <input
                      type="text"
                      value={maintPerformedBy}
                      onChange={(e) => setMaintPerformedBy(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-purple-500 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>تُقيد هذه التكلفة حصراً ضمن مصاريف قطاع النقل وتُخصم من أرباحه.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMaintenanceModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20"
                  >
                    {loading ? 'جاري القيد...' : 'حفظ وإصدار السند'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة إضافة شاحنة جديدة */}
        {showAddVehicleModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" /> إضافة شاحنة أو آلية جديدة للأسطول
                </h3>
                <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddVehicle} className="space-y-3.5 text-[14px]">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">اسم / وصف الشاحنة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شاحنة مرسيدس أكتروس 3340"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم اللوحة الفريد *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 54321 - نجف"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">النوع والتصنيف</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    >
                      <option value="شاحنة قلاب رمل وحصى">شاحنة قلاب رمل وحصى</option>
                      <option value="تريلة نقل حديد وإسمنت">تريلة نقل حديد وإسمنت</option>
                      <option value="خلاطة خرسانة مركزية">خلاطة خرسانة مركزية</option>
                      <option value="رافعة هيدروليكية (كرين)">رافعة هيدروليكية (كرين)</option>
                      <option value="آلية ثقيلة (شفل / حفارة)">آلية ثقيلة (شفل / حفارة)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">السائق / الكابتن</label>
                    <input
                      type="text"
                      placeholder="اسم السائق المسؤول"
                      value={assignedDriver}
                      onChange={(e) => setAssignedDriver(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">دورة تبديل الدهن (كم)</label>
                    <input
                      type="number"
                      value={oilInterval}
                      onChange={(e) => setOilInterval(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">قراءة العداد (كم)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={currentMileage}
                      onChange={(e) => setCurrentMileage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الموقع الميداني الأولي</label>
                    <input
                      type="text"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVehicleModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? 'جاري الحفظ...' : 'تسجيل الآلية'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة تحديث حالة الشاحنة */}
        {editingVehicle && canEdit && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-right space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-400" /> تحديث حالة: {editingVehicle.vehicle_name}
                </h3>
                <button onClick={() => setEditingVehicle(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVehicleUpdate} className="space-y-3.5 text-[14px]">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">حالة الآلية التشغيلية</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none text-xs"
                  >
                    <option value="AVAILABLE">جاهزة ومتاحة للخدمة</option>
                    <option value="IN_TRANSIT">في الطريق بمهمة</option>
                    <option value="MAINTENANCE">في الصيانة / عطل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-xs">الموقع الميداني الحالي</label>
                  <input
                    type="text"
                    value={updateLocation}
                    onChange={(e) => setUpdateLocation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">العداد (كم)</label>
                    <input
                      type="number"
                      value={updateMileage}
                      onChange={(e) => setUpdateMileage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نسبة الوقود %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={updateFuel}
                      onChange={(e) => setUpdateFuel(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    حفظ التحديث
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة تقرير وسجل العمليات اللوجستية الطباعي الرسمي (A4) */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:static">
            
            <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 print:hidden shadow-2xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
                >
                  <Printer className="w-4 h-4" /> طباعة السجل (A4)
                </button>
                <button
                  onClick={exportTripsToCSV}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" /> تصدير ملف (Excel / CSV)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> إغلاق النافذة
                </button>
              </div>
            </div>

            <div className="w-full max-w-5xl bg-white text-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 shadow-2xl print:border-none print:shadow-none print:p-0 print:m-0 space-y-6">
              
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    <Image 
                      src="/logo.png" 
                      alt="شركة البرج المتألق" 
                      width={70} 
                      height={70} 
                      className="object-contain" 
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-950">شركة البرج المتألق</h1>
                    <p className="text-xs text-slate-600 font-bold mt-0.5">قسم أسطول النقل العام والخدمات اللوجستية (RTCO Fleet)</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">النجف الأشرف - حي الفرات | هاتف العمليات: 07868006699</p>
                  </div>
                </div>
                <div className="text-left flex flex-col items-end">
                  <div className="border-2 border-slate-900 px-4 py-1.5 font-black text-xs uppercase tracking-wider bg-emerald-500 text-slate-950 rounded-xl">
                    سجل المهام والرحلات الميدانية الرسمي
                  </div>
                  <p className="text-[11px] font-mono mt-2 text-slate-600">تاريخ الطباعة: <span className="font-bold text-slate-950">{new Date().toISOString().split('T')[0]}</span></p>
                  <p className="text-[11px] text-slate-500 font-sans">المسؤول: <span className="font-bold text-slate-900">{currentUser.full_name}</span></p>
                </div>
              </div>

              {/* أرقام الحسابات المعزولة في التقرير المطبوع */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[13px] text-center font-mono">
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-sans">إيراد النقل المعزول</span>
                  <span className="text-sm font-black text-emerald-600">{formatNum(transportFinance.totalRevenue)} د.ع</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-sans">المصروف والوقود</span>
                  <span className="text-sm font-black text-rose-600">{formatNum(transportFinance.totalExpenses)} د.ع</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-sans">صافي أرباح النقل</span>
                  <span className={`text-sm font-black ${transportFinance.netProfit >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                    {formatNum(transportFinance.netProfit)} د.ع
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-sans">إجمالي الأطنان</span>
                  <span className="text-sm font-black text-amber-600">{formatNum(transportFinance.totalTonsMoved)} طن</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> تفاصيل حركة الآليات وأجور النقل المحصلة
                </h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-[12px] text-right">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">الشاحنة</th>
                        <th className="p-3">المادة المنقولة</th>
                        <th className="p-3">الانطلاق</th>
                        <th className="p-3">الوجهة</th>
                        <th className="p-3">الوزن</th>
                        <th className="p-3">أجور النقل</th>
                        <th className="p-3">كلفة الإيجار</th>
                        <th className="p-3">صافي الربح</th>
                        <th className="p-3">الكابتن</th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {trips.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-6 text-slate-400 font-sans">لا توجد رحلات مسجلة في هذا السجل.</td>
                        </tr>
                      ) : (
                        trips.map((t, idx) => {
                          const isExt = t.truck_source_type === 'EXTERNAL';
                          const rev = Number(t.trip_cost || 0);
                          const rent = isExt ? Number(t.external_rental_cost || 0) : 0;
                          return (
                            <tr key={t.trip_id} className="hover:bg-slate-50/80">
                              <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold font-sans text-slate-950">
                                {t.vehicle_name || t.external_truck_info}
                                {isExt ? ' (مستأجرة)' : ''}
                              </td>
                              <td className="p-3 font-sans font-semibold text-slate-800">{t.cargo_description}</td>
                              <td className="p-3 font-sans text-slate-600">{t.origin}</td>
                              <td className="p-3 font-sans font-bold text-emerald-800">{t.destination}</td>
                              <td className="p-3 font-bold text-slate-900">{t.cargo_weight_tons} طن</td>
                              <td className="p-3 font-bold text-emerald-600">{formatNum(rev)} د.ع</td>
                              <td className="p-3 font-bold text-rose-400">{formatNum(rent)} د.ع</td>
                              <td className="p-3 font-bold text-sky-600">{formatNum(rev - rent)} د.ع</td>
                              <td className="p-3 font-sans text-slate-700">{t.captain_name || t.external_driver_name}</td>
                              <td className="p-3 text-center font-sans font-bold text-[10px]">
                                {t.trip_status === 'COMPLETED' ? (
                                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">مكتملة</span>
                                ) : (
                                  <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">في الطريق</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-10 text-center border-t border-slate-200">
                <div>
                  <p className="font-bold text-xs text-slate-700">كابتن / مسؤول الحركة</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">التوقيع والتاريخ</p>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div>
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-700">مدير الحسابات والمالية</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">التدقيق المالي</p>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div>
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-700">المدير التنفيذي للشركة</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">المصادقة والختم الرسمي</p>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto mt-8"></div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}