import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Check, 
  X, 
  ChevronRight,
  Filter,
  MoreHorizontal,
  Clock,
  Calendar as CalendarIcon,
  Lock,
  Unlock,
  UserCheck, 
  UserMinus, 
  Users, 
  Download, 
  ChevronLeft, 
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
import AttendanceCalendarModal from '../components/AttendanceCalendarModal';
import { getISTDateString, getISTTimeString, getISTDisplayDate } from '../utils/dateUtils';

export default function Attendance() {
  const { attendance = [], customers = [], memberships = [], attendanceLocks = [], updateAttendance, finalizeAttendance } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getISTDateString());

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
    shakes: selectedAttendance.filter(a => a.status === 'Shake').length || 0
  };

  // Dynamic weekly flow chart — last 7 days real attendance data
  const getWeeklyFlowData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({ day, present: 0, absent: 0, shake: 0 }));

    const oneWeekAgo = new Date(getISTDateString());
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    attendance.forEach(att => {
      const attDate = new Date(att.date);
      if (attDate >= oneWeekAgo) {
        const dayName = days[attDate.getDay()];
        const dayObj = data.find(d => d.day === dayName);
        if (dayObj) {
          if (att.status === 'Present') dayObj.present++;
          else if (att.status === 'Absent') dayObj.absent++;
          else if (att.status === 'Shake') dayObj.shake++;
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
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleMarkAttendance = async (customerId, newStatus) => {
    if (isLocked) {
      toast.error('Attendance for this date is locked and cannot be modified.');
      return;
    }
    try {
      await updateAttendance({
        customerId,
        date: selectedDate,
        status: newStatus,
        checkIn: newStatus === 'Present' || newStatus === 'Shake' ? getISTTimeString() : '-',
      });
      toast.success(`${newStatus} marked for ${customers.find(c => c.id === customerId)?.name}`);
    } catch (error) {
      console.error('Attendance marking failed:', error);
      toast.error(`Failed to mark attendance: ${error.message || 'Unknown error'}`);
    }
  };

  const getMembershipStatus = (customerId) => {
    const customerMemberships = memberships.filter(m => m.customerId === customerId);
    if (customerMemberships.length === 0) {
      return 'Afresh';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeAndNotExpired = customerMemberships.find(m => {
      const expiry = new Date(m.expiryDate);
      return expiry >= today;
    });

    if (activeAndNotExpired) {
      return 'Active';
    } else {
      return 'Expired';
    }
  };

  const filteredClients = customers.filter(client => {
    const matchesSearch = 
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contact || '').includes(searchTerm);
    
    const record = selectedAttendance.find(a => a.customerId === client.id);
    const status = record ? record.status : 'Pending';
    const matchesStatus = filterStatus === 'All' || status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const isToday = selectedDate === todayStr;

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Attendance Console</h1>
          <p className="text-muted mt-2 font-medium">Coordinate daily holistic wellness presence for all members.</p>
        </div>
        <div className="flex items-center space-x-3">
          {isLocked && (
            <div className="flex items-center space-x-2 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              <Lock size={14} className="text-red-500" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                Finalized by {currentLock?.locked_by_name?.split(' ')[0]}
              </span>
            </div>
          )}
          {!isLocked && (
            <button
              onClick={handleFinalize}
              className="flex items-center space-x-2 bg-[#1F4D3A] text-white px-5 py-3 rounded-xl shadow-md hover:bg-[#2A6B51] transition-all"
            >
              <Lock size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Finalize Day</span>
            </button>
          )}
          <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-2xl border border-beige shadow-luxury">
            <CalendarIcon size={18} className="text-gold" />
            <span className="text-xs font-black text-forest uppercase tracking-widest">
              {getISTDisplayDate(selectedDate)}
            </span>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="ml-2 px-3 py-1 bg-sage/10 text-sage rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-sage/20 transition-all"
              >
                Today
              </button>
            )}
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="hidden"
            id="attendance-date-picker"
          />
          <label
            htmlFor="attendance-date-picker"
            className="flex items-center space-x-2 bg-white border border-beige px-6 py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] text-forest hover:bg-offwhite transition-all shadow-sm cursor-pointer"
          >
            <CalendarIcon size={16} />
            <span>Pick Date</span>
          </label>
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center space-x-2 bg-forest text-white px-6 py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] hover:bg-forest-hover transition-all shadow-lg shadow-forest/20 active:scale-95"
          >
            <CalendarIcon size={16} />
            <span>View Calendar</span>
          </button>
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
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Present</p>
              <UserCheck size={20} className="text-[#1F7A45]/30" />
            </div>
            <p className="text-4xl font-extrabold text-[#1F7A45] leading-none">{stats.present}</p>
          </div>
          <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-[#B42318] h-[160px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Absent</p>
              <UserMinus size={20} className="text-[#B42318]/30" />
            </div>
            <p className="text-4xl font-extrabold text-[#B42318] leading-none">{stats.absent}</p>
          </div>
          <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-l-gold h-[160px]">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total Shakes</p>
              <Clock size={20} className="text-gold/30" />
            </div>
            <p className="text-4xl font-extrabold text-gold leading-none">{stats.shakes}</p>
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
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-[#D97706] rounded-full"></div>
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Shake</span>
              </div>
            </div>
          </div>
          <div className="flex-1 h-[220px]">
            {layoutReady && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={weeklyFlowData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#F7F6F2'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="present" fill="#1F4D3A" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="absent" fill="#E7E5E4" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="shake" fill="#D97706" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            )}
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
              placeholder="Search by member name or contact..." 
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
                <th className="px-10 py-6 hidden lg:table-cell">Membership</th>
                <th className="px-10 py-6">Marked By</th>
                <th className="px-10 py-6 text-center">Attendance Marking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/40">
              {filteredClients.map((client) => {
                const record = selectedAttendance.find(a => a.customerId === client.id);
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
                    <td className="px-10 py-8 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all ${
                        memStatus === 'Active' ? 'bg-[#DDF5E5] text-[#1F7A45] border-[#DDF5E5]' :
                        memStatus === 'Afresh' ? 'bg-[#FEF9C3] text-[#A16207] border-[#FEF08A]' :
                        'bg-[#FDE2E2] text-[#B42318] border-[#FDE2E2]'
                      }`}>
                        {memStatus}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-xs font-bold text-forest">{record?.markedBy || '-'}</p>
                      {record?.source && (
                        <p className={`text-[9px] mt-1 font-bold uppercase tracking-widest ${record.source === 'Auto-Marked' ? 'text-amber-500' : 'text-sage'}`}>
                          {record.source}
                        </p>
                      )}
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex justify-center items-center space-x-3">
                        <button 
                          onClick={() => handleMarkAttendance(client.id, 'Present')}
                          disabled={isLocked}
                          className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 shadow-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'} ${
                            status === 'Present' 
                              ? 'bg-[#1F7A45] text-white shadow-lg shadow-[#1F7A45]/20' 
                              : 'bg-white text-[#1F7A45] border border-[#DDF5E5] hover:bg-[#DDF5E5]'
                          }`}
                          title="Mark Present"
                        >
                          <Check size={24} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => handleMarkAttendance(client.id, 'Absent')}
                          disabled={isLocked}
                          className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 shadow-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'} ${
                            status === 'Absent' 
                              ? 'bg-[#B42318] text-white shadow-lg shadow-[#B42318]/20' 
                              : 'bg-white text-[#B42318] border border-[#FDE2E2] hover:bg-[#FDE2E2]'
                          }`}
                          title="Mark Absent"
                        >
                          <X size={24} strokeWidth={3} />
                        </button>
                        {memStatus === 'Active' && (
                          <button 
                            onClick={() => handleMarkAttendance(client.id, 'Shake')}
                            disabled={isLocked}
                            className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 shadow-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'} ${
                              status === 'Shake' 
                                ? 'bg-[#D97706] text-white shadow-lg shadow-[#D97706]/20' 
                                : 'bg-white text-[#D97706] border border-[#FEF08A] hover:bg-[#FEF9C3]'
                            }`}
                            title="Mark Shake"
                          >
                            <span className="text-xl font-black">S</span>
                          </button>
                        )}
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

      {/* Attendance Calendar Modal */}
      <AttendanceCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
}
