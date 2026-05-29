import { useState, useMemo } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, Clock, ShieldAlert, DollarSign, Plus, X, Users, Filter, ChevronDown, Download, Eye, Edit3, Trash2, Activity, Calendar, History, MessageSquare, MapPin, Briefcase, Phone, ArrowRight, User, Info, Tag, Globe, Award, Sparkles, Zap, Smartphone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export default function Memberships() {
  const { memberships, customers, addMembership, addNewMember, renewMembership, user, sendWhatsAppAlert } = useAppContext();
  const [filter, setFilter] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [renewalLogs, setRenewalLogs] = useState([]);
  const [memberAttendance, setMemberAttendance] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');

  const { register, handleSubmit, reset } = useForm();

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
    console.log("onSubmitNewMember called with data:", data);
    try {
      await addNewMember(data);
      toast.success('New member enrolled successfully');
      setIsNewMemberModalOpen(false);
      reset();
    } catch (error) {
      console.error("onSubmitNewMember error:", error);
      toast.error('Enrollment failed. Please check the data.');
    }
  };

  const openRenewModal = (membership) => {
    setSelectedMembership(membership);
    setIsRenewModalOpen(true);
  };

  const handleRenew = async (durationDays) => {
    if (!selectedMembership) return;
    try {
      await renewMembership(selectedMembership.id, durationDays);
      toast.success('Wellness journey successfully extended');
      setIsRenewModalOpen(false);
    } catch (error) {
      toast.error('Extension failed. Please check connectivity.');
    }
  };

  const openDetailModal = async (membership) => {
    setActiveMembership(membership);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    
    try {
      const { supabase } = await import('../lib/supabaseClient');
      if (supabase) {
        // Fetch Renewal Logs
        const { data: logs } = await supabase
          .from('renewal_logs')
          .select('*')
          .eq('membership_id', membership.id)
          .order('renewed_at', { ascending: false });
        
        if (logs) setRenewalLogs(logs);

        // Fetch Member-specific Attendance (recent 10)
        const { data: att } = await supabase
          .from('attendance')
          .select('*')
          .eq('client_id', membership.customerId)
          .order('date', { ascending: false })
          .limit(10);
        
        if (att) setMemberAttendance(att);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setIsDetailLoading(false);
    }
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
                  <tr 
                    key={membership.id} 
                    className="hover:bg-offwhite transition-colors group cursor-pointer"
                    onClick={(e) => {
                      if (e.target.closest('button')) return;
                      openDetailModal(membership);
                    }}
                  >
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
                      <p className="text-[10px] font-bold text-sage uppercase tracking-[0.15em] mt-1.5">₹{(membership.amount || 0).toLocaleString('en-IN')}</p>
                    </td>
                    <td className="px-10 py-8 hidden md:table-cell">
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-bold text-forest">{membership.startDate ? new Date(membership.startDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'}) : 'N/A'} – {membership.expiryDate ? new Date(membership.expiryDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'}) : 'N/A'}</p>
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
                        <button 
                          onClick={() => openDetailModal(membership)}
                          className="p-3 text-muted hover:text-forest bg-offwhite border border-beige rounded-xl transition-all shadow-sm hover:shadow-md"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openRenewModal(membership)}
                          className="p-3 text-forest hover:text-white bg-offwhite hover:bg-gold border border-beige hover:border-gold rounded-xl transition-all shadow-sm hover:shadow-md"
                        >
                          <Clock size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            sendWhatsAppAlert(membership.customerId, 'Renewal Reminder', { expiry_date: membership.expiryDate });
                          }}
                          className="p-3 text-emerald hover:text-white bg-offwhite hover:bg-emerald/80 border border-beige hover:border-emerald rounded-xl transition-all shadow-sm hover:shadow-md"
                          title="Send WhatsApp Reminder"
                        >
                          <Activity size={16} />
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
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="flex items-center p-6 bg-offwhite rounded-3xl border border-beige col-span-1 sm:col-span-2">
                   <div className="w-14 h-14 bg-forest rounded-2xl flex items-center justify-center text-white mr-5 shadow-lg shrink-0">
                     <Users size={24} />
                   </div>
                   <div className="overflow-hidden">
                     <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Practitioner</p>
                     <p className="text-xl font-extrabold text-forest truncate">{customers.find(c => c.id === selectedMembership?.customerId)?.name}</p>
                     <p className="text-[10px] font-bold text-sage uppercase tracking-widest mt-1 flex items-center">
                       <ShieldAlert size={10} className="mr-1" /> {customers.find(c => c.id === selectedMembership?.customerId)?.whatsapp_number || 'No WhatsApp'}
                     </p>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Renewal Extension</label>
                   <select 
                     id="renewalDuration"
                     className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none"
                     defaultValue="30"
                   >
                     <option value="30">Monthly Flow (+30 Days)</option>
                     <option value="90">Quarterly Balance (+90 Days)</option>
                     <option value="180">Half-Yearly (+180 Days)</option>
                     <option value="365">Annual Harmony (+365 Days)</option>
                   </select>
                 </div>
                 <div className="space-y-3">
                   <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Current Expiry</label>
                   <div className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest/40 flex items-center">
                     <Clock size={16} className="mr-3" />
                     {selectedMembership?.expiryDate ? new Date(selectedMembership.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                   </div>
                 </div>
               </div>

               <div className="flex gap-4 pt-4">
                 <button onClick={() => setIsRenewModalOpen(false)} className="flex-1 px-8 py-4 bg-white text-muted border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Discard</button>
                 <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        sendWhatsAppAlert(selectedMembership?.customerId, 'Renewal Reminder', { expiry_date: selectedMembership?.expiryDate });
                      }}
                      className="p-2.5 text-emerald bg-white border border-beige rounded-xl hover:bg-emerald hover:text-white transition-all shadow-sm"
                    >
                      <Activity size={14} />
                    </button>
                    <button 
                      onClick={() => handleRenew(document.getElementById('renewalDuration').value)} 
                      className="text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 bg-forest text-white hover:bg-forest-hover rounded-xl transition-all shadow-lg shadow-forest/10 active:scale-95"
                    >
                      Complete Extension
                    </button>
                  </div>
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
            
            <form onSubmit={handleSubmit(onSubmitNewMember, (err) => console.log("Form validation errors:", err))} className="p-10 sm:p-14 space-y-10">
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
      {/* Member Detail Modal */}
      {isDetailModalOpen && activeMembership && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-10 duration-700 my-auto">
            {/* Header */}
            <div className="px-8 sm:px-14 py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.75rem] bg-forest text-white flex items-center justify-center text-2xl font-black shadow-2xl shadow-forest/20">
                  {customers.find(c => c.id === activeMembership.customerId)?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-forest tracking-tight">
                    {customers.find(c => c.id === activeMembership.customerId)?.name || 'Practitioner Profile'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-sage/10 text-sage text-[9px] font-black uppercase tracking-widest rounded-lg border border-sage/10">
                      {activeMembership.customerId}
                    </span>
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
                      activeMembership.status === 'Active' ? 'bg-emerald/10 text-emerald border-emerald/20' :
                      activeMembership.status === 'Expired' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-gold/10 text-gold border-gold/20'
                    }`}>
                      {activeMembership.status} Journey
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige shrink-0">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 sm:p-14">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-sage/20 border-t-sage rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">Gathering wellness metrics...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Left Column: Client Info */}
                  <div className="lg:col-span-1 space-y-10">
                    <section>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-offwhite rounded-lg border border-beige">
                          <User size={16} className="text-sage" />
                        </div>
                        <h3 className="text-[10px] font-black text-forest uppercase tracking-[0.2em]">Client Information</h3>
                      </div>
                      <div className="bg-offwhite/40 border border-beige rounded-[2rem] p-8 space-y-6">
                        {[
                          { icon: <Phone size={14} />, label: 'Contact', value: customers.find(c => c.id === activeMembership.customerId)?.contact },
                          { icon: <Smartphone size={14} />, label: 'WhatsApp', value: customers.find(c => c.id === activeMembership.customerId)?.whatsapp_number || customers.find(c => c.id === activeMembership.customerId)?.contact },
                          { icon: <MapPin size={14} />, label: 'Address', value: customers.find(c => c.id === activeMembership.customerId)?.address },
                          { icon: <Briefcase size={14} />, label: 'Profession', value: customers.find(c => c.id === activeMembership.customerId)?.profession },
                          { icon: <Info size={14} />, label: 'Purpose', value: customers.find(c => c.id === activeMembership.customerId)?.purpose },
                          { icon: <Globe size={14} />, label: 'Referral', value: customers.find(c => c.id === activeMembership.customerId)?.referralSource || 'Global' },
                          { icon: <Calendar size={14} />, label: 'Joined On', value: customers.find(c => c.id === activeMembership.customerId)?.joiningDate ? new Date(customers.find(c => c.id === activeMembership.customerId).joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start space-x-4">
                            <div className="text-muted/40 mt-1">{item.icon}</div>
                            <div>
                              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-0.5">{item.label}</p>
                              <p className="text-sm font-bold text-forest leading-relaxed">{item.value || 'Not provided'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-offwhite rounded-lg border border-beige">
                          <Zap size={16} className="text-gold" />
                        </div>
                        <h3 className="text-[10px] font-black text-forest uppercase tracking-[0.2em]">Quick Actions</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => {
                            setIsDetailModalOpen(false);
                            openRenewModal(activeMembership);
                          }}
                          className="flex flex-col items-center justify-center p-6 bg-offwhite border border-beige rounded-2xl hover:bg-gold hover:text-white transition-all group"
                        >
                          <Clock size={20} className="mb-2 text-gold group-hover:text-white" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Renew Plan</span>
                        </button>
                        <button 
                          onClick={() => sendWhatsAppAlert(activeMembership?.customerId, 'Renewal Reminder', { expiry_date: activeMembership?.expiryDate })}
                          className="flex flex-col items-center justify-center p-6 bg-offwhite border border-beige rounded-2xl hover:bg-emerald hover:text-white transition-all group"
                        >
                          <MessageSquare size={20} className="mb-2 text-emerald group-hover:text-white" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Send Alert</span>
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Membership & History */}
                  <div className="lg:col-span-2 space-y-12">
                    <section>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-offwhite rounded-lg border border-beige">
                          <Award size={16} className="text-sage" />
                        </div>
                        <h3 className="text-[10px] font-black text-forest uppercase tracking-[0.2em]">Membership Architecture</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="bg-white border border-beige rounded-[2rem] p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Active Plan</p>
                              <p className="text-2xl font-black text-forest">{activeMembership.plan}</p>
                            </div>
                            <div className="w-14 h-14 bg-offwhite rounded-2xl flex items-center justify-center text-forest border border-beige shadow-sm">
                              <CreditCard size={24} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Investment</p>
                              <p className="text-lg font-extrabold text-sage">₹{activeMembership.amount?.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Payment Status</p>
                              <p className="text-lg font-extrabold text-forest">{activeMembership.payment_status || 'Paid'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white border border-beige rounded-[2rem] p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Journey Validity</p>
                              <p className="text-2xl font-black text-forest">
                                {Math.ceil((new Date(activeMembership.expiryDate || new Date()) - new Date()) / (1000 * 60 * 60 * 24))} Days
                              </p>
                            </div>
                            <div className="w-14 h-14 bg-offwhite rounded-2xl flex items-center justify-center text-gold border border-beige shadow-sm">
                              <Clock size={24} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Begins</p>
                              <p className="text-sm font-bold text-forest">{activeMembership.startDate ? new Date(activeMembership.startDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Concludes</p>
                              <p className="text-sm font-bold text-forest">{activeMembership.expiryDate ? new Date(activeMembership.expiryDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                      <section>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-offwhite rounded-lg border border-beige">
                              <History size={16} className="text-sage" />
                            </div>
                            <h3 className="text-[10px] font-black text-forest uppercase tracking-[0.2em]">Renewal Flow</h3>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {renewalLogs.length > 0 ? renewalLogs.map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-offwhite/40 rounded-xl border border-beige/40">
                              <div>
                                <p className="text-[10px] font-bold text-forest">{new Date(log.renewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                <p className="text-[8px] font-black text-muted uppercase tracking-widest mt-0.5">Extended Journey</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-sage uppercase">SUCCESS</p>
                              </div>
                            </div>
                          )) : (
                            <div className="py-10 text-center bg-offwhite/20 rounded-2xl border border-dashed border-beige">
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest">No renewal history</p>
                            </div>
                          )}
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-offwhite rounded-lg border border-beige">
                              <Activity size={16} className="text-forest" />
                            </div>
                            <h3 className="text-[10px] font-black text-forest uppercase tracking-[0.2em]">Recent Presence</h3>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {memberAttendance.length > 0 ? memberAttendance.map((att, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-offwhite/40 rounded-xl border border-beige/40">
                              <div>
                                <p className="text-[10px] font-bold text-forest">{new Date(att.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                              </div>
                              <div>
                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                  att.status === 'Present' ? 'bg-emerald/10 text-emerald' : 'bg-red-50 text-red-500'
                                }`}>
                                  {att.status}
                                </span>
                              </div>
                            </div>
                          )) : (
                            <div className="py-10 text-center bg-offwhite/20 rounded-2xl border border-dashed border-beige">
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest">No attendance yet</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="p-8 bg-forest rounded-[2.5rem] text-white shadow-2xl shadow-forest/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                        <Sparkles size={120} />
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-xl font-extrabold tracking-tight mb-2">Internal Metadata</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mt-6">
                          <div>
                            <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Enrolled By</p>
                            <p className="text-xs font-bold">{activeMembership.added_by || 'System Admin'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">System Entry</p>
                            <p className="text-xs font-bold">{formatDate(activeMembership.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Last Synced</p>
                            <p className="text-xs font-bold">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
