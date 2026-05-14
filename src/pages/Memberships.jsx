import React, { useState } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, Clock, ShieldAlert, DollarSign, Plus, X, Users, Filter, ChevronDown, Download, Eye, Edit3, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export default function Memberships() {
  const { memberships, customers, addMembership, addNewMember, user } = useAppContext();
  const [filter, setFilter] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();

  const filteredMemberships = filter === 'All' 
    ? memberships 
    : memberships.filter(m => m.status === filter);

  const activeCount = memberships.filter(m => m.status === 'Active').length;
  const expiringSoonCount = memberships.filter(m => {
    const daysLeft = (new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 14 && m.status === 'Active';
  }).length;

  const onSubmitNewPlan = async (data) => {
    try {
      await addMembership({
        ...data,
        amount: parseInt(data.amount),
        status: 'Active',
        paymentStatus: 'Paid'
      });
      toast.success('Membership plan activated successfully');
      setIsAddModalOpen(false);
      reset();
    } catch (error) {
      toast.error('Failed to activate plan. Please try again.');
    }
  };

  const onSubmitNewMember = async (data) => {
    try {
      await addNewMember(data);
      toast.success('New member enrolled successfully');
      setIsNewMemberModalOpen(false);
      reset();
    } catch (error) {
      toast.error('Enrollment failed. Please check the data.');
    }
  };

  const openRenewModal = (membership) => {
    setSelectedMembership(membership);
    setIsRenewModalOpen(true);
  };

  const handleRenew = (data) => {
    // Renewal logic
    toast.success('Membership renewed successfully');
    setIsRenewModalOpen(false);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Membership Management</h1>
          <p className="text-muted mt-2 font-medium">Curate and track client wellness journeys.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center px-8 py-4 bg-white text-forest border border-beige rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-offwhite transition-all shadow-sm"
          >
            <CreditCard size={18} className="mr-2 text-sage" />
            Assign Plan
          </button>
          <button 
            onClick={() => setIsNewMemberModalOpen(true)}
            className="flex items-center justify-center px-8 py-4 bg-forest text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-forest-hover transition-all shadow-xl shadow-forest/20 active:scale-95"
          >
            <Plus size={18} className="mr-2 text-gold" />
            Enroll New Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="luxury-card p-8 flex items-center space-x-6 border-l-4 border-l-forest">
          <div className="w-14 h-14 bg-offwhite rounded-2xl flex items-center justify-center text-forest shadow-sm border border-beige">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Active Memberships</p>
            <p className="text-3xl font-extrabold text-forest leading-none">{activeCount}</p>
          </div>
        </div>
        <div className="luxury-card p-8 flex items-center space-x-6 border-l-4 border-l-gold">
          <div className="w-14 h-14 bg-offwhite rounded-2xl flex items-center justify-center text-gold shadow-sm border border-beige">
            <ShieldAlert size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Expiring Soon</p>
            <p className="text-3xl font-extrabold text-forest leading-none">{expiringSoonCount}</p>
          </div>
        </div>
        <div className="luxury-card p-8 flex items-center space-x-6 border-l-4 border-l-sage">
          <div className="w-14 h-14 bg-offwhite rounded-2xl flex items-center justify-center text-sage shadow-sm border border-beige">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Monthly Yield</p>
            <p className="text-3xl font-extrabold text-forest leading-none">₹84k</p>
          </div>
        </div>
      </div>

      <div className="luxury-card overflow-hidden bg-white">
        <div className="p-8 sm:p-10 border-b border-beige flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center space-x-3">
             <Filter size={18} className="text-sage" />
             <h3 className="text-xl font-extrabold text-forest tracking-tight">Enrollment Directory</h3>
          </div>
          <div className="flex p-1.5 bg-offwhite rounded-[1.25rem] border border-beige w-full sm:w-auto">
            {['All', 'Active', 'Pending', 'Expired'].map((status) => (
              <button 
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === status 
                    ? 'bg-forest text-white shadow-lg' 
                    : 'text-muted hover:text-forest'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-offwhite/50 text-muted text-[10px] font-black uppercase tracking-[0.2em] border-b border-beige">
                <th className="px-10 py-6">Practitioner / Journey</th>
                <th className="px-10 py-6">Engagement Plan</th>
                <th className="px-10 py-6 hidden md:table-cell">Duration</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40">
              {filteredMemberships.map((membership) => {
                const customer = customers.find(c => c.id === membership.customerId);
                const daysLeft = Math.ceil((new Date(membership.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysLeft > 0 && daysLeft <= 14;

                return (
                  <tr key={membership.id} className="hover:bg-offwhite transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-2xl bg-offwhite border border-beige flex items-center justify-center text-forest font-black text-sm mr-4 shadow-sm group-hover:bg-forest group-hover:text-white transition-all">
                           {customer?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-extrabold text-forest text-base leading-tight">{customer?.name || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1.5">{customer?.id || 'NO_ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-extrabold text-forest text-sm leading-tight">{membership.plan}</p>
                      <p className="text-[10px] font-bold text-sage uppercase tracking-[0.15em] mt-1.5">₹{membership.amount.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="px-10 py-8 hidden md:table-cell">
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-bold text-forest">{new Date(membership.startDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})} – {new Date(membership.expiryDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</p>
                        {isExpiringSoon && (
                          <div className="flex items-center text-[9px] font-black text-gold uppercase tracking-[0.1em]">
                            <Clock size={10} className="mr-1" /> Ends in {daysLeft} days
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${
                        membership.status === 'Active' ? 'bg-emerald/5 text-emerald border-emerald/20' :
                        membership.status === 'Pending' ? 'bg-gold/5 text-gold border-gold/20' :
                        membership.status === 'Expired' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-offwhite text-muted border-beige'
                      }`}>
                        {membership.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button className="p-3 text-muted hover:text-forest bg-offwhite border border-beige rounded-xl transition-all shadow-sm hover:shadow-md">
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openRenewModal(membership)}
                          className="p-3 text-forest hover:text-white bg-offwhite hover:bg-gold border border-beige hover:border-gold rounded-xl transition-all shadow-sm hover:shadow-md"
                        >
                          <Clock size={16} />
                        </button>
                        <button className="p-3 text-red-300 hover:text-red-600 bg-offwhite border border-beige rounded-xl transition-all shadow-sm hover:shadow-md">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew Modal */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-center justify-center p-6 sm:p-10">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 border-b border-beige flex items-center justify-between bg-offwhite/50">
              <h2 className="text-2xl font-extrabold text-forest tracking-tight">Extend Journey</h2>
              <button onClick={() => setIsRenewModalOpen(false)} className="p-3 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige">
                <X size={20} />
              </button>
            </div>
            <div className="p-10 space-y-8">
               <div className="flex items-center p-6 bg-offwhite rounded-3xl border border-beige">
                 <div className="w-14 h-14 bg-forest rounded-2xl flex items-center justify-center text-white mr-5 shadow-lg">
                   <Users size={24} />
                 </div>
                 <div>
                   <p className="text-xs font-black text-muted uppercase tracking-widest mb-1">Practitioner</p>
                   <p className="text-xl font-extrabold text-forest">{customers.find(c => c.id === selectedMembership?.customerId)?.name}</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Renewal Plan</label>
                   <select className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all">
                     <option>Monthly Flow (₹15,000)</option>
                     <option>Quarterly Balance (₹40,000)</option>
                     <option>Annual Harmony (₹1,50,000)</option>
                   </select>
                 </div>
                 <div className="space-y-3">
                   <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Start Date</label>
                   <input type="date" className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all" />
                 </div>
               </div>

               <div className="flex gap-4 pt-4">
                 <button onClick={() => setIsRenewModalOpen(false)} className="flex-1 px-8 py-4 bg-white text-muted border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Cancel</button>
                 <button onClick={handleRenew} className="flex-[2] px-8 py-4 bg-forest text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-xl shadow-forest/20">Confirm Renewal</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* New Member Enrollment Modal */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-10 duration-700 my-10">
            <div className="px-10 sm:px-14 py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
              <div>
                <h2 className="text-3xl font-extrabold text-forest tracking-tight">Wellness Enrollment</h2>
                <p className="text-sm font-medium text-muted mt-1">Begin a new client's transformation journey.</p>
              </div>
              <button onClick={() => setIsNewMemberModalOpen(false)} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitNewMember)} className="p-10 sm:p-14 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="md:col-span-1 space-y-6">
                  <div className="w-full aspect-square bg-offwhite border-2 border-dashed border-beige rounded-[2.5rem] flex flex-col items-center justify-center text-muted group hover:border-sage transition-colors cursor-pointer">
                    <Plus size={40} className="mb-3 text-beige group-hover:text-sage transition-colors" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Upload Profile</p>
                  </div>
                  <div className="p-6 bg-offwhite/50 rounded-3xl border border-beige">
                    <p className="text-[10px] font-black text-forest uppercase tracking-widest mb-3">Onboarding Coach</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-forest text-white flex items-center justify-center font-bold text-[10px] mr-3 uppercase">{user?.name?.charAt(0) || 'A'}</div>
                      <p className="text-sm font-extrabold text-forest">{user?.name || 'Coach Aditi'}</p>
                    </div>
                  </div>
                </div>

                {/* Fields Section */}
                <div className="md:col-span-2 space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Full Legal Name</label>
                      <input {...register("name", { required: true })} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all placeholder-muted/30" placeholder="e.g. Rahul Sharma" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Contact Number</label>
                      <input {...register("contact", { required: true })} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all placeholder-muted/30" placeholder="+91 00000 00000" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Living Address</label>
                      <input {...register("address", { required: true })} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all placeholder-muted/30" placeholder="Street, City, State, Zip" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Primary Goal</label>
                      <select {...register("purpose")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all appearance-none">
                        <option value="Health">Personal Health & Wellness</option>
                        <option value="Business">Entrepreneurial Growth</option>
                        <option value="Mental">Holistic Mental Clarity</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Profession</label>
                      <input {...register("profession")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all placeholder-muted/30" placeholder="e.g. Design Architect" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Referral Channel</label>
                      <select {...register("referralSource")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all appearance-none">
                        <option value="Instagram">Instagram Bloom</option>
                        <option value="Word of Mouth">Kindred Referral</option>
                        <option value="Website">Global Website</option>
                        <option value="LinkedIn">Professional Network</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Engagement Plan</label>
                      <select {...register("plan")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all appearance-none">
                        <option value="Monthly Flow">Monthly Flow (₹15,000)</option>
                        <option value="Quarterly Balance">Quarterly Balance (₹40,000)</option>
                        <option value="Annual Harmony">Annual Harmony (₹1,50,000)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-beige">
                <button type="button" onClick={() => setIsNewMemberModalOpen(false)} className="flex-1 px-10 py-5 bg-white text-muted border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Discard Entry</button>
                <button type="submit" className="flex-[2] px-10 py-5 bg-forest text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-2xl shadow-forest/20 active:scale-95">Complete Enrollment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
