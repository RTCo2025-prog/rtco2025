'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Fuel, 
  LogOut, 
  RefreshCw, 
  User, 
  Timer, 
  AlertCircle,
  Package,
  Weight,
  Send,
  X,
  Compass
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';

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

function openGoogleMapsDirections(origin: string, destination: string) {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin + ', العراق')}&destination=${encodeURIComponent(destination + ', العراق')}&travelmode=driving`;
  window.open(url, '_blank');
}

export default function CaptainDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [showLocationBox, setShowLocationBox] = useState(false);

  // نموذج تسجيل وقود سريع
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelCost, setFuelCost] = useState('60000');
  const [fuelDesc, setFuelDesc] = useState('تزويد وقود ديزل للشاحنة');
  const [fuelStation, setFuelStation] = useState('محطة وقود النور');

  const loadData = async (userFullName: string) => {
    try {
      const res = await fetch('/api/fleet', { cache: 'no-store' });
      const data = await res.json();

      const cleanName = userFullName.trim().toLowerCase();

      let myVehicle = null;
      if (data.vehicles && data.vehicles.length > 0) {
        myVehicle = data.vehicles.find((veh: any) => {
          const driver = String(veh.assigned_driver || '').trim().toLowerCase();
          return driver && (driver.includes(cleanName) || cleanName.includes(driver));
        });
        setAssignedVehicle(myVehicle || null);
      }

      if (data.trips && data.trips.length > 0) {
        const myActiveTrip = data.trips.find((t: any) => {
          const captain = String(t.captain_name || '').trim().toLowerCase();
          const matchCaptain = captain && (captain.includes(cleanName) || cleanName.includes(captain));
          const matchVehicle = myVehicle ? (t.vehicle_id === myVehicle.vehicle_id || t.vehicle_id === myVehicle.id) : false;
          return t.trip_status === 'IN_PROGRESS' && (matchCaptain || matchVehicle);
        });

        setActiveTrip(myActiveTrip || null);
      }
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
        loadData(u.full_name || '');
      } catch {}
    }

    const interval = setInterval(() => {
      const userRaw = localStorage.getItem('erp_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        loadData(u.full_name || '');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    router.push('/login');
  };

  // فحص الصلاحيات الإجرائية الميدانية للكابتن
  const canEdit = useMemo(() => {
    return hasPermission(currentUser, 'fleet', 'edit');
  }, [currentUser]);

  const canAdd = useMemo(() => {
    return hasPermission(currentUser, 'fleet', 'add');
  }, [currentUser]);

  const handleCompleteDelivery = async () => {
    if (!activeTrip) return;
    if (!canEdit) {
      alert('ليس لديك صلاحية تأكيد وصول وتسليم الشحنات');
      return;
    }
    if (!confirm('هل وصلت للموقع وتم تفريغ وتسليم الشحنة بنجاح؟')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/fleet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE_TRIP',
          trip_id: activeTrip.trip_id,
          vehicle_id: activeTrip.vehicle_id,
          arrival_location: activeTrip.destination
        })
      });
      if (res.ok) {
        alert('بوركت جهودك كابتن! تم تأكيد الوصول والتسليم بنجاح.');
        if (currentUser) loadData(currentUser.full_name);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('ليس لديك صلاحية تحديث الموقع الميداني');
      return;
    }
    const vId = activeTrip?.vehicle_id || assignedVehicle?.vehicle_id || assignedVehicle?.id;
    if (!vId || !newLocation.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/fleet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_VEHICLE_STATUS',
          vehicle_id: vId,
          current_location: newLocation.trim()
        })
      });
      if (res.ok) {
        setShowLocationBox(false);
        setNewLocation('');
        if (currentUser) loadData(currentUser.full_name);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd && !canEdit) {
      alert('ليس لديك صلاحية قيد فواتير الوقود');
      return;
    }
    const vId = activeTrip?.vehicle_id || assignedVehicle?.vehicle_id || assignedVehicle?.id;
    if (!vId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MAINTENANCE_LOG',
          vehicle_id: vId,
          log_type: 'FUEL',
          description: fuelDesc,
          cost: fuelCost,
          performed_by: fuelStation
        })
      });
      if (res.ok) {
        alert('تم قيد فاتورة الوقود على شاحنتك بنجاح!');
        setShowFuelModal(false);
        if (currentUser) loadData(currentUser.full_name);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  const progress = activeTrip 
    ? calculateTripProgress(activeTrip.departure_time, Number(activeTrip.estimated_hours || 6))
    : null;

  return (
    <AuthGuard moduleName="fleet" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans max-w-md mx-auto flex flex-col justify-between pb-8 text-xs">
        
        <div className="space-y-4">
          {/* الترويسة الميدانية */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-800 flex items-center justify-center">
                {currentUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{currentUser.full_name}</p>
                <span className="text-[10px] text-emerald-400 font-semibold block">كابتن أسطول النقل الميداني</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => loadData(currentUser.full_name)}
                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl"
                title="تحديث"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 bg-slate-800 text-rose-400 hover:text-white rounded-xl"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* بطاقة الشاحنة المخصصة */}
          {assignedVehicle ? (
            <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">شاحنتك المخصصة:</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <Truck className="w-4 h-4 text-emerald-400" /> {assignedVehicle.vehicle_name}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  لوحة: <strong className="text-slate-200">{assignedVehicle.plate_number}</strong>
                </p>
              </div>
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-500 block">مستوى الوقود</span>
                <span className="text-sm font-bold text-emerald-400">{assignedVehicle.current_fuel_pct}%</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>لا توجد شاحنة مقيدة باسمك حالياً.</span>
            </div>
          )}

          {/* تفاصيل المهمة الجارية */}
          {activeTrip ? (
            <div className="bg-slate-900 border-2 border-amber-500/50 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 animate-pulse" /> مهمتك الجارية الآن
                </span>
                <button
                  onClick={() => openGoogleMapsDirections(activeTrip.origin, activeTrip.destination)}
                  className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5" /> الخريطة والملاحة
                </button>
              </div>

              {/* تفاصيل الحمولة */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1"><Package className="w-3.5 h-3.5 text-amber-400" /> المادة:</span>
                  <span className="font-bold text-white text-sm">{activeTrip.cargo_description}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1"><Weight className="w-3.5 h-3.5 text-sky-400" /> الوزن:</span>
                  <span className="font-mono font-bold text-amber-400">{activeTrip.cargo_weight_tons} طن</span>
                </div>
              </div>

              {/* مسار الرحلة */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">الانطلاق (التحميل):</span>
                    <strong className="text-slate-200">{activeTrip.origin}</strong>
                  </div>
                </div>

                <div className="border-r-2 border-dashed border-slate-700 mr-1 h-3"></div>

                <div className="flex items-start gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">الوصول والتفريغ:</span>
                    <strong className="text-emerald-400">{activeTrip.destination}</strong>
                  </div>
                </div>
              </div>

              {/* شريط التقدم */}
              {progress && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5 text-emerald-400" /> مسار الطريق:
                    </span>
                    <span className="font-mono font-bold text-white">{progress.progressPct}%</span>
                  </div>

                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500" 
                      style={{ width: `${progress.progressPct}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* زر التسليم */}
              {canEdit && (
                <button
                  onClick={handleCompleteDelivery}
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> تأكيد الوصول وتسليم الشحنة
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white text-sm">أنت في وضع الجاهزية والاستعداد</h3>
              <p className="text-slate-400 text-[11px]">لا توجد مهمة جارية مسندة إليك حالياً.</p>
            </div>
          )}

          {/* الأزرار الميدانية */}
          <div className="grid grid-cols-2 gap-2.5">
            {canEdit && (
              <button
                onClick={() => setShowLocationBox(!showLocationBox)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-xs"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>تحديث موقعي الميداني</span>
              </button>
            )}

            {(canAdd || canEdit) && (
              <button
                onClick={() => setShowFuelModal(true)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-xs"
              >
                <Fuel className="w-4 h-4 text-purple-400" />
                <span>تسجيل وصل وقود</span>
              </button>
            )}
          </div>

          {showLocationBox && canEdit && (
            <form onSubmit={handleUpdateLocation} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
              <label className="block text-slate-400 font-semibold text-[11px]">الموقع الحالي على الطريق:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="مثال: الطريق السريع - سيطرة الديوانية"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-emerald-500 text-xs"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-500 text-slate-950 px-3 rounded-xl font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

        </div>

        {/* نافذة تسجيل الوقود */}
        {showFuelModal && (canAdd || canEdit) && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-3xl p-5 shadow-2xl text-right space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Fuel className="w-4 h-4 text-purple-400" /> تسجيل وقود للشاحنة
                </h3>
                <button onClick={() => setShowFuelModal(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddFuel} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">المبلغ (د.ع) *</label>
                  <input
                    type="number"
                    required
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">اسم المحطة أو الموقع</label>
                  <input
                    type="text"
                    value={fuelStation}
                    onChange={(e) => setFuelStation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowFuelModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                  >
                    حفظ الوصل
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="pt-4 text-center">
          <Link href="/fleet" className="text-slate-500 hover:text-slate-300 text-xs inline-flex items-center gap-1 font-semibold">
            <Truck className="w-3.5 h-3.5" /> العودة للوحة الإدارة العامة
          </Link>
        </div>

      </div>
    </AuthGuard>
  );
}