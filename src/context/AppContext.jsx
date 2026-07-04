import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '../lib/supabaseClient';
import { getISTDateString, getISTTimeString } from '../utils/dateUtils';
import useRealtime from '../hooks/useRealtime';

const AppContext = createContext();

const ConfigErrorScreen = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F2', padding: '20px', fontFamily: 'sans-serif' }}>
    <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(31,77,58,0.1)', maxWidth: '500px', textAlign: 'center', border: '1px solid #E7E5E4' }}>
      <div style={{ width: '64px', height: '64px', background: '#ffebee', color: '#c62828', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px', fontWeight: 'bold' }}>!</div>
      <h2 style={{ color: '#1F4D3A', fontSize: '24px', fontWeight: '900', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configuration Error</h2>
      <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', fontWeight: '500' }}>
        The application is missing required Supabase environment variables. If you are on Netlify, please add <strong style={{ color: '#1F4D3A' }}>VITE_SUPABASE_URL</strong> and <strong style={{ color: '#1F4D3A' }}>VITE_SUPABASE_ANON_KEY</strong> to your Site Settings and trigger a new deployment.
      </p>
    </div>
  </div>
);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendanceLocks, setAttendanceLocks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [closings, setClosings] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Derived state to match strict requirements
  const currentUser = user;
  const currentRole = user?.role || null;
  const isAuthenticated = !!user;
  const session = sessionData;

  const customersRef = React.useRef([]);
  const attendanceRef = React.useRef([]);
  const membershipsRef = React.useRef([]);
  const notificationsRef = React.useRef([]);
  const attendanceLocksRef = React.useRef([]);
  const visitorsRef = React.useRef([]);
  const closingsRef = React.useRef([]);

  useEffect(() => {
    customersRef.current = customers;
    attendanceRef.current = attendance;
    membershipsRef.current = memberships;
    notificationsRef.current = notifications;
    attendanceLocksRef.current = attendanceLocks;
    visitorsRef.current = visitors;
    closingsRef.current = closings;
  }, [customers, attendance, memberships, notifications, attendanceLocks, visitors, closings]);

  // Initialize realtime subscriptions after auth is resolved
  useRealtime({
    supabase,
    setCustomers,
    setAttendance,
    setMemberships,
    setNotifications,
    setAttendanceLocks,
    setVisitors,
    setClosings,
    customersRef,
    attendanceRef,
    membershipsRef,
    notificationsRef,
    attendanceLocksRef,
    visitorsRef,
    closingsRef,
  });

  // Cache for resolved profiles to avoid repeated DB queries
  const profileCacheRef = useRef({});

  // Returns user immediately with metadata role (non-blocking)
  const resolveUserProfile = (sessionUser) => {
    const metaRole = sessionUser.user_metadata?.role || 'member';
    const metaName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Member';

    // Use cached profile if available for instant resolution
    const cached = profileCacheRef.current[sessionUser.id];
    if (cached) {
      return { ...sessionUser, role: cached.role, name: cached.name || metaName };
    }

    return { ...sessionUser, role: metaRole, name: metaName };
  };

  // Refreshes user role from DB in the background (non-blocking)
  const refreshProfileFromDB = async (sessionUser) => {
    if (!supabase) return;
    const metaName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Member';
    const metaRole = sessionUser.user_metadata?.role || 'member';

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Profile fetch error:', error.message);
        return;
      }

      if (profileData) {
        const dbRole = profileData.role || 'member';
        const dbName = profileData.name || metaName;
        profileCacheRef.current[sessionUser.id] = { role: dbRole, name: dbName };
        console.log(`[Auth] Role resolved from DB: ${dbRole} for ${sessionUser.email}`);
        setUser(prev => prev?.id === sessionUser.id ? { ...prev, role: dbRole, name: dbName } : prev);
      } else {
        // No profile found — create one
        console.log(`[Auth] No profile found for ${sessionUser.email}. Creating with role: ${metaRole}`);
        await supabase.from('profiles').upsert(
          [{ id: sessionUser.id, name: metaName, role: metaRole }],
          { onConflict: 'id' }
        );
        profileCacheRef.current[sessionUser.id] = { role: metaRole, name: metaName };
      }
    } catch (err) {
      console.warn('[Auth] Background profile fetch failed:', err.message);
    }
  };

  // Check for active session using onAuthStateChange as the sole source of truth.
  // Role is always fetched fresh from the profiles table on every session event.
  useEffect(() => {
    if (!isConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    let isFirstRun = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email || "No session");
      setSessionData(session);

      try {
        if (session?.user) {
          // Resolve user instantly with metadata (non-blocking)
          const resolvedUser = resolveUserProfile(session.user);
          setUser(resolvedUser);
          fetchData(resolvedUser);
          // Refresh role from DB in background (does not block auth)
          refreshProfileFromDB(session.user);
        } else {
          setUser(null);
          setCustomers([]);
          setAttendance([]);
          setMemberships([]);
        }
      } catch (err) {
        console.error("Error handling auth state change:", err);
      } finally {
        if (isFirstRun) {
          isFirstRun = false;
          setAuthLoading(false);
        }
      }
    });

    // Safety timeout in case onAuthStateChange does not fire or gets stuck
    const safetyTimeout = setTimeout(() => {
      if (isFirstRun) {
        console.warn("Auth initialization safety timeout fired.");
        isFirstRun = false;
        setAuthLoading(false);
      }
    }, 5000);

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchData(currentUser = null) {
    if (!supabase) return;
    const activeUser = currentUser || user;
    const isMember = activeUser?.role === 'member';

    try {
      setDataLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const { data: clientData } = await supabase.from('clients').select('*').order('full_name', { ascending: true });
      if (clientData) {
        const parsedClients = clientData.map(c => {
          try {
            const meta = typeof c.address === 'string' ? JSON.parse(c.address) : c.address;
            return { ...c, ...meta, address: meta.address || c.address };
          } catch {
            return c;
          }
        });
        setCustomers(parsedClients);
      }

      if (isMember) {
        setAttendance([]);
        setMemberships([]);
        setNotifications([]);
        setAttendanceLocks([]);
        setVisitors([]);
        return;
      }

      const { data: memData, error: memError } = await supabase.from('memberships').select('*').order('created_at', { ascending: false });
      if (memError) {
        if (memError.code === 'PGRST205' || memError.message?.includes('404') || memError.message?.includes('does not exist')) {
          console.warn('[Data] memberships table not found in database. Skipping memberships sync.');
        } else {
          console.error('[Data] memberships fetch error:', memError.message);
        }
        setMemberships([]);
      } else if (memData) {
        setMemberships(memData.map(m => ({
          ...m,
          customerId: m.client_id,
          plan: m.membership_plan,
          startDate: m.start_date,
          expiryDate: m.expiry_date
        })));
      }

      const thirtyOneDaysAgo = new Date(getISTDateString());
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      const { data: attData } = await supabase
        .from('attendance')
        .select('*, profiles(name)')
        .gte('date', getISTDateString(thirtyOneDaysAgo));
      if (attData) setAttendance(attData.map(a => ({
        ...a,
        customerId: a.client_id,
        markedBy: a.profiles?.name || a.marked_by_name
      })));

      const { data: noteData, error: noteError } = await supabase
        .from('notification_logs')
        .select('*, clients(name)')
        .order('sent_at', { ascending: false })
        .limit(10);
      if (noteError) {
        if (noteError.code === 'PGRST205' || noteError.message?.includes('404') || noteError.message?.includes('does not exist')) {
          console.warn('[Data] notification_logs table not found in database. Skipping notifications sync.');
        } else {
          console.error('[Data] notification_logs fetch error:', noteError.message);
        }
        setNotifications([]);
      } else if (noteData) {
        setNotifications(noteData);
      }

      const { data: lockData, error: lockError } = await supabase
        .from('attendance_locks')
        .select('*')
        .gte('date', getISTDateString(thirtyOneDaysAgo));

      if (lockError) {
        if (lockError.code === 'PGRST205' || lockError.message?.includes('404') || lockError.message?.includes('does not exist')) {
          console.warn('[Data] attendance_locks table not found. Skipping locks sync.');
        } else {
          console.error('[Data] attendance_locks fetch error:', lockError.message);
        }
        setAttendanceLocks([]);
      } else if (lockData) {
        setAttendanceLocks(lockData);
      }

      const { data: visitorData, error: visitorError } = await supabase
        .from('visitor_logs')
        .select('*')
        .gte('visit_date', getISTDateString(thirtyOneDaysAgo))
        .order('created_at', { ascending: false });

      if (visitorError) {
        if (visitorError.code === 'PGRST205' || visitorError.message?.includes('404') || visitorError.message?.includes('does not exist')) {
          console.warn('[Data] visitor_logs table not found. Skipping visitors sync.');
        } else {
          console.error('[Data] visitor_logs fetch error:', visitorError.message);
        }
        setVisitors([]);
      } else if (visitorData) {
        setVisitors(visitorData);
      }

      const { data: closingData, error: closingError } = await supabase
        .from('closing')
        .select('*')
        .gte('visit_date', getISTDateString(thirtyOneDaysAgo))
        .order('created_at', { ascending: false });

      if (closingError) {
        if (closingError.code === 'PGRST205' || closingError.message?.includes('404') || closingError.message?.includes('does not exist')) {
          console.warn('[Data] closing table not found. Skipping closings sync.');
        } else {
          console.error('[Data] closing fetch error:', closingError.message);
        }
        setClosings([]);
      } else if (closingData) {
        setClosings(closingData.map(c => ({
          ...c,
          visitorId: c.visitor_id,
          markedBy: c.created_by_user_name // updated mapping based on new schema
        })));
      }

    } catch (error) {
      console.error('Data sync failed:', error.message);
    } finally {
      setDataLoading(false);
    }
  };

  // Real-time Subscriptions — only active when authenticated and configured


  const login = async (credentials) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      const resolvedUser = await resolveUserProfile(data.user);
      setUser(resolvedUser);
      // Run fetchData in background — don't block login navigation
      if (resolvedUser.role !== 'member') {
        fetchData(resolvedUser);
      } else {
        setCustomers([]);
        setAttendance([]);
        setMemberships([]);
      }
      return resolvedUser;
    }

    throw new Error('System not configured.');
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    sessionStorage.clear();
    localStorage.clear();
  };

  const addCustomer = async (customerData) => {
    // --- Duplicate check by mobile number ---
    const mobile = customerData.mobile_number?.trim();
    if (mobile) {
      const { data: existing } = await supabase
        .from('clients')
        .select('id, full_name, mobile_number')
        .eq('mobile_number', mobile)
        .limit(1);
      if (existing && existing.length > 0) {
        console.warn('[addCustomer] Duplicate mobile number found:', mobile, '-> existing ID:', existing[0].id);
        // Return existing profile without inserting
        return { duplicate: true, existingId: existing[0].id };
      }
    }

    const registrationNow = new Date();
    const registrationDateIST = getISTDateString(registrationNow);
    const registrationTimeIST = getISTTimeString(registrationNow);
    const creatorName = user?.name || user?.email?.split('@')[0] || 'System Admin';

    const insertPayload = {
      // New schema fields
      full_name: customerData.full_name,
      mobile_number: customerData.mobile_number,
      whatsapp_number: customerData.whatsapp_number || customerData.mobile_number,
      email: customerData.email || null,
      address: customerData.address || null,
      profession: customerData.profession || null,
      dob: customerData.dob || null,
      gender: customerData.gender || null,
      marital_status: customerData.marital_status || null,
      joining_date: customerData.joining_date || registrationDateIST,
      purpose: customerData.purpose || null,
      member_type: customerData.member_type || null,
      referred_by: customerData.referred_by || null,
      // Registration tracking (date-wise storage)
      registration_date: registrationDateIST,
      registration_time_ist: registrationTimeIST,
      created_by_name: creatorName,
      // Legacy fields (keep for backward compatibility)
      name: customerData.full_name,
      contact: customerData.mobile_number,
      status: 'Active',
      created_by: user?.id
    };

    const { data, error } = await supabase.from('clients').insert([insertPayload]).select();
    if (error) {
      console.error('addCustomer failed:', error);
      throw error;
    }

    // No auto-attendance insert - attendance is only created when manually marked

    // Insert default membership plan

    const parsedClient = { ...data[0] };

    // Update state optimistically
    setCustomers(prev => [parsedClient, ...prev]);

    // Trigger welcome WhatsApp
    await sendWhatsAppAlert(data[0].id, 'Welcome', { plan: 'Monthly Flow' });
    return { data, error };
  };

  const addVisitor = async (visitorData) => {
    const markerName = user?.name || user?.email?.split('@')[0] || 'System Admin';
    const { data, error } = await supabase
      .from('visitor_logs')
      .insert([{
        visitor_name: visitorData.visitor_name,
        mobile_number: visitorData.mobile_number || null,
        gender: visitorData.gender || null,
        age: visitorData.age ? Number(visitorData.age) : null,
        address: visitorData.address || null,
        purpose: visitorData.purpose || null,
        visit_date: visitorData.visit_date,
        visit_time: visitorData.visit_time,
        notes: visitorData.notes || null,
        added_by_user_id: user?.id,
        added_by_name: markerName
      }])
      .select();

    if (error) {
      console.error('addVisitor failed:', error);
      throw error;
    }
    if (data && data[0]) {
      setVisitors(prev => [data[0], ...prev]);
    }
    return { data: data[0] };
  };

  const updateVisitor = async (id, updates) => {
    const { data, error } = await supabase
      .from('visitor_logs')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) {
      console.error('updateVisitor failed:', error);
      throw error;
    }
    if (data && data[0]) {
      setVisitors(prev => prev.map(v => v.id === id ? data[0] : v));
    }
    return { data: data[0] };
  };

  const deleteVisitor = async (id) => {
    const { error } = await supabase.from('visitor_logs').delete().eq('id', id);
    if (error) {
      console.error('deleteVisitor failed:', error);
      throw error;
    }
    setVisitors(prev => prev.filter(v => v.id !== id));
    return { error };
  };

  const updateCustomer = async (customerId, updates) => {
    let id = customerId;
    let payload = updates;
    if (typeof customerId === 'object' && !updates) {
      id = customerId.id;
      payload = { ...customerId };
      delete payload.id;
    }
    const contactValue = payload.contact || payload.email || 'No Contact';
    const whatsappValue = payload.whatsapp_number || contactValue;

    const updatePayload = {
      // New schema fields
      full_name: payload.full_name || payload.name,
      mobile_number: payload.mobile_number || payload.contact_number || payload.contact,
      whatsapp_number: payload.whatsapp_number || payload.mobile_number || payload.contact_number || payload.contact,
      email: payload.email || null,
      address: payload.address || null,
      profession: payload.profession || null,
      dob: payload.dob || null,
      gender: payload.gender || null,
      marital_status: payload.marital_status || null,
      joining_date: payload.joining_date || null,
      purpose: payload.purpose || null,
      member_type: payload.member_type || null,
      referred_by: payload.referred_by || null,
      // Legacy fields
      name: payload.full_name || payload.name,
      contact: payload.mobile_number || payload.contact_number || payload.contact,
      status: payload.status || 'Active'
    };
    const { data, error } = await supabase.from('clients').update(updatePayload).eq('id', id).select();
    if (!error && data && data.length) {
      const parsedClient = { ...data[0] };
      setCustomers(prev => prev.map(c => c.id === id ? parsedClient : c));
    }
    return { data, error };
  };

  const deleteCustomer = async (customerId) => {
    const { error } = await supabase.from('clients').delete().eq('id', customerId);
    if (!error) setCustomers(prev => prev.filter(c => c.id !== customerId));
    return { error };
  };

  const updateAttendance = async (record) => {
    const clientName = customers.find(c => c.id === record.customerId)?.name || 'Unknown';
    const now = new Date();
    const dateIST = getISTDateString(now);
    const timeIST = getISTTimeString(now);
    const markerName = user?.name || user?.email?.split('@')[0] || 'Coach';

    // 1. Update/Insert Attendance
    const { data: attData, error: attErr } = await supabase
      .from('attendance')
      .upsert({
        client_id: record.customerId,
        date: record.date,
        status: record.status,
        remark: record.remark || null,
        user_id: user?.id || null,
        marked_by_name: markerName,
        client_name: clientName,
        updated_at: now.toISOString(),
        // Payment fields (only saved when provided)
        ...(record.amount_paid != null && { amount_paid: record.amount_paid }),
        ...(record.payment_status != null && { payment_status: record.payment_status }),
        ...(record.advance_amount != null && { advance_amount: record.advance_amount }),
        ...(record.due_amount != null && { due_amount: record.due_amount }),
        ...(record.payment_method != null && { payment_method: record.payment_method }),
      }, { onConflict: 'client_id, date' })
      .select();

    if (attErr) throw attErr;

    // 2. Local State Sync — update existing or append new
    const mappedRecord = { ...attData[0], customerId: attData[0].client_id, markedBy: markerName };
    setAttendance(prev => {
      const idx = prev.findIndex(a => a.customerId === record.customerId && a.date === record.date);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...prev[idx], ...mappedRecord };
        return updated;
      }
      return [...prev, mappedRecord];
    });

    // 3. Shake Deduction Logic
    const isShake = ['S', 'SB', 'SF', 'SBF'].includes(record.remark);
    if (isShake) {
      const activeMem = memberships.find(m =>
        (m.client_id === record.customerId || m.customerId === record.customerId) &&
        m.status === 'Active'
      );

      if (activeMem) {
        // Check if log already exists for this specific date to prevent double-decrement
        const { data: existingLogs } = await supabase
          .from('membership_usage_logs')
          .select('id')
          .eq('membership_id', activeMem.id)
          .eq('shake_date', record.date);

        if (!existingLogs || existingLogs.length === 0) {
          const newRemaining = Math.max(0, (activeMem.remaining_days || 0) - 1);
          const newStatus = newRemaining === 0 ? 'Expired' : 'Active';

          // Update Membership
          await supabase.from('memberships')
            .update({ remaining_days: newRemaining, status: newStatus })
            .eq('id', activeMem.id);

          // Update Frontend
          setMemberships(prev => prev.map(m => m.id === activeMem.id ? { ...m, remaining_days: newRemaining, status: newStatus } : m));

          // Log Usage WITH payment details if provided
          await supabase.from('membership_usage_logs').insert({
            membership_id: activeMem.id,
            client_id: record.customerId,
            shake_date: record.date,
            shake_type: record.remark,
            shake_time_ist: timeIST,
            remaining_days: newRemaining,
            updated_by_name: markerName,
            ...(record.amount_paid != null && { amount_paid: record.amount_paid }),
            ...(record.payment_status != null && { payment_status: record.payment_status }),
            ...(record.advance_amount != null && { advance_amount: record.advance_amount }),
            ...(record.due_amount != null && { due_amount: record.due_amount }),
            ...(record.payment_method != null && { payment_method: record.payment_method })
          });
        }
      }
    }
  };

  const logShakePayment = async (customerId, remark, days, totalAmount, paymentStatus = 'Paid', advanceAmount = 0, dueAmount = 0, paymentMethod = 'Cash', shakeDate = null) => {
    const now = new Date();
    const dateIST = shakeDate || getISTDateString(now);
    const timeIST = getISTTimeString(now);
    const markerName = user?.name || user?.email?.split('@')[0] || 'System Admin';
    const clientName = customers.find(c => c.id === customerId)?.name || 'Unknown';

    try {
      // 1. Log the shake consumption and payment
      const { data: usageLog, error: usageErr } = await supabase.from('membership_usage_logs').insert({
        membership_id: null,
        client_id: customerId,
        client_name: clientName,
        membership_plan: 'Non-Member Shake',
        shake_type: remark,
        used_day: days,
        remaining_days: null,
        shake_date: dateIST,
        shake_time_ist: timeIST,
        amount_paid: totalAmount,
        payment_status: paymentStatus,
        advance_amount: advanceAmount,
        due_amount: dueAmount,
        payment_method: paymentMethod,
        updated_by_name: markerName,
        updated_by_user_id: user?.id || null
      }).select();

      if (usageErr) throw usageErr;

      // 2. Log the activity for audit
      const { error: actErr } = await supabase.from('membership_activity_logs').insert({
        membership_id: null,
        client_id: customerId,
        action_type: 'Payment',
        action_description: `Collected ₹${advanceAmount} (Total: ₹${totalAmount}) via ${paymentMethod} for ${days} days of ${remark} Shake`,
        performed_by_name: markerName,
        performed_by_user_id: user?.id || null
      });

      if (actErr) throw actErr;

      return { data: usageLog, error: null };
    } catch (error) {
      console.error('logShakePayment failed:', error);
      throw error;
    }
  };

  const logVisitorShakePayment = async (visitorId, payload) => {
    const markerName = user?.name || user?.email?.split('@')[0] || 'System Admin';

    try {
      const { data, error } = await supabase.from('visitor_shake_logs').insert({
        visitor_id: visitorId,
        visitor_name: payload.visitor_name,
        shake_type: payload.shake_type,
        amount: payload.amount,
        payment_status: payload.payment_status,
        advance_amount: payload.advance_amount,
        due_amount: payload.due_amount,
        payment_method: payload.payment_method,
        created_by_user_id: user?.id || null,
        created_by_user_name: markerName
      }).select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('logVisitorShakePayment failed:', error);
      throw error;
    }
  };

  const finalizeAttendance = async (dateStr) => {
    const markerName = user?.name || user?.email?.split('@')[0] || 'System Admin';
    const { data, error } = await supabase
      .from('attendance_locks')
      .insert([{
        date: dateStr,
        locked_by_user_id: user?.id,
        locked_by_name: markerName,
        is_locked: true
      }])
      .select();

    if (error) {
      if (error.code === '23505') { // unique violation
        throw new Error('Attendance for this date is already locked.');
      }
      console.error("finalizeAttendance failed:", error);
      throw error;
    }

    // Add to local state (realtime should catch it too, but we optimistically add)
    if (data && data[0]) {
      setAttendanceLocks(prev => [...prev, data[0]]);
    }
  };

  const addMembership = async (membershipData) => {
    const markerName = user?.name || user?.email?.split('@')[0] || 'System Admin';
    const clientName = customers.find(c => c.id === membershipData.customerId)?.name || membershipData.customerName || 'Unknown';

    // --- Payment calculation ---
    const totalAmount = parseFloat(membershipData.totalAmount ?? membershipData.amount ?? 0);
    const advanceAmount = parseFloat(membershipData.advanceAmount ?? totalAmount);
    const remainingAmount = Math.max(0, totalAmount - advanceAmount);

    let paymentStatusDetail = 'Unpaid';
    if (remainingAmount === 0) {
      paymentStatusDetail = 'Paid';
    } else if (advanceAmount > 0 && remainingAmount > 0) {
      paymentStatusDetail = 'Partially Paid';
    }

    // --- Expiry date calculation ---
    const durationDays = membershipData.durationDays || 30;
    let expiryDateStr = membershipData.expiryDate;
    if (!expiryDateStr && membershipData.startDate) {
      const startD = new Date(membershipData.startDate);
      startD.setDate(startD.getDate() + durationDays);
      expiryDateStr = startD.toISOString().split('T')[0];
    }
    if (!expiryDateStr) {
      expiryDateStr = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const insertPayload = {
      client_id: membershipData.customerId,
      client_name: clientName,
      membership_plan: membershipData.plan,
      duration_days: durationDays,
      amount: totalAmount,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      remaining_amount: remainingAmount,
      payment_status_detail: paymentStatusDetail,
      start_date: membershipData.startDate,
      expiry_date: expiryDateStr,
      status: 'Active',
      payment_status: paymentStatusDetail === 'Unpaid' ? 'Unpaid' : (paymentStatusDetail === 'Paid' ? 'Paid' : 'Partially Paid'),
      renewal_status: 'New',
      remaining_days: durationDays,
      created_by_user_id: user?.id || null,
      created_by_name: markerName
    };

    console.log('[addMembership] Insert payload:', insertPayload);
    const { data, error } = await supabase
      .from('memberships')
      .insert([insertPayload])
      .select();

    if (error) {
      console.error('[addMembership] INSERT FAILED:', error);
      console.error('[addMembership] Code:', error.code, '| Message:', error.message, '| Details:', error.details, '| Hint:', error.hint);
      throw error;
    }

    if (data && data.length > 0) {
      console.log('[addMembership] Created:', data[0].id);
      const normalized = {
        ...data[0],
        customerId: data[0].client_id,
        plan: data[0].membership_plan,
        startDate: data[0].start_date,
        expiryDate: data[0].expiry_date
      };
      setMemberships(prev => [normalized, ...prev]);
      setCustomers(prev => prev.map(c => c.id === data[0].client_id ? { ...c, status: 'Active' } : c));
      await sendWhatsAppAlert(data[0].client_id, 'MembershipCreated', { plan: data[0].membership_plan });
    }
    return { data, error };
  };

  const addNewMember = async (data) => {
    console.log('[addNewMember] entered with data:', data);
    console.log('[addNewMember] current user:', { id: user?.id, name: user?.name, email: user?.email });

    // --- Duplicate check by mobile number ---
    const mobile = data.mobile_number?.trim();
    if (mobile) {
      const { data: existing } = await supabase
        .from('clients')
        .select('id, full_name, mobile_number')
        .eq('mobile_number', mobile)
        .limit(1);
      if (existing && existing.length > 0) {
        console.warn('[addNewMember] Duplicate mobile:', mobile, '-> existing ID:', existing[0].id);
        throw new Error(`Profile already exists for mobile number ${mobile} (${existing[0].full_name}).`);
      }
    }

    const registrationNow = new Date();
    const registrationDateIST = getISTDateString(registrationNow);
    const registrationTimeIST = getISTTimeString(registrationNow);
    const creatorName = user?.name || user?.email?.split('@')[0] || 'System Admin';

    // Validate member_type has a valid value (CHECK constraint: Coach | Member)
    const validMemberTypes = ['Coach', 'Member'];
    const memberType = validMemberTypes.includes(data.member_type) ? data.member_type : 'Member';

    const insertPayload = {
      // New schema fields
      full_name: data.full_name,
      mobile_number: data.mobile_number,
      whatsapp_number: data.whatsapp_number || data.mobile_number,
      email: data.email || null,
      address: data.address || null,
      profession: data.profession || null,
      dob: data.dob || null,
      gender: data.gender || null,
      marital_status: data.marital_status || null,
      joining_date: data.joining_date || registrationDateIST,
      purpose: data.purpose || null,
      member_type: memberType,
      referred_by: data.referred_by || null,
      notes: data.notes || null,
      // Registration tracking (date-wise storage)
      registration_date: registrationDateIST,
      registration_time_ist: registrationTimeIST,
      created_by_name: creatorName,
      // Legacy fields
      name: data.full_name,
      contact: data.mobile_number,
      status: 'Active',
      created_by: user?.id || null
    };

    console.log('[addNewMember] clients insert payload:', insertPayload);
    const { data: clientData, error: clientError } = await supabase.from('clients').insert([insertPayload]).select();

    if (clientError) {
      console.error('[addNewMember] CLIENT INSERT FAILED:', clientError);
      console.error('[addNewMember] Error code:', clientError.code, '| message:', clientError.message, '| details:', clientError.details, '| hint:', clientError.hint);
      throw clientError;
    }
    console.log('[addNewMember] Client created:', clientData[0]?.id);

    // No auto-attendance insert - attendance is only created when manually marked

    // Insert membership directly after client creation
    const planMap = {
      '1 Day': 173,
      '3 Days': 729,
      '10 Days': 2500,
      '30 Days': 7000
    };
    const durationMap = {
      '1 Day': 1,
      '3 Days': 3,
      '10 Days': 10,
      '30 Days': 30
    };

    // Auto-calculate payment details
    const totalAmount = data.total_amount ? parseFloat(data.total_amount) : (planMap[data.plan] || 0);
    const advanceAmount = data.advance_amount ? parseFloat(data.advance_amount) : totalAmount;
    const remainingAmount = Math.max(0, (totalAmount || 0) - (advanceAmount || 0));

    let paymentStatusDetail = 'Unpaid';
    if (remainingAmount === 0) {
      paymentStatusDetail = 'Paid';
    } else if (remainingAmount > 0 && advanceAmount > 0) {
      paymentStatusDetail = 'Partially Paid';
    }

    // For 'Other' plan, use custom_duration; otherwise look up duration from map
    const duration = data.plan === 'Other'
      ? (parseInt(data.custom_duration) || 30)
      : (durationMap[data.plan] || 30);
    const startDate = data.membership_start_date ? new Date(data.membership_start_date) : new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(startDate.getDate() + duration);

    const membershipPayload = {
      client_id: clientData[0].id,
      client_name: data.full_name || null,
      membership_plan: data.plan,
      duration_days: duration,
      amount: totalAmount || 0,
      total_amount: totalAmount || 0,
      advance_amount: advanceAmount || 0,
      remaining_amount: remainingAmount || 0,
      payment_status_detail: paymentStatusDetail,
      start_date: startDate.toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0],
      status: 'Active',
      payment_status: paymentStatusDetail === 'Unpaid' ? 'Unpaid' : (paymentStatusDetail === 'Paid' ? 'Paid' : 'Partially Paid'),
      renewal_status: 'New',
      created_by_user_id: user?.id || null,
      created_by_name: creatorName,
      remaining_days: duration
    };
    console.log('[addNewMember] memberships insert payload:', membershipPayload);
    const { data: memData, error: memError } = await supabase.from('memberships').insert([
      membershipPayload
    ]).select();

    if (memError) {
      console.error('[addNewMember] MEMBERSHIP INSERT FAILED:', memError);
      console.error('[addNewMember] Error code:', memError.code, '| message:', memError.message, '| details:', memError.details, '| hint:', memError.hint);
      // Clean up the orphaned client record
      await supabase.from('clients').delete().eq('id', clientData[0].id);
      throw memError;
    }
    console.log('[addNewMember] Membership created:', memData[0]?.id);

    // Log Activity - non-fatal if fails
    const { error: logError } = await supabase.from('membership_activity_logs').insert([
      {
        membership_id: memData[0].id,
        client_id: clientData[0].id,
        action_type: 'Created',
        action_description: `Enrolled in ${data.plan}`,
        performed_by_user_id: user?.id || null,
        performed_by_name: creatorName
      }
    ]);
    if (logError) {
      console.warn('[addNewMember] Activity log insert warning (non-fatal):', logError.message);
    }

    const parsedClient = { ...clientData[0] };

    // Optimistically update local state to reflect the newly added client and membership
    const newMembership = {
      ...memData[0],
      customerId: memData[0].client_id,
      plan: memData[0].membership_plan,
      startDate: memData[0].start_date,
      expiryDate: memData[0].expiry_date
    };
    setCustomers(prev => {
      const filtered = prev.filter(c => c.id !== clientData[0].id);
      return [parsedClient, ...filtered];
    });
    setMemberships(prev => {
      const filtered = prev.filter(m => m.id !== `PENDING-${clientData[0].id}`);
      return [newMembership, ...filtered];
    });

    // Trigger Welcome WhatsApp via Edge Function
    await sendWhatsAppAlert(clientData[0].id, 'Welcome', { plan: memData[0].membership_plan });

    return { client: parsedClient, membership: memData[0] };
  };

  const convertVisitorToMember = async (visitorData, membershipData = null) => {
    // 1. Duplicate check by mobile number
    if (visitorData.mobile_number) {
      const existing = customers.find(c => c.mobile_number === visitorData.mobile_number || c.contact === visitorData.mobile_number || c.whatsapp_number === visitorData.mobile_number);
      if (existing) {
        throw new Error('A member with this mobile number already exists. Please update the existing member record instead.');
      }
    }

    // 2. Create new member
    const insertPayload = {
      full_name: visitorData.visitor_name,
      mobile_number: visitorData.mobile_number,
      whatsapp_number: visitorData.mobile_number,
      email: null,
      address: visitorData.address,
      profession: null,
      dob: null,
      gender: visitorData.gender,
      marital_status: null,
      joining_date: new Date().toISOString().split('T')[0],
      purpose: visitorData.purpose,
      member_type: 'Member',
      referred_by: 'Visitor Log',
      name: visitorData.visitor_name,
      contact: visitorData.mobile_number,
      status: 'Active',
      created_by: user?.id
    };

    const { data: clientData, error: clientError } = await supabase.from('clients').insert([insertPayload]).select();
    if (clientError) throw clientError;

    const newClient = clientData[0];
    setCustomers(prev => [newClient, ...prev]);

    // No auto-attendance insert - attendance is only created when manually marked

    // 4. Create membership if provided
    if (membershipData) {
      await addMembership({
        customerId: newClient.id,
        customerName: newClient.name,
        plan: membershipData.plan,
        durationDays: membershipData.durationDays,
        amount: membershipData.amount,
        startDate: membershipData.startDate
      });
    }

    return newClient;
  };

  const renewMembership = async (membershipId, renewalData) => {
    const membership = memberships.find(m => m.id === membershipId);
    if (!membership) throw new Error('Membership not found');

    const durationDays = renewalData?.durationDays || renewalData;
    const planName = renewalData?.plan || 'Custom Plan';
    const amount = renewalData?.amount || 0;

    const startDate = new Date().toISOString().split('T')[0];
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + parseInt(durationDays));
    const expiryDateStr = newExpiry.toISOString().split('T')[0];

    if (membershipId.startsWith('PENDING-')) {
      const { data: insertedData, error: insertError } = await supabase
        .from('memberships')
        .insert([{
          client_id: membership.client_id,
          membership_plan: planName,
          duration_days: parseInt(durationDays),
          amount: amount,
          start_date: startDate,
          expiry_date: expiryDateStr,
          status: 'Active',
          payment_status: 'Paid',
          renewal_status: 'New',
          remaining_days: parseInt(durationDays)
        }])
        .select();

      if (insertError) throw insertError;

      await supabase.from('renewal_logs').insert({
        client_id: membership.client_id,
        membership_id: insertedData[0].id,
        previous_expiry_date: startDate,
        new_expiry_date: expiryDateStr,
        renewed_by_user_id: user?.id
      });

      const client = customers.find(c => c.id === membership.client_id);
      if (client?.whatsapp_number) {
        await supabase.functions.invoke('whatsapp-notify', {
          body: {
            client_id: membership.client_id,
            whatsapp_number: client.whatsapp_number,
            message_type: 'Welcome Plan',
            client_name: client.name,
            expiry_date: expiryDateStr
          }
        });
      }

      const mapped = {
        ...insertedData[0],
        customerId: insertedData[0].client_id,
        plan: insertedData[0].membership_plan,
        expiryDate: insertedData[0].expiry_date
      };
      setMemberships(prev => [mapped, ...prev.filter(m => m.id !== membershipId)]);
      return { data: insertedData, error: null };
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('memberships')
      .update({
        membership_plan: planName,
        duration_days: parseInt(durationDays),
        amount: amount,
        start_date: startDate,
        expiry_date: expiryDateStr,
        status: 'Active',
        renewal_status: 'Renewed'
      })
      .eq('id', membershipId)
      .select();

    if (updateError) throw updateError;

    await supabase.from('renewal_logs').insert({
      client_id: membership.client_id,
      membership_id: membershipId,
      previous_expiry_date: membership.expiryDate || membership.expiry_date,
      new_expiry_date: expiryDateStr,
      renewed_by_user_id: user?.id
    });

    const client = customers.find(c => c.id === membership.client_id);
    if (client?.whatsapp_number) {
      await supabase.functions.invoke('whatsapp-notify', {
        body: {
          client_id: membership.client_id,
          whatsapp_number: client.whatsapp_number,
          message_type: 'Renewal Confirmation',
          client_name: client.name,
          new_expiry_date: expiryDateStr
        }
      });
    }

    setMemberships(memberships.map(m => m.id === membershipId ? { ...updatedData[0], customerId: updatedData[0].client_id, plan: updatedData[0].membership_plan, expiryDate: updatedData[0].expiry_date } : m));
    return { data: updatedData, error: null };
  };

  const deleteMembership = async (membershipId) => {
    const membership = memberships.find(m => m.id === membershipId);
    if (!membership) throw new Error('Membership not found');

    const clientId = membership.client_id || membership.customerId;
    const clientName = customers.find(c => c.id === clientId)?.name || membership.client_name || 'Unknown';
    const deletedByUserId = user?.id || null;
    const deletedByUserName = user?.name || user?.email?.split('@')[0] || 'System Admin';
    const deletionTimeIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Log the action (Non-fatal if it fails)
    try {
      await supabase.from('membership_activity_logs').insert({
        membership_id: null, // Keep NULL to prevent ON DELETE CASCADE from deleting this audit log
        client_id: clientId,
        action_type: 'MembershipDeleted',
        action_description: `Deleted Membership ID: ${membershipId} | Member ID: ${clientId} | Member Name: ${clientName} | Deleted By User ID: ${deletedByUserId} | Deleted By User Name: ${deletedByUserName} | Deletion Date & Time (IST): ${deletionTimeIST}`,
        performed_by_user_id: deletedByUserId,
        performed_by_name: deletedByUserName
      });
    } catch (logErr) {
      console.warn('[deleteMembership] Activity log failed:', logErr);
    }

    // Delete ONLY from the membership table (Backend logic)
    const { data: deleteData, error: deleteError } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId)
      .select();

    if (deleteError) {
      console.error('[deleteMembership] Delete failed:', deleteError);
      throw deleteError;
    }

    if (!deleteData || deleteData.length === 0) {
      const errorMsg = `Delete failed: 0 rows affected in database. This is typically caused by Row-Level Security (RLS) policies blocking the delete operation for your account role, or because the record was already deleted. Please verify your permissions in the profiles table.`;
      console.error('[deleteMembership] 0 rows affected:', errorMsg);
      throw new Error(errorMsg);
    }

    // Optimistically update frontend state immediately
    setMemberships(prev => prev.filter(m => m.id !== membershipId));

    // Refresh data from the backend to ensure frontend logic reflects changes
    if (user) {
      await fetchData(user);
    }

    return { success: true };
  };

  const updateMembership = async (membershipId, updates, actionType, actionDescription) => {
    // 1. Update the membership in the database
    const { data: updatedData, error: updateError } = await supabase
      .from('memberships')
      .update(updates)
      .eq('id', membershipId)
      .select();

    if (updateError) throw updateError;

    // 2. Insert into activity logs
    const markerName = user?.name || user?.email?.split('@')[0] || 'System Admin';
    const clientId = updatedData[0]?.client_id;

    if (actionType) {
      await supabase.from('membership_activity_logs').insert([
        {
          membership_id: membershipId,
          client_id: clientId,
          action_type: actionType,
          action_description: actionDescription || `Membership updated`,
          performed_by_user_id: user?.id,
          performed_by_name: markerName
        }
      ]);
    }

    // 3. Update local state
    if (updatedData && updatedData[0]) {
      const mapped = {
        ...updatedData[0],
        customerId: updatedData[0].client_id,
        plan: updatedData[0].membership_plan,
        startDate: updatedData[0].start_date,
        expiryDate: updatedData[0].expiry_date
      };
      setMemberships(prev => prev.map(m => m.id === membershipId ? mapped : m));
    }

    return { data: updatedData, error: null };
  };

  const fetchMembershipActivityLogs = async (membershipId) => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('membership_activity_logs')
        .select('*')
        .eq('membership_id', membershipId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchMembershipActivityLogs failed:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('fetchMembershipActivityLogs error:', err);
      return [];
    }
  };

  const sendWhatsAppAlert = async (clientId, messageType, extraData = {}) => {
    if (!supabase) return;
    const client = customers.find(c => c.id === clientId);
    if (!client || !client.whatsapp_number) {
      console.warn('Client has no WhatsApp number');
      return;
    }

    try {
      await supabase.functions.invoke('whatsapp-notify', {
        body: {
          client_id: client.id,
          whatsapp_number: client.whatsapp_number,
          message_type: messageType,
          client_name: client.name,
          ...extraData
        }
      });
    } catch (error) {
      console.error('Failed to send WhatsApp notification', error);
      // Fallback: log to notification_logs
      try {
        await supabase.from('notification_logs').insert({
          client_id: client.id,
          whatsapp_number: client.whatsapp_number,
          message_type: messageType,
          message_content: JSON.stringify({ client_name: client.name, ...extraData }),
          sent_status: 'failed',
          sent_at: new Date().toISOString()
        });
      } catch (logErr) {
        console.error('Failed to log notification fallback', logErr);
      }
    }
  };

  // Fetch attendance for a specific month (YYYY-MM format)
  const fetchMonthlyAttendance = async (yearMonth) => {
    if (!supabase) return [];
    try {
      const [year, month] = yearMonth.split('-').map(Number);
      const startDate = `${yearMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('attendance')
        .select('*, profiles(name)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('fetchMonthlyAttendance failed:', error);
        return [];
      }
      return (data || []).map(a => ({
        ...a,
        customerId: a.client_id,
        markedBy: a.profiles?.name || a.marked_by_name
      }));
    } catch (err) {
      console.error('fetchMonthlyAttendance error:', err);
      return [];
    }
  };

  // ── Add Closing from Visitor (with duplicate prevention) ───────────────────
  const addClosing = async (visitor, currentUser) => {
    if (!supabase) throw new Error('Supabase not configured');

    // Check for existing closing record for this visitor
    const existing = closingsRef.current.find(c => c.visitor_id === visitor.id);
    if (existing) {
      throw new Error('This visitor has already been added to the Closing section.');
    }

    // Also double-check in the DB to be safe (race condition prevention)
    const { data: dbCheck } = await supabase
      .from('closing')
      .select('id')
      .eq('visitor_id', visitor.id)
      .maybeSingle();
    if (dbCheck) {
      throw new Error('This visitor has already been added to the Closing section.');
    }

    const now = new Date();
    const insertPayload = {
      visitor_id: visitor.id,
      visitor_name: visitor.visitor_name || '',
      contact_number: visitor.mobile_number || '',
      visit_date: visitor.visit_date || getISTDateString(),
      visit_time: visitor.visit_time || getISTTimeString(),
      status: 'Pending',
      selected_type: 'Pending',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by_user_id: currentUser?.id || null,
      created_by_user_name: currentUser?.name || currentUser?.email || 'Admin',
    };

    const { data: closingData, error } = await supabase
      .from('closing')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    const mappedRecord = {
      ...closingData,
      visitorId: closingData.visitor_id,
      markedBy: closingData.created_by_user_name,
    };

    setClosings(prev => [...prev, mappedRecord]);
    return mappedRecord;
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const updateClosing = async (record) => {
    // Record is now visitor-based
    const visitor = visitors.find(v => v.id === record.visitorId);
    const now = new Date();

    const existing = closingsRef.current.find(
      c => c.visitor_id === record.visitorId
    );

    const upsertPayload = {
      visitor_id: record.visitorId,
      status: record.status !== undefined ? record.status : (existing?.status || 'Pending'),
      selected_type: record.selectedType !== undefined ? record.selectedType : (existing?.selected_type || 'Pending'),
      updated_at: now.toISOString()
    };

    const { data: closingData, error: closingErr } = await supabase
      .from('closing')
      .upsert(upsertPayload, { onConflict: 'visitor_id' })
      .select();

    if (closingErr) throw closingErr;

    const mappedRecord = {
      ...closingData[0],
      visitorId: closingData[0].visitor_id,
      markedBy: closingData[0].created_by_user_name
    };

    setClosings(prev => {
      const idx = prev.findIndex(c => c.visitor_id === record.visitorId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...prev[idx], ...mappedRecord };
        return updated;
      }
      return [...prev, mappedRecord];
    });

    return { data: closingData[0] };
  };

  const deleteClosing = async (id) => {
    const { error } = await supabase.from('closing').delete().eq('id', id);
    if (error) throw error;
    setClosings(prev => prev.filter(c => c.id !== id));
  };

  if (!isConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <AppContext.Provider value={{
      user, login, logout, loading: authLoading,
      currentUser, currentRole, session, authLoading, isAuthenticated,
      customers, addCustomer, updateCustomer, deleteCustomer,
      visitors, addVisitor, updateVisitor, deleteVisitor,
      attendance, updateAttendance, logShakePayment, logVisitorShakePayment, setAttendance, fetchMonthlyAttendance, attendanceLocks, finalizeAttendance,
      memberships, addMembership, renewMembership, addNewMember, fetchData, convertVisitorToMember, updateMembership, deleteMembership, fetchMembershipActivityLogs,
      notifications, setNotifications, sendWhatsAppAlert,
      closings, addClosing, updateClosing, deleteClosing,
      dataLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
