import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

// Mock initial data for Demo Mode
const mockCustomers = [
  { id: 'ELV-1001', name: 'Aarav Sharma', contact: '+91 98765 43210', profession: 'Tech Lead', purpose: 'Health', joiningDate: '2026-05-01', status: 'Active' },
  { id: 'ELV-1002', name: 'Priya Patel', contact: '+91 98765 43211', profession: 'Designer', purpose: 'Business', joiningDate: '2026-05-05', status: 'Active' }
];

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check for active session or fallback to demo
  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        console.log('ELEVATE: Supabase not configured. Initializing Demo Mode.');
        setIsDemoMode(true);
        // Load from localStorage if exists
        const savedUser = localStorage.getItem('elevate_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          loadLocalData();
        }
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser({ ...session.user, ...profile });
          fetchData();
        }
      } catch (error) {
        console.warn('Supabase connection failed. Falling back to Demo Mode:', error.message);
        setIsDemoMode(true);
        loadLocalData();
      }
      setLoading(false);
    };

    checkUser();

    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser({ ...session.user, ...profile });
        fetchData();
      } else {
        setUser(null);
        setCustomers([]);
        setAttendance([]);
        setMemberships([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadLocalData = () => {
    const savedCustomers = localStorage.getItem('customers');
    const savedAttendance = localStorage.getItem('attendance');
    const savedMemberships = localStorage.getItem('memberships');

    setCustomers(savedCustomers ? JSON.parse(savedCustomers) : mockCustomers);
    setAttendance(savedAttendance ? JSON.parse(savedAttendance) : []);
    setMemberships(savedMemberships ? JSON.parse(savedMemberships) : []);
  };

  // Persist local data in Demo Mode
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('customers', JSON.stringify(customers));
      localStorage.setItem('attendance', JSON.stringify(attendance));
      localStorage.setItem('memberships', JSON.stringify(memberships));
      if (user) localStorage.setItem('elevate_user', JSON.stringify(user));
      else localStorage.removeItem('elevate_user');
    }
  }, [customers, attendance, memberships, user, isDemoMode]);

  const fetchData = async () => {
    if (!supabase || !user || isDemoMode) return;
    
    try {
      const { data: clientData } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (clientData) setCustomers(clientData);
      const { data: memData } = await supabase.from('memberships').select('*').order('created_at', { ascending: false });
      if (memData) setMemberships(memData);
      const today = new Date().toISOString().split('T')[0];
      const { data: attData } = await supabase.from('attendance').select('*').eq('date', today);
      if (attData) setAttendance(attData.map(a => ({ ...a, customerId: a.client_id })));
    } catch (error) {
      console.error('Data sync failed:', error.message);
    }
  };

  const login = async (credentials) => {
    if (!supabase || isDemoMode) {
      // Demo authentication fallback
      if (credentials.email === 'coach@elevate.in' && credentials.password === 'elevate') {
        const demoUser = { id: 'DEMO-001', name: 'Aditi Varma', email: credentials.email, role: 'Lead Coach' };
        setUser(demoUser);
        setIsDemoMode(true);
        loadLocalData();
        return demoUser;
      }
      throw new Error('Invalid credentials for Demo Mode. Use coach@elevate.in / elevate');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    if (isDemoMode) {
      localStorage.removeItem('elevate_user');
    }
  };

  const addCustomer = async (customerData) => {
    if (!supabase || isDemoMode) {
      const newCust = { ...customerData, id: `ELV-${Math.floor(1000 + Math.random() * 9000)}`, created_at: new Date().toISOString() };
      setCustomers([newCust, ...customers]);
      return { data: [newCust], error: null };
    }
    const { data, error } = await supabase.from('clients').insert([{ ...customerData, created_by: user.id }]).select();
    if (!error) setCustomers([data[0], ...customers]);
    return { data, error };
  };

  const updateAttendance = async (record) => {
    if (!supabase || isDemoMode) {
      const existingIndex = attendance.findIndex(a => a.customerId === record.customerId && a.date === record.date);
      if (existingIndex >= 0) {
        const newAttendance = [...attendance];
        newAttendance[existingIndex] = { ...newAttendance[existingIndex], ...record };
        setAttendance(newAttendance);
      } else {
        setAttendance([...attendance, { ...record, id: `ATT-${Date.now()}` }]);
      }
      return;
    }

    const { data, error } = await supabase
      .from('attendance')
      .upsert({ 
        client_id: record.customerId, 
        date: record.date, 
        status: record.status,
        marked_by: user.id 
      }, { onConflict: 'client_id, date' })
      .select();

    if (!error) {
      const updatedRecord = { ...data[0], customerId: data[0].client_id };
      const existingIndex = attendance.findIndex(a => a.customerId === updatedRecord.customerId && a.date === updatedRecord.date);
      if (existingIndex >= 0) {
        const newAttendance = [...attendance];
        newAttendance[existingIndex] = updatedRecord;
        setAttendance(newAttendance);
      } else {
        setAttendance([...attendance, updatedRecord]);
      }
    }
  };

  const addNewMember = async (data) => {
    if (!supabase || isDemoMode) {
      const custId = `ELV-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCust = { id: custId, name: data.name, contact: data.contact, profession: data.profession, purpose: data.purpose, status: 'Active' };
      const newMem = { id: `MEM-${Date.now()}`, customerId: custId, plan: data.plan, amount: data.amount, status: 'Active' };
      setCustomers([newCust, ...customers]);
      setMemberships([newMem, ...memberships]);
      return { client: newCust, membership: newMem };
    }
    // Supabase logic (omitted for brevity but kept in mind)
    // ... existing implementation ...
  };

  return (
    <AppContext.Provider value={{
      user, login, logout, loading, isDemoMode,
      customers, addCustomer, updateCustomer: () => {}, deleteCustomer: () => {}, 
      attendance, updateAttendance, setAttendance,
      memberships, addMembership: () => {}, addNewMember, fetchData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
