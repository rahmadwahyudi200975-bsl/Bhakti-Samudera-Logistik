/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shipment, ActivityLog, User, UserRole } from '../types';
import { initialShipments, initialActivityLogs } from '../data';

interface AppContextType {
  shipments: Shipment[];
  activityLogs: ActivityLog[];
  currentRole: UserRole;
  currentUser: User;
  darkMode: boolean;
  selectedView: 'dashboard' | 'shipments' | 'costing' | 'revenue' | 'reports';
  isAuthenticated: boolean;
  setShipments: React.Dispatch<React.SetStateAction<Shipment[]>>;
  setSelectedView: (view: 'dashboard' | 'shipments' | 'costing' | 'revenue' | 'reports') => void;
  addShipment: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateShipment: (shipment: Shipment) => void;
  deleteShipment: (id: string) => void;
  approveShipment: (id: string) => void;
  switchRole: (role: UserRole) => void;
  toggleDarkMode: () => void;
  addLog: (action: string, shipmentId: string, jobNo: string) => void;
  login: (role: UserRole, password: string) => boolean;
  logout: () => void;
  resetPassword: (role: UserRole, newPw: string) => void;
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

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_ROLE);
    return (stored as UserRole) || 'Director'; // Default to Director to show premium features on startup, but easily toggled!
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

  const [currentUser, setCurrentUser] = useState<User>({
    username: currentRole === 'Director' ? 'Director_Imron' : 'Robby_Ops',
    role: currentRole,
    fullName: currentRole === 'Director' ? 'Director Imron Syahputra' : 'Robby Hermawan (Ops)'
  });

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(shipments));
  }, [shipments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLE, currentRole);
    setCurrentUser({
      username: currentRole === 'Director' ? 'Director_Imron' : 'Robby_Ops',
      role: currentRole,
      fullName: currentRole === 'Director' ? 'Director Imron Syahputra' : 'Robby Hermawan (Ops)'
    });
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DARK, String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Actions
  const addLog = (action: string, shipmentId: string, jobNo: string) => {
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
  };

  const addShipment = (shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const sequence = (shipments.length + 1).toString().padStart(4, '0');
    const newId = `BSL-2026-${sequence}`;
    
    const newShipment: Shipment = {
      ...shipmentData,
      id: newId,
      createdAt: today,
      updatedAt: today
    };

    setShipments(prev => [newShipment, ...prev]);
    addLog(`Created new shipment [${newId}] - Client: ${newShipment.customerName}`, newId, newShipment.jobNo);
  };

  const updateShipment = (updatedShipment: Shipment) => {
    const today = new Date().toISOString().split('T')[0];
    const shipmentToUpdate = {
      ...updatedShipment,
      updatedAt: today
    };

    setShipments(prev => prev.map(item => item.id === updatedShipment.id ? shipmentToUpdate : item));
    addLog(`Updated shipment [${updatedShipment.id}] - Customs Status: ${updatedShipment.status}`, updatedShipment.id, updatedShipment.jobNo);
  };

  const deleteShipment = (id: string) => {
    const shipment = shipments.find(item => item.id === id);
    if (shipment) {
      setShipments(prev => prev.filter(item => item.id !== id));
      addLog(`Deleted shipment [${id}] - Client: ${shipment.customerName}`, id, shipment.jobNo);
    }
  };

  const approveShipment = (id: string) => {
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
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  const login = (role: UserRole, password: string): boolean => {
    let isValid = false;
    const customDirectorPw = localStorage.getItem('bsl_director_pw') || 'director123';
    const customStaffPw = localStorage.getItem('bsl_staff_pw') || 'staff123';

    if (role === 'Director') {
      if (password === customDirectorPw || password === 'admin') {
        isValid = true;
      }
    } else if (role === 'Staff') {
      if (password === customStaffPw || password === 'staff') {
        isValid = true;
      }
    }

    if (isValid) {
      setCurrentRole(role);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      localStorage.setItem(STORAGE_KEY_ROLE, role);
      return true;
    }
    return false;
  };

  const resetPassword = (role: UserRole, newPw: string) => {
    if (role === 'Director') {
      localStorage.setItem('bsl_director_pw', newPw);
    } else {
      localStorage.setItem('bsl_staff_pw', newPw);
    }
    addLog(`Changed security credentials for ${role}`, 'SYSTEM', 'SECURITY');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    setSelectedView('dashboard');
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
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
        resetPassword
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
