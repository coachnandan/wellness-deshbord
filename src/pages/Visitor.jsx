import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  UserPlus,
  Plus,
  Search,
  Phone,
  Clock,
  Calendar as CalendarIcon,
  X,
  FileText,
  MapPin,
  Trash2,
  Edit3,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  UserCheck,
  CheckSquare
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getISTDateString, getISTTimeString, getISTDisplayDate } from '../utils/dateUtils';
import { toast } from 'react-toastify';
import VisitorCalendarModal from '../components/VisitorCalendarModal';

const PURPOSES = [
  'Enquiry / Info',
  'Trial Session',
  'Weight Loss',
  'Weight Gain',
  'Yoga',
  'Meditation',
  'Fitness',
  'Health & Vitality',
  'Stress Management',
  'General Wellness',
  'Other',
];

export default function Visitor() {
  const { visitors = [], addVisitor, updateVisitor, deleteVisitor, dataLoading, convertVisitorToMember, addClosing, closings = [], user } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => getISTDateString());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [selectedVisitorForMember, setSelectedVisitorForMember] = useState(null);
  const [membershipFormState, setMembershipFormState] = useState({
    startDate: new Date().toISOString().split('T')[0],
    plan: '10 Days',
    amount: 2500,
    amountType: 'Default'
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  const todayStr = getISTDateString();
  const isToday = selectedDate === todayStr;

  // Filter by selected date + search
  const filteredVisitors = visitors.filter(v => {
    const matchesDate = v.visit_date === selectedDate;
    const matchesSearch =
      v.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.mobile_number?.includes(searchTerm);
    return matchesDate && matchesSearch;
  });

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  const paginatedVisitors = filteredVisitors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const todayCount = visitors.filter(v => v.visit_date === todayStr).length;
  const weekAgo = new Date(todayStr);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = visitors.filter(v => new Date(v.visit_date) >= weekAgo).length;

  const handleOpenAdd = () => {
    reset({
      visit_date: todayStr,
      visit_time: getISTTimeString(),
    });
    setEditingVisitor(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (visitor) => {
    setEditingVisitor(visitor);
    setValue('visitor_name', visitor.visitor_name || '');
    setValue('mobile_number', visitor.mobile_number || '');
    setValue('gender', visitor.gender || '');
    setValue('age', visitor.age || '');
    setValue('address', visitor.address || '');
    setValue('purpose', visitor.purpose || '');
    setValue('visit_date', visitor.visit_date || todayStr);
    setValue('visit_time', visitor.visit_time || getISTTimeString());
    setValue('notes', visitor.notes || '');
    setActiveDropdown(null);
    setIsAddModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingVisitor) {
        await updateVisitor(editingVisitor.id, {
          visitor_name: data.visitor_name,
          mobile_number: data.mobile_number || null,
          gender: data.gender || null,
          age: data.age ? Number(data.age) : null,
          address: data.address || null,
          purpose: data.purpose || null,
          visit_date: data.visit_date,
          visit_time: data.visit_time,
          notes: data.notes || null,
        });
        toast.success('Visitor record updated.');
      } else {
        await addVisitor(data);
        toast.success('Visitor logged successfully.');
      }
      setIsAddModalOpen(false);
      reset();
      setEditingVisitor(null);
    } catch (error) {
      toast.error(`Error: ${error.message || 'Operation failed.'}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete visitor record for "${name}"? This cannot be undone.`)) return;
    try {
      await deleteVisitor(id);
      toast.success('Visitor record deleted.');
      setActiveDropdown(null);
    } catch (error) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleConvertToMember = async (visitor) => {
    if (!window.confirm(`Convert visitor "${visitor.visitor_name}" to a Member?`)) return;
    try {
      await convertVisitorToMember(visitor);
      toast.success(`${visitor.visitor_name} is now a Member!`);
      setActiveDropdown(null);
    } catch (error) {
      toast.error(error.message || 'Conversion failed.');
    }
  };

  const handleOpenMembershipModal = (visitor) => {
    setSelectedVisitorForMember(visitor);
    setMembershipFormState({
      startDate: new Date().toISOString().split('T')[0],
      plan: '10 Days',
      amount: 2500,
      amountType: 'Default'
    });
    setIsMembershipModalOpen(true);
    setActiveDropdown(null);
  };

  const handleMembershipSubmit = async (e) => {
    e.preventDefault();
    try {
      const duration = membershipFormState.plan === '3 Days' ? 3 
        : membershipFormState.plan === '10 Days' ? 10 
        : 30;

      await convertVisitorToMember(selectedVisitorForMember, {
        plan: membershipFormState.plan,
        durationDays: duration,
        amount: membershipFormState.amount,
        startDate: membershipFormState.startDate
      });
      toast.success(`${selectedVisitorForMember.visitor_name} is now an Active Member!`);
      setIsMembershipModalOpen(false);
    } catch (error) {
      console.error('Conversion failed:', error);
      toast.error(error.message || 'Failed to assign membership.');
    }
  };

  const handleAddToClosing = async (visitor) => {
    try {
      await addClosing(visitor, user);
      toast.success(`${visitor.visitor_name} has been added to the Closing section!`);
      setActiveDropdown(null);
    } catch (error) {
      if (error.message?.includes('already been added')) {
        toast.warn('This visitor has already been added to the Closing section.');
      } else {
        toast.error(`Failed to add to Closing: ${error.message || 'Unknown error'}`);
      }
      setActiveDropdown(null);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Visitor Logbook</h1>
          <p className="text-muted mt-2 font-medium">Track and manage walk-in visitors in real time.</p>
        </div>

        <div className="flex items-center flex-wrap gap-3 w-full lg:w-auto">
          {/* Date display */}
          <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-2xl border border-beige shadow-luxury">
            <CalendarIcon size={18} className="text-gold" />
            <span className="text-xs font-black text-forest uppercase tracking-widest">
              {getISTDisplayDate(selectedDate)}
            </span>
            {!isToday && (
              <button
                onClick={() => { setSelectedDate(todayStr); setCurrentPage(1); }}
                className="ml-2 px-3 py-1 bg-sage/10 text-sage rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-sage/20 transition-all"
              >
                Today
              </button>
            )}
          </div>

          {/* Hidden date input */}
          <input
            type="date"
            id="visitor-date-input"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
            className="hidden"
          />

          {/* Calendar button */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="p-4 bg-white border border-beige rounded-2xl text-forest hover:bg-offwhite transition-all shadow-sm"
            title="Open Calendar"
          >
            <CalendarIcon size={20} />
          </button>

          {/* Add visitor button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center px-7 py-4 bg-forest text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-forest-hover transition-all shadow-xl shadow-forest/20 active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} className="mr-2 text-gold" />
            Add Visitor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-forest h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total (All Time)</p>
            <UserPlus size={20} className="text-forest/30" />
          </div>
          <p className="text-4xl font-extrabold text-forest leading-none">{visitors.length}</p>
        </div>
        <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-gold h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Today</p>
            <Clock size={20} className="text-gold/30" />
          </div>
          <p className="text-4xl font-extrabold text-gold leading-none">{todayCount}</p>
        </div>
        <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-sage h-[140px]">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">This Week</p>
            <UserPlus size={20} className="text-sage/30" />
          </div>
          <p className="text-4xl font-extrabold text-sage leading-none">{weekCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="luxury-card overflow-hidden bg-white">
        <div className="p-8 sm:p-10 border-b border-beige flex flex-col xl:flex-row gap-6 items-center bg-offwhite/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted/40" size={20} />
            <input
              type="text"
              placeholder="Search by name or contact..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-14 pr-6 py-4 bg-white border border-beige rounded-2xl text-forest font-bold text-sm placeholder-muted/30 focus:ring-4 focus:ring-sage/10 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-offwhite/50 text-muted text-[10px] font-black uppercase tracking-[0.2em] border-b border-beige">
                <th className="px-10 py-6">Visitor</th>
                <th className="px-10 py-6 hidden md:table-cell">Contact</th>
                <th className="px-10 py-6 hidden lg:table-cell">Purpose</th>
                <th className="px-10 py-6">Time</th>
                <th className="px-10 py-6 hidden xl:table-cell">Added By</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40">
              {dataLoading ? (
                <tr>
                  <td colSpan={6} className="px-10 py-16 text-center">
                    <div className="w-8 h-8 border-4 border-sage/20 border-t-sage rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedVisitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-offwhite rounded-full flex items-center justify-center mb-5 border border-beige">
                        <UserPlus size={28} className="text-muted/40" />
                      </div>
                      <p className="text-forest font-extrabold text-xl">
                        No Visitors {isToday ? 'Today' : 'Found'}
                      </p>
                      <p className="text-muted text-sm mt-2">
                        {isToday
                          ? "No walk-ins have been logged today yet."
                          : `No visitor records for ${getISTDisplayDate(selectedDate)}.`}
                      </p>
                      {isToday && (
                        <button
                          onClick={handleOpenAdd}
                          className="mt-6 flex items-center px-6 py-3 bg-forest text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-forest-hover transition-all shadow-md"
                        >
                          <Plus size={14} className="mr-2 text-gold" /> Log First Visitor
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedVisitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-offwhite transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-2xl bg-offwhite border border-beige flex items-center justify-center text-forest font-black text-sm mr-4 shadow-sm group-hover:bg-forest group-hover:text-white transition-all duration-300 flex-shrink-0">
                          {visitor.visitor_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-extrabold text-forest text-base leading-tight">{visitor.visitor_name}</p>
                          {visitor.gender && (
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                              {visitor.gender}{visitor.age ? ` · ${visitor.age} yrs` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden md:table-cell">
                      <div className="space-y-1">
                        {visitor.mobile_number ? (
                          <p className="text-sm font-extrabold text-forest flex items-center">
                            <Phone size={12} className="mr-2 text-sage" /> {visitor.mobile_number}
                          </p>
                        ) : (
                          <span className="text-muted text-xs font-bold">—</span>
                        )}
                        {visitor.address && (
                          <p className="text-[10px] font-bold text-muted flex items-center">
                            <MapPin size={10} className="mr-1 text-gold" />
                            <span className="truncate max-w-[150px]">{visitor.address}</span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden lg:table-cell">
                      {visitor.purpose ? (
                        <span className="inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] bg-sage/10 text-forest border border-sage/20">
                          {visitor.purpose}
                        </span>
                      ) : (
                        <span className="text-muted text-xs font-bold">—</span>
                      )}
                    </td>
                    <td className="px-10 py-8">
                      <span className="inline-flex items-center px-3 py-2 rounded-xl text-[10px] font-black bg-gold/10 text-gold border border-gold/20">
                        <Clock size={10} className="mr-1" /> {visitor.visit_time || '—'}
                      </span>
                      {visitor.notes && (
                        <div className="flex items-center mt-2 text-[10px] text-muted">
                          <FileText size={10} className="mr-1 flex-shrink-0 text-gold" />
                          <span className="truncate max-w-[120px]" title={visitor.notes}>{visitor.notes}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-8 hidden xl:table-cell">
                      <p className="text-xs font-bold text-forest">{visitor.added_by_name || '—'}</p>
                    </td>
                    <td className="px-10 py-8 text-right relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === visitor.id ? null : visitor.id)}
                        className="p-3 text-muted hover:text-forest bg-offwhite border border-beige rounded-xl transition-all shadow-sm group-hover:shadow-md"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === visitor.id && (
                        <div className="absolute right-12 top-10 w-52 bg-white rounded-2xl shadow-2xl border border-beige z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                          <button
                            onClick={() => handleConvertToMember(visitor)}
                            className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-forest hover:bg-offwhite transition-colors flex items-center border-b border-beige/40"
                          >
                            <UserCheck size={14} className="mr-3 text-gold" /> Member
                          </button>
                          <button
                            onClick={() => handleOpenMembershipModal(visitor)}
                            className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-forest hover:bg-offwhite transition-colors flex items-center border-b border-beige/40"
                          >
                            <CreditCard size={14} className="mr-3 text-gold" /> Membership
                          </button>
                          <button
                            onClick={() => handleAddToClosing(visitor)}
                            className={`w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest transition-colors flex items-center border-b border-beige/40 ${
                              closings.some(c => c.visitor_id === visitor.id)
                                ? 'text-muted/40 cursor-not-allowed bg-offwhite/50'
                                : 'text-[#0891B2] hover:bg-[#CFFAFE]/40'
                            }`}
                            disabled={closings.some(c => c.visitor_id === visitor.id)}
                            title={closings.some(c => c.visitor_id === visitor.id) ? 'Already in Closing' : 'Add to Closing'}
                          >
                            <CheckSquare size={14} className={`mr-3 ${closings.some(c => c.visitor_id === visitor.id) ? 'text-muted/30' : 'text-[#0891B2]'}`} />
                            {closings.some(c => c.visitor_id === visitor.id) ? 'In Closing ✓' : 'Closing'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(visitor)}
                            className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-forest hover:bg-offwhite transition-colors flex items-center"
                          >
                            <Edit3 size={14} className="mr-3 text-sage" /> Edit Record
                          </button>
                          <button
                            onClick={() => handleDelete(visitor.id, visitor.visitor_name)}
                            className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors flex items-center"
                          >
                            <Trash2 size={14} className="mr-3" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-10 py-8 bg-offwhite/30 border-t border-beige flex items-center justify-between">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredVisitors.length)} of {filteredVisitors.length}
            </p>
            <div className="flex items-center space-x-3">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite disabled:opacity-30 transition-all shadow-sm">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite disabled:opacity-30 transition-all shadow-sm">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Modal */}
      <VisitorCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onDateSelect={handleDateSelect}
      />

      {/* Add / Edit Visitor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-2xl border border-white/20 animate-in zoom-in-95 duration-500 my-4 sm:my-8">
            <div className="px-6 py-6 sm:px-10 sm:py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-forest tracking-tight">
                  {editingVisitor ? 'Edit Visitor Record' : 'New Visitor'}
                </h2>
                <p className="text-sm font-medium text-muted mt-1">
                  {editingVisitor ? `Editing ${editingVisitor.visitor_name}'s details.` : 'Register a walk-in visitor.'}
                </p>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setEditingVisitor(null); }} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-8">

              {/* Personal Information */}
              <div>
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-5">Personal Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Full Name *</label>
                    <input {...register('visitor_name', { required: 'Name is required' })} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/30" placeholder="e.g. Rahul Verma" />
                    {errors.visitor_name && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1 mt-1 block">{errors.visitor_name.message}</span>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Mobile Number</label>
                    <input {...register('mobile_number')} type="tel" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/30" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Age</label>
                    <input {...register('age')} type="number" min="1" max="120" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/30" placeholder="e.g. 28" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Gender</label>
                    <select {...register('gender')} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Purpose of Visit</label>
                    <select {...register('purpose')} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                      <option value="">Select Purpose</option>
                      {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Address</label>
                    <input {...register('address')} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/30" placeholder="City / Area (Optional)" />
                  </div>
                </div>
              </div>

              {/* Visit Info */}
              <div className="border-t border-beige pt-6">
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-5">Visit Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Visit Date</label>
                    <input {...register('visit_date', { required: true })} type="date" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Visit Time (IST)</label>
                    <input {...register('visit_time')} type="time" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Notes / Remarks (Optional)</label>
                    <textarea {...register('notes')} rows={3} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/30 resize-none" placeholder="Any specific requirements, follow-up notes, etc." />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingVisitor(null); }} className="flex-1 px-8 py-5 bg-white text-muted border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">
                  Discard
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] px-8 py-5 bg-forest text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-2xl shadow-forest/20 disabled:opacity-60">
                  {isSubmitting ? 'Saving...' : editingVisitor ? 'Update Visitor' : 'Save Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Membership Modal */}
      {isMembershipModalOpen && selectedVisitorForMember && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-2xl border border-white/20 animate-in zoom-in-95 duration-500 my-4 sm:my-8">
            <div className="px-6 py-6 sm:px-10 sm:py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-forest tracking-tight">Assign Membership</h2>
                <p className="text-sm font-medium text-muted mt-1">Activate a new membership plan for {selectedVisitorForMember.visitor_name}.</p>
              </div>
              <button onClick={() => setIsMembershipModalOpen(false)} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-8">
              {/* Read-Only Details */}
              <div className="bg-offwhite/50 p-6 rounded-2xl border border-beige/50">
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-4">Visitor Information</p>
                <div className="grid grid-cols-2 gap-4 text-sm font-bold text-forest">
                  <div>Name: <span className="text-muted ml-1">{selectedVisitorForMember.visitor_name}</span></div>
                  <div>Contact: <span className="text-muted ml-1">{selectedVisitorForMember.mobile_number || 'Not specified'}</span></div>
                  <div>Gender: <span className="text-muted ml-1">{selectedVisitorForMember.gender || 'Not specified'}</span></div>
                  <div>Age: <span className="text-muted ml-1">{selectedVisitorForMember.age || 'Not specified'}</span></div>
                  <div className="col-span-2">Address: <span className="text-muted ml-1">{selectedVisitorForMember.address || 'Not specified'}</span></div>
                </div>
              </div>

              <form onSubmit={handleMembershipSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Membership Start Date *</label>
                  <input type="date" required value={membershipFormState.startDate} onChange={(e) => setMembershipFormState(p => ({...p, startDate: e.target.value}))} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Membership Plan *</label>
                  <select required value={membershipFormState.plan} onChange={(e) => {
                    const plan = e.target.value;
                    const defaultAmount = plan === '3 Days' ? 729 : plan === '10 Days' ? 2500 : 7000;
                    setMembershipFormState(p => ({
                      ...p, 
                      plan, 
                      amount: p.amountType === 'Default' ? defaultAmount : p.amount
                    }));
                  }} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                    <option value="3 Days">3 Days</option>
                    <option value="10 Days">10 Days</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Total Amount (₹) *</label>
                  <div className="flex gap-4">
                    <select 
                      value={membershipFormState.amountType} 
                      onChange={(e) => {
                        const amountType = e.target.value;
                        const defaultAmount = membershipFormState.plan === '3 Days' ? 729 : membershipFormState.plan === '10 Days' ? 2500 : 7000;
                        setMembershipFormState(p => ({
                          ...p, 
                          amountType, 
                          amount: amountType === 'Default' ? defaultAmount : p.amount
                        }));
                      }} 
                      className={`h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none ${membershipFormState.amountType === 'Other' ? 'w-1/3' : 'w-full'}`}
                    >
                      <option value="Default">₹{membershipFormState.plan === '3 Days' ? 729 : membershipFormState.plan === '10 Days' ? 2500 : 7000}</option>
                      <option value="Other">Other</option>
                    </select>
                    {membershipFormState.amountType === 'Other' && (
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        value={membershipFormState.amount} 
                        onChange={(e) => setMembershipFormState(p => ({...p, amount: e.target.value}))} 
                        className="flex-1 h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" 
                        placeholder="Enter custom amount" 
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex gap-6 pt-4">
                  <button type="button" onClick={() => setIsMembershipModalOpen(false)} className="flex-1 px-8 py-5 bg-white text-muted border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] px-8 py-5 bg-forest text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-xl shadow-forest/20">
                    Activate Membership
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
