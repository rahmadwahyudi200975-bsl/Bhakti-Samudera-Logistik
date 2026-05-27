/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Boxes, 
  Wallet, 
  Receipt, 
  FileText, 
  User,
  Menu,
  X,
  LogOut,
  Anchor
} from 'lucide-react';
import { useState } from 'react';
import CompanyLogo from './CompanyLogo';
import { isDirectorRole, UserRole } from '../types';

export default function Sidebar() {
  const { selectedView, setSelectedView, currentRole, switchRole, logout } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      description: isDirectorRole(currentRole) ? 'Operations & Profit Summary' : 'Ringkasan Operasional & KPI Kerja'
    },
    {
      id: 'shipments',
      label: 'Shipment Management',
      icon: Boxes,
      description: 'Customs Clearance Progress'
    },
    ...(isDirectorRole(currentRole) ? [
      {
        id: 'costing',
        label: 'Costing & Funding',
        icon: Wallet,
        description: 'Budget vs Actual Expenses'
      },
      {
        id: 'revenue',
        label: 'Revenue & Invoicing',
        icon: Receipt,
        description: 'Billing & Settlement Status'
      },
      {
        id: 'reports',
        label: 'Financial Reports',
        icon: FileText,
        description: 'Daily, Weekly & Annual Records'
      }
    ] : [])
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        id="sidebar-mobile-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 text-white bg-blue-900 rounded-lg md:hidden hover:bg-blue-850 transition-all focus:outline-none"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar Core */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-35 flex w-72 flex-col bg-blue-600 text-white transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-blue-700/50 dark:bg-slate-900 dark:border-slate-800`}
      >
        {/* Header Branding */}
        <div className="flex h-20 items-center gap-3 border-b border-blue-700/60 px-6 dark:border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 dark:bg-slate-800 border border-white/10 dark:border-slate-750/70 shrink-0 overflow-hidden">
            <CompanyLogo className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-white uppercase leading-tight font-sans">
              BHAKTI SAMUDERA
            </h1>
            <p className="text-[9px] text-blue-100/70 font-semibold uppercase tracking-[0.15em] mt-0.5 dark:text-sky-400/70">
              LOGISTICS & CUSTOMS
            </p>
          </div>
        </div>

        {/* User Role Quick Badge & Switcher */}
        <div className="px-4 py-4">
          <div className="rounded-xl bg-blue-700 p-4 border border-blue-800/30 dark:bg-slate-850 dark:border-slate-805">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-800 text-white dark:bg-slate-705">
                <User className="h-5 w-5 text-blue-200 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-white dark:text-slate-200">System Access Role</h4>
                <p className="text-[11px] text-blue-200 dark:text-slate-400">Mode: <span className="text-white font-bold">{currentRole}</span></p>
              </div>
            </div>

            {/* Role switch dropdown */}
            <div className="mt-3">
              <select
                id="role-switch-select"
                value={currentRole}
                onChange={(e) => {
                  switchRole(e.target.value as UserRole);
                  setIsOpen(false);
                }}
                className="w-full rounded-lg bg-blue-800 dark:bg-slate-805 py-1.5 px-2.5 text-xs font-bold text-white outline-none border border-blue-600/40 dark:border-slate-700/60 transition-all cursor-pointer"
              >
                <option value="President Director">👑 President Director</option>
                <option value="Director of Operation">⚙️ Director of Operation</option>
                <option value="Director of Finance">💼 Director of Finance</option>
                <option value="Finance Staff">💳 Finance Staff</option>
                <option value="Operation Staff">⚓ Operation Staff</option>
                <option value="Director">🛡️ Director (Legacy)</option>
                <option value="Staff">🔑 Staff Ops (Legacy)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 px-3 py-3 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = selectedView === item.id;
            return (
              <button
                id={`sidebar-link-${item.id}`}
                key={item.id}
                onClick={() => {
                  setSelectedView(item.id);
                  setIsOpen(false);
                }}
                className={`group flex w-full items-start gap-4 rounded-xl px-4 py-3.5 text-left transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white font-semibold shadow-md dark:bg-blue-700'
                    : 'text-blue-100/80 hover:bg-blue-700/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-808 dark:hover:text-white'
                }`}
              >
                <IconComponent className={`mt-0.5 h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-blue-200 group-hover:text-white dark:text-slate-400 dark:group-hover:text-blue-400'}`} />
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className={`text-[11px] ${isActive ? 'text-blue-200/90' : 'text-blue-100/60 group-hover:text-blue-100/90 dark:text-slate-500'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="p-4 border-t border-blue-700/60 dark:border-slate-800 shrink-0">
          <button
            id="sidebar-btn-logout"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-750/50 hover:bg-red-650/20 hover:text-red-400 border border-blue-700/60 hover:border-red-500/30 py-2.5 px-4 text-xs font-semibold tracking-wide uppercase transition-all whitespace-nowrap active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0 text-blue-300" />
            Keluar (Log Out)
          </button>
        </div>
      </aside>
    </>
  );
}
