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

  useEffect(() => {
    customersRef.current = customers;
    attendanceRef.current = attendance;
    membershipsRef.current = memberships;
    notificationsRef.current = notifications;
    attendanceLocksRef.current = attendanceLocks;
    visitorsRef.current = visitors;
  }, [customers, attendance, memberships, notifications, attendanceLocks, visitors]);

  // Initialize realtime subscriptions after auth is resolved
  useRealtime({
    supabase,
    setCustomers,
    setAttendance,
    setMemberships,
    setNotifications,
    setAttendanceLocks,
    setVisitors,
    customersRef,
    attendanceRef,
    membershipsRef,
    notificationsRef,
    attendanceLocksRef,
    visitorsRef,
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
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + 30);
    const { data: memData } = await supabase.from('memberships').insert([
      {
        client_id: data[0].id,
        membership_plan: 'Monthly Flow',
        duration_days: 30,
        amount: 15000,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'Active',
        payment_status: 'Paid',
        renewal_status: 'New'
      }
    ]).select();

    const parsedClient = { ...data[0] };

    // Update state optimistically
    setCustomers(prev => [parsedClient, ...prev]);

    // Refresh memberships
    if (memData && memData.length) {
      const mappedMem = {
        ...memData[0],
        customerId: memData[0].client_id,
        plan: memData[0].membership_plan,
        startDate: memData[0].start_date,
        expiryDate: memData[0].expiry_date
      };
      setMemberships(prev => [mappedMem, ...prev.filter(m => m.id !== `PENDING-${data[0].id}`)]);
    }

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
    const markerName = user?.name || user?.email?.split('@')[0] || 'Coach';
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('attendance')
      .upsert({ 
        client_id: record.customerId, 
        date: record.date, 
        status: record.status,
        user_id: user?.id || null,
        marked_by_name: markerName,
        client_name: clientName,
        source: 'Manual',
        updated_at: now
      }, { onConflict: 'client_id, date' })
      .select();

    if (error) {
      if (error.message?.includes('ATTENDANCE_LOCKED')) {
        throw new Error('Attendance for this date has been finalized and cannot be modified.');
      }
      console.error("updateAttendance failed:", error);
      throw error;
    }

    const updatedRecord = { 
      ...data[0], 
      customerId: data[0].client_id, 
      markedBy: markerName,
      source: data[0].source || 'Manual'
    };
    const existingIndex = attendance.findIndex(a => a.customerId === updatedRecord.customerId && a.date === updatedRecord.date);
    if (existingIndex >= 0) {
      const newAttendance = [...attendance];
      newAttendance[existingIndex] = updatedRecord;
      setAttendance(newAttendance);
    } else {
      setAttendance([...attendance, updatedRecord]);
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
    const { data, error } = await supabase
      .from('memberships')
      .insert([{
        client_id: membershipData.customerId,
        client_name: clientName,
        membership_plan: membershipData.plan,
        duration_days: membershipData.durationDays || 30,
        amount: membershipData.amount,
        start_date: membershipData.startDate,
        expiry_date: membershipData.expiryDate || new Date(Date.now() + (membershipData.durationDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Active',
        payment_status: 'Paid',
        renewal_status: 'New',
        created_by_user_id: user?.id,
        created_by_name: markerName
      }])
      .select();

    if (!error && data && data.length > 0) {
      const normalized = {
        ...data[0],
        customerId: data[0].client_id,
        plan: data[0].membership_plan,
        startDate: data[0].start_date,
        expiryDate: data[0].expiry_date
      };
      setMemberships(prev => [normalized, ...prev]);
      // Also update the client's status to Active
      setCustomers(prev => prev.map(c => c.id === data[0].client_id ? { ...c, status: 'Active' } : c));
      // Trigger WhatsApp for new membership
      await sendWhatsAppAlert(data[0].client_id, 'MembershipCreated', { plan: data[0].membership_plan });
    } else if (error) {
       console.error("addMembership error:", error);
       throw error;
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
      'Monthly Flow': 15000,
      'Quarterly Balance': 40000,
      'Annual Harmony': 150000
    };
    const durationMap = {
      'Monthly Flow': 30,
      'Quarterly Balance': 90,
      'Annual Harmony': 365
    };
    
    // Auto-calculate payment details
    const totalAmount = data.total_amount ? parseFloat(data.total_amount) : (planMap[data.plan] || 0);
    const advanceAmount = data.advance_amount ? parseFloat(data.advance_amount) : totalAmount;
    const remainingAmount = Math.max(0, (totalAmount || 0) - (advanceAmount || 0));
    
    let paymentStatusDetail = 'Pending';
    if (remainingAmount === 0) {
      paymentStatusDetail = 'Fully Paid';
    } else if (remainingAmount > 0 && advanceAmount > 0) {
      paymentStatusDetail = 'Partially Paid';
    }
    
    const duration = durationMap[data.plan] || 30;
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
      payment_status: paymentStatusDetail === 'Pending' ? 'Pending' : 'Paid',
      renewal_status: 'New',
      created_by_user_id: user?.id || null,
      created_by_name: creatorName
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
      status: membershipData ? 'Active' : 'Afresh',
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

  const renewMembership = async (membershipId, durationDays) => {
    const membership = memberships.find(m => m.id === membershipId);
    if (!membership) throw new Error('Membership not found');

    const prevExpiry = new Date(membership.expiryDate || membership.expiry_date || Date.now());
    const newExpiry = new Date(membership.status === 'Pending' ? Date.now() : prevExpiry);
    newExpiry.setDate(newExpiry.getDate() + parseInt(durationDays));

    if (membershipId.startsWith('PENDING-')) {
      const planMap = {
        30: { plan: 'Monthly Flow', amount: 15000 },
        90: { plan: 'Quarterly Balance', amount: 40000 },
        180: { plan: 'Half-Yearly', amount: 80000 },
        365: { plan: 'Annual Harmony', amount: 150000 }
      };
      const pDetails = planMap[durationDays] || { plan: 'Custom Plan', amount: 0 };

      const { data: insertedData, error: insertError } = await supabase
        .from('memberships')
        .insert([{
          client_id: membership.client_id,
          membership_plan: pDetails.plan,
          duration_days: parseInt(durationDays),
          amount: pDetails.amount,
          start_date: new Date().toISOString().split('T')[0],
          expiry_date: newExpiry.toISOString().split('T')[0],
          status: 'Active',
          payment_status: 'Paid',
          renewal_status: 'New'
        }])
        .select();

      if (insertError) throw insertError;

      await supabase.from('renewal_logs').insert({
        client_id: membership.client_id,
        membership_id: insertedData[0].id,
        previous_expiry_date: new Date().toISOString().split('T')[0],
        new_expiry_date: newExpiry.toISOString().split('T')[0],
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
            expiry_date: newExpiry.toISOString().split('T')[0]
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
        expiry_date: newExpiry.toISOString().split('T')[0],
        status: 'Active',
        renewal_status: 'Renewed'
      })
      .eq('id', membershipId)
      .select();

    if (updateError) throw updateError;

    await supabase.from('renewal_logs').insert({
      client_id: membership.client_id,
      membership_id: membershipId,
      previous_expiry_date: membership.expiryDate,
      new_expiry_date: newExpiry.toISOString().split('T')[0],
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
          new_expiry_date: newExpiry.toISOString().split('T')[0]
        }
      });
    }

    setMemberships(memberships.map(m => m.id === membershipId ? { ...updatedData[0], customerId: updatedData[0].client_id, plan: updatedData[0].membership_plan, expiryDate: updatedData[0].expiry_date } : m));
    return { data: updatedData, error: null };
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

  if (!isConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <AppContext.Provider value={{
      user, login, logout, loading: authLoading,
      currentUser, currentRole, session, authLoading, isAuthenticated,
      customers, addCustomer, updateCustomer, deleteCustomer,
      visitors, addVisitor, updateVisitor, deleteVisitor,
      attendance, updateAttendance, setAttendance, fetchMonthlyAttendance, attendanceLocks, finalizeAttendance,
      memberships, addMembership, renewMembership, addNewMember, fetchData, convertVisitorToMember, updateMembership, fetchMembershipActivityLogs,
      notifications, setNotifications, sendWhatsAppAlert,
      dataLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
