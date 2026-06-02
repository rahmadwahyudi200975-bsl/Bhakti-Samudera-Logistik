/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import AdminSettingsDesk from './AdminSettingsDesk';
import { 
  getSumOfCosts, 
  getShipmentTotalRevenue, 
  getShipmentProfit, 
  formatRupiah 
} from '../data';
import { 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Briefcase, 
  Ship, 
  ChevronRight, 
  CheckCircle2,
  Truck,
  FileSpreadsheet,
  Layers,
  Lock,
  Clock,
  RotateCw,
  Printer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LabelList
} from 'recharts';
import { CustomClearanceStatus } from '../types';

export default function DashboardView() {
  const { shipments, currentRole, setSelectedView, setShipments } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintPdf = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 950);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setShowSyncSuccess(false);
    
    // Snappy database & localStorage real-time update retrieval
    setTimeout(() => {
      try {
        const stored = localStorage.getItem('bsl_shipments_v2');
        if (stored) {
          setShipments(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Gagal meluat ulang data kargo:", err);
      }
      
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
      setShowSyncSuccess(true);
      
      // Auto vanish success badge
      setTimeout(() => {
        setShowSyncSuccess(false);
      }, 3000);
    }, 450); // fast and tactile loading animation
  };

  // 1. CALCULATE FINANCIALS & STATS
  const totalShipmentsCount = shipments.length;
  const activeShipments = shipments.filter(s => s.status !== 'Completed' && s.status !== 'Cancelled');
  const activeCount = activeShipments.length;
  const completedCount = shipments.filter(s => s.status === 'Completed').length;
  const cancelledCount = shipments.filter(s => s.status === 'Cancelled').length;

  const redChannelCount = shipments.filter(s => s.status === 'Red Channel / Behandle').length;

  // Operational details for Staff dashboard
  const documentReviewCount = shipments.filter(s => 
    ['Draft', 'Document Checking'].includes(s.status)
  ).length;

  const customsPendingCount = shipments.filter(s => 
    ['Submit PIB', 'Billing Issued', 'Paid Pending SPPB', 'Red Channel / Behandle'].includes(s.status)
  ).length;

  const truckingDeliveryCount = shipments.filter(s => 
    ['SPPB Issued', 'Gate Out / Delivery'].includes(s.status)
  ).length;

  // Total Operation Costs (Sum of actual Reimbursement Funding of each shipment)
  const totalOperationCost = shipments.reduce((acc, s) => acc + getSumOfCosts(s.actualCosts), 0);
  const totalEstimatedCost = shipments.reduce((acc, s) => acc + getSumOfCosts(s.estimatedCosts), 0);

  // Total Company revenue (Direct Service Fees)
  const totalRevenue = shipments.reduce((acc, s) => acc + getShipmentTotalRevenue(s), 0);

  // Total pure services fees (BBS's direct value-added margins)
  const totalServiceFees = shipments.reduce((acc, s) => {
    return acc + (s.revenue.handlingFee + s.revenue.truckingSelling + s.revenue.undernameSelling + s.revenue.reimbursementMarkup);
  }, 0);

  // Gross Profit = REVENUE - OPERATION COST
  const totalProfit = totalRevenue - totalOperationCost;
  const averageMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // 3. COMPILE DATA FOR MONTHLY SHIPMENTS (BAR CHART)
  const monthlyShipmentData = (() => {
    const predefinedMonths = [
      { key: '2026-01', label: 'Jan' },
      { key: '2026-02', label: 'Feb' },
      { key: '2026-03', label: 'Mar' },
      { key: '2026-04', label: 'Apr' },
      { key: '2026-05', label: 'May' },
      { key: '2026-06', label: 'Jun' },
      { key: '2026-07', label: 'Jul' },
      { key: '2026-08', label: 'Aug' },
      { key: '2026-09', label: 'Sep' },
      { key: '2026-10', label: 'Oct' },
      { key: '2026-11', label: 'Nov' },
      { key: '2026-12', label: 'Dec' }
    ];

    // Count actual completed shipments per month (YYYY-MM) berdasarkan tanggal barang diterima oleh customer (targetCompletionDate)
    const counts: Record<string, number> = {};
    shipments.forEach(s => {
      if (s.status === 'Completed') {
        const dateStr = s.targetCompletionDate || s.updatedAt || s.createdAt || '2026-05-01';
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
          const key = `${parts[0]}-${parts[1]}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    });

    return predefinedMonths.map(m => {
      const actualCount = counts[m.key] || 0;
      return {
        name: m.label,
        'Shipments': actualCount
      };
    });
  })();

  // 4. COMPILE DATA FOR CUSTOMS LANES (DONUT CHART)
  const customsLaneData = (() => {
    let greenCount = 0;
    let yellowCount = 0;
    let redCount = 0;

    shipments.forEach(s => {
      const lane = s.customsLane || 'GREEN LANE';
      if (lane === 'RED LANE') redCount++;
      else if (lane === 'YELLOW LANE') yellowCount++;
      else greenCount++;
    });

    const total = greenCount + yellowCount + redCount;

    return [
      { 
        name: 'GREEN LANE', 
        value: greenCount, 
        color: '#10b981', 
        percent: total > 0 ? Math.round((greenCount / total) * 100) : 0
      },
      { 
        name: 'YELLOW LANE', 
        value: yellowCount, 
        color: '#eab308', 
        percent: total > 0 ? Math.round((yellowCount / total) * 100) : 0
      },
      { 
        name: 'RED LANE', 
        value: redCount, 
        color: '#ef4444', 
        percent: total > 0 ? Math.round((redCount / total) * 100) : 0
      }
    ];
  })();

  // Customs Status Colors helper
  const getStatusColor = (status: CustomClearanceStatus) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'Document Checking': return 'bg-sky-100 text-sky-850 dark:bg-sky-955/20 dark:text-sky-400';
      case 'Submit PIB': return 'bg-blue-100 text-blue-855 dark:bg-blue-955/20 dark:text-blue-400';
      case 'Billing Issued': return 'bg-purple-100 text-purple-855 dark:bg-purple-955/20 dark:text-purple-400';
      case 'Paid Pending SPPB': return 'bg-amber-100 text-amber-855 dark:bg-amber-955/20 dark:text-amber-400';
      case 'Red Channel / Behandle': return 'bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-400 font-bold animate-pulse';
      case 'SPPB Issued': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-400';
      case 'Gate Out / Delivery': return 'bg-teal-100 text-teal-800 dark:bg-teal-955/20 dark:text-teal-400';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-955/20 dark:text-green-400';
      case 'Cancelled': return 'bg-rose-100/60 text-rose-700 dark:bg-rose-955/25 dark:text-rose-400 border border-rose-250/20 line-through';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div id="dashboard-view-wrapper" className="space-y-8 animate-fade-in print:p-8 print:bg-white print:text-slate-900">
      
      {/* PAGE HEADER ROW WITH PRINT ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight font-sans">
            Dashboard Overview
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Real-time customs clearance pipeline summary, lane distribution, operational flow metrics, and financial status.
          </p>
        </div>
        
        <button
          id="btn-print-top-trigger"
          onClick={handlePrintPdf}
          disabled={isPrinting}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all outline-none cursor-pointer disabled:opacity-50"
        >
          <Printer className="h-4 w-4" />
          {isPrinting ? "Preparing Pdf..." : "Print Pdf"}
        </button>
      </div>

      {/* TOP TIMELINE INFO BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 p-6 md:p-8 text-white shadow-lg border border-blue-950 print:hidden">
        <div>
          <span className="rounded-full bg-blue-500/35 px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase">
            Integrated System | {currentRole}
          </span>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">
            Welcome back to the Bhakti Samudera Logistik Portal
          </h3>
          <p className="mt-1 text-sm text-blue-200">
            Customs Clearance & Operational Control System
          </p>
        </div>
        <button
          id="banner-view-shipment"
          onClick={() => setSelectedView('shipments')}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 shadow-md transition-all focus:outline-none"
        >
          Manage Shipments
          <ChevronRight className="h-4.5 w-4.5 text-slate-900" />
        </button>
      </div>

      {/* REAL-TIME SYNC & QUICK REFRESH CONTROL PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-soft-sm transition-all print:hidden">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Koneksi Database Aktif (Websocket)
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Terakhir diperbarui: <span className="font-mono font-bold text-slate-700 dark:text-slate-355">{lastSyncTime} WIB</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 self-end sm:self-center">
          {showSyncSuccess && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-fade-in flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              Selesai Sinkronisasi!
            </div>
          )}
          <button
            id="print-pdf-btn"
            onClick={handlePrintPdf}
            disabled={isPrinting}
            className={`flex items-center gap-1.5 py-2 px-4 text-xs font-extrabold tracking-wide uppercase rounded-xl border transition-all cursor-pointer ${
              isPrinting
                ? 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-850 dark:border-slate-800'
                : 'bg-white border-slate-200 text-slate-705 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm'
            }`}
          >
            <Printer className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            {isPrinting ? 'Preparing Pdf...' : 'Print Pdf'}
          </button>
          <button
            id="refresh-realtime-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 py-2 px-4 text-xs font-extrabold tracking-wide uppercase rounded-xl border transition-all cursor-pointer ${
              isRefreshing
                ? 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-850 dark:border-slate-800'
                : 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10'
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Sinkronisasi...' : 'SINKRONKAN DATA'}
          </button>
        </div>
      </div>



      {/* 1. KEY KPI CARDS GRID */}
      <div id="kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Shipments KPI - Core operational tracker visible to both */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Shipments</span>
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-955/50 dark:text-blue-400 animate-pulse">
              <Ship className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-800 dark:text-blue-400 tracking-tight">{activeCount}</span>
            <span className="text-xs text-slate-400">active of {totalShipmentsCount} cargo</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="font-bold text-green-500 flex items-center gap-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {completedCount} Selesai
            </span>
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0 animate-pulse" />
              {redChannelCount} Dalam Proses
            </span>
          </div>
        </div>

        {/* Condition-based secondary grid blocks */}
        {currentRole === 'Director' ? (
          <>
            {/* Total Operation Cost (Sum of all actual reimbursement funding) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Operation Cost</span>
                <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-955/50 dark:text-amber-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-slate-855 dark:text-white block tracking-tight font-mono">
                  {formatRupiah(totalOperationCost)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Budgeted plan: {formatRupiah(totalEstimatedCost)}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Total port advances representing actual reimbursement funding.
              </div>
            </div>

            {/* Pure direct service fee revenues */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Revenue</span>
                <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-955/50 dark:text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-slate-850 dark:text-white block tracking-tight font-mono">
                  {formatRupiah(totalServiceFees)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                  Excluding Pending Reimbursements
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Accumulated invoice total representing pure handling service fees.
              </div>
            </div>

            {/* Gross Profit / Net margins */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Gross Profit</span>
                <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-955/50 dark:text-purple-400">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-slate-850 dark:text-white block tracking-tight font-mono">
                  {formatRupiah(totalProfit)}
                </span>
                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-600 dark:bg-purple-955/30 dark:text-purple-400 mt-1 inline-block font-mono">
                  Profit Share: {averageMarginPercent.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-none">
                Profit leftover computed after excluding direct port advances.
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Staff Card 1: Document Review Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">Draft & Doc Checklist</span>
                <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-955/50 dark:text-amber-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-850 dark:text-white block tracking-tight">
                  {documentReviewCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Awaiting Document Compositions
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800 pt-3">
                Cargo is in target B/L, Commercial Invoice, and Packing List audit.
              </div>
            </div>

            {/* Staff Card 2: Customs PIB Clearance Stage */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">Customs Clearance Stage</span>
                <div className="rounded-xl bg-rose-105 bg-rose-50 text-rose-600 dark:bg-rose-955/30 dark:text-rose-400">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-850 dark:text-white block tracking-tight">
                  {customsPendingCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  PIB, Billing, SSPCP, & Port Inspections
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800 pt-3 font-semibold text-blue-600 dark:text-blue-400">
                Active container inspections & port customs PIB verification.
              </div>
            </div>

            {/* Staff Card 3: Logistics dispatch & ready for trucking */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">Delivery Circulation</span>
                <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-955/50 dark:text-emerald-400">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-850 dark:text-white block tracking-tight">
                  {truckingDeliveryCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  SPPB Released & Port Gate Out Status
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800 pt-3">
                Cargo is ready for truck dispatch to the importer's warehouse.
              </div>
            </div>
          </>
        )}

      </div>

      {/* 3. CHART VISUALIZATIONS WIDGETS (RECHARTS) */}
      <div className="space-y-6">
        
        {/* Monthly Shipments Chart (Full Width) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Monthly Shipments Chart
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Jumlah shipment selesai ditangani, dihitung berdasarkan tanggal barang diterima oleh customer.
              </p>
            </div>
          </div>

          <div className="h-80 w-full text-xs font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyShipmentData}
                margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.4} />
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis precision={0} stroke="#64748B" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Legend />
                <Bar dataKey="Shipments" fill="#005696" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="Shipments" position="inside" fill="#ffffff" style={{ fontWeight: 'bold', fontSize: '11px' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. CUSTOMS LANES SEGMENTATION */}
      <div className="rounded-2xl border border-slate-205 bg-white p-6 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850 flex flex-col">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            CUSTOMS LANE
          </h3>
        </div>

        <div id="lane-chart-container" className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
          {customsLaneData.some(d => d.value > 0) ? (
            <>
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customsLaneData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {customsLaneData.map((entry, index) => (
                        <Cell key={`cell-lane-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value} Shipment(s)`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2 w-full max-w-lg font-sans">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1.5">Lane Category</h5>
                <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                  {customsLaneData.map((d) => (
                    <div key={d.name} className="flex flex-col text-[11px] p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate text-slate-700 dark:text-slate-300 font-bold">{d.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-900 dark:text-white shrink-0">
                          {d.value} ({d.percent}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-xs text-slate-400 py-10 h-56 w-full">
              <Layers className="h-8 w-8 text-slate-300 mb-2" />
              No shipment data with customs lanes recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Corporate Admin Branding & Access Control Desk */}
      <div className="print:hidden">
        <AdminSettingsDesk />
      </div>

    </div>
  );
}
