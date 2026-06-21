import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
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
      default: return 'bg-white/80 backdrop-blur-md text-forest border-beige hover:border-sage/40 hover:bg-white shadow-sm';
    }
  };

  const getLabel = (remark) => {
    if (remark === 'S') return 'S · Shake';
    if (remark === 'SB') return 'SB · +Beta';
    if (remark === 'SF') return 'SF · +Fiber';
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
            { id: 'SF', label: 'Shake + Fiber', icon: <Sparkles size={14}/>, color: 'text-[#0891B2]', bgHover: 'hover:bg-[#CFFAFE]' }
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
  const { attendance = [], customers = [], memberships = [], attendanceLocks = [], updateAttendance, finalizeAttendance } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getISTDateString());
  const [paymentModal, setPaymentModal] = useState(null);
  
  // Shake Members Modal State
  const [showShakeMembers, setShowShakeMembers] = useState(null); // 'S', 'SB', or 'SF'
  const [isShakeDropdownOpen, setIsShakeDropdownOpen] = useState(false);
  const shakeDropdownRef = useRef(null);

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
  
  const todayStr = getISTDateString();
  const selectedAttendance = attendance.filter(a => a.date === selectedDate);

  const stats = {
    total: customers.length || 0,
    present: selectedAttendance.filter(a => a.status === 'Present').length || 0,
    absent: selectedAttendance.filter(a => a.status === 'Absent').length || 0,
    shakes: selectedAttendance.filter(a => ['S', 'SB', 'SF'].includes(a.remark)).length || 0,
    sb: selectedAttendance.filter(a => a.remark === 'SB').length || 0,
    sf: selectedAttendance.filter(a => a.remark === 'SF').length || 0,
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
          
          if (['S', 'SB', 'SF'].includes(att.remark)) dayObj.shake++;
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

  const DAILY_RATES = { 'S': 250, 'SB': 418, 'SF': 348 };
  const REMARK_LABELS = { 'S': 'Shake', 'SB': 'Shake + Beta Heart', 'SF': 'Shake + Fiber' };

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
    if (['S', 'SB', 'SF'].includes(remarkValue)) {
      const days = getRemarkDaysCount(customerId, remarkValue);
      const dailyRate = DAILY_RATES[remarkValue];
      setPaymentModal({ customerId, customerName: customer?.name || 'Unknown', remark: remarkValue, days, dailyRate, totalAmount: days * dailyRate });
      return;
    }
  };

  const handlePaymentConfirm = async () => {
    if (!paymentModal) return;
    const { customerId, remark, days, dailyRate, totalAmount } = paymentModal;
    try {
      const record = selectedAttendance.find(a => a.customerId === customerId);
      // Notice we preserve the existing status (or default to 'Present') instead of setting to 'Shake'
      const statusToSave = record?.status && record.status !== 'Pending' ? record.status : 'Present';
      
      await updateAttendance({ 
        customerId, 
        date: selectedDate, 
        status: statusToSave, 
        checkIn: record?.checkIn || getISTTimeString(), 
        remark 
      });
      
      const customerMemberships = memberships.filter(m => m.customerId === customerId);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const activeMem = customerMemberships.find(m => new Date(m.expiryDate) >= today);
      
      if (activeMem) {
        const membership = memberships
          .filter(m => m.client_id === customerId || m.customerId === customerId)
          .sort((a, b) => new Date(b.start_date || b.createdAt) - new Date(a.start_date || a.createdAt))[0];
        if (membership) {
          await supabase.from('memberships').update({ extra_type: remark, extra_charge: totalAmount, extra_days: days }).eq('id', membership.id).select();
        }
      }
      
      const customer = customers.find(c => c.id === customerId);
      toast.success(`${REMARK_LABELS[remark]} recorded for ${customer?.name} — Day ${days}, Total: ₹${totalAmount}`);
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
        return {
          id: a.customerId,
          name: customer?.name || 'Unknown',
          contact: customer?.contact || '-',
          markedBy: a.markedBy || '-',
          time: a.checkIn || (a.updated_at ? new Date(a.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'),
          remark: a.remark
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
            className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-[#D97706] relative hover:-translate-y-1 transition-transform duration-300 h-[140px] cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Shake</p>
              <Clock size={18} className="text-[#D97706]/30" />
            </div>
            <p className="text-4xl font-extrabold text-[#D97706] leading-none">{stats.shakes}</p>
            
            {/* Shake Details Dropdown Overlay */}
            <div onClick={(e) => e.stopPropagation()} className={`absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-luxury-hover border border-white/50 p-2 transition-all duration-300 z-20 ${isShakeDropdownOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
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
        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-muted text-[10px] font-black uppercase tracking-[0.15em] border-b border-beige">
                <th className="px-8 py-6">Member Profile</th>
                <th className="px-6 py-6">Marked By</th>
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
                    <td className="px-6 py-5">
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
                  showShakeMembers === 'SB' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'bg-[#CFFAFE] text-[#0891B2]'
                }`}>
                  {showShakeMembers === 'S' ? <Clock size={20} /> : showShakeMembers === 'SB' ? <Heart size={20} /> : <Sparkles size={20} />}
                </div>
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
                    <div key={idx} className="flex items-center p-4 bg-offwhite/50 rounded-2xl border border-beige hover:bg-white hover:border-sage/30 transition-all shadow-sm hover:shadow-md group">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 mr-4 shadow-sm transition-transform group-hover:scale-105 ${
                        showShakeMembers === 'S' ? 'bg-[#D97706] text-white' :
                        showShakeMembers === 'SB' ? 'bg-[#7C3AED] text-white' : 'bg-[#0891B2] text-white'
                      }`}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-forest text-sm truncate">{member.name}</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">ID: {member.id.substring(0,8)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
                        <span className="flex items-center gap-1 text-[10px] font-black text-forest uppercase tracking-widest">
                          <Clock size={10} className="text-sage" /> {member.time}
                        </span>
                        <span className="text-[9px] font-bold text-muted/80 uppercase tracking-widest">
                          By: <span className="text-forest">{member.markedBy}</span>
                        </span>
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

      {/* Daily Rate Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="px-8 py-6 border-b border-beige flex items-center justify-between bg-offwhite/30">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                  paymentModal.remark === 'S' ? 'bg-[#D97706]/10 text-[#D97706]' :
                  paymentModal.remark === 'SB' ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'bg-[#0891B2]/10 text-[#0891B2]'
                }`}><DollarSign size={20} /></div>
                <div>
                  <h3 className="text-xl font-extrabold text-forest">{REMARK_LABELS[paymentModal.remark]}</h3>
                  <p className="text-xs text-muted font-bold mt-1">{paymentModal.customerName}</p>
                </div>
              </div>
              <button onClick={() => setPaymentModal(null)} className="p-2 rounded-xl bg-offwhite text-muted hover:bg-beige transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-5 bg-offwhite rounded-2xl border border-beige">
                <div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">Days Logged</p>
                  <p className="text-3xl font-extrabold text-forest mt-1">{paymentModal.days}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">Rate</p>
                  <p className="text-2xl font-extrabold text-sage mt-1">₹{paymentModal.dailyRate}</p>
                  <p className="text-[9px] font-bold text-muted mt-1">per day</p>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border-2 transition-colors ${
                paymentModal.remark === 'S' ? 'bg-[#FEF9C3]/20 border-[#D97706]/20' :
                paymentModal.remark === 'SB' ? 'bg-[#7C3AED]/5 border-[#7C3AED]/20' : 'bg-[#0891B2]/5 border-[#0891B2]/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Total Amount</p>
                    <p className="text-[10px] font-bold text-muted mt-1">{paymentModal.days} days × ₹{paymentModal.dailyRate}</p>
                  </div>
                  <p className={`text-4xl font-extrabold tracking-tight ${
                    paymentModal.remark === 'S' ? 'text-[#D97706]' : paymentModal.remark === 'SB' ? 'text-[#7C3AED]' : 'text-[#0891B2]'
                  }`}>₹{paymentModal.totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 border-t border-beige bg-offwhite/50 flex gap-4">
              <button onClick={() => setPaymentModal(null)} className="flex-1 px-6 py-4 bg-white text-forest border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite active:scale-95 transition-all shadow-sm">Cancel</button>
              <button onClick={handlePaymentConfirm}
                className={`flex-[2] px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-luxury active:scale-95 ${
                  paymentModal.remark === 'S' ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-[#D97706]/30' :
                  paymentModal.remark === 'SB' ? 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] shadow-[#7C3AED]/30' : 
                  'bg-gradient-to-br from-[#06B6D4] to-[#0891B2] shadow-[#0891B2]/30'
                }`}>Confirm & Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
