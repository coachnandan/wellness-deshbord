import React from 'react';
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  TrendingUp,
  Activity,
  UserPlus,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { useAppContext } from '../context/AppContext';

const KPICard = ({ title, value, icon: Icon, trend, trendValue, accentColor }) => (
  <div className="luxury-card p-6 sm:p-8 flex flex-col justify-between h-full">
    <div className="flex items-center justify-between mb-6">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-offwhite border border-beige shadow-sm`}>
        <Icon size={22} className={accentColor} />
      </div>
      {trend && (
        <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg border ${trend === 'up' ? 'bg-emerald/10 text-emerald border-emerald/20' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {trend === 'up' ? '↗' : '↘'} {trendValue}%
        </div>
      )}
    </div>
    <div>
      <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-2">{title}</p>
      <h3 className="text-3xl font-extrabold text-forest tracking-tight leading-none">{value}</h3>
    </div>
  </div>
);

export default function Dashboard() {
  const { customers, attendance, memberships } = useAppContext();

  // Basic aggregations
  const totalCustomers = customers.length;
  const activeMemberships = memberships.filter(m => m.status === 'Active').length;
  const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length;
  const pendingRenewals = memberships.filter(m => m.status === 'Pending').length;
  const newLeads = customers.filter(c => new Date(c.joiningDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const revenue = memberships.filter(m => m.paymentStatus === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

  const mockAttendanceData = [
    { name: 'Mon', present: 12, absent: 3 },
    { name: 'Tue', present: 15, absent: 2 },
    { name: 'Wed', present: 10, absent: 5 },
    { name: 'Thu', present: 18, absent: 1 },
    { name: 'Fri', present: 14, absent: 4 },
    { name: 'Sat', present: 20, absent: 0 },
    { name: 'Sun', present: 8, absent: 12 },
  ];

  const mockRevenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 59000 },
    { month: 'Jun', revenue: 75000 },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-forest tracking-tight">Performance Insight</h1>
          <p className="text-muted mt-2 font-medium">Holistic growth and engagement tracking.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-2xl border border-beige shadow-luxury">
          <div className="w-2 h-2 bg-emerald rounded-full animate-pulse"></div>
          <span className="text-xs font-black text-forest uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
        <KPICard title="Total Clients" value={totalCustomers} icon={Users} accentColor="text-forest" trend="up" trendValue="12" />
        <KPICard title="Active Plans" value={activeMemberships} icon={Activity} accentColor="text-sage" trend="up" trendValue="8" />
        <KPICard title="Session Flow" value={todayAttendance} icon={CalendarCheck} accentColor="text-gold" />
        <KPICard title="Renewals" value={pendingRenewals} icon={TrendingUp} accentColor="text-red-500" trend="down" trendValue="3" />
        <KPICard title="Net Revenue" value={`₹${(revenue/1000).toFixed(1)}k`} icon={CreditCard} accentColor="text-forest" trend="up" trendValue="15" />
        <KPICard title="New Leads" value={newLeads} icon={UserPlus} accentColor="text-sage" trend="up" trendValue="24" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="luxury-card p-8 sm:p-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-extrabold text-forest tracking-tight">Weekly Session Flow</h3>
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 bg-forest rounded-full"></div>
                 <span className="text-[10px] font-black text-muted uppercase tracking-wider">Present</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 bg-beige rounded-full"></div>
                 <span className="text-[10px] font-black text-muted uppercase tracking-wider">Absent</span>
               </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAttendanceData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#F7F6F2'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="present" fill="#1F4D3A" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="absent" fill="#E7E5E4" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="luxury-card p-8 sm:p-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-extrabold text-forest tracking-tight">Revenue Trajectory</h3>
            <div className="px-4 py-2 bg-offwhite border border-beige rounded-xl text-[10px] font-black text-forest uppercase tracking-widest">Year 2024</div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRevenueData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C2A878" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#C2A878" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10, fontWeight: 700}} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="revenue" stroke="#C2A878" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="luxury-card overflow-hidden">
          <div className="px-8 py-8 border-b border-beige flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-forest tracking-tight">Recent Enrollments</h3>
            <button className="text-[10px] font-black text-gold uppercase tracking-[0.2em] hover:text-forest transition-colors flex items-center">
              View All <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="divide-y divide-beige/50">
            {customers.slice(-4).reverse().map((customer) => (
              <div key={customer.id} className="px-8 py-6 flex items-center justify-between hover:bg-offwhite transition-colors group">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-2xl bg-offwhite border border-beige text-forest flex items-center justify-center font-black text-base mr-4 transition-all group-hover:scale-110 group-hover:bg-forest group-hover:text-white group-hover:border-forest shadow-sm">
                    {customer?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-forest">{customer?.name || 'Unknown'}</p>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] mt-1">{customer?.address?.split(',')[0] || 'Unknown Location'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald/10 text-emerald border border-emerald/20">
                    {customer.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="luxury-card overflow-hidden">
          <div className="px-8 py-8 border-b border-beige flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-forest tracking-tight">Upcoming Renewals</h3>
            <div className="w-10 h-10 rounded-xl bg-offwhite border border-beige flex items-center justify-center">
              <Clock size={18} className="text-gold" />
            </div>
          </div>
          <div className="divide-y divide-beige/50">
            {memberships.filter(m => m.status === 'Pending' || m.status === 'Active').slice(0, 4).map((membership) => {
              const customer = customers.find(c => c.id === membership.customerId);
              return (
                <div key={membership.id} className="px-8 py-6 flex items-center justify-between hover:bg-offwhite transition-colors group">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-2xl bg-offwhite border border-beige text-gold flex items-center justify-center mr-4 transition-all group-hover:bg-gold group-hover:text-white group-hover:border-gold shadow-sm">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-forest">{customer?.name || 'Unknown'}</p>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] mt-1">Expiring: {new Date(membership.expiryDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 bg-forest text-white hover:bg-forest-hover rounded-xl transition-all shadow-lg shadow-forest/10 active:scale-95">
                    Renew
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
