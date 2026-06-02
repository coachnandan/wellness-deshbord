import React, { useState } from 'react';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Filter, 
  UserCheck, 
  UserMinus, 
  Users, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  TrendingUp,
  BarChart as BarChartIcon
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import ClientEditModal from '../components/ClientEditModal';

export default function Attendance() {
  const { attendance = [], customers = [], memberships = [], updateAttendance } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr);

  const stats = {
    total: customers.length || 0,
    present: todayAttendance.filter(a => a.status === 'Present').length || 0,
    absent: todayAttendance.filter(a => a.status === 'Absent').length || 0,
    pending: (customers.length || 0) - todayAttendance.length
  };

  // Mock data for the weekly flow chart
  const weeklyFlowData = [
    { day: 'Mon', present: 12, absent: 2 },
    { day: 'Tue', present: 15, absent: 1 },
    { day: 'Wed', present: 10, absent: 4 },
    { day: 'Thu', present: 18, absent: 0 },
    { day: 'Fri', present: 14, absent: 3 },
    { day: 'Sat', present: 22, absent: 1 },
    { day: 'Sun', present: stats.present, absent: stats.absent },
  ];

  const handleMarkAttendance = (customerId, isPresent) => {
    updateAttendance({
      customerId,
      date: todayStr,
      status: isPresent ? 'Present' : 'Absent',
      checkIn: isPresent ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
    });
    
    toast.success(`${isPresent ? 'Presence' : 'Absence'} marked for ${customers.find(c => c.id === customerId)?.name}`);
  };

  const getMembershipStatus = (customerId) => {
    const membership = memberships.find(m => m.customerId === customerId);
    return membership ? membership.status : 'No Plan';
  };

  const filteredClients = customers.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact.includes(searchTerm);
    
    const record = todayAttendance.find(a => a.customerId === client.id);
    const status = record ? record.status : 'Pending';
    const matchesStatus = filterStatus === 'All' || status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Attendance Console</h1>
          <p className="text-muted mt-2 font-medium">Coordinate daily holistic wellness presence for all clients.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-2xl border border-beige shadow-luxury">
          <CalendarIcon size={18} className="text-gold" />
          <span className="text-xs font-black text-forest uppercase tracking-widest">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Summary Cards and Chart Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-forest h-[160px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total Directory</p>
              <Users size={20} className="text-forest/30" />
            </div>
            <p className="text-4xl font-extrabold text-forest leading-none">{stats.total}</p>
          </div>
          <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-[#1F7A45] h-[160px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Present Today</p>
              <UserCheck size={20} className="text-[#1F7A45]/30" />
            </div>
            <p className="text-4xl font-extrabold text-[#1F7A45] leading-none">{stats.present}</p>
          </div>
          <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-[#B42318] h-[160px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Absent Today</p>
              <UserMinus size={20} className="text-[#B42318]/30" />
            </div>
            <p className="text-4xl font-extrabold text-[#B42318] leading-none">{stats.absent}</p>
          </div>
          <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-gold h-[160px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Pending Entry</p>
              <Clock size={20} className="text-gold/30" />
            </div>
            <p className="text-4xl font-extrabold text-gold leading-none">{stats.pending}</p>
          </div>
        </div>

        <div className="xl:col-span-2 luxury-card p-8 sm:p-10 flex flex-col h-full min-h-[340px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <BarChartIcon size={18} className="text-sage mr-2" />
              <h3 className="text-xl font-extrabold text-forest tracking-tight">Weekly Session Flow</h3>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-forest rounded-full"></div>
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Presence</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-beige rounded-full"></div>
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Absence</span>
              </div>
            </div>
          </div>
          <div className="flex-1 h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={weeklyFlowData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#F7F6F2'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="present" fill="#1F4D3A" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="absent" fill="#E7E5E4" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="luxury-card overflow-hidden bg-white">
        <div className="p-8 sm:p-10 border-b border-beige flex flex-col xl:flex-row gap-6 items-center bg-offwhite/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted/40" size={20} />
            <input 
              type="text" 
              placeholder="Search by client name or contact..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-beige rounded-2xl text-forest font-bold text-sm placeholder-muted/30 focus:ring-4 focus:ring-sage/10 transition-all outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={16} />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white border border-beige rounded-2xl text-forest font-black uppercase tracking-widest text-[10px] outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-sage/10 transition-all shadow-sm"
              >
                <option value="All">All Presence</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <button className="flex items-center justify-center px-8 py-4 bg-white border border-beige rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] text-forest hover:bg-offwhite transition-all shadow-sm flex-1 sm:flex-none">
              <Download size={16} className="mr-2 text-gold" /> Export Logs
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-offwhite/50 text-muted text-[10px] font-black uppercase tracking-[0.2em] border-b border-beige">
                <th className="px-10 py-6">Practitioner Profile</th>
                <th className="px-10 py-6 hidden md:table-cell">Professional Focus</th>
                <th className="px-10 py-6 hidden lg:table-cell">Membership</th>
                <th className="px-10 py-6">Session Status</th>
                <th className="px-10 py-6">Marked By</th>
                <th className="px-10 py-6 text-center">Attendance Marking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40">
              {filteredClients.map((client) => {
                const record = todayAttendance.find(a => a.customerId === client.id);
                const memStatus = getMembershipStatus(client.id);
                const status = record ? record.status : 'Pending';

                return (
                  <tr key={client.id} className="hover:bg-offwhite transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-2xl bg-offwhite border border-beige flex items-center justify-center text-forest font-black text-sm mr-4 shadow-sm group-hover:bg-forest group-hover:text-white transition-all duration-500">
                           {client?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p 
                            onClick={() => client && setEditingCustomer(client)}
                            className="font-extrabold text-forest text-base leading-tight cursor-pointer hover:text-sage transition-colors"
                          >
                            {client?.name || 'Unknown'}
                          </p>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1.5">{client?.contact || 'No Contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 hidden md:table-cell">
                      <p className="font-extrabold text-forest text-sm leading-tight">{client.profession}</p>
                      <p className="text-[10px] font-bold text-sage uppercase tracking-[0.15em] mt-1.5">{client.purpose}</p>
                    </td>
                    <td className="px-10 py-8 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${
                        memStatus === 'Active' ? 'bg-forest/5 text-forest border-forest/20' : 'bg-offwhite text-muted border-beige'
                      }`}>
                        {memStatus}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        status === 'Present' ? 'bg-[#DDF5E5] text-[#1F7A45] border border-[#DDF5E5]' :
                        status === 'Absent' ? 'bg-[#FDE2E2] text-[#B42318] border border-[#FDE2E2]' :
                        'bg-offwhite text-muted border border-beige'
                      }`}>
                        {status === 'Pending' ? (
                          <div className="flex items-center">
                            <Clock size={12} className="mr-1.5 opacity-50" /> Pending Entry
                          </div>
                        ) : status}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-xs font-bold text-forest">{record?.markedBy || '-'}</p>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex justify-center items-center space-x-3">
                        <button 
                          onClick={() => handleMarkAttendance(client.id, true)}
                          className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 shadow-sm active:scale-90 ${
                            status === 'Present' 
                              ? 'bg-[#1F7A45] text-white shadow-lg shadow-[#1F7A45]/20' 
                              : 'bg-white text-[#1F7A45] border border-[#DDF5E5] hover:bg-[#DDF5E5]'
                          }`}
                          title="Mark Present"
                        >
                          <Check size={24} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => handleMarkAttendance(client.id, false)}
                          className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 shadow-sm active:scale-90 ${
                            status === 'Absent' 
                              ? 'bg-[#B42318] text-white shadow-lg shadow-[#B42318]/20' 
                              : 'bg-white text-[#B42318] border border-[#FDE2E2] hover:bg-[#FDE2E2]'
                          }`}
                          title="Mark Absent"
                        >
                          <X size={24} strokeWidth={3} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder for premium feel */}
        <div className="px-10 py-8 bg-offwhite/30 border-t border-beige flex items-center justify-between">
           <p className="text-[10px] font-black text-muted uppercase tracking-widest">
             Audit logs synced with global directory
           </p>
           <div className="flex space-x-3">
             <button className="p-3 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite transition-all shadow-sm opacity-30 cursor-not-allowed">
               <ChevronLeft size={18} />
             </button>
             <button className="p-3 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite transition-all shadow-sm opacity-30 cursor-not-allowed">
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>

      {/* Client Edit Modal */}
      {editingCustomer && (
        <ClientEditModal 
          customer={editingCustomer} 
          onClose={() => setEditingCustomer(null)} 
        />
      )}
    </div>
  );
}
