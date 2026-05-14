import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { Lock, Mail, Leaf } from 'lucide-react';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('Welcome back to the Sanctuary');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F2] relative overflow-hidden font-sans">
      {/* Subtle organic background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#1F4D3A]/5 rounded-full filter blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#C2A878]/10 rounded-full filter blur-[100px]"></div>

      <div className="w-full max-w-lg p-10 sm:p-16 bg-white/40 backdrop-blur-3xl rounded-[3rem] shadow-[0_32px_64px_rgba(31,77,58,0.08)] border border-white z-10 mx-4">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-[#1F4D3A] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-[#1F4D3A]/30">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-extrabold text-[#1F4D3A] text-center tracking-tighter uppercase">
            ELEVATE
          </h2>
          <p className="text-[#6B7280] mt-4 text-center text-sm tracking-[0.3em] uppercase font-black">
            Professional Wellness Console
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-[#1F4D3A] uppercase tracking-[0.2em] px-1">Institutional Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#7A9B8E]" />
              </div>
              <input
                {...register("email", { required: "Email is required" })}
                type="email"
                defaultValue="coach@elevate.in"
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#E7E5E4] rounded-2xl text-[#1E1E1E] font-bold focus:ring-4 focus:ring-[#7A9B8E]/10 focus:border-[#1F4D3A] transition-all outline-none placeholder-[#6B7280]/20"
                placeholder="coach@elevate.in"
              />
            </div>
            {errors.email && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.email.message}</span>}
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-[#1F4D3A] uppercase tracking-[0.2em] px-1">Security Key</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#7A9B8E]" />
              </div>
              <input
                {...register("password", { required: "Password is required" })}
                type="password"
                defaultValue="elevate"
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#E7E5E4] rounded-2xl text-[#1E1E1E] font-bold focus:ring-4 focus:ring-[#7A9B8E]/10 focus:border-[#1F4D3A] transition-all outline-none placeholder-[#6B7280]/20"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-5 px-6 rounded-2xl shadow-xl shadow-[#1F4D3A]/10 text-[10px] font-black text-white bg-[#1F4D3A] hover:bg-[#2F5D50] focus:outline-none focus:ring-4 focus:ring-[#1F4D3A]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-[0.2em]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Enter Sanctuary'
            )}
          </button>
        </form>
        
        <div className="mt-12 pt-8 border-t border-[#E7E5E4] flex flex-col items-center">
          <p className="text-[9px] font-black text-[#7A9B8E] uppercase tracking-[0.3em] mb-4">Credentials for Audit</p>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-[#1F4D3A] mb-1">coach@elevate.in</p>
              <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest">Email</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-[#1F4D3A] mb-1">elevate</p>
              <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest">Key</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative footer text */}
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-[10px] font-bold text-[#7A9B8E] uppercase tracking-[0.5em] opacity-40">Holistic Excellence • Since 2024</p>
      </div>
    </div>
  );
}
