/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Shipment, ActivityLog, User, UserRole, RegisteredUser } from '../types';
import { initialShipments, initialActivityLogs } from '../data';

interface AppContextType {
  shipments: Shipment[];
  activityLogs: ActivityLog[];
  currentRole: UserRole;
  currentUser: User;
  darkMode: boolean;
  selectedView: 'dashboard' | 'shipments' | 'costing' | 'revenue' | 'reports';
  isAuthenticated: boolean;
  registeredUsers: RegisteredUser[];
  companyLogo: string | null;
  setShipments: React.Dispatch<React.SetStateAction<Shipment[]>>;
  setSelectedView: (view: 'dashboard' | 'shipments' | 'costing' | 'revenue' | 'reports') => void;
  addShipment: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateShipment: (shipment: Shipment) => void;
  deleteShipment: (id: string) => void;
  approveShipment: (id: string) => void;
  switchRole: (role: UserRole) => void;
  toggleDarkMode: () => void;
  addLog: (action: string, shipmentId: string, jobNo: string) => void;
  login: (emailOrRole: string, password?: string) => boolean;
  logout: () => void;
  resetPassword: (role: UserRole, newPw: string) => void;
  registerUser: (email: string, fullName: string, role: UserRole, password?: string) => void;
  updateUser: (id: string, email: string, fullName: string, role: UserRole, password?: string) => void;
  deleteUser: (id: string) => void;
  updateCompanyLogo: (logo: string | null) => void;
  wipeAllShipments: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Local storage keys (v2 to load English datasets immediately)
  const STORAGE_KEY_SHIPMENTS = 'bsl_shipments_v2';
  const STORAGE_KEY_LOGS = 'bsl_logs_v2';
  const STORAGE_KEY_ROLE = 'bsl_role_v2';
  const STORAGE_KEY_DARK = 'bsl_dark_v2';
  const STORAGE_KEY_AUTH = 'bsl_auth_v2';

  // State initialization with localStorage fallback
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
    const parsed: Shipment[] = stored ? JSON.parse(stored) : initialShipments;
    
    const getDefaultChecklistForStatus = (status: string) => {
      const list = [
        'Draft', 
        'Document Checking', 
        'Submit PIB', 
        'Billing Issued', 
        'Paid Pending SPPB', 
        'Red Channel / Behandle', 
        'SPPB Issued', 
        'Gate Out / Delivery', 
        'Completed'
      ];
      const sIndex = list.indexOf(status);
      return {
        billOfLading: sIndex >= 1,
        invoicePackingList: sIndex >= 1,
        pibDeclaration: sIndex >= 2,
        customsTaxPaid: sIndex >= 4,
        doReleased: sIndex >= 6,
        sppbReleased: sIndex >= 6,
      };
    };

    const getPrepopulatedContainerNo = (index: number): string => {
      const prefixes = ['MSKU', 'HLXU', 'OCGU', 'TGBU', 'ONEU', 'EGLU'];
      const basePrefix = prefixes[index % prefixes.length];
      const numPart = (983751 + index * 12347) % 10000000;
      return `${basePrefix}${String(numPart).padStart(7, '0')}`;
    };

    const getPrepopulatedTargetCompletion = (eta: string): string => {
      if (!eta) return '2026-05-30';
      try {
        const d = new Date(eta);
        d.setDate(d.getDate() + 5);
        return d.toISOString().split('T')[0];
      } catch (err) {
        return '2026-05-30';
      }
    };

