import React, { useState, useEffect } from 'react';
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
import { toast } from 'react-toastify';
import ClientEditModal from '../components/ClientEditModal';
import { getISTDateString } from '../utils/dateUtils';

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
  const { customers = [], attendance = [], memberships = [], visitors = [], dataLoading } = useAppContext();
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setLayoutReady(true), 500);
    return () => clearTimeout(id);
  }, []);

  // New visitors = customers who joined in the last 7 days
  const newVisitors = customers.filter(c => {
    const joinDate = new Date(c.joining_date || c.joiningDate || c.created_at);
    return joinDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  });

  // Basic aggregations
  const totalCustomers = customers.length;
  const activeMemberships = memberships.filter(m => m.status === 'Active').length;
  
  const todayStr = getISTDateString();
  const todayAttendance = attendance.filter(a => a.date === todayStr && a.status === 'Present').length;
  const todayShakes = attendance.filter(a => a.date === todayStr && a.status === 'Shake').length;
  const pendingRenewals = memberships.filter(m => m.status === 'Pending').length;
  
  // Visitors from dedicated visitor_logs table
  const todayVisitorCount = visitors.filter(v => v.visit_date === todayStr).length;

  // Net Revenue
  const revenue = memberships
    .filter(m => m.payment_status === 'Paid' || m.paymentStatus === 'Paid')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Dynamic Attendance Flow (Last 7 days)
  const getWeeklyAttendanceData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({ name: day, present: 0, absent: 0, shake: 0 }));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    attendance.forEach(att => {
      const attDate = new Date(att.date);
      if (attDate >= oneWeekAgo) {
        const dayName = days[attDate.getDay()];
        const dayObj = data.find(d => d.name === dayName);
        if (dayObj) {
          if (att.status === 'Present') dayObj.present++;
          else if (att.status === 'Absent') dayObj.absent++;
          else if (att.status === 'Shake') dayObj.shake++;
        }
      }
    });
    return data;
  };

  // Dynamic Revenue Trajectory
  const getRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data = months.map(m => ({ month: m, revenue: 0 }));

    memberships.forEach(m => {
      if (m.payment_status === 'Paid' || m.paymentStatus === 'Paid') {
        const startDate = new Date(m.start_date || m.startDate || m.created_at);
        if (startDate.getFullYear() === currentYear) {
          const monthName = months[startDate.getMonth()];
          const monthObj = data.find(d => d.month === monthName);
          if (monthObj) {
            monthObj.revenue += Number(m.amount || 0);
          }
        }
      }
    });
    const currentMonthIndex = new Date().getMonth();
    // Return last 6 months up to current
    return data.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1);
  };

  const attendanceData = getWeeklyAttendanceData();
  const revenueData = getRevenueData();

  const renderCardValue = (value) => {
    if (dataLoading) {
      return (
        <span className="inline-block w-20 h-8 bg-sage/10 animate-pulse rounded-lg"></span>
      );
    }
    return value;
  };

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

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Member" value={renderCardValue(totalCustomers)} icon={Users} accentColor="text-sage" trend="up" trendValue="12" />
        <KPICard title="Attendance" value={renderCardValue(todayAttendance)} icon={CalendarCheck} accentColor="text-sage" trend="up" trendValue="4" />
        <KPICard title="Shake" value={renderCardValue(todayShakes)} icon={Activity} accentColor="text-sage" />
        <KPICard title="Visitors Today" value={renderCardValue(todayVisitorCount)} icon={UserPlus} accentColor="text-sage" />
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
                <div className="w-3 h-3 bg-[#D97706] rounded-full"></div>
                <span className="text-[10px] font-black text-muted uppercase tracking-wider">Shake</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-beige rounded-full"></div>
                <span className="text-[10px] font-black text-muted uppercase tracking-wider">Absent</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            {layoutReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={attendanceData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: '#F7F6F2' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="present" fill="#1F4D3A" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="shake" fill="#D97706" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="absent" fill="#E7E5E4" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="luxury-card p-8 sm:p-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-extrabold text-forest tracking-tight">Revenue Trajectory</h3>
            <div className="px-4 py-2 bg-offwhite border border-beige rounded-xl text-[10px] font-black text-forest uppercase tracking-widest">Year {new Date().getFullYear()}</div>
          </div>
          <div className="h-[300px]">
            {layoutReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C2A878" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C2A878" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#C2A878" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
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
            {dataLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="px-8 py-6 flex items-center justify-between hover:bg-offwhite transition-colors group animate-pulse">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-2xl bg-sage/10 mr-4"></div>
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-sage/10 rounded"></div>
                      <div className="w-16 h-3 bg-sage/10 rounded"></div>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-sage/10 rounded-xl"></div>
                </div>
              ))
            ) : customers.length === 0 ? (
              <div className="px-8 py-10 text-center text-muted font-medium">No recent enrollments found.</div>
            ) : (
              customers.slice(-4).reverse().map((customer) => (
                <div key={customer.id} className="px-8 py-6 flex items-center justify-between hover:bg-offwhite transition-colors group">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-2xl bg-offwhite border border-beige text-forest flex items-center justify-center font-black text-base mr-4 transition-all group-hover:scale-110 group-hover:bg-forest group-hover:text-white group-hover:border-forest shadow-sm">
                      {customer?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p
                        onClick={() => customer && setEditingCustomer(customer)}
                        className="text-base font-extrabold text-forest cursor-pointer hover:text-sage transition-colors"
                      >
                        {customer?.name || 'Unknown'}
                      </p>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] mt-1">{customer?.address?.split(',')[0] || 'Unknown Location'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald/10 text-emerald border border-emerald/20">
                      {customer.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="luxury-card overflow-hidden">
          <div className="px-8 py-8 border-b border-beige flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-forest tracking-tight">New Visitor</h3>
            <button className="text-[10px] font-black text-gold uppercase tracking-[0.2em] hover:text-forest transition-colors flex items-center">
              View All <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="divide-y divide-beige/50">
            {dataLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="px-8 py-6 flex items-center justify-between hover:bg-offwhite transition-colors group animate-pulse">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-2xl bg-sage/10 mr-4"></div>
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-sage/10 rounded"></div>
                      <div className="w-16 h-3 bg-sage/10 rounded"></div>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-sage/10 rounded-xl"></div>
                </div>
              ))
            ) : newVisitors.length === 0 ? (
              <div className="px-8 py-10 text-center text-muted font-medium">No one has arrived</div>
            ) : (
              newVisitors.slice(-4).reverse().map((visitor) => (
                <div key={visitor.id} className="px-8 py-6 flex items-center justify-between hover:bg-offwhite transition-colors group">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-2xl bg-offwhite border border-beige text-forest flex items-center justify-center font-black text-base mr-4 transition-all group-hover:scale-110 group-hover:bg-forest group-hover:text-white group-hover:border-forest shadow-sm">
                      {visitor?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p
                        onClick={() => visitor && setEditingCustomer(visitor)}
                        className="text-base font-extrabold text-forest cursor-pointer hover:text-sage transition-colors"
                      >
                        {visitor?.name || 'Unknown'}
                      </p>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] mt-1">{visitor?.address?.split(',')[0] || 'Unknown Location'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald/10 text-emerald border border-emerald/20">
                      {visitor.status}
                    </span>
                  </div>
                </div>
              ))
            )}
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
