import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-toastify';
import { Lock, Mail, Leaf, User as UserIcon, Smartphone, Shield, UserPlus } from 'lucide-react';

export default function Signup() {
  const { register, handleSubmit, getValues, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Get selected role from navigation state, redirect to role-selection if missing
  const selectedRole = location.state?.role || sessionStorage.getItem('selectedRole');

  useEffect(() => {
    if (!selectedRole) {
      toast.info('Please select your portal access capacity first.');
      navigate('/role-selection', { replace: true });
    }
  }, [selectedRole, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name || 'Anonymous Coach',
            role: selectedRole || 'member',
            phone: data.phone || '',
            created_at: new Date().toISOString()
          }
        }
      });
      if (error) throw error;
      
      if (authData?.session) {
        toast.success('Sanctuary account created. Welcome to the Sanctuary!');
        navigate('/');
      } else {
        toast.success('Sanctuary account requested. Please verify your email.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedRole) {
    return null; // Let the useEffect redirect run
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F2] relative overflow-hidden font-sans">
      {/* Subtle organic background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#1F4D3A]/5 rounded-full filter blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#C2A878]/10 rounded-full filter blur-[100px]"></div>

      <div className="w-full max-w-lg p-10 sm:p-16 bg-white/40 backdrop-blur-3xl rounded-[3rem] shadow-[0_32px_64px_rgba(31,77,58,0.08)] border border-white z-10 mx-4 animate-in fade-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#1F4D3A] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-[#1F4D3A]/30">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-[#1F4D3A] text-center tracking-tighter uppercase">
            Anandam Wellness
          </h2>
          <p className="text-[#6B7280] mt-4 text-center text-xs tracking-[0.2em] uppercase font-black">
            Holistic Wellness CRM
          </p>
        </div>
 
        {/* Selected Access Feedback Banner */}
        <div className="mb-8 flex items-center justify-between p-4 bg-[#1F4D3A]/5 border border-[#1F4D3A]/10 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#1F4D3A] text-white rounded-xl">
              {selectedRole === 'admin' ? <Shield className="w-4.5 h-4.5" /> : <UserPlus className="w-4.5 h-4.5" />}
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-black uppercase tracking-widest leading-none mb-1">Portal Access</p>
              <p className="text-xs font-black text-[#1F4D3A] uppercase tracking-wider">
                {selectedRole === 'admin' ? 'Institutional Admin' : 'Staff Member'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/role-selection')}
            className="px-4 py-2 border border-[#1F4D3A]/20 hover:border-[#1F4D3A] text-[9px] font-black text-[#1F4D3A] uppercase tracking-widest rounded-xl hover:bg-white transition-all duration-300"
          >
            Change
          </button>
        </div>
 
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#1F4D3A] uppercase tracking-[0.2em] px-1">Full Legal Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-[#7A9B8E]" />
              </div>
              <input
                {...register("name", { required: "Name is required" })}
                type="text"
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#E7E5E4] rounded-2xl text-[#1E1E1E] font-bold focus:ring-4 focus:ring-[#7A9B8E]/10 focus:border-[#1F4D3A] transition-all outline-none placeholder-[#6B7280]/20"
                placeholder="Coach Name"
              />
            </div>
            {errors.name && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.name.message}</span>}
          </div>
 
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#1F4D3A] uppercase tracking-[0.2em] px-1">Institutional Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#7A9B8E]" />
              </div>
              <input
                {...register("email", { required: "Email is required" })}
                type="email"
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#E7E5E4] rounded-2xl text-[#1E1E1E] font-bold focus:ring-4 focus:ring-[#7A9B8E]/10 focus:border-[#1F4D3A] transition-all outline-none placeholder-[#6B7280]/20"
                placeholder="coach@anandam.in"
              />
            </div>
            {errors.email && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#1F4D3A] uppercase tracking-[0.2em] px-1">Phone Number (Optional)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Smartphone className="h-5 w-5 text-[#7A9B8E]" />
              </div>
              <input
                {...register("phone")}
                type="tel"
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#E7E5E4] rounded-2xl text-[#1E1E1E] font-bold focus:ring-4 focus:ring-[#7A9B8E]/10 focus:border-[#1F4D3A] transition-all outline-none placeholder-[#6B7280]/20"
                placeholder="+91 00000 00000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#1F4D3A] uppercase tracking-[0.2em] px-1">Security Key</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#7A9B8E]" />
              </div>
              <input
                {...register("password", { required: "Password is required" })}
                type="password"
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#E7E5E4] rounded-2xl text-[#1E1E1E] font-bold focus:ring-4 focus:ring-[#7A9B8E]/10 focus:border-[#1F4D3A] transition-all outline-none placeholder-[#6B7280]/20"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.password.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#1F4D3A] uppercase tracking-[0.2em] px-1">Confirm Security Key</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#7A9B8E]" />
              </div>
              <input
                {...register("confirmPassword", {
                  required: "Confirm password is required",
                  validate: value => value === getValues('password') || "Passwords do not match"
                })}
                type="password"
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#E7E5E4] rounded-2xl text-[#1E1E1E] font-bold focus:ring-4 focus:ring-[#7A9B8E]/10 focus:border-[#1F4D3A] transition-all outline-none placeholder-[#6B7280]/20"
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.confirmPassword.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-5 px-6 rounded-2xl shadow-xl shadow-[#1F4D3A]/10 text-[10px] font-black text-white bg-[#1F4D3A] hover:bg-[#2F5D50] focus:outline-none focus:ring-4 focus:ring-[#1F4D3A]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-[0.2em] mt-8"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Request Access'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
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
        <p className="text-[10px] font-bold text-[#7A9B8E] uppercase tracking-[0.5em] opacity-40">Holistic Excellence • Since 2024</p>
      </div>
    </div>
  );
}
