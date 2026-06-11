import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Filter, MoreVertical, X, Edit3, Trash2, ChevronLeft, ChevronRight, User as UserIcon, Phone, MapPin, Briefcase, Activity, CreditCard, CalendarClock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { getISTDisplayDate } from '../utils/dateUtils';

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, dataLoading, addMembership } = useAppContext();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [membershipFormState, setMembershipFormState] = useState({
    startDate: new Date().toISOString().split('T')[0],
    plan: '10 Days',
    amount: 2500,
    amountType: 'Default'
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Constants
  const itemsPerPage = 8;

  // Filter and search logic
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.contact || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenMembershipModal = (customer) => {
    setEditingCustomer(customer);
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
        
      console.log('[Membership] Creating membership for:', editingCustomer.id, 'Plan:', membershipFormState.plan);
      await addMembership({
        customerId: editingCustomer.id,
        customerName: editingCustomer.name,
        plan: membershipFormState.plan,
        durationDays: duration,
        amount: membershipFormState.amount,
        startDate: membershipFormState.startDate
      });
      toast.success('Membership created successfully.');
      setIsMembershipModalOpen(false);
    } catch (error) {
      const errMsg = error?.message || error?.error_description || 'Unknown error';
      console.error('[Membership] Failed:', error);
      console.error('[Membership] Error code:', error?.code, '| details:', error?.details, '| hint:', error?.hint);
      toast.error(`Failed to create membership: ${errMsg}`);
    }
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      Object.keys(customer).forEach(key => setValue(key, customer[key]));
      // Map legacy fields to new fields
      setValue('full_name', customer.full_name || customer.name || '');
      setValue('mobile_number', customer.mobile_number || customer.contact_number || customer.contact || '');
    } else {
      setEditingCustomer(null);
      reset({
        joining_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
    setActiveDropdown(null);
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!data.whatsapp_number) data.whatsapp_number = data.mobile_number;
    console.log('Submitting data:', data);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        toast.success('Member profile updated successfully.');
      } else {
        const result = await addCustomer(data);
        if (result?.duplicate) {
          toast.info('Profile already exists for this mobile number.');
        } else {
          toast.success('Member Profile Created Successfully.');
        }
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Operation failed:', error);
      toast.error(`Error: ${error.message || 'Operation failed. Please check the data.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to archive this member profile?')) {
      deleteCustomer(id);
      toast.info('Member profile has been archived');
      setActiveDropdown(null);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Member Directory</h1>
          <p className="text-muted mt-2 font-medium">Manage and nurture your professional member relationships.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full lg:w-auto flex items-center justify-center px-8 py-4 bg-forest text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-forest-hover transition-all shadow-xl shadow-forest/20 active:scale-95"
        >
          <Plus size={18} className="mr-2 text-gold" />
          Add New Profile
        </button>
      </div>

      <div className="luxury-card overflow-hidden bg-white">
        <div className="p-8 sm:p-10 border-b border-beige flex flex-col sm:flex-row gap-6 items-center bg-offwhite/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted/40" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-14 pr-6 py-4 bg-white border border-beige rounded-2xl text-forest font-bold text-sm placeholder-muted/30 focus:ring-4 focus:ring-sage/10 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={16} />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-4 bg-white border border-beige rounded-2xl text-forest font-black uppercase tracking-widest text-[10px] outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-sage/10 transition-all"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-offwhite/50 text-muted text-[10px] font-black uppercase tracking-[0.2em] border-b border-beige">
                <th className="px-10 py-6">Member Profile</th>
                <th className="px-10 py-6 hidden md:table-cell">Contact & Location</th>
                <th className="px-10 py-6 hidden lg:table-cell">Professional Focus</th>
                <th className="px-10 py-6 hidden xl:table-cell">Registered On</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40">
              {dataLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-10 py-8">
                      <div className="flex items-center">
                        <div className="w-14 h-14 rounded-2xl bg-sage/10 mr-5"></div>
                        <div className="space-y-2">
                          <div className="w-28 h-4 bg-sage/10 rounded"></div>
                          <div className="w-16 h-3 bg-sage/10 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden md:table-cell">
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-sage/10 rounded"></div>
                        <div className="w-24 h-3 bg-sage/10 rounded"></div>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden lg:table-cell">
                      <div className="space-y-2">
                        <div className="w-24 h-4 bg-sage/10 rounded"></div>
                        <div className="w-20 h-3 bg-sage/10 rounded"></div>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden xl:table-cell">
                      <div className="w-24 h-4 bg-sage/10 rounded"></div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="w-16 h-6 bg-sage/10 rounded-xl"></div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="inline-block w-10 h-10 bg-sage/10 rounded-xl"></div>
                    </td>
                  </tr>
                ))
              ) : currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-16 text-center text-muted font-medium">
                    No members found.
                  </td>
                </tr>
              ) : (
                currentCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-offwhite transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center">
                        <div className="w-14 h-14 rounded-2xl bg-offwhite border border-beige flex items-center justify-center text-forest font-black text-lg mr-5 shadow-sm group-hover:bg-forest group-hover:text-white transition-all">
                          {customer?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p
                            onClick={() => handleOpenModal(customer)}
                            className="font-extrabold text-forest text-base leading-tight cursor-pointer hover:text-sage transition-colors"
                          >
                            {customer?.name || 'Unknown'}
                          </p>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1.5">{customer?.id || 'NO_ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden md:table-cell">
                      <div className="space-y-1.5">
                        <p className="text-sm font-extrabold text-forest flex items-center"><Phone size={12} className="mr-2 text-sage" /> {customer?.contact || 'No Contact'}</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center"><MapPin size={12} className="mr-2 text-gold" /> {customer?.address?.split(',')[0] || 'Unknown Location'}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden lg:table-cell">
                      <div className="space-y-1.5">
                        <p className="text-sm font-extrabold text-forest flex items-center"><Briefcase size={14} className="mr-2 text-sage" /> {customer.profession}</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center"><Activity size={14} className="mr-2 text-gold" /> {customer.purpose}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden xl:table-cell">
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-forest flex items-center">
                          <CalendarClock size={13} className="mr-2 text-sage shrink-0" />
                          {customer.registration_date
                            ? getISTDisplayDate(customer.registration_date)
                            : (customer.joining_date ? getISTDisplayDate(customer.joining_date) : '—')}
                        </p>
                        {customer.registration_time_ist && (
                          <p className="text-[9px] font-bold text-muted uppercase tracking-widest ml-5">
                            {customer.registration_time_ist}
                          </p>
                        )}
                        {customer.created_by_name && (
                          <p className="text-[9px] font-bold text-muted uppercase tracking-widest ml-5">
                            by {customer.created_by_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${customer.status === 'Active' ? 'bg-emerald/5 text-emerald border-emerald/20' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === customer.id ? null : customer.id)}
                        className="p-3 text-muted hover:text-forest bg-offwhite border border-beige rounded-xl transition-all shadow-sm group-hover:shadow-md"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {activeDropdown === customer.id && (
                        <div className="absolute right-14 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-beige z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                          <button
                            onClick={() => handleOpenMembershipModal(customer)}
                            className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-forest hover:bg-offwhite transition-colors flex items-center border-b border-beige/40"
                          >
                            <CreditCard size={16} className="mr-3 text-gold" /> Membership
                          </button>
                          <button
                            onClick={() => handleOpenModal(customer)}
                            className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-forest hover:bg-offwhite transition-colors flex items-center"
                          >
                            <Edit3 size={16} className="mr-3 text-sage" /> Edit Profile
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 transition-colors flex items-center"
                          >
                            <Trash2 size={16} className="mr-3" /> Archive Profile
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

        {totalPages > 1 && (
          <div className="px-10 py-8 bg-offwhite/30 border-t border-beige flex items-center justify-between">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} members
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-2xl border border-white/20 animate-in zoom-in-95 duration-500 my-4 sm:my-8">
            <div className="px-6 py-6 sm:px-10 sm:py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-forest tracking-tight">
                  {editingCustomer ? 'Update Profile' : 'New Member Profile'}
                </h2>
                <p className="text-sm font-medium text-muted mt-1">Refine the professional details of your member.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-8">
              {/* Personal Information */}
              <div>
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-5">Personal Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Full Name *</label>
                    <input {...register("full_name", { required: "Full name is required" })} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. Aditi Sharma" />
                    {errors.full_name && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1 mt-1 block">{errors.full_name.message}</span>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Mobile Number *</label>
                    <input {...register("mobile_number", { required: "Mobile number is required" })} type="tel" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="+91 98765 43210" />
                    {errors.mobile_number && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1 mt-1 block">{errors.mobile_number.message}</span>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">WhatsApp Number</label>
                    <input {...register("whatsapp_number")} type="tel" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="Same as mobile if blank" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Email ID</label>
                    <input {...register("email")} type="email" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. member@example.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Date of Birth</label>
                    <input {...register("dob")} type="date" className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Gender</label>
                    <select {...register("gender")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Marital Status</label>
                    <select {...register("marital_status")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Profession</label>
                    <input {...register("profession")} className="w-full h-14 px-6 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. Architect" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1 mb-2">Address</label>
                    <textarea {...register("address")} rows={2} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20 resize-none" placeholder="Street, City, State" />
                  </div>
                </div>
              </div>

              {/* Membership Information */}
              <div className="border-t border-beige pt-6">
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-5">Membership Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Joining Date</label>
                    <input {...register("joining_date")} type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Purpose / Wellness Goal</label>
                    <select {...register("purpose")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                      <option value="">Select Purpose</option>
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Weight Gain">Weight Gain</option>
                      <option value="Yoga">Yoga</option>
                      <option value="Meditation">Meditation</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Health & Vitality">Health &amp; Vitality</option>
                      <option value="Stress Management">Stress Management</option>
                      <option value="General Wellness">General Wellness</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Member Type *</label>
                    <select {...register("member_type", { required: "Member type is required" })} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                      <option value="">Select Member Type</option>
                      <option value="Coach">Coach</option>
                      <option value="Member">Member</option>
                    </select>
                    {errors.member_type && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.member_type.message}</span>}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Referred By</label>
                    <input {...register("referred_by")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="Name or Source" />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-5 bg-white text-muted border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Discard</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] px-8 py-5 bg-forest text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-2xl shadow-forest/20 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Saving...' : (editingCustomer ? 'Update Profile' : 'Establish Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Membership Modal */}
      {isMembershipModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-2xl border border-white/20 animate-in zoom-in-95 duration-500 my-4 sm:my-8">
            <div className="px-6 py-6 sm:px-10 sm:py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-forest tracking-tight">Assign Membership</h2>
                <p className="text-sm font-medium text-muted mt-1">Activate a new membership plan for {editingCustomer.name}.</p>
              </div>
              <button onClick={() => setIsMembershipModalOpen(false)} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-8">
              {/* Read-Only Details */}
              <div className="bg-offwhite/50 p-6 rounded-2xl border border-beige/50">
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-4">Member Information</p>
                <div className="grid grid-cols-2 gap-4 text-sm font-bold text-forest">
                  <div>Name: <span className="text-muted ml-1">{editingCustomer.name}</span></div>
                  <div>ID: <span className="text-muted ml-1">{editingCustomer.id?.slice(0,8)}</span></div>
                  <div>Contact: <span className="text-muted ml-1">{editingCustomer.contact}</span></div>
                  <div>Gender: <span className="text-muted ml-1">{editingCustomer.gender || 'Not specified'}</span></div>
                  <div className="col-span-2">Address: <span className="text-muted ml-1">{editingCustomer.address || 'Not specified'}</span></div>
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
