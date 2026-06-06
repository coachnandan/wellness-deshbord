import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, UserMinus, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AttendanceCalendarModal({ isOpen, onClose, onDateSelect }) {
  const { customers = [], fetchMonthlyAttendance } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchMonthlyAttendance(currentMonth);
      setMonthlyData(data);
      setLoading(false);
    };
    load();
  }, [isOpen, currentMonth]);

  if (!isOpen) return null;

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const currentMonthData = monthlyData.filter(a => {
    if (!selectedMember) return true;
    return a.customerId === selectedMember;
  });

  // Build calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const getDayRecords = (day) => {
    if (!day) return [];
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    return currentMonthData.filter(a => a.date === dateStr);
  };

  const getDaySummary = (day) => {
    const records = getDayRecords(day);
    if (records.length === 0) return { present: 0, absent: 0, total: 0 };
    return {
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      total: records.length
    };
  };

  // Unique members with attendance this month
  const memberIds = [...new Set(monthlyData.map(a => a.customerId))];
  const memberList = memberIds.map(id => customers.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="fixed inset-0 bg-forest/40 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 flex flex-col">
        {/* Header */}
        <div className="px-6 sm:px-10 py-6 border-b border-beige flex items-center justify-between bg-offwhite/50 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-forest/10 rounded-2xl">
              <CalendarIcon size={22} className="text-forest" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-forest tracking-tight">Monthly Attendance</h2>
              <p className="text-xs font-medium text-muted mt-0.5">Day-wise attendance history</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-muted hover:text-forest transition-colors bg-white rounded-2xl shadow-sm border border-beige">
            <X size={22} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 sm:px-10 py-4 border-b border-beige flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={prevMonth} className="p-2 bg-white border border-beige rounded-xl hover:bg-offwhite transition-all">
              <ChevronLeft size={18} className="text-forest" />
            </button>
            <span className="text-sm font-black text-forest uppercase tracking-widest min-w-[140px] text-center">{monthName}</span>
            <button onClick={nextMonth} className="p-2 bg-white border border-beige rounded-xl hover:bg-offwhite transition-all">
              <ChevronRight size={18} className="text-forest" />
            </button>
          </div>
          <select
            value={selectedMember || ''}
            onChange={(e) => setSelectedMember(e.target.value || null)}
            className="px-4 py-2 bg-white border border-beige rounded-xl text-forest font-bold text-xs outline-none appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="">All Members</option>
            {memberList.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-sage/20 border-t-sage rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[9px] font-black text-muted uppercase tracking-widest py-2">{d}</div>
              ))}
              {/* Calendar cells */}
              {calendarCells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const summary = getDaySummary(day);
                const isToday = day === new Date().getDate() && currentMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                return (
                  <div
                    key={day}
                    onClick={() => onDateSelect && onDateSelect(dateStr)}
                    className={`rounded-2xl p-2 min-h-[70px] flex flex-col items-center justify-center border transition-all cursor-pointer hover:shadow-md hover:scale-105 ${
                      isToday ? 'border-forest bg-forest/5' : summary.total > 0 ? 'border-beige bg-offwhite/50 hover:border-forest/50' : 'border-transparent bg-offwhite/20 hover:border-beige'
                    }`}
                  >
                    <span className={`text-xs font-black ${isToday ? 'text-forest' : 'text-muted'}`}>{day}</span>
                    {summary.total > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        {summary.present > 0 && (
                          <span className="flex items-center text-[9px] font-black text-[#1F7A45]">
                            <Check size={10} className="mr-0.5" />{summary.present}
                          </span>
                        )}
                        {summary.absent > 0 && (
                          <span className="flex items-center text-[9px] font-black text-[#B42318]">
                            <UserMinus size={10} className="mr-0.5" />{summary.absent}
                          </span>
                        )}
                      </div>
                    )}
                    {summary.total === 0 && (
                      <Clock size={12} className="text-beige mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-beige">
            <div className="flex items-center space-x-2">
              <Check size={14} className="text-[#1F7A45]" />
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserMinus size={14} className="text-[#B42318]" />
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-beige" />
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">No Record</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
