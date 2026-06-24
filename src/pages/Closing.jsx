import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Check, Filter, Clock,
  Calendar as CalendarIcon, UserCheck, UserMinus, Users,
  ChevronLeft, ChevronRight, ChevronDown, User, X
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getISTDateString, getISTDisplayDate } from '../utils/dateUtils';

// ─── Animated Status Dropdown ────────────────────────────────────────────────
const StatusDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const config = {
    Closing: { bg: 'bg-[#DDF5E5] text-[#1F7A45] border-[#1F7A45]/20 shadow-[#1F7A45]/10', icon: <Check size={16} strokeWidth={3} /> },
    Pending:  { bg: 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20 shadow-[#D97706]/10', icon: <Clock size={16} strokeWidth={2.5} /> },
  };
  const current = config[value] || config.Pending;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300 shadow-md ${current.bg} hover:scale-105 active:scale-95 hover:shadow-lg`}
        title={value || 'Pending'}
      >
        {current.icon}
      </button>
      <div className={`absolute z-30 top-full left-1/2 -translate-x-1/2 mt-2 w-[128px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-beige overflow-hidden transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        {['Closing', 'Pending'].map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); setIsOpen(false); }}
            className={`flex items-center gap-2 w-full text-left px-4 py-3.5 text-[11px] font-black uppercase tracking-widest transition-colors hover:bg-offwhite ${config[opt].bg.split(' ')[1]}`}
          >
            {config[opt].icon}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Animated Selected-Type Dropdown ─────────────────────────────────────────
const SelectedTypeDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const typeStyles = {
    Member:     'bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white border-[#0891B2]',
    Membership: 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white border-[#7C3AED]',
    Pending:    'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white border-[#D97706]',
  };
  const currentStyle = typeStyles[value] || typeStyles.Pending;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-[148px] px-4 py-3 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${currentStyle} hover:scale-[1.02] active:scale-95`}
      >
        <span className="truncate mr-2">{value || 'Select Type'}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 text-white/80 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`absolute z-30 top-full left-0 mt-2 w-[160px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden transition-all duration-300 origin-top-left ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="p-1.5">
          {['Member', 'Membership', 'Pending'].map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`flex items-center justify-between w-full text-left px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:bg-offwhite text-forest`}
            >
              {opt}
              {value === opt && <div className="w-1.5 h-1.5 rounded-full bg-forest" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Closing Page ────────────────────────────────────────────────────────
export default function Closing() {
  const { closings = [], visitors = [], updateClosing } = useAppContext();

  const todayStr = getISTDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Records for the selected date
  const dateClosings = closings.filter(c => c.visit_date === selectedDate);

  // Summary card counts
  const stats = {
    total:        dateClosings.length,
    closing:      dateClosings.filter(c => c.status === 'Closing').length,
    pending:      dateClosings.filter(c => c.status === 'Pending').length,
    selectedType: dateClosings.filter(c => c.selected_type === 'Member' || c.selected_type === 'Membership').length,
  };

  // Handlers — pass only the changed field; updateClosing preserves the rest
  const handleStatusChange = async (visitorId, newStatus) => {
    try { await updateClosing({ visitorId, date: selectedDate, status: newStatus }); }
    catch (err) { console.error('Status update failed:', err); }
  };
  const handleTypeChange = async (visitorId, newType) => {
    try { await updateClosing({ visitorId, date: selectedDate, selectedType: newType }); }
    catch (err) { console.error('Type update failed:', err); }
  };

  // Build display rows: driven by closings for the selected date, enriched with visitor details
  const allRows = dateClosings.map(record => {
    const visitor = visitors.find(v => v.id === record.visitorId) || { id: record.visitorId, visitor_name: record.visitor_name, mobile_number: record.contact_number || '' };
    return { visitor, record, status: record.status || 'Pending', selectedType: record.selected_type || 'Pending' };
  });

  const filtered = allRows.filter(({ visitor, status, selectedType }) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (visitor.visitor_name || '').toLowerCase().includes(q) || (visitor.mobile_number || '').includes(q);
    const matchesFilter =
      filterStatus === 'All' ||
      status === filterStatus ||
      selectedType === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => setPage(1), [searchTerm, filterStatus, selectedDate]);

  return (
    <div className="space-y-10 font-sans">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-forest tracking-tight">Closing</h1>
          <p className="text-muted mt-1 font-medium text-sm">Manage and track daily closings across visitors.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-beige shadow-luxury">
            <CalendarIcon size={15} className="text-gold" />
            <span className="text-xs font-black text-forest uppercase tracking-widest">
              {getISTDisplayDate(selectedDate)}
            </span>
            {selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="ml-2 px-3 py-1 bg-sage/10 text-sage rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sage/20 transition-colors flex items-center gap-1"
              >
                <X size={10} /> Today
              </button>
            )}
          </div>
          <label htmlFor="closing-date-picker" className="flex items-center gap-2 bg-white border border-beige px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-forest hover:bg-offwhite transition-all shadow-luxury cursor-pointer active:scale-95">
            <CalendarIcon size={15} /> Pick Date
          </label>
          <input
            id="closing-date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="sr-only"
          />
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total',         value: stats.total,        color: 'border-l-forest',   textColor: 'text-forest',   Icon: Users },
          { label: 'Closing',       value: stats.closing,      color: 'border-l-[#1F7A45]',textColor: 'text-[#1F7A45]',Icon: UserCheck },
          { label: 'Pending',       value: stats.pending,      color: 'border-l-[#D97706]',textColor: 'text-[#D97706]',Icon: Clock },
          { label: 'Selected Type', value: stats.selectedType, color: 'border-l-[#0891B2]',textColor: 'text-[#0891B2]',Icon: UserMinus },
        ].map(({ label, value, color, textColor, Icon }) => (
          <div key={label} className={`luxury-card p-6 flex flex-col justify-between border-l-4 ${color} hover:-translate-y-1 transition-transform duration-300 h-[130px]`}>
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{label}</p>
              <Icon size={17} className={`${textColor} opacity-30`} />
            </div>
            <p className={`text-4xl font-extrabold ${textColor} leading-none`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table Card ────────────────────────────────────── */}
      <div className="luxury-card overflow-visible bg-white flex flex-col">

        {/* Toolbar */}
        <div className="p-6 border-b border-beige flex flex-col md:flex-row gap-4 items-center bg-offwhite/50 rounded-t-[2rem]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/50" size={17} />
            <input
              type="text"
              placeholder="Search by name or contact…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-white border border-beige rounded-2xl text-forest font-bold text-sm placeholder-muted/40 focus:border-sage focus:ring-4 focus:ring-sage/10 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-52">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={14} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-3.5 bg-white border border-beige rounded-2xl text-forest font-black uppercase tracking-widest text-[10px] outline-none appearance-none cursor-pointer focus:border-sage focus:ring-4 focus:ring-sage/10 transition-all shadow-sm"
              >
                <option value="All">All</option>
                <option value="Closing">Closing</option>
                <option value="Pending">Pending</option>
                <option value="Member">Member</option>
                <option value="Membership">Membership</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-white text-muted text-[10px] font-black uppercase tracking-[0.15em] border-b border-beige">
                <th className="px-8 py-5">Visitor</th>
                <th className="px-6 py-5">Marked By</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5">Selected Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40">
              {paginated.map(({ visitor, record, status, selectedType }) => {
                const updatedTime = record?.updated_at
                  ? new Date(record.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                  : null;

                return (
                  <tr key={visitor.id || Math.random()} className="hover:bg-offwhite/80 transition-colors duration-200 group">
                    {/* Visitor */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center text-forest font-black text-sm shrink-0 group-hover:bg-forest group-hover:text-white group-hover:border-forest group-hover:scale-105 shadow-sm transition-all duration-500">
                          {visitor?.visitor_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-extrabold text-forest text-[15px] leading-tight transition-colors truncate max-w-[180px]"
                          >
                            {visitor?.visitor_name || 'Unknown'}
                          </p>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1 truncate">
                            {visitor?.mobile_number || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Marked By */}
                    <td className="px-6 py-5">
                      {record ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-offwhite border border-beige flex items-center justify-center text-muted shrink-0 shadow-sm">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-forest leading-tight">{record.markedBy || '—'}</p>
                            {updatedTime && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock size={9} className="text-muted/60" />
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{updatedTime}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-muted/40 uppercase tracking-widest pl-2">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <StatusDropdown value={status} onChange={(v) => handleStatusChange(visitor.id, v)} />
                      </div>
                    </td>

                    {/* Selected Type */}
                    <td className="px-6 py-5">
                      <SelectedTypeDropdown value={selectedType} onChange={(v) => handleTypeChange(visitor.id, v)} />
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-offwhite border border-beige flex items-center justify-center mb-4">
                      <Search size={22} className="text-muted/40" />
                    </div>
                    <p className="text-forest font-extrabold text-base">No records found.</p>
                    <p className="text-muted text-sm mt-1">Visitors from previous days will appear here automatically.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-8 py-5 bg-offwhite/50 border-t border-beige flex items-center justify-between rounded-b-[2rem]">
          <p className="text-[10px] font-black text-muted uppercase tracking-widest">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length || 0)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-black text-muted uppercase tracking-widest px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
