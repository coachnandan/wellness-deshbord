import React from 'react';
import { useForm } from 'react-hook-form';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import {
  User, Phone, MapPin, Briefcase, Globe, Tag, Sparkles, ArrowRight, CheckCircle
} from 'lucide-react';

export default function AddClient() {
  console.log('AddClient component rendered');
  const { addNewMember, user } = useAppContext();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    // Auto-copy WhatsApp number from contact number if empty
    if (!data.whatsapp_number) {
      data.whatsapp_number = data.contact_number;
    }
    console.log('Submitting client data:', data);
    try {
      await addNewMember(data);
      toast.success('New member enrolled successfully!');
      reset();
    } catch (error) {
      console.error('Enrollment failed:', error);
      toast.error('Enrollment failed. Please check the data and try again.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-forest tracking-tight">Enroll New Member</h1>
            <p className="text-muted font-medium text-sm mt-0.5">Begin a new client's wellness transformation journey.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <span className="px-3 py-1.5 bg-sage/10 text-sage text-[9px] font-black uppercase tracking-widest rounded-full border border-sage/20">
            Staff Access
          </span>
          <span className="text-[10px] font-bold text-muted">Logged in as {user?.name || 'Staff Member'}</span>
        </div>
      </div>

      {/* Enrollment Form Card */}
      <div className="luxury-card overflow-hidden">
        <div className="px-10 py-8 border-b border-beige bg-offwhite/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-forest tracking-tight">Wellness Enrollment Form</h2>
            <p className="text-sm font-medium text-muted mt-0.5">Fill in the client's details to register them.</p>
          </div>
          <div className="w-12 h-12 bg-forest/5 rounded-2xl flex items-center justify-center border border-beige">
            <User className="w-5 h-5 text-sage" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-8">
          {/* Personal Details */}
          <div>
            <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-5">Personal Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Full Legal Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-sage" />
                  </div>
                  <input
                    {...register("name", { required: "Full name is required" })}
                    type="text"
                    className="w-full pl-12 pr-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all placeholder-muted/30"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                {errors.name && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.name.message}</span>}
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Contact Person</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-sage" />
                  </div>
                  <input
                    {...register("contact")}
                    type="text"
                    className="w-full pl-12 pr-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all placeholder-muted/30"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Contact Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-sage" />
                  </div>
                  <input
                    {...register("contact_number", { required: "Contact number is required" })}
                    type="tel"
                    className="w-full pl-12 pr-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all placeholder-muted/30"
                    placeholder="+91 00000 00000"
                  />
                </div>
                {errors.contact_number && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.contact_number.message}</span>}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">WhatsApp Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-sage" />
                    </div>
                    <input
                      {...register("whatsapp_number")}
                      type="tel"
                      className="w-full pl-12 pr-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all placeholder-muted/30"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Living Address *</label>
                <div className="relative">
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <MapPin className="h-4 w-4 text-sage" />
                  </div>
                  <textarea
                    {...register("address", { required: "Address is required" })}
                    className="w-full pl-12 pr-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all placeholder-muted/30 min-h-[100px]"
                    placeholder="Street, City, State"
                  />
                </div>
                {errors.address && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest px-1">{errors.address.message}</span>}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Status</label>
                  <select
                    {...register("status", { required: "Status is required" })}
                    className="w-full pl-5 pr-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Follow-Up">Follow-Up</option>
                    <option value="Form Submission">Form Submission</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Wellness Profile */}
          <div className="border-t border-beige pt-8">
            <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-5">Wellness Profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Primary Goal</label>
                <select
                  {...register("purpose")}
                  className="w-full px-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all appearance-none"
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Weight Gain">Weight Gain</option>
                  <option value="Health & Vitality">Health & Vitality</option>
                  <option value="Stress Management">Stress Management</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Fitness">Fitness</option>
                  <option value="General Wellness">General Wellness</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Profession</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-sage" />
                  </div>
                  <input
                    {...register("profession")}
                    type="text"
                    className="w-full pl-12 pr-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all placeholder-muted/30"
                    placeholder="e.g. Design Architect"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-forest uppercase tracking-[0.2em] px-1">Referral Channel</label>
                <select
                  {...register("referral_source")}
                  className="w-full px-5 py-4 bg-offwhite border border-beige rounded-2xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage/50 transition-all appearance-none"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Website">Website</option>
                  <option value="Existing Client">Existing Client</option>
                  <option value="Walk-In">Walk-In</option>
                  <option value="Google">Google</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Engagement Plan */}
          <div className="border-t border-beige pt-8">
            <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-5">Engagement Plan</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { value: 'Monthly Flow', label: 'Monthly Flow', price: '₹15,000', days: '30 Days' },
                { value: 'Quarterly Balance', label: 'Quarterly Balance', price: '₹40,000', days: '90 Days' },
                { value: 'Annual Harmony', label: 'Annual Harmony', price: '₹1,50,000', days: '365 Days' }
              ].map((plan) => (
                <label key={plan.value} className="cursor-pointer">
                  <input
                    {...register("plan")}
                    type="radio"
                    value={plan.value}
                    defaultChecked={plan.value === 'Monthly Flow'}
                    className="sr-only peer"
                  />
                  <div className="p-6 bg-offwhite border-2 border-beige rounded-2xl peer-checked:border-forest peer-checked:bg-forest/5 transition-all hover:border-sage/40">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-sm font-extrabold text-forest">{plan.label}</p>
                      <div className="w-5 h-5 rounded-full border-2 border-beige peer-checked:border-forest flex items-center justify-center">
                      </div>
                    </div>
                    <p className="text-xl font-black text-sage">{plan.price}</p>
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mt-1">{plan.days}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="border-t border-beige pt-8 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 px-8 py-4 bg-white text-muted border border-beige rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-offwhite transition-all"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] flex items-center justify-center px-10 py-5 bg-forest text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-2xl shadow-forest/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-gold" />
                  Complete Enrollment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
