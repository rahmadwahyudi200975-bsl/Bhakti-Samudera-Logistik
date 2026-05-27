/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Clock, 
  User as UserIcon,
  ChevronDown,
  FileClock,
  LogOut,
  Anchor
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { getSumOfCosts, formatRupiah } from '../data';

export default function Topbar() {
  const { 
    currentUser, 
    currentRole, 
    switchRole, 
    darkMode, 
    toggleDarkMode, 
    shipments,
    setSelectedView,
    logout
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live notifications based on shipment list database!
  const alerts: { id: string; text: string; type: 'warning' | 'info' | 'critical'; link: 'shipments' | 'costing' }[] = [];

  shipments.forEach(s => {
    // 1. Red channel warning
    if (s.status === 'Red Channel / Behandle') {
      alerts.push({
        id: `red-${s.id}`,
        text: `${s.id} (${s.customerName.slice(0, 15)}...) is in RED CHANNEL & requires immediate Inspection.`,
        type: 'critical',
        link: 'shipments'
      });
    }

    // 2. High Budget Overruns
    const estSum = getSumOfCosts(s.estimatedCosts);
    const actSum = getSumOfCosts(s.actualCosts);
    if (actSum > estSum && estSum > 0) {
      alerts.push({
        id: `overrun-${s.id}`,
        text: `${s.id} has a BUDGET OVERRUN! Actual (${formatRupiah(actSum)}) exceeds Estimate (${formatRupiah(estSum)}).`,
        type: 'warning',
        link: 'costing'
      });
    }
  });

  return (
    <header 
      id="top-bar" 
      className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white px-6 md:px-10 dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200"
    >
      {/* Greetings / Client Indicator */}
      <div className="flex items-center gap-3">
        {/* Padding for mobile toggle */}
        <div className="w-10 md:hidden h-1" />
        
        {/* Premium Corporate Logo badge */}
        <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/15 border border-blue-200/20 shrink-0 dark:from-sky-505 dark:to-blue-600 dark:border-slate-800">
          <Anchor className="h-5.5 w-5.5" />
        </div>

        <div>
          <h2 className="text-base font-black text-slate-850 dark:text-slate-100 tracking-tight leading-none flex items-center gap-2">
            PT Bhakti Samudera Logistik
            <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 dark:text-sky-400 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-100 dark:border-slate-700 font-mono tracking-wider uppercase">
              PORTAL
            </span>
          </h2>
          <p className="hidden sm:block text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            Customs Clearance Tracking & Funding Control System
          </p>
        </div>
      </div>

      {/* Right Section Controllers */}
      <div className="flex items-center gap-4">
        
        {/* UTC Time Indicator */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/60 px-3.5 py-1.5 dark:bg-slate-800 dark:border-slate-700">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
            2026-05-26 03:25 UTC
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          id="btn-theme-toggle"
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-soft-sm hover:bg-slate-50 hover:text-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-805 dark:text-slate-305 dark:hover:bg-slate-800"
          title={darkMode ? "Enable Light Mode" : "Enable Dark Mode"}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            id="btn-notif-toggle"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-soft-sm hover:bg-slate-50 hover:text-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-805 dark:text-slate-305 dark:hover:bg-slate-800"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div 
              id="notif-dropdown-content" 
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-slide-up"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                  OPERATIONAL ALERTS ({alerts.length})
                </h4>
                {alerts.length === 0 && (
                  <span className="text-xs text-green-500">All systems green</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto pt-2 space-y-2">
                {alerts.length > 0 ? (
                  alerts.map((al) => (
                    <button
                      key={al.id}
                      onClick={() => {
                        setSelectedView(al.link);
                        setNotifOpen(false);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-805"
                    >
                      <div className={`mt-0.5 rounded-lg p-1.5 ${
                        al.type === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                        al.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400'
                      }`}>
                        <AlertTriangle className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-normal">
                          {al.text}
                        </p>
                        <span className="mt-1 text-[10px] text-blue-500 hover:underline inline-block font-semibold">
                          View details & action →
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-550">
                    <FileClock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                    No operational alerts at this time.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card with Role Switch Dropdown */}
        <div ref={userRef} className="relative">
          <button
            id="btn-user-dropdown-toggle"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pr-2.5 text-left shadow-soft-xs hover:bg-slate-100 focus:outline-none dark:border-slate-700 dark:bg-slate-805 dark:hover:bg-slate-800 transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs uppercase">
              {currentUser.username[0]}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] font-medium text-slate-500 leading-none mt-1">
                Role: <span className="text-blue-600 dark:text-blue-400 font-semibold">{currentRole}</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {userDropdownOpen && (
            <div 
              id="user-dropdown-content" 
              className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400">Logged in as:</p>
                <p className="text-xs font-bold text-slate-850 dark:text-slate-100 mt-0.5">{currentUser.fullName}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">{currentUser.username}</p>
              </div>
              <div className="p-1 space-y-1 mt-1">
                <button
                  id="dropdown-switch-role-staff"
                  onClick={() => {
                    switchRole('Staff');
                    setUserDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                    currentRole === 'Staff'
                      ? 'bg-blue-50 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-805'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  Switch to Staff Ops
                </button>
                <button
                  id="dropdown-switch-role-director"
                  onClick={() => {
                    switchRole('Director');
                    setUserDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                    currentRole === 'Director'
                      ? 'bg-blue-50 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-805'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  Switch to Director
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  id="dropdown-logout"
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-all text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar (Log Out)
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
