import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Filter, MoreVertical, X, Edit3, Trash2, ChevronLeft, ChevronRight, User as UserIcon, Phone, MapPin, Briefcase, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, dataLoading } = useAppContext();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Constants
  const itemsPerPage = 8;

  // Filter and search logic
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      Object.keys(customer).forEach(key => setValue(key, customer[key]));
    } else {
      setEditingCustomer(null);
      reset({
        status: 'Active',
        joiningDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        toast.success('Client profile updated with care');
      } else {
        await addCustomer(data);
        toast.success('New client journey initiated');
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error('Operation failed. Please verify the client data.');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to archive this client profile?')) {
      deleteCustomer(id);
      toast.info('Client profile has been archived');
      setActiveDropdown(null);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Client Directory</h1>
          <p className="text-muted mt-2 font-medium">Manage and nurture your professional client relationships.</p>
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
                <th className="px-10 py-6">Client Profile</th>
                <th className="px-10 py-6 hidden md:table-cell">Contact & Location</th>
                <th className="px-10 py-6 hidden lg:table-cell">Professional Focus</th>
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
                    No clients found.
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
                          <p className="font-extrabold text-forest text-base leading-tight">{customer?.name || 'Unknown'}</p>
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
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${
                        customer.status === 'Active' ? 'bg-emerald/5 text-emerald border-emerald/20' : 'bg-red-50 text-red-600 border-red-100'
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} clients
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
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
            <div className="px-10 py-10 border-b border-beige flex items-center justify-between bg-offwhite/50">
              <div>
                <h2 className="text-3xl font-extrabold text-forest tracking-tight">
                  {editingCustomer ? 'Update Profile' : 'New Client Profile'}
                </h2>
                <p className="text-sm font-medium text-muted mt-1">Refine the professional details of your client.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-10 sm:p-12 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Name</label>
                  <input {...register("name", { required: true })} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. Aditi Sharma" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Contact (Email/Phone)</label>
                  <input {...register("contact")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="coach@anandam.in" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Contact Number</label>
                  <input {...register("contact_number")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">WhatsApp</label>
                  <input {...register("whatsapp_number")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="Same as contact if blank" />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Address</label>
                  <input {...register("address", { required: true })} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="Street, City, State" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Profession</label>
                  <input {...register("profession")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. Architect" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Purpose</label>
                  <input {...register("purpose")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. Health & Vitality" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Referral Source</label>
                  <input {...register("referral_source")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all placeholder-muted/20" placeholder="e.g. Instagram" />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Status</label>
                  <select {...register("status")} className="w-full px-6 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all appearance-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-5 bg-white text-muted border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all">Discard</button>
                <button type="submit" className="flex-[2] px-8 py-5 bg-forest text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-2xl shadow-forest/20">
                  {editingCustomer ? 'Update Profile' : 'Establish Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
