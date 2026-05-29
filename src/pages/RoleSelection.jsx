import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, UserPlus, Leaf } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { user } = useAppContext();
  
  

  // If already logged in, send them straight to the dashboard
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleRoleSelect = (role) => {
    // Save role for later page reloads
    sessionStorage.setItem('selectedRole', role);
    // Navigate directly to auth page with selected role passed as state
    navigate('/signup', { state: { role } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F2] relative overflow-hidden font-sans">
      {/* Subtle organic background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#1F4D3A]/5 rounded-full filter blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#C2A878]/10 rounded-full filter blur-[100px]"></div>

      <div className="w-full max-w-2xl p-10 sm:p-16 bg-white/40 backdrop-blur-3xl rounded-[3rem] shadow-[0_32px_64px_rgba(31,77,58,0.08)] border border-white z-10 mx-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-[#1F4D3A] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-[#1F4D3A]/30">
            <Leaf className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1F4D3A] text-center tracking-tighter uppercase">
            Anandam Wellness
          </h2>
          <p className="text-[#6B7280] mt-4 text-center text-xs tracking-[0.2em] uppercase font-black">
            Portal Access Setup
          </p>
        </div>

        <div className="text-center mb-10">
          <h3 className="text-2xl font-extrabold text-[#1F4D3A] tracking-tight uppercase">
            Choose Your Access Role
          </h3>
          <p className="text-[10px] text-[#6B7280] font-black tracking-widest uppercase mt-2">
            Select the capacity in which you will guide wellness journeys
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Option */}
          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className="text-left p-8 bg-white border border-[#E7E5E4] rounded-[2.5rem] transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-xl hover:border-[#1F4D3A]/30 hover:-translate-y-1"
          >
            <div>
              <div className="w-14 h-14 bg-[#1F4D3A]/5 text-[#1F4D3A] group-hover:bg-[#1F4D3A] group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-500 mb-6 shadow-sm">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-[#1F4D3A] uppercase tracking-wider mb-2">
                Admin
              </h4>
              <p className="text-xs text-[#6B7280] font-bold leading-relaxed">
                Full dashboard access and complete management controls.
              </p>
            </div>
            <div className="mt-8 flex items-center text-[10px] font-black text-[#1F4D3A] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
              Select Role & Continue →
            </div>
          </button>

          {/* Member Option */}
          <button
            type="button"
            onClick={() => handleRoleSelect('member')}
            className="text-left p-8 bg-white border border-[#E7E5E4] rounded-[2.5rem] transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-xl hover:border-[#1F4D3A]/30 hover:-translate-y-1"
          >
            <div>
              <div className="w-14 h-14 bg-[#1F4D3A]/5 text-[#1F4D3A] group-hover:bg-[#1F4D3A] group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-500 mb-6 shadow-sm">
                <UserPlus className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-[#1F4D3A] uppercase tracking-wider mb-2">
                Member
              </h4>
              <p className="text-xs text-[#6B7280] font-bold leading-relaxed">
                Limited access for adding new members only.
              </p>
            </div>
            <div className="mt-8 flex items-center text-[10px] font-black text-[#1F4D3A] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
              Select Role & Continue →
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-[10px] font-black text-[#7A9B8E] uppercase tracking-widest hover:text-[#1F4D3A] transition-colors"
          >
            Already have access? Enter Sanctuary
          </button>
        </div>
      </div>

      {/* Decorative footer text */}
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-[10px] font-bold text-[#7A9B8E] uppercase tracking-[0.5em] opacity-40">
          Holistic Excellence • Since 2024
        </p>
      </div>
    </div>
  );
}