    return parsed.map((s, index) => {
      const containerNumber = s.containerNumber || getPrepopulatedContainerNo(index);
      const targetCompletionDate = s.targetCompletionDate || getPrepopulatedTargetCompletion(s.eta);
      const documentChecklist = s.documentChecklist || getDefaultChecklistForStatus(s.status);
      const attachments = s.attachments || [];
      return {
        ...s,
        containerNumber,
        targetCompletionDate,
        documentChecklist,
        attachments
      };
    });
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_LOGS);
    return stored ? JSON.parse(stored) : initialActivityLogs;
  });

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    const stored = localStorage.getItem('bsl_registered_users_v2');
    if (stored) return JSON.parse(stored);
    return [
      { id: 'usr-1', email: 'director@bsl.co.id', fullName: 'Director Imron Syahputra', role: 'Director', password: 'director123', createdAt: '2026-05-27' },
      { id: 'usr-2', email: 'staff.ops@bsl.co.id', fullName: 'Robby Hermawan (Ops)', role: 'Staff', password: 'staff123', createdAt: '2026-05-27' },
      { id: 'usr-3', email: 'president@bsl.co.id', fullName: 'President Admiral Harry', role: 'President Director', password: 'president123', createdAt: '2026-05-27' },
      { id: 'usr-4', email: 'ops.dir@bsl.co.id', fullName: 'Director H. Subandono', role: 'Director of Operation', password: 'opsdirector123', createdAt: '2026-05-27' },
      { id: 'usr-5', email: 'fin.dir@bsl.co.id', fullName: 'Director Sri Mulyani Indrawati', role: 'Director of Finance', password: 'findirector123', createdAt: '2026-05-27' },
      { id: 'usr-6', email: 'finance.staff@bsl.co.id', fullName: 'Amelia Putri (Finance)', role: 'Finance Staff', password: 'finance123', createdAt: '2026-05-27' },
      { id: 'usr-7', email: 'operation.staff@bsl.co.id', fullName: 'Robby Hermawan (Ops Team)', role: 'Operation Staff', password: 'operation123', createdAt: '2026-05-27' }
    ];
  });

  const [companyLogo, setCompanyLogo] = useState<string | null>(() => {
    return localStorage.getItem('bsl_company_logo_v2');
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_ROLE);
    return (stored as UserRole) || 'Director';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DARK);
    return stored === 'true';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_AUTH);
    return stored === 'true';
  });

  const [selectedView, setSelectedView] = useState<'dashboard' | 'shipments' | 'costing' | 'revenue' | 'reports'>('dashboard');

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedRole = localStorage.getItem(STORAGE_KEY_ROLE) as UserRole || 'Director';
    const loggedInEmail = localStorage.getItem('bsl_logged_in_email');
    if (loggedInEmail) {
      const stored = localStorage.getItem('bsl_registered_users_v2');
      const users: RegisteredUser[] = stored ? JSON.parse(stored) : [];
      const found = users.find(u => u.email.toLowerCase() === loggedInEmail.toLowerCase());
      if (found) {
        return {
          username: found.email.split('@')[0],
          role: found.role,
          fullName: found.fullName
        };
      }
    }
    const defaultUsersMap: Record<UserRole, { username: string; fullName: string }> = {
      'President Director': { username: 'president_admiral', fullName: 'President Admiral Harry' },
      'Director of Operation': { username: 'ops_director', fullName: 'Director H. Subandono' },
      'Director of Finance': { username: 'fin_director', fullName: 'Director Sri Mulyani Indrawati' },
      'Finance Staff': { username: 'finance_amelia', fullName: 'Amelia Putri (Finance Staff)' },
      'Operation Staff': { username: 'operation_robby', fullName: 'Robby Hermawan (Ops Staff)' },
      'Director': { username: 'Director_Imron', fullName: 'Director Imron Syahputra' },
      'Staff': { username: 'Robby_Ops', fullName: 'Robby Hermawan (Ops)' }
    };
    const defaultUser = defaultUsersMap[savedRole] || defaultUsersMap['Director'];
    return {
      username: defaultUser.username,
      role: savedRole,
      fullName: defaultUser.fullName
    };
  });

  const currentVersionRef = useRef<number>(0);

  const fetchServerState = async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Failed to fetch state');
      const data = await res.json();
      
      // Client-side dynamic deduplication by Job Number (keeping the latest update)
      const rawShipments: Shipment[] = data.shipments || [];
      const cleanShipments: Shipment[] = [];
      const seenJobNos = new Set<string>();

      // Sort with newest updatedAt/createdAt first to keep most recent
      const sortedIncoming = [...rawShipments].sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt || '';
        const dateB = b.updatedAt || b.createdAt || '';
        return dateB.localeCompare(dateA);
      });

      for (const s of sortedIncoming) {
        const normJob = (s.jobNo || '').trim().toUpperCase();
        if (!normJob) {
          cleanShipments.push(s);
          continue;
        }
        if (!seenJobNos.has(normJob)) {
          seenJobNos.add(normJob);
          cleanShipments.push(s);
        }
      }

      // Restore descending display order by ID
      cleanShipments.sort((a, b) => b.id.localeCompare(a.id));
      
      setShipments(cleanShipments);
      setActivityLogs(data.activityLogs);
      setRegisteredUsers(data.registeredUsers);
      setCompanyLogo(data.companyLogo);
      if (data.companyLogo) {
        localStorage.setItem('bsl_company_logo_v2', data.companyLogo);
        window.dispatchEvent(new Event('company-logo-updated'));
      } else {
        localStorage.removeItem('bsl_company_logo_v2');
      }
      currentVersionRef.current = data.version;
    } catch (err) {
      console.warn('Real-time sync error (offline/fallback mode):', err);
    }
  };

  useEffect(() => {
    fetchServerState();

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/version');
        if (!res.ok) return;
        const data = await res.json();
        if (data.version && data.version !== currentVersionRef.current) {
          await fetchServerState();
        }
      } catch (err) {
        // Network offline/reconnecting
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
    localStorage.setItem('bsl_registered_users_v2', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLE, currentRole);
    const loggedInEmail = localStorage.getItem('bsl_logged_in_email');
    if (loggedInEmail) {
      const found = registeredUsers.find(u => u.email.toLowerCase() === loggedInEmail.toLowerCase());
      if (found) {
        setCurrentUser({
          username: found.email.split('@')[0],
          role: found.role,
          fullName: found.fullName
        });
        return;
      }
    }
    const defaultUsersMap: Record<UserRole, { username: string; fullName: string }> = {
      'President Director': { username: 'president_admiral', fullName: 'President Admiral Harry' },
      'Director of Operation': { username: 'ops_director', fullName: 'Director H. Subandono' },
      'Director of Finance': { username: 'fin_director', fullName: 'Director Sri Mulyani Indrawati' },
      'Finance Staff': { username: 'finance_amelia', fullName: 'Amelia Putri (Finance Staff)' },
      'Operation Staff': { username: 'operation_robby', fullName: 'Robby Hermawan (Ops Staff)' },
      'Director': { username: 'Director_Imron', fullName: 'Director Imron Syahputra' },
      'Staff': { username: 'Robby_Ops', fullName: 'Robby Hermawan (Ops)' }
    };
    const defaultUser = defaultUsersMap[currentRole] || defaultUsersMap['Director'];
    setCurrentUser({
      username: defaultUser.username,
      role: currentRole,
      fullName: defaultUser.fullName
    });
  }, [currentRole, registeredUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DARK, String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Actions
  const addLog = async (action: string, shipmentId: string, jobNo: string) => {
    const newLog: ActivityLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      shipmentId,
      jobNo,
      username: currentUser.username,
      role: currentUser.role,
      action,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      if (res.ok) {
        const data = await res.json();
        currentVersionRef.current = data.version;
      }
    } catch (err) {
      console.error('Error posting log context', err);
    }
  };

  const addShipment = async (shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Find maximum numeric sequence to calculate the next ID without collision (e.g. BSL-2026-0004)
    let maxSeq = 0;
    for (const s of shipments) {
      if (s.id && s.id.startsWith('BSL-2026-')) {
        const numPart = parseInt(s.id.replace('BSL-2026-', ''), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
    const nextSeq = maxSeq + 1;
    const newId = `BSL-2026-${nextSeq.toString().padStart(4, '0')}`;
    
    const newShipment: Shipment = {
      customsLane: 'GREEN LANE',
      ...shipmentData,
      id: newId,
      createdAt: today,
      updatedAt: today
    };

    setShipments(prev => [newShipment, ...prev]);
    addLog(`Created new shipment [${newId}] - Client: ${newShipment.customerName}`, newId, newShipment.jobNo);

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShipment)
      });
      if (res.ok) {
        const data = await res.json();
        currentVersionRef.current = data.version;
        if (data.shipment) {
          // Replace optimistic shipment with server-confirmed shipment with correct ID
          setShipments(prev => prev.map(s => s.id === newId ? data.shipment : s));
        }
      }
    } catch (err) {
      console.error('Error adding shipment to server', err);
    }
  };

  const updateShipment = async (updatedShipment: Shipment) => {
    const today = new Date().toISOString().split('T')[0];
    const shipmentToUpdate = {
      ...updatedShipment,
      updatedAt: today
    };

    setShipments(prev => prev.map(item => item.id === updatedShipment.id ? shipmentToUpdate : item));
    addLog(`Updated shipment [${updatedShipment.id}] - Customs Status: ${updatedShipment.status}`, updatedShipment.id, updatedShipment.jobNo);

    try {
      const res = await fetch(`/api/shipments/${updatedShipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentToUpdate)
      });
      if (res.ok) {
        const data = await res.json();
        currentVersionRef.current = data.version;
      }
    } catch (err) {
      console.error('Error updating shipment server-side', err);
    }
  };

  const deleteShipment = async (id: string) => {
    const shipment = shipments.find(item => item.id === id);
    if (shipment) {
      setShipments(prev => prev.filter(item => item.id !== id));
      addLog(`Deleted shipment [${id}] - Client: ${shipment.customerName}`, id, shipment.jobNo);

      try {
        const res = await fetch(`/api/shipments/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const data = await res.json();
          currentVersionRef.current = data.version;
        }
      } catch (err) {
        console.error('Error deleting shipment server-side', err);
      }
    }
  };

  const wipeAllShipments = async (): Promise<boolean> => {
    setShipments([]);
    try {
      const res = await fetch('/api/state/wipe-shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            username: currentUser.username,
            role: currentUser.role
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        currentVersionRef.current = data.version;
        await fetchServerState();
        return true;
      }
    } catch (err) {
      console.error('Error wiping shipments server-side', err);
    }
    return false;
  };

  const approveShipment = async (id: string) => {
    setShipments(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isApproved: true, cashFlowStatus: 'Funded (Active)' };
      }
      return item;
    }));
    const shipment = shipments.find(item => item.id === id);
    if (shipment) {
      addLog(`Approved operational funding for shipment [${id}]`, id, shipment.jobNo);
    }

    try {
      const res = await fetch(`/api/shipments/${id}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        currentVersionRef.current = data.version;
      }
    } catch (err) {
      console.error('Error approving shipment budgets', err);
    }
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem('bsl_logged_in_email');
  };

  const login = (emailOrRole: string, password?: string): boolean => {
    let matchedUser: RegisteredUser | undefined = undefined;
    const safePw = password || '';

    // Check if it's the old role-based login
    if (emailOrRole === 'Director') {
      const customDirectorPw = localStorage.getItem('bsl_director_pw') || 'director123';
      if (safePw === customDirectorPw || safePw === 'admin') {
        matchedUser = registeredUsers.find(u => u.role === 'Director');
      }
    } else if (emailOrRole === 'Staff') {
      const customStaffPw = localStorage.getItem('bsl_staff_pw') || 'staff123';
      if (safePw === customStaffPw || safePw === 'staff') {
        matchedUser = registeredUsers.find(u => u.role === 'Staff');
      }
    } else {
      // Find by email (case-insensitive) & password
      matchedUser = registeredUsers.find(
        u => u.email.toLowerCase() === emailOrRole.trim().toLowerCase() && u.password === safePw
      );
    }

    if (matchedUser) {
      setCurrentRole(matchedUser.role);
      setIsAuthenticated(true);
      setCurrentUser({
        username: matchedUser.email.split('@')[0],
        role: matchedUser.role,
        fullName: matchedUser.fullName
      });

      localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      localStorage.setItem(STORAGE_KEY_ROLE, matchedUser.role);
      localStorage.setItem('bsl_logged_in_email', matchedUser.email);
      addLog(`User logged in: ${matchedUser.fullName} (${matchedUser.role})`, 'SYSTEM', 'AUTH');
      return true;
    }
    return false;
  };

  const resetPassword = async (role: UserRole, newPw: string) => {
    if (role === 'Director') {
      localStorage.setItem('bsl_director_pw', newPw);
    } else {
      localStorage.setItem('bsl_staff_pw', newPw);
    }

    let updatedObj: RegisteredUser | undefined = undefined;
    // Also update in registeredUsers
    setRegisteredUsers(prev => prev.map(u => {
      if (u.role === role) {
        updatedObj = { ...u, password: newPw };
        return updatedObj;
      }
      return u;
    }));

    addLog(`Changed security credentials for ${role}`, 'SYSTEM', 'SECURITY');

    if (updatedObj) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedObj)
        });
        if (res.ok) {
          const data = await res.json();
          currentVersionRef.current = data.version;
        }
      } catch (err) {
        console.error('Error resetting credentials server-side', err);
      }
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem('bsl_logged_in_email');
    setSelectedView('dashboard');
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const registerUser = async (email: string, fullName: string, role: UserRole, password?: string) => {
    const newUser: RegisteredUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      email: email.trim(),
      fullName: fullName.trim(),
      role,
      password: password || 'user123',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setRegisteredUsers(prev => [...prev, newUser]);
    addLog(`Registered new user access: ${fullName} (${role})`, 'SYSTEM', 'ACCESS');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const data = await res.json();
        currentVersionRef.current = data.version;
      }
    } catch (err) {
      console.error('Error registering user server-side', err);
    }
  };

  const deleteUser = async (id: string) => {
    const user = registeredUsers.find(u => u.id === id);
    if (user) {
      setRegisteredUsers(prev => prev.filter(u => u.id !== id));
      addLog(`Removed user access: ${user.fullName} (${user.role})`, 'SYSTEM', 'ACCESS');

      try {
        const res = await fetch(`/api/users/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const data = await res.json();
          currentVersionRef.current = data.version;
        }
      } catch (err) {
        console.error('Error deleting user server-side', err);
      }
    }
  };

  const updateUser = async (id: string, email: string, fullName: string, role: UserRole, password?: string) => {
    let updatedObj: RegisteredUser | undefined = undefined;
    setRegisteredUsers(prev => prev.map(u => {
      if (u.id === id) {
        updatedObj = {
          ...u,
          email: email.trim(),
          fullName: fullName.trim(),
          role,
          password: password || u.password
        };
        return updatedObj;
      }
      return u;
    }));
    addLog(`Updated corporate staff access privileges for: ${fullName} (${role})`, 'SYSTEM', 'ACCESS');

    if (updatedObj) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedObj)
        });
        if (res.ok) {
          const data = await res.json();
          currentVersionRef.current = data.version;
        }
      } catch (err) {
        console.error('Error updating status server-side', err);
      }
    }
  };

  const updateCompanyLogo = async (logo: string | null) => {
    setCompanyLogo(logo);
    if (logo) {
      localStorage.setItem('bsl_company_logo_v2', logo);
    } else {
      localStorage.removeItem('bsl_company_logo_v2');
    }
    // Fire event so CompanyLogo components update instantly
    window.dispatchEvent(new Event('company-logo-updated'));
    addLog('Updated company logo configuration', 'SYSTEM', 'BRANDING');

    try {
      const res = await fetch('/api/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo })
      });
      if (res.ok) {
        const data = await res.json();
        currentVersionRef.current = data.version;
      }
    } catch (err) {
      console.error('Error updating company logo server side', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        shipments,
        activityLogs,
        currentRole,
        currentUser,
        darkMode,
        selectedView,
        isAuthenticated,
        registeredUsers,
        companyLogo,
        setShipments,
        setSelectedView,
        addShipment,
        updateShipment,
        deleteShipment,
        approveShipment,
        switchRole,
        toggleDarkMode,
        addLog,
        login,
        logout,
        resetPassword,
        registerUser,
        updateUser,
        deleteUser,
        updateCompanyLogo,
        wipeAllShipments
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
