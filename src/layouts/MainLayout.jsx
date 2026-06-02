import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  CreditCard, 
  LogOut, 
  Menu,
  X,
  Bell,
  User as UserIcon,
  Leaf,
  BarChart3,
  Settings
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import NotificationPopup from '../components/NotificationPopup';
import ProfilePopup from '../components/ProfilePopup';

const adminNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', path: '/clients', icon: Users },
  { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { name: 'Memberships', path: '/memberships', icon: CreditCard },
];

const memberNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', path: '/clients', icon: Users },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useAppContext();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : memberNavItems;

  const handleLogout = () => {
    logout();
    navigate('/role-selection');
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-forest text-white transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 border-r border-white/5 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between h-24 px-8 border-b border-white/5">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-10 h-10 bg-sage rounded-xl flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-500">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white group-hover:tracking-wider transition-all duration-500 uppercase">
            Anandam Wellness
          </span>
        </div>
        <button onClick={toggleSidebar} className="lg:hidden text-white/60 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col flex-1 px-4 py-10 space-y-3 overflow-y-auto no-scrollbar h-[calc(100vh-180px)]">
        <p className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 mt-2">Console Management</p>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold group relative overflow-hidden ${
                isActive 
                  ? 'bg-white/10 backdrop-blur-md text-white shadow-[0_4px_20px_rgba(255,255,255,0.05)]' 
                  : 'text-white/50 hover:bg-white/[0.08] hover:text-white hover:translate-x-1'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active Indicator Accent */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-gold rounded-full shadow-[0_0_10px_rgba(194,168,120,0.5)]"></div>
                )}
                
                <item.icon className={`w-5 h-5 mr-3 transition-all duration-300 ${isActive ? 'text-gold scale-110' : 'text-white/30 group-hover:text-white/80 group-hover:scale-110'}`} />
                <span className="relative z-10 tracking-tight">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="absolute bottom-0 w-full p-6 border-t border-white/5 bg-forest-hover/40 backdrop-blur-md">
        <div className="flex items-center mb-6 px-2 group cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-sage/10 border border-white/5 flex items-center justify-center mr-3 shadow-inner group-hover:bg-sage/20 transition-colors">
            <UserIcon size={20} className="text-sage" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black text-white truncate group-hover:text-gold transition-colors">{user?.name || 'Coach Aditi'}</p>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest truncate">{user?.role || 'Lead Practitioner'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-3.5 text-[10px] font-black text-red-300/60 bg-red-400/5 rounded-2xl hover:bg-red-400/10 hover:text-red-300 transition-all border border-red-400/10 uppercase tracking-[0.2em]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Terminate Session
        </button>
      </div>
    </div>
  );
};

const Header = ({ toggleSidebar }) => {
  const { user, notifications } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);


  const unreadCount = notifications.length; // Simplified for this example

  return (
    <header className="flex items-center justify-between h-24 px-6 sm:px-10 bg-offwhite/80 backdrop-blur-xl border-b border-beige/50 sticky top-0 z-40">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-3 mr-4 text-forest bg-white rounded-xl lg:hidden hover:bg-beige/20 transition-all shadow-sm border border-beige/50"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-forest tracking-tight leading-tight">Namaste, {user?.name?.split(' ')[0] || 'Aditi'}</h2>
          <p className="text-xs sm:text-sm text-muted font-bold tracking-tight">Welcome back to your workspace.</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6 relative">
        {user?.role === 'admin' && (
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`relative p-3 text-forest border border-beige/50 rounded-xl transition-all shadow-sm group ${showNotifications ? 'bg-beige/20 ring-4 ring-sage/10' : 'bg-white hover:bg-offwhite'}`}
          >
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-gold rounded-full border-2 border-white shadow-sm animate-pulse" />
            )}
          </button>
        )}
        {showNotifications && <NotificationPopup onClose={() => setShowNotifications(false)} />}

        <div 
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
          className={`w-12 h-12 rounded-2xl border border-beige/50 p-1 shadow-sm overflow-hidden flex items-center justify-center hover:scale-105 transition-all cursor-pointer relative ${showProfile ? 'ring-4 ring-sage/10 scale-105' : 'bg-white'}`}
        >
             <img 
               src={`https://ui-avatars.com/api/?name=${user?.name || 'Aditi'}&background=1F4D3A&color=F7F6F2&bold=true`} 
               alt="Avatar" 
               className="w-full h-full rounded-xl object-cover" 
             />
        </div>

        {showProfile && <ProfilePopup onClose={() => setShowProfile(false)} />}
      </div>
    </header>
  );
};

const MobileNav = () => {
  const { user } = useAppContext();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : memberNavItems;

  return (
    <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-forest/90 backdrop-blur-xl rounded-[2.5rem] z-[45] px-8 py-5 shadow-2xl border border-white/10 ring-8 ring-offwhite/80 transition-all duration-500">
      <div className="flex items-center justify-around">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-2 transition-all duration-500 ${
                isActive ? 'text-gold scale-125' : 'text-white/40'
              }`
            }
          >
            <item.icon size={20} />
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mainRef = useRef(null);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="h-screen bg-offwhite selection:bg-forest/10 selection:text-forest overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="lg:ml-64 flex flex-col h-screen transition-all duration-500">
        <Header toggleSidebar={toggleSidebar} />
        
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-10 pb-40 lg:pb-12 relative">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <MobileNav />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-forest/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-500"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
