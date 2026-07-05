import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient';
import {
  Search, Check, X, Filter, Clock,
  Calendar as CalendarIcon, Lock,
  UserCheck, UserMinus, Users, Download,
  ChevronLeft, ChevronRight, ChevronDown,
  BarChart as BarChartIcon,
  Heart, Sparkles, User, DollarSign
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import ClientEditModal from '../components/ClientEditModal';
import AttendanceCalendarModal from '../components/AttendanceCalendarModal';
import { getISTDateString, getISTTimeString, getISTDisplayDate, getStartOfWeekIST } from '../utils/dateUtils';

// --- Custom Animated Dropdown Components ---

const StatusDropdown = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStyles = (status) => {
    switch (status) {
      case 'Present': return 'bg-[#DDF5E5] text-[#1F7A45] border-[#1F7A45]/20 shadow-[#1F7A45]/10';
      case 'Absent': return 'bg-[#FDE2E2] text-[#B42318] border-[#B42318]/20 shadow-[#B42318]/10';
      default: return 'bg-offwhite text-muted border-beige shadow-sm';
    }
  };

  const getIcon = (status) => {
    switch (status) {
      case 'Present': return <Check size={16} strokeWidth={3} />;
      case 'Absent': return <X size={16} strokeWidth={3} />;
      default: return <Clock size={16} className="opacity-50" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300 shadow-md ${getStyles(value)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 hover:shadow-lg'}`}
        title={value === 'Pending' ? 'Set Status' : value}
      >
        {getIcon(value)}
      </button>

      {/* Dropdown Menu */}
      <div className={`absolute z-20 top-full left-1/2 -translate-x-1/2 mt-2 w-[120px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-beige overflow-hidden transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        {['Present', 'Absent'].map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); setIsOpen(false); }}
            className={`flex items-center gap-2 w-full text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest transition-colors hover:bg-offwhite ${value === opt ? getStyles(opt).split(' ')[1] : 'text-forest'}`}
          >
            {getIcon(opt)}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

const ShakeTypeDropdown = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStyles = (remark) => {
    switch (remark) {
      case 'S': return 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white border-[#D97706] shadow-md shadow-[#D97706]/30';
      case 'SB': return 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/30';
      case 'SF': return 'bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white border-[#0891B2] shadow-md shadow-[#0891B2]/30';
      case 'SBF': return 'bg-gradient-to-br from-[#F59E0B] to-[#0891B2] text-white border-[#0891B2] shadow-md shadow-[#0891B2]/30';
      default: return 'bg-white/80 backdrop-blur-md text-forest border-beige hover:border-sage/40 hover:bg-white shadow-sm';
    }
  };

  const getLabel = (remark) => {
    if (remark === 'S') return 'S · Shake';
    if (remark === 'SB') return 'SB · +Beta';
    if (remark === 'SF') return 'SF · +Fiber';
    if (remark === 'SBF') return 'SBF · +Beta+Fiber';
    return 'Select Type';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-[140px] px-4 py-3 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${getStyles(value)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
      >
        <span className="truncate mr-2">{getLabel(value)}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''} ${value ? 'text-white/80' : 'text-muted/50'}`} />
      </button>

      {/* Glassmorphism Dropdown */}
      <div className={`absolute z-20 top-full left-0 mt-2 w-[160px] -ml-[10px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden transition-all duration-400 origin-top-left ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        <div className="p-1.5">
          {[
            { id: 'S', label: 'Shake', icon: <Clock size={14}/>, color: 'text-[#D97706]', bgHover: 'hover:bg-[#FEF3C7]' },
            { id: 'SB', label: 'Shake + Beta', icon: <Heart size={14}/>, color: 'text-[#7C3AED]', bgHover: 'hover:bg-[#F3E8FF]' },
            { id: 'SF', label: 'Shake + Fiber', icon: <Sparkles size={14}/>, color: 'text-[#0891B2]', bgHover: 'hover:bg-[#CFFAFE]' },
            { id: 'SBF', label: 'Shake + Beta + Fiber', icon: <Heart size={14}/>, color: 'text-[#D97706]', bgHover: 'hover:bg-[#FEF3C7]' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setIsOpen(false); }}
              className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${opt.bgHover} ${value === opt.id ? 'bg-offwhite' : 'bg-transparent'} text-forest relative overflow-hidden group`}
            >
              <span className={`${opt.color} group-hover:scale-110 transition-transform duration-300`}>{opt.icon}</span>
              {opt.label}
              {value === opt.id && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-forest" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- Main Component ---

export default function Attendance() {
  const { attendance = [], customers = [], memberships = [], attendanceLocks = [], updateAttendance, logShakePayment, finalizeAttendance, user } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getISTDateString());
  const [paymentModal, setPaymentModal] = useState(null);
  
  const [showShakeMembers, setShowShakeMembers] = useState(null);
  const [isShakeDropdownOpen, setIsShakeDropdownOpen] = useState(false);
  const shakeDropdownRef = useRef(null);
  const [shakeLogs, setShakeLogs] = useState([]); // payment logs from DB
  const [localPayments, setLocalPayments] = useState({}); // instant local cache: key = `${customerId}_${date}_${remark}`

  const fetchShakeLogs = async (date) => {
    try {
      const { data, error } = await supabase
        .from('membership_usage_logs')
        .select('client_id, shake_type, amount_paid, advance_amount, due_amount, payment_method, payment_status, shake_date, created_at')
        .eq('shake_date', date)
        .not('shake_type', 'is', null);
      if (!error && data) setShakeLogs(data);
      if (error) console.error("fetchShakeLogs DB error:", error);
    } catch (err) {
      console.error("fetchShakeLogs network error:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shakeDropdownRef.current && !shakeDropdownRef.current.contains(event.target)) {
        setIsShakeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setLayoutReady(true), 500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    fetchShakeLogs(selectedDate);
  }, [selectedDate]);
  
  const todayStr = getISTDateString();
  const selectedAttendance = attendance.filter(a => a.date === selectedDate);

  const stats = {
    total: customers.length || 0,
    present: selectedAttendance.filter(a => a.status === 'Present').length || 0,
    absent: selectedAttendance.filter(a => a.status === 'Absent').length || 0,
    shakes: selectedAttendance.filter(a => ['S', 'SB', 'SF', 'SBF'].includes(a.remark)).length || 0,
    sb: selectedAttendance.filter(a => a.remark === 'SB').length || 0,
    sf: selectedAttendance.filter(a => a.remark === 'SF').length || 0,
    sbf: selectedAttendance.filter(a => a.remark === 'SBF').length || 0,
    s_only: selectedAttendance.filter(a => a.remark === 'S').length || 0,
  };

  const getWeeklyFlowData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({ day, present: 0, absent: 0, shake: 0 }));
    const startOfWeekStr = getStartOfWeekIST(todayStr);
    attendance.forEach(att => {
      if (att.date >= startOfWeekStr && att.date <= todayStr) {
        const attDate = new Date(att.date);
        const dayName = days[attDate.getDay()];
        const dayObj = data.find(d => d.day === dayName);
        if (dayObj) {
          if (att.status === 'Present') dayObj.present++;
          else if (att.status === 'Absent') dayObj.absent++;
          
          if (['S', 'SB', 'SF', 'SBF'].includes(att.remark)) dayObj.shake++;
        }
      }
    });
    return data;
  };

  const weeklyFlowData = getWeeklyFlowData();
  const isLocked = attendanceLocks.some(lock => lock.date === selectedDate && lock.is_locked);
  const currentLock = attendanceLocks.find(lock => lock.date === selectedDate && lock.is_locked);

  const handleFinalize = async () => {
    if (window.confirm(`Are you sure you want to finalize attendance for ${getISTDisplayDate(selectedDate)}? This action cannot be undone.`)) {
      try {
        await finalizeAttendance(selectedDate);
        toast.success(`Attendance for ${getISTDisplayDate(selectedDate)} has been locked.`);
      } catch (error) { toast.error(error.message); }
    }
  };

  const handleStatusChange = async (customerId, newStatus) => {
    if (isLocked) { toast.error('Attendance for this date is locked.'); return; }
    try {
      const updatePayload = {
        customerId, date: selectedDate, status: newStatus,
        checkIn: newStatus === 'Present' ? getISTTimeString() : '-',
      };

      await updateAttendance(updatePayload);
      toast.success(`${newStatus} marked for ${customers.find(c => c.id === customerId)?.name}`);
    } catch (error) {
      console.error('Attendance marking failed:', error);
      toast.error(`Failed to mark attendance: ${error.message || 'Unknown error'}`);
    }
  };

  const DAILY_RATES = { 'S': 250, 'SB': 418, 'SF': 348, 'SBF': 481 };
  const REMARK_LABELS = { 'S': 'Shake', 'SB': 'Shake + Beta Heart', 'SF': 'Shake + Fiber', 'SBF': 'Shake + Beta + Fiber' };

  const getRemarkDaysCount = (customerId, remarkType) => {
    const uniqueDates = new Set(
      attendance.filter(a => a.customerId === customerId && a.remark === remarkType).map(a => a.date)
    );
    if (!uniqueDates.has(selectedDate)) uniqueDates.add(selectedDate);
    return uniqueDates.size;
  };

  const handleRemarkChange = async (customerId, remarkValue) => {
    if (isLocked) { toast.error('Attendance for this date is locked.'); return; }
    const customer = customers.find(c => c.id === customerId);
    
    // Auto-trigger payment modal logic for all shakes
    if (['S', 'SB', 'SF', 'SBF'].includes(remarkValue)) {
      setPaymentModal({
        customerId,
        customerName: customer?.name || 'Unknown',
        remark: remarkValue,
        plan: '1 Day',
        customDuration: '',
        totalAmount: 173,
        paymentStatus: 'Paid',
        advanceAmount: 173,
        dueAmount: 0,
        paymentMethod: 'Cash'
      });
      return;
    }
  };

  const handlePaymentConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!paymentModal) return;
    const { customerId, remark, plan, customDuration, totalAmount, paymentStatus, advanceAmount, dueAmount, paymentMethod } = paymentModal;
    const finalDays = plan === 'Custom' && customDuration ? parseInt(customDuration) :
                     (plan === '1 Day' ? 1 : plan === '3 Days' ? 3 : plan === '10 Days' ? 10 : 30);
    try {
      const record = selectedAttendance.find(a => a.customerId === customerId);
      const statusToSave = record?.status && record.status !== 'Pending' ? record.status : 'Present';
      
      // Step 1: Mark attendance WITH payment info — saves everything in one DB call
      try {
        await updateAttendance({ 
          customerId, 
          date: selectedDate, 
          status: statusToSave, 
          checkIn: record?.checkIn || getISTTimeString(), 
          remark,
          amount_paid: totalAmount,
          payment_status: paymentStatus,
          advance_amount: advanceAmount,
          due_amount: dueAmount,
          payment_method: paymentMethod,
        });
      } catch (attErr) {
        // Fallback: save without payment fields if columns don't exist yet
        console.warn('[Attendance] Payment columns missing, saving basic attendance:', attErr?.message);
        await updateAttendance({ 
          customerId, 
          date: selectedDate, 
          status: statusToSave, 
          checkIn: record?.checkIn || getISTTimeString(), 
          remark,
        });
      }

      // Step 2: Store in local state IMMEDIATELY so popup shows right away
      const payKey = `${customerId}_${selectedDate}_${remark}`;
      setLocalPayments(prev => ({
        ...prev,
        [payKey]: {
          client_id: customerId,
          shake_type: remark,
          amount_paid: totalAmount,
          payment_status: paymentStatus,
          advance_amount: advanceAmount,
          due_amount: dueAmount,
          payment_method: paymentMethod,
          shake_date: selectedDate,
          created_at: new Date().toISOString(),
        }
      }));

      // Step 3: Handle Membership specific logic (extra charges for active, audit log for non-members)
      const customerMemberships = memberships.filter(m => m.customerId === customerId || m.client_id === customerId);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const activeMem = customerMemberships.find(m => new Date(m.expiryDate || m.expiry_date) >= today && (m.status === 'Active' || !m.status));
      
      if (activeMem) {
        const membership = customerMemberships.sort((a, b) => new Date(b.start_date || b.createdAt) - new Date(a.start_date || a.createdAt))[0];
        if (membership) {
          await supabase.from('memberships').update({ extra_type: remark, extra_charge: totalAmount, extra_days: finalDays }).eq('id', membership.id);
        }
      } else {
        if (logShakePayment) {
          await logShakePayment(customerId, remark, finalDays, totalAmount, paymentStatus, advanceAmount, dueAmount, paymentMethod, selectedDate);
        }
      }
      fetchShakeLogs(selectedDate); // refresh DB logs in background

      const customer = customers.find(c => c.id === customerId);
      const paidLabel = paymentStatus === 'Paid' ? `₹${totalAmount}` : paymentStatus === 'Advance' ? `₹${advanceAmount} paid, ₹${dueAmount} due` : `₹${totalAmount} due`;
      toast.success(`${REMARK_LABELS[remark]} recorded for ${customer?.name} — ${paidLabel} via ${paymentMethod}`);
      setPaymentModal(null);
    } catch (error) {
      console.error('[PaymentConfirm] Failed:', error);
      toast.error(`Failed to record: ${error?.message || 'Unknown error'}`);
    }
  };

  const filteredClients = customers.filter(client => {
    const matchesSearch =
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contact || '').includes(searchTerm);
    const record = selectedAttendance.find(a => a.customerId === client.id);
    const status = record ? record.status : 'Pending';
    const remark = record?.remark;
    const matchesStatus = filterStatus === 'All' || status === filterStatus || remark === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getMembersByRemark = (remarkType) => {
    return selectedAttendance
      .filter(a => a.remark === remarkType)
      .map(a => {
        const customer = customers.find(c => c.id === a.customerId);
        // Read payment info from attendance record first (saved to DB),
        // then fall back to localPayments (instant display before DB confirms)
        const payKey = `${a.customerId}_${selectedDate}_${remarkType}`;
        const localPay = localPayments[payKey];
        const paymentMethod = a.payment_method || localPay?.payment_method || null;
        const amountPaid = a.amount_paid ?? localPay?.amount_paid ?? null;
        const advanceAmount = a.advance_amount ?? localPay?.advance_amount ?? null;
        const dueAmount = a.due_amount ?? localPay?.due_amount ?? null;
        const paymentStatus = a.payment_status || localPay?.payment_status || null;
        return {
          id: a.customerId,
          name: customer?.name || 'Unknown',
          contact: customer?.contact || '-',
          markedBy: a.markedBy || a.marked_by_name || '-',
          time: a.checkIn || a.check_in || (a.updated_at ? new Date(a.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'),
          remark: a.remark,
          paymentMethod,
          amountPaid,
          advanceAmount,
          dueAmount,
          paymentStatus,
        };
      });
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="space-y-10 font-sans animate-in fade-in duration-500">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-forest tracking-tight">Attendance Console</h1>
          <p className="text-muted mt-2 font-medium">Coordinate daily holistic wellness presence for all clients.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isLocked ? (
            <div className="flex items-center gap-2 bg-red-50 px-5 py-3 rounded-2xl border border-red-100 shadow-sm transition-all">
              <Lock size={15} className="text-red-500" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Locked by {currentLock?.locked_by_name?.split(' ')[0]}</span>
            </div>
          ) : (
            <button onClick={handleFinalize} className="flex items-center gap-2 bg-forest text-white px-5 py-3 rounded-2xl shadow-luxury hover:bg-forest-hover transition-all duration-300 text-[10px] font-black uppercase tracking-widest active:scale-95 hover:shadow-luxury-hover">
              <Lock size={15} /> Finalize Day
            </button>
          )}
          <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-beige shadow-luxury hover:shadow-luxury-hover transition-all duration-300">
            <CalendarIcon size={16} className="text-gold" />
            <span className="text-xs font-black text-forest uppercase tracking-widest">{getISTDisplayDate(selectedDate)}</span>
            {!isToday && (
              <button onClick={() => setSelectedDate(todayStr)} className="px-3 py-1.5 bg-sage/10 text-sage rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sage/20 transition-colors ml-2">Today</button>
            )}
          </div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="hidden" id="att-date" />
          <label htmlFor="att-date" className="flex items-center gap-2 bg-white border border-beige px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-forest hover:bg-offwhite transition-all duration-300 shadow-luxury cursor-pointer active:scale-95 hover:shadow-luxury-hover">
            <CalendarIcon size={16} /> Pick Date
          </label>
          <button onClick={() => setIsCalendarOpen(true)} className="flex items-center gap-2 bg-white border border-beige px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-forest hover:bg-offwhite transition-all duration-300 shadow-luxury cursor-pointer active:scale-95 hover:shadow-luxury-hover">
            <CalendarIcon size={16} className="text-gold" /> View Calendar
          </button>
        </div>
      </div>

      {/* ── Summary Cards + Chart Grid ─────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Stat Cards */}
        <div className="xl:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-forest hover:-translate-y-1 transition-transform duration-300 h-[140px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total Members</p>
              <Users size={18} className="text-forest/30" />
            </div>
            <p className="text-4xl font-extrabold text-forest leading-none">{stats.total}</p>
          </div>
          <div className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-[#1F7A45] hover:-translate-y-1 transition-transform duration-300 h-[140px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Present Today</p>
              <UserCheck size={18} className="text-[#1F7A45]/30" />
            </div>
            <p className="text-4xl font-extrabold text-[#1F7A45] leading-none">{stats.present}</p>
          </div>
          <div className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-[#B42318] hover:-translate-y-1 transition-transform duration-300 h-[140px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Absent Today</p>
              <UserMinus size={18} className="text-[#B42318]/30" />
            </div>
            <p className="text-4xl font-extrabold text-[#B42318] leading-none">{stats.absent}</p>
          </div>
          
          {/* Animated Shake Dropdown Card */}
          <div 
            ref={shakeDropdownRef}
            onClick={() => setIsShakeDropdownOpen(!isShakeDropdownOpen)}
            className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-[#D97706] relative hover:-translate-y-1 transition-transform duration-300 h-[140px] cursor-pointer overflow-visible"
          >
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Shake</p>
              <Clock size={18} className="text-[#D97706]/30" />
            </div>
            <p className="text-4xl font-extrabold text-[#D97706] leading-none">{stats.shakes}</p>
            
            {/* Shake Details Dropdown — opens UPWARD to avoid overlapping search bar */}
            <div onClick={(e) => e.stopPropagation()} className={`absolute bottom-full left-0 w-full mb-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-luxury-hover border border-white/50 p-2 transition-all duration-300 z-50 ${isShakeDropdownOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
              <div className="space-y-1">
                <button onClick={(e) => { e.stopPropagation(); setShowShakeMembers('S'); setIsShakeDropdownOpen(false); }} className="flex justify-between items-center w-full px-3 py-2.5 rounded-xl hover:bg-offwhite transition-colors group/btn">
                  <span className="text-[10px] font-black text-forest uppercase tracking-widest flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#FEF3C7] text-[#D97706] flex items-center justify-center transition-transform group-hover/btn:scale-110"><Clock size={12}/></div>
                    Shake
                  </span>
                  <span className="text-sm font-extrabold text-[#D97706]">{stats.s_only}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowShakeMembers('SB'); setIsShakeDropdownOpen(false); }} className="flex justify-between items-center w-full px-3 py-2.5 rounded-xl hover:bg-offwhite transition-colors group/btn">
                  <span className="text-[10px] font-black text-forest uppercase tracking-widest flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center transition-transform group-hover/btn:scale-110"><Heart size={12}/></div>
                    SB (Beta)
                  </span>
                  <span className="text-sm font-extrabold text-[#7C3AED]">{stats.sb}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowShakeMembers('SF'); setIsShakeDropdownOpen(false); }} className="flex justify-between items-center w-full px-3 py-2.5 rounded-xl hover:bg-offwhite transition-colors group/btn">
                  <span className="text-[10px] font-black text-forest uppercase tracking-widest flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#CFFAFE] text-[#0891B2] flex items-center justify-center transition-transform group-hover/btn:scale-110"><Sparkles size={12}/></div>
                    SF (Fiber)
                  </span>
                  <span className="text-sm font-extrabold text-[#0891B2]">{stats.sf}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowShakeMembers('SBF'); setIsShakeDropdownOpen(false); }} className="flex justify-between items-center w-full px-3 py-2.5 rounded-xl hover:bg-offwhite transition-colors group/btn">
                  <span className="text-[10px] font-black text-forest uppercase tracking-widest flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#FFE5B4] text-[#D97706] flex items-center justify-center transition-transform group-hover/btn:scale-110"><Heart size={12}/></div>
                    SBF (Beta+Fiber)
                  </span>
                  <span className="text-sm font-extrabold text-[#D97706]">{stats.sbf}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart (Simplified) */}
        <div className="xl:col-span-2 luxury-card p-8 flex flex-col h-full min-h-[300px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-beige/50 pb-4">
            <div className="flex items-center">
              <BarChartIcon size={20} className="text-sage mr-2" />
              <h3 className="text-xl font-extrabold text-forest tracking-tight">Weekly Session Flow</h3>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              {[
                { color: 'bg-[#1F7A45]', label: 'Present' },
                { color: 'bg-[#B42318]', label: 'Absent' },
                { color: 'bg-[#D97706]', label: 'Shake' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${l.color} shadow-sm`} />
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 min-h-[220px]">
            {layoutReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={weeklyFlowData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: '#F7F6F2', radius: 8 }} 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #E7E5E4', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', padding: '12px' }} 
                  />
                  <Bar dataKey="present" fill="#1F7A45" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1000} />
                  <Bar dataKey="absent" fill="#B42318" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1000} />
                  <Bar dataKey="shake" fill="#D97706" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Table ─────────────────────────────────── */}
      <div className="luxury-card overflow-visible bg-white flex flex-col">
        {/* Toolbar */}
        <div className="p-6 border-b border-beige flex flex-col md:flex-row gap-4 items-center bg-offwhite/50 rounded-t-[2rem]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/50" size={18} />
            <input
              type="text" placeholder="Search by member name or contact..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-white border border-beige rounded-2xl text-forest font-bold text-sm placeholder-muted/40 focus:border-sage focus:ring-4 focus:ring-sage/10 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={14} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-3.5 bg-white border border-beige rounded-2xl text-forest font-black uppercase tracking-widest text-[10px] outline-none appearance-none cursor-pointer focus:border-sage focus:ring-4 focus:ring-sage/10 transition-all shadow-sm">
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="S">Shake</option>
                <option value="SB">Shake + Beta</option>
                <option value="SF">Shake + Fiber</option>
                <option value="SBF">Shake + Beta + Fiber</option>
                <option value="Pending">Pending</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={14} />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] text-forest hover:bg-offwhite active:scale-95 transition-all shadow-sm">
              <Download size={14} className="text-gold" /> Export
            </button>
          </div>
        </div>

        {/* 4-Column Table */}
        <div className="overflow-x-auto no-scrollbar pb-32">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-muted text-[10px] font-black uppercase tracking-[0.15em] border-b border-beige">
                <th className="px-8 py-6">Member Profile</th>
                <th className="px-6 py-6 hidden md:table-cell">Marked By</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-6 py-6">Shake Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40 relative">
              {filteredClients.map((client) => {
                const record = selectedAttendance.find(a => a.customerId === client.id);
                const status = record ? record.status : 'Pending';
                const currentRemark = record?.remark || '';
                const updatedTime = record?.updated_at ? new Date(record.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;

                return (
                  <tr key={client.id} className="hover:bg-offwhite/80 transition-colors duration-300 group">
                    
                    {/* Member Column */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center text-forest font-black text-sm shrink-0 group-hover:bg-forest group-hover:text-white group-hover:border-forest group-hover:scale-105 shadow-sm transition-all duration-500">
                          {client?.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p onClick={() => client && setEditingCustomer(client)} className="font-extrabold text-forest text-[15px] leading-tight cursor-pointer hover:text-sage transition-colors truncate">
                            {client?.name || 'Unknown'}
                          </p>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1.5 truncate">{client?.contact || 'No Contact'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Marked By Column */}
                    <td className="px-6 py-5 hidden md:table-cell">
                      {record ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-offwhite border border-beige flex items-center justify-center text-muted shrink-0 shadow-sm transition-colors group-hover:bg-white">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-forest">{record.markedBy || '—'}</p>
                            {updatedTime && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Clock size={10} className="text-muted/60" />
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{updatedTime}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-muted/40 uppercase tracking-widest pl-2">—</span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <StatusDropdown 
                          value={status} 
                          onChange={(newStatus) => handleStatusChange(client.id, newStatus)} 
                          disabled={isLocked}
                        />
                      </div>
                    </td>

                    {/* Shake Type Column */}
                    <td className="px-6 py-5">
                      <ShakeTypeDropdown 
                        value={currentRemark} 
                        onChange={(newRemark) => handleRemarkChange(client.id, newRemark)} 
                        disabled={isLocked}
                      />
                    </td>
                  </tr>
                );
              })}
              
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-offwhite border border-beige flex items-center justify-center mb-4">
                      <Search size={24} className="text-muted/40" />
                    </div>
                    <p className="text-forest font-extrabold">No members found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-offwhite/50 border-t border-beige flex items-center justify-between rounded-b-[2rem]">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">
            {filteredClients.length} member{filteredClients.length !== 1 ? 's' : ''} listed
          </p>
          <div className="flex gap-2">
            <button className="p-2.5 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite transition-all shadow-sm opacity-50 cursor-not-allowed"><ChevronLeft size={16} /></button>
            <button className="p-2.5 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite transition-all shadow-sm opacity-50 cursor-not-allowed"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────── */}
      {editingCustomer && <ClientEditModal customer={editingCustomer} onClose={() => setEditingCustomer(null)} />}
      <AttendanceCalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} onDateSelect={(date) => { setSelectedDate(date); setIsCalendarOpen(false); }} />

      {/* Shake Members List Modal */}
      {showShakeMembers && (
        <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-beige flex items-center justify-between bg-offwhite/30">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                  showShakeMembers === 'S' ? 'bg-[#FEF3C7] text-[#D97706]' :
                  showShakeMembers === 'SB' ? 'bg-[#F3E8FF] text-[#7C3AED]' :
                  showShakeMembers === 'SF' ? 'bg-[#CFFAFE] text-[#0891B2]' :
                  showShakeMembers === 'SBF' ? 'bg-[#FFE5B4] text-[#D97706]' : ''
                }`}>
                  {showShakeMembers === 'S' ? <Clock size={20} /> : showShakeMembers === 'SB' ? <Heart size={20} /> : showShakeMembers === 'SF' ? <Sparkles size={20} /> : <Heart size={20} />}</div>
                <div>
                  <h3 className="text-xl font-extrabold text-forest">{REMARK_LABELS[showShakeMembers]} Members</h3>
                  <p className="text-xs text-muted font-bold mt-1">Real-time sync for {getISTDisplayDate(selectedDate)}</p>
                </div>
              </div>
              <button onClick={() => setShowShakeMembers(null)} className="p-2 rounded-xl bg-white border border-beige text-muted hover:text-forest transition-colors shadow-sm"><X size={20} /></button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              {getMembersByRemark(showShakeMembers).length > 0 ? (
                <div className="space-y-3">
                  {getMembersByRemark(showShakeMembers).map((member, idx) => (
                    <div key={idx} className="p-4 bg-offwhite/50 rounded-2xl border border-beige hover:bg-white hover:border-sage/30 transition-all shadow-sm hover:shadow-md group">
                      <div className="flex items-center">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 mr-4 shadow-sm transition-transform group-hover:scale-105 ${
                          showShakeMembers === 'S' ? 'bg-[#D97706] text-white' :
                          showShakeMembers === 'SB' ? 'bg-[#7C3AED] text-white' :
                          showShakeMembers === 'SF' ? 'bg-[#0891B2] text-white' : 'bg-gradient-to-br from-[#D97706] to-[#0891B2] text-white'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-forest text-sm truncate">{member.name}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{REMARK_LABELS[member.remark]}</p>
                            
                            {member.paymentStatus && (
                              <div className="flex items-center gap-3">
                                <span className="w-1 h-1 rounded-full bg-beige/80"></span>
                                <p className="text-[10px] font-bold text-forest uppercase tracking-widest">
                                  Mode: <span className="font-black text-muted">{member.paymentMethod || 'Cash'}</span>
                                </p>
                                <span className="w-1 h-1 rounded-full bg-beige/80"></span>
                                {member.paymentStatus === 'Due' ? (
                                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                    Due: <span className="font-black">₹{((member.dueAmount ?? member.amountPaid) ?? 0).toLocaleString('en-IN')}</span>
                                  </p>
                                ) : member.paymentStatus === 'Advance' && (member.dueAmount ?? 0) > 0 ? (
                                  <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-bold text-forest uppercase tracking-widest">
                                      Paid: <span className="font-black text-[#1F7A45]">₹{(member.advanceAmount ?? 0).toLocaleString('en-IN')}</span>
                                    </p>
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                      Due: <span className="font-black">₹{member.dueAmount.toLocaleString('en-IN')}</span>
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[10px] font-bold text-forest uppercase tracking-widest">
                                    Paid: <span className="font-black text-[#1F7A45]">₹{(member.amountPaid ?? 0).toLocaleString('en-IN')}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                          <span className="flex items-center gap-1 text-[10px] font-black text-forest uppercase tracking-widest">
                            <Clock size={10} className="text-sage" /> {member.time}
                          </span>
                          <span className="text-[9px] font-bold text-muted/80 uppercase tracking-widest">
                            By: <span className="text-forest">{member.markedBy}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5 ${
                    showShakeMembers === 'S' ? 'bg-[#FEF3C7]' :
                    showShakeMembers === 'SB' ? 'bg-[#F3E8FF]' : 'bg-[#CFFAFE]'
                  }`}>
                    <User size={24} className={`${
                      showShakeMembers === 'S' ? 'text-[#D97706]/50' :
                      showShakeMembers === 'SB' ? 'text-[#7C3AED]/50' : 'text-[#0891B2]/50'
                    }`} />
                  </div>
                  <p className="text-forest font-extrabold text-lg">No members found</p>
                  <p className="text-muted text-sm mt-2">No members have taken {REMARK_LABELS[showShakeMembers]} today.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing & Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-8 duration-300 my-4">
            {/* Header */}
            <div className="px-8 py-6 border-b border-beige flex items-center justify-between bg-offwhite/30">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                  paymentModal.remark === 'S' ? 'bg-[#D97706]/10 text-[#D97706]' :
                  paymentModal.remark === 'SB' ? 'bg-[#7C3AED]/10 text-[#7C3AED]' :
                  paymentModal.remark === 'SF' ? 'bg-[#0891B2]/10 text-[#0891B2]' : 'bg-[#D97706]/10 text-[#D97706]'
                }`}><DollarSign size={20} /></div>
                <div>
                  <h3 className="text-xl font-extrabold text-forest">{REMARK_LABELS[paymentModal.remark]}</h3>
                  <p className="text-xs text-muted font-bold mt-1">{paymentModal.customerName}</p>
                </div>
              </div>
              <button onClick={() => setPaymentModal(null)} className="p-2 rounded-xl bg-offwhite text-muted hover:bg-beige transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handlePaymentConfirm} className="p-8 space-y-5">

              {/* Payment Plan */}
              <div className={`grid gap-4 ${paymentModal.plan === 'Custom' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Payment Plan *</label>
                  <select
                    required
                    value={paymentModal.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const amounts = { '1 Day': 173, '3 Days': 729, '10 Days': 2500, '30 Days': 7000 };
                      const newTotal = amounts[plan] ?? paymentModal.totalAmount;
                      setPaymentModal(p => {
                        const adv = p.paymentStatus === 'Paid' ? newTotal : (p.paymentStatus === 'Advance' ? Math.min(p.advanceAmount, newTotal) : 0);
                        const due = p.paymentStatus === 'Due' ? newTotal : (p.paymentStatus === 'Advance' ? Math.max(0, newTotal - adv) : 0);
                        return { ...p, plan, totalAmount: newTotal, advanceAmount: adv, dueAmount: due };
                      });
                    }}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none"
                  >
                    <option value="1 Day">1 Day (₹173)</option>
                    <option value="3 Days">3 Days (₹729)</option>
                    <option value="10 Days">10 Days (₹2,500)</option>
                    <option value="30 Days">30 Days (₹7,000)</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                {paymentModal.plan === 'Custom' && (
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Days *</label>
                    <input
                      type="number" required min="1"
                      value={paymentModal.customDuration}
                      onChange={(e) => setPaymentModal(p => ({...p, customDuration: e.target.value}))}
                      className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                      placeholder="e.g. 5"
                    />
                  </div>
                )}
              </div>

              {/* Status + Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Payment Status *</label>
                  <select
                    required
                    value={paymentModal.paymentStatus}
                    onChange={(e) => {
                      const status = e.target.value;
                      setPaymentModal(p => {
                        const rate = p.totalAmount;
                        if (status === 'Paid') return { ...p, paymentStatus: status, advanceAmount: rate, dueAmount: 0 };
                        if (status === 'Due') return { ...p, paymentStatus: status, advanceAmount: 0, dueAmount: rate };
                        return { ...p, paymentStatus: status, advanceAmount: 0, dueAmount: rate };
                      });
                    }}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Advance">Advance</option>
                    <option value="Due">Due</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Payment Mode *</label>
                  <select
                    required
                    value={paymentModal.paymentMethod}
                    onChange={(e) => setPaymentModal(p => ({...p, paymentMethod: e.target.value}))}
                    className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>

              {/* Advance split — only when Advance selected */}
              {paymentModal.paymentStatus === 'Advance' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Advance (₹) *</label>
                    <input
                      type="number" required min="0" max={paymentModal.totalAmount}
                      value={paymentModal.advanceAmount}
                      onChange={(e) => {
                        const adv = Number(e.target.value);
                        setPaymentModal(p => ({ ...p, advanceAmount: adv, dueAmount: Math.max(0, p.totalAmount - adv) }));
                      }}
                      className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Due (₹)</label>
                    <div className="w-full h-14 px-6 bg-beige/30 border border-beige/50 rounded-2xl font-bold text-muted flex items-center select-none">
                      ₹{paymentModal.dueAmount}
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Total Amount */}
              <div className={`p-5 rounded-3xl border-2 transition-all ${
                paymentModal.remark === 'S' ? 'bg-[#FFFBEB] border-[#D97706]/30' :
                paymentModal.remark === 'SB' ? 'bg-[#F5F3FF] border-[#7C3AED]/30' :
                paymentModal.remark === 'SF' ? 'bg-[#ECFEFF] border-[#0891B2]/30' : 'bg-[#FFFBEB] border-[#D97706]/30'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap">Total Amount (₹)</p>
                  <input
                    type="number" min="0" required
                    value={paymentModal.totalAmount}
                    onChange={(e) => {
                      const newTotal = Number(e.target.value);
                      setPaymentModal(p => {
                        const adv = p.paymentStatus === 'Paid' ? newTotal : (p.paymentStatus === 'Advance' ? Math.min(p.advanceAmount, newTotal) : 0);
                        const due = p.paymentStatus === 'Due' ? newTotal : (p.paymentStatus === 'Advance' ? Math.max(0, newTotal - adv) : 0);
                        return { ...p, totalAmount: newTotal, advanceAmount: adv, dueAmount: due };
                      });
                    }}
                    className={`w-36 text-right bg-transparent outline-none border-b-2 border-dashed text-4xl font-extrabold tracking-tight pb-1 ${
                      paymentModal.remark === 'S' ? 'text-[#D97706] border-[#D97706]/40' :
                      paymentModal.remark === 'SB' ? 'text-[#7C3AED] border-[#7C3AED]/40' :
                      paymentModal.remark === 'SF' ? 'text-[#0891B2] border-[#0891B2]/40' : 'text-[#D97706] border-[#D97706]/40'
                    }`}
                  />
                </div>
                <p className="text-[9px] font-bold text-muted mt-2">Click the amount to edit it</p>
              </div>

              <div className="flex gap-4 pt-1">
                <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 px-6 py-4 bg-white text-forest border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite active:scale-95 transition-all shadow-sm">Cancel</button>
                <button type="submit"
                  className={`flex-[2] px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-luxury active:scale-95 ${
                    paymentModal.remark === 'S' ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-[#D97706]/30' :
                    paymentModal.remark === 'SB' ? 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] shadow-[#7C3AED]/30' :
                    paymentModal.remark === 'SF' ? 'bg-gradient-to-br from-[#06B6D4] to-[#0891B2] shadow-[#0891B2]/30' :
                    'bg-gradient-to-br from-[#F59E0B] to-[#0891B2] shadow-[#D97706]/30'
                  }`}>Confirm & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
