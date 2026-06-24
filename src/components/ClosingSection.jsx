import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Check, X, Filter, Clock,
  Calendar as CalendarIcon, UserCheck, UserMinus, Users, Download,
  ChevronLeft, ChevronRight, ChevronDown, User
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getISTDateString, getISTTimeString, getISTDisplayDate } from '../utils/dateUtils';
import ClientEditModal from './ClientEditModal';

// --- Custom Animated Dropdown Components ---

const StatusDropdown = ({ value, onChange }) => {
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
      case 'Closing': return 'bg-[#DDF5E5] text-[#1F7A45] border-[#1F7A45]/20 shadow-[#1F7A45]/10';
      case 'Pending': return 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20 shadow-[#D97706]/10';
      default: return 'bg-offwhite text-muted border-beige shadow-sm';
    }
  };

  const getIcon = (status) => {
    switch (status) {
      case 'Closing': return <Check size={16} strokeWidth={3} />;
      case 'Pending': return <Clock size={16} strokeWidth={3} />;
      default: return <Clock size={16} className="opacity-50" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300 shadow-md ${getStyles(value)} hover:scale-105 active:scale-95 hover:shadow-lg`}
        title={value}
      >
        {getIcon(value)}
      </button>

      {/* Dropdown Menu */}
      <div className={`absolute z-20 top-full left-1/2 -translate-x-1/2 mt-2 w-[120px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-beige overflow-hidden transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        {['Closing', 'Pending'].map((opt) => (
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

const SelectedTypeDropdown = ({ value, onChange }) => {
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

  const getStyles = (type) => {
    switch (type) {
      case 'Member': return 'bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white border-[#0891B2] shadow-md shadow-[#0891B2]/30';
      case 'Membership': return 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/30';
      case 'Pending': return 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white border-[#D97706] shadow-md shadow-[#D97706]/30';
      default: return 'bg-white/80 backdrop-blur-md text-forest border-beige hover:border-sage/40 hover:bg-white shadow-sm';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-[140px] px-4 py-3 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${getStyles(value)} hover:scale-[1.02] active:scale-95`}
      >
        <span className="truncate mr-2">{value || 'Select Type'}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''} ${value && value !== 'Pending' ? 'text-white/80' : 'text-muted/50'}`} />
      </button>

      {/* Glassmorphism Dropdown */}
      <div className={`absolute z-20 top-full left-0 mt-2 w-[160px] -ml-[10px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden transition-all duration-400 origin-top-left ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        <div className="p-1.5">
          {['Member', 'Membership', 'Pending'].map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:bg-offwhite ${value === opt ? 'bg-offwhite' : 'bg-transparent'} text-forest relative overflow-hidden group`}
            >
              {opt}
              {value === opt && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-forest" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ClosingSection() {
  const { closings = [], customers = [], updateClosing } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => getISTDateString());
  
  const todayStr = getISTDateString();
  const selectedClosings = closings.filter(c => c.closing_date === selectedDate);

  // Summary Cards Logic
  const stats = {
    total: selectedClosings.length || 0,
    closing: selectedClosings.filter(c => c.status === 'Closing').length || 0,
    pending: selectedClosings.filter(c => c.status === 'Pending').length || 0,
    selectedType: selectedClosings.filter(c => c.selected_type === 'Member' || c.selected_type === 'Membership').length || 0,
  };

  const handleStatusChange = async (customerId, newStatus) => {
    try {
      await updateClosing({ customerId, date: selectedDate, status: newStatus });
    } catch (error) {
      console.error('Closing status update failed:', error);
    }
  };

  const handleTypeChange = async (customerId, newType) => {
    try {
      await updateClosing({ customerId, date: selectedDate, selectedType: newType });
    } catch (error) {
      console.error('Selected type update failed:', error);
    }
  };

  // List all customers for the table. We map each to a closing record if it exists, else default Pending
  const filteredClients = customers.filter(client => {
    const matchesSearch =
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contact || '').includes(searchTerm);
    const record = selectedClosings.find(c => c.customerId === client.id);
    const status = record ? record.status : 'Pending';
    const type = record ? record.selected_type : 'Pending';
    const matchesStatus = filterStatus === 'All' || status === filterStatus || type === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-10 font-sans animate-in fade-in duration-500 mt-16">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest tracking-tight">Closing</h2>
          <p className="text-muted mt-2 font-medium">Manage and track daily closings efficiently.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-beige shadow-luxury hover:shadow-luxury-hover transition-all duration-300">
            <CalendarIcon size={16} className="text-gold" />
            <span className="text-xs font-black text-forest uppercase tracking-widest">{getISTDisplayDate(selectedDate)}</span>
            {selectedDate !== todayStr && (
              <button onClick={() => setSelectedDate(todayStr)} className="px-3 py-1.5 bg-sage/10 text-sage rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sage/20 transition-colors ml-2">Today</button>
            )}
          </div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="hidden" id="closing-date" />
          <label htmlFor="closing-date" className="flex items-center gap-2 bg-white border border-beige px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-forest hover:bg-offwhite transition-all duration-300 shadow-luxury cursor-pointer active:scale-95 hover:shadow-luxury-hover">
            <CalendarIcon size={16} /> Pick Date
          </label>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-forest hover:-translate-y-1 transition-transform duration-300 h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total</p>
            <Users size={18} className="text-forest/30" />
          </div>
          <p className="text-4xl font-extrabold text-forest leading-none">{stats.total}</p>
        </div>
        <div className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-[#1F7A45] hover:-translate-y-1 transition-transform duration-300 h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Closing</p>
            <UserCheck size={18} className="text-[#1F7A45]/30" />
          </div>
          <p className="text-4xl font-extrabold text-[#1F7A45] leading-none">{stats.closing}</p>
        </div>
        <div className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-[#D97706] hover:-translate-y-1 transition-transform duration-300 h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Pending</p>
            <Clock size={18} className="text-[#D97706]/30" />
          </div>
          <p className="text-4xl font-extrabold text-[#D97706] leading-none">{stats.pending}</p>
        </div>
        <div className="luxury-card p-6 flex flex-col justify-between border-l-4 border-l-[#0891B2] hover:-translate-y-1 transition-transform duration-300 h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Selected Type</p>
            <UserMinus size={18} className="text-[#0891B2]/30" />
          </div>
          <p className="text-4xl font-extrabold text-[#0891B2] leading-none">{stats.selectedType}</p>
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
                <option value="Closing">Closing</option>
                <option value="Pending">Pending</option>
                <option value="Member">Member</option>
                <option value="Membership">Membership</option>
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
                <th className="px-6 py-6">Selected Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40 relative">
              {filteredClients.map((client) => {
                const record = selectedClosings.find(c => c.customerId === client.id);
                const status = record ? record.status : 'Pending';
                const currentType = record ? record.selected_type : 'Pending';
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
                        />
                      </div>
                    </td>

                    {/* Selected Type Column */}
                    <td className="px-6 py-5">
                      <SelectedTypeDropdown 
                        value={currentType} 
                        onChange={(newType) => handleTypeChange(client.id, newType)} 
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
    </div>
  );
}
