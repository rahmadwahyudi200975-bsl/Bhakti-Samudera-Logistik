/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import ShipmentsView from './components/ShipmentsView';
import CostingView from './components/CostingView';
import RevenueView from './components/RevenueView';
import ReportsView from './components/ReportsView';
import LoginView from './components/LoginView';

function AppContent() {
  const { selectedView, isAuthenticated, currentRole } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Double guard check: If staff somehow navigates to costing/revenue/reports, force them to dashboard
  const isFinancialTab = ['costing', 'revenue', 'reports'].includes(selectedView);
  const activeView = (isFinancialTab && currentRole === 'Staff') ? 'dashboard' : selectedView;

  return (
    <div id="app-root-shell" className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-205 flex">
      {/* 1. Sidebar Navigation Left Panel */}
      <Sidebar />

      {/* 2. Main Ingress Body (Accounting for sidebar padding on desktop) */}
      <div id="main-content-layout" className="flex-1 flex flex-col min-w-0 md:pl-72 min-h-screen">
        
        {/* Top Header Controls bar */}
        <Topbar />

        {/* Dynamic Route Content Shell */}
        <main id="primary-route-ingress" className="flex-1 p-6 md:p-10 max-w-[1600px] w-full mx-auto pb-16">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'shipments' && <ShipmentsView />}
          {activeView === 'costing' && <CostingView />}
          {activeView === 'revenue' && <RevenueView />}
          {activeView === 'reports' && <ReportsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
