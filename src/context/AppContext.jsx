import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured } from '../lib/supabaseClient';
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
  
  useEffect(() => {
    customersRef.current = customers;
    attendanceRef.current = attendance;
    membershipsRef.current = memberships;
    notificationsRef.current = notifications;
  }, [customers, attendance, memberships, notifications]);

  // Initialize realtime subscriptions after auth is resolved
  useRealtime({
    supabase,
    setCustomers,
    setAttendance,
    setMemberships,
    setNotifications,
    customersRef,
    attendanceRef,
    membershipsRef,
    notificationsRef,
  });

  const resolveUserProfile = async (sessionUser) => {
    if (!supabase) return { ...sessionUser, role: 'member', name: sessionUser.email?.split('@')[0] || 'Member' };
    
    // Metadata values used ONLY as fallback (when DB is unreachable/timed out)
    const metaRole = sessionUser.user_metadata?.role || 'member';
    const metaName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Member';
    
    try {
      // Always fetch role from DB — never trust stale JWT metadata for role
      const profilePromise = supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
      
      const { data: profileData, error: profileError } = await Promise.race([profilePromise, timeoutPromise]);

      if (profileError) {
        console.warn('Profile fetch error:', profileError.message);
      }

      if (profileData) {
        // Role always comes from DB — this is the source of truth
        const dbRole = profileData.role || 'member';
        const dbName = profileData.name || metaName;
        console.log(`[Auth] Role resolved from DB: ${dbRole} for ${sessionUser.email}`);
        return { ...sessionUser, role: dbRole, name: dbName };
      }

      // No profile found — create one using signup metadata role
      console.log(`[Auth] No profile found for ${sessionUser.email}. Creating with role: ${metaRole}`);
      await supabase.from('profiles').upsert(
        [{ id: sessionUser.id, name: metaName, role: metaRole }],
        { onConflict: 'id' }
      );
      return { ...sessionUser, role: metaRole, name: metaName };
    } catch (err) {
      // DB unreachable — fall back to metadata role (only on timeout)
      console.warn('[Auth] Profile fetch timed out, using metadata role as fallback:', err.message);
      return { ...sessionUser, role: metaRole, name: metaName };
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
          const resolvedUser = await resolveUserProfile(session.user);
          setUser(resolvedUser);
          fetchData(resolvedUser);
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
      const { data: clientData } = await supabase.from('clients').select('*');
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
        return;
      }

      const { data: memData } = await supabase.from('memberships').select('*').order('created_at', { ascending: false });
      if (memData) setMemberships(memData.map(m => ({ 
        ...m, 
        customerId: m.client_id, 
        plan: m.membership_plan, 
        startDate: m.start_date,
        expiryDate: m.expiry_date 
      })));
      
      const { data: attData } = await supabase
        .from('attendance')
        .select('*, profiles(name)')
        .eq('date', today);
      if (attData) setAttendance(attData.map(a => ({ 
        ...a, 
        customerId: a.client_id, 
        markedBy: a.profiles?.name 
      })));

      const { data: noteData } = await supabase
         .from('notification_logs')
         .select('*, clients(name)')
         .order('sent_at', { ascending: false })
         .limit(10);
      if (noteData) setNotifications(noteData);
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
      joining_date: customerData.joining_date || new Date().toISOString().split('T')[0],
      purpose: customerData.purpose || null,
      member_type: customerData.member_type || null,
      referred_by: customerData.referred_by || null,
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

    // Insert attendance record for today (default Absent)
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('attendance').insert([
      {
        client_id: data[0].id,
        date: today,
        status: 'Absent',
        user_id: user?.id
      }
    ]);

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
    
    // Refresh attendance
    const { data: attData } = await supabase.from('attendance').select('*').eq('date', today).eq('client_id', data[0].id);
    if (attData && attData.length) {
      setAttendance(prev => [...prev, ...attData.map(a => ({ ...a, customerId: a.client_id }))]);
    }

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
    const { data, error } = await supabase
      .from('attendance')
      .upsert({ 
        client_id: record.customerId, 
        date: record.date, 
        status: record.status,
        user_id: user?.id
      }, { onConflict: 'client_id, date' })
      .select();

    if (error) {
      console.error("updateAttendance failed:", error);
      throw error;
    }

    const updatedRecord = { ...data[0], customerId: data[0].client_id };
    const existingIndex = attendance.findIndex(a => a.customerId === updatedRecord.customerId && a.date === updatedRecord.date);
    if (existingIndex >= 0) {
      const newAttendance = [...attendance];
      newAttendance[existingIndex] = updatedRecord;
      setAttendance(newAttendance);
    } else {
      setAttendance([...attendance, updatedRecord]);
    }
  };

  const addMembership = async (membershipData) => {
    const { data, error } = await supabase
      .from('memberships')
      .insert([{ 
        client_id: membershipData.customerId, 
        membership_plan: membershipData.plan, 
        duration_days: membershipData.durationDays || 30, 
        amount: membershipData.amount, 
        start_date: membershipData.startDate, 
        expiry_date: membershipData.expiryDate || new Date(Date.now() + (membershipData.durationDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Active', 
        payment_status: 'Paid', 
        renewal_status: 'Upcoming Renewal' 
      }])
      .select();

    if (!error) {
      setMemberships(prev => [data[0], ...prev]);
      // Trigger WhatsApp for new membership
      await sendWhatsAppAlert(data[0].client_id, 'MembershipCreated', { plan: data[0].membership_plan });
    }
    return { data, error };
  };

  const addNewMember = async (data) => {
    console.log("addNewMember entered with data:", data);

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
      joining_date: data.joining_date,
      purpose: data.purpose || null,
      member_type: data.member_type,
      referred_by: data.referred_by || null,

      // Legacy fields
      name: data.full_name,
      contact: data.mobile_number,
      status: 'Active',
      created_by: user?.id
    };
    
    const { data: clientData, error: clientError } = await supabase.from('clients').insert([insertPayload]).select();

    if (clientError) {
      console.error("addNewMember failed:", clientError);
      throw clientError;
    }

    // Insert attendance record for today (default Absent)
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('attendance').insert([
      {
        client_id: clientData[0].id,
        date: today,
        status: 'Absent',
        user_id: user?.id
      }
    ]);

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
    const amount = planMap[data.plan] || 0;
    const duration = durationMap[data.plan] || 30;
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + duration);
    const { data: memData, error: memError } = await supabase.from('memberships').insert([
      {
        client_id: clientData[0].id,
        membership_plan: data.plan,
        duration_days: duration,
        amount: amount,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'Active',
        payment_status: 'Paid',
        renewal_status: 'New'
      }
    ]).select();

    if (memError) throw memError;

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
    
    // Refresh attendance
    const { data: attData } = await supabase.from('attendance').select('*').eq('date', today).eq('client_id', clientData[0].id);
    if (attData && attData.length) {
      setAttendance(prev => [...prev, ...attData.map(a => ({ ...a, customerId: a.client_id }))]);
    }
    
    // Trigger Welcome WhatsApp via Edge Function
    await sendWhatsAppAlert(clientData[0].id, 'Welcome', { plan: memData[0].membership_plan });

    return { client: parsedClient, membership: memData[0] };
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

  if (!isConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <AppContext.Provider value={{
      user, login, logout, loading: authLoading,
      currentUser, currentRole, session, authLoading, isAuthenticated,
      customers, addCustomer, updateCustomer, deleteCustomer, 
      attendance, updateAttendance, setAttendance,
      memberships, addMembership, renewMembership, addNewMember, fetchData,
      notifications, setNotifications, sendWhatsAppAlert,
      dataLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
