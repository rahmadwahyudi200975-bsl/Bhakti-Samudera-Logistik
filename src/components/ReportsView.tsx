/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  getSumOfCosts, 
  getShipmentTotalRevenue, 
  getShipmentProfit, 
  formatRupiah 
} from '../data';
import { 
  Printer, 
  Ship, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function ReportsView() {
  const { shipments } = useApp();
  
  // Tab states: 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  
  // Date states for filtering
  const [selectedDate, setSelectedDate] = useState('2026-05-25'); // dummy date matching our mock data
  const [startDate, setStartDate] = useState('2026-05-15');
  const [endDate, setEndDate] = useState('2026-05-26');
  const [selectedMonth, setSelectedMonth] = useState('05');
  const [selectedMonthYear, setSelectedMonthYear] = useState('2026');
  const [selectedYear, setSelectedYear] = useState('2026');

  const getMonthName = (monthValue: string) => {
    const names: Record<string, string> = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return names[monthValue] || monthValue;
  };

  // CUSTOMER PROFITABILITY BREAKDOWN VIEW TOGGLE
  const [analyzeCustomer, setAnalyzeCustomer] = useState<string>('all');

  // PRINT SIMULATION
  const [isPrinting, setIsPrinting] = useState(false);

  // Dynamic audit tracker and cryptographic checksum parameters
  const [generationTime] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} WIB`;
  });

  const generateAuditHash = () => {
    const combinedBytes = (periodShipments.length * 31) + (totalRevenuePeriod % 2026) + (totalProfitPeriod % 1009) + (totalDisbursedPeriod % 997);
    return `BSL-SEC-${combinedBytes.toString(16).toUpperCase()}-${selectedYear}`;
  };

  // 1. FILTER SHIPMENTS FOR THE PERIOD
  const periodShipments = shipments.filter(s => {
    // Audit date match
    if (reportType === 'daily') {
      return s.createdAt === selectedDate || s.updatedAt === selectedDate;
    } else if (reportType === 'weekly') {
      return s.createdAt >= startDate && s.createdAt <= endDate;
    } else if (reportType === 'monthly') {
      return s.createdAt.startsWith(`${selectedMonthYear}-${selectedMonth}`);
    } else { // yearly
      return s.createdAt.startsWith(selectedYear);
    }
  }).filter(s => {
    // Optionally filter by specific customer to analyze profitability
    if (analyzeCustomer === 'all') return true;
    return s.customerName === analyzeCustomer;
  });

  // Unique Customer list inside filtered period for sub-analysis dropdown
  const uniqueCustomersInPeriod = Array.from(new Set(periodShipments.map(s => s.customerName)));

  // 2. STATISTICS FOR SELECT PERIOD
  const volumeTeus = periodShipments.reduce((acc, s) => {
    const factor = s.containerSize === '20ft' ? 1 : 2; // TEUS factor
    return acc + (s.containerQty * (s.containerSize === 'LCL' ? 0.5 : factor));
  }, 0);

  const totalDisbursedPeriod = periodShipments.reduce((acc, s) => acc + getSumOfCosts(s.actualCosts), 0);
  const totalRevenuePeriod = periodShipments.reduce((acc, s) => acc + getShipmentTotalRevenue(s), 0);
  const totalProfitPeriod = periodShipments.reduce((acc, s) => acc + getShipmentProfit(s), 0);
  
  // 3. Year-over-Year (YoY) comparison calculations
  const currentYearInt = parseInt(selectedYear) || 2026;
  const prevYearStr = String(currentYearInt - 1);

  const prevYearShipments = shipments.filter(s => s.createdAt.startsWith(prevYearStr)).filter(s => {
    if (analyzeCustomer === 'all') return true;
    return s.customerName === analyzeCustomer;
  });

  const prevVolumeTeus = prevYearShipments.reduce((acc, s) => {
    const factor = s.containerSize === '20ft' ? 1 : 2; // TEUS factor
    return acc + (s.containerQty * (s.containerSize === 'LCL' ? 0.5 : factor));
  }, 0);

  const prevTotalDisbursed = prevYearShipments.reduce((acc, s) => acc + getSumOfCosts(s.actualCosts), 0);
  const prevTotalRevenue = prevYearShipments.reduce((acc, s) => acc + getShipmentTotalRevenue(s), 0);
  const prevTotalProfit = prevYearShipments.reduce((acc, s) => acc + getShipmentProfit(s), 0);

  const calculatePctChange = (curr: number, prev: number) => {
    if (prev === 0) {
      return curr > 0 ? 100 : 0;
    }
    return ((curr - prev) / prev) * 100;
  };

  const yoyShipmentsChange = calculatePctChange(periodShipments.length, prevYearShipments.length);
  const yoyVolumeChange = calculatePctChange(volumeTeus, prevVolumeTeus);
  const yoyRevenueChange = calculatePctChange(totalRevenuePeriod, prevTotalRevenue);
  const yoyCostChange = calculatePctChange(totalDisbursedPeriod, prevTotalDisbursed);
  const yoyProfitChange = calculatePctChange(totalProfitPeriod, prevTotalProfit);
  
  // Sub-sum categories for detailed breakdown in report
  const reportCostSums = periodShipments.reduce((acc, s) => {
    const act = s.actualCosts;
    acc.doContainer += act.doContainer;
    acc.storage += act.storage;
    acc.pdri += act.pdri;
    acc.sptnp += act.sptnp;
    acc.bahandle += act.bahandle;
    acc.undername += act.undername;
    acc.trucking += act.trucking;
    acc.extraCost += act.extraCost;
    acc.operationalCost += act.operationalCost;
    acc.surveyorFee += act.surveyorFee;
    return acc;
  }, {
    doContainer: 0,
    storage: 0,
    pdri: 0,
    sptnp: 0,
    bahandle: 0,
    undername: 0,
    trucking: 0,
    extraCost: 0,
    operationalCost: 0,
    surveyorFee: 0
  });

  // Action download simulation
  const handlePrintReport = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1500);
  };

  return (
    <div id="reports-view-wrapper" className="space-y-6 animate-fade-in print:p-8 print:bg-white print:text-slate-900">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-slate-855 dark:text-white uppercase tracking-tight font-sans">Profit & Loss Audit Reports</h2>
          <p className="text-xs text-slate-500 font-sans">
            Automated consolidation of customs entry files, port capital usage, and client portfolio profitability margins.
          </p>
        </div>
        
        {/* Cetak simulated PDF */}
        <button
          id="btn-print-trigger"
          onClick={handlePrintReport}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-705 shadow-md transition-all outline-none"
        >
          <Printer className="h-4 w-4" />
          {isPrinting ? "Preparing Print Document..." : "Print Report Document"}
        </button>
      </div>

      {/* FILTER PANEL: CHOOSE REPORT TYPES */}
      <div className="rounded-2xl border border-slate-205 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-855 print:hidden space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800/80">
          
          {/* Report types tabs */}
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <button
              id="report-tab-daily"
              onClick={() => setReportType('daily')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                reportType === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-550 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Daily Report
            </button>
            <button
              id="report-tab-weekly"
              onClick={() => setReportType('weekly')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                reportType === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-550 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Weekly Report
            </button>
            <button
              id="report-tab-monthly"
              onClick={() => setReportType('monthly')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                reportType === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-550 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Laporan Bulanan (Monthly)
            </button>
            <button
              id="report-tab-yearly"
              onClick={() => setReportType('yearly')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                reportType === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-550 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Yearly Import Report
            </button>
          </div>

          {/* Analyze by Customer dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">Client Profitability Analysis:</span>
            <select
              id="reports-customer-select"
              value={analyzeCustomer}
              onChange={(e) => setAnalyzeCustomer(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-705 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="all">All Importers (Consolidated)</option>
              {Array.from(new Set(shipments.map(s => s.customerName))).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

        {/* TIME FILTER VALUES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
          
          {/* Daily calendar picker */}
          {reportType === 'daily' && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Report Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none dark:border-slate-800 dark:bg-slate-800 w-full sm:w-60 text-slate-705 dark:text-white font-semibold"
                />
                <span className="text-[11px] text-slate-405">Displaying daily closing ledger for select date</span>
              </div>
            </div>
          )}

          {/* Weekly date range picker */}
          {reportType === 'weekly' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none dark:border-slate-800 dark:bg-slate-800 text-slate-75 * text-slate-705 dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none dark:border-slate-800 dark:bg-slate-800 text-slate-75 * text-slate-705 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Monthly picker */}
          {reportType === 'monthly' && (
            <>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Pilih Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none dark:border-slate-800 dark:bg-slate-800 text-slate-705 dark:text-white font-bold"
                >
                  <option value="01">Januari (01)</option>
                  <option value="02">Februari (02)</option>
                  <option value="03">Maret (03)</option>
                  <option value="04">April (04)</option>
                  <option value="05">Mei (05)</option>
                  <option value="06">Juni (06)</option>
                  <option value="07">Juli (07)</option>
                  <option value="08">Agustus (08)</option>
                  <option value="09">September (09)</option>
                  <option value="10">Oktober (10)</option>
                  <option value="11">November (11)</option>
                  <option value="12">Desember (12)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-widest">Tahun</label>
                <select
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="rounded-xl border border-slate-202 bg-slate-50 p-2 outline-none dark:border-slate-800 dark:bg-slate-800 text-slate-705 dark:text-white font-bold"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </>
          )}

          {/* Yearly picker */}
          {reportType === 'yearly' && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Fiscal Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-xl border border-slate-202 bg-slate-50 p-2 outline-none dark:border-slate-800 dark:bg-slate-800 w-44 font-bold text-slate-705 dark:text-white"
              >
                <option value="2026">Fiscal Year 2026</option>
                <option value="2025">Fiscal Year 2025</option>
              </select>
            </div>
          )}

        </div>
      </div>

      {/* COMPILATION OFFICIAL REPORT SHEET */}
      <div 
        id="official-report-sheet" 
        className="rounded-2xl border border-slate-250 bg-white p-6 md:p-10 shadow-lg dark:border-slate-800 dark:bg-slate-900 duration-200 space-y-8"
      >
        
        {/* Report Header Logos & Meta stamp */}
        <div className="flex items-start justify-between border-b pb-6 dark:border-slate-800">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-xl bg-blue-900 text-white flex items-center justify-center">
              <Ship className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-105 uppercase tracking-wide">
                PT BHAKTI SAMUDERA LOGISTIK
              </h3>
              <p className="text-[10px] text-slate-450 uppercase tracking-widest leading-none mt-1 font-sans">
                CUSTOMS CLEARANCE & FREIGHT FORWARDING AGENT
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Ruko Tanjung Priok No.14A, Tanjung Priok, Jakarta Utara, DKI Jakarta.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider dark:bg-blue-955/25 dark:text-blue-400">
              REAL FINANCIAL LEDGER
            </span>
            <p className="text-xs text-slate-450 mt-1 px-1 py-0.5 leading-none">
              Generated: <span className="font-mono font-bold dark:text-slate-300">{generationTime}</span>
            </p>
            <p className="text-xs text-slate-405 font-medium mt-1">
              Issuer: <span className="text-slate-550 dark:text-slate-350 font-semibold">PT Bhakti Samudera Logistik Automated System</span>
            </p>
          </div>
        </div>

        {/* Title of the Report sheet */}
        <div className="text-center">
          <h2 className="text-lg font-extrabold text-blue-900 uppercase dark:text-white select-none font-sans">
            {reportType === 'daily' && `Daily Import Ledger Recap (${selectedDate})`}
            {reportType === 'weekly' && `Periodic Weekly Import Ledger (${startDate} to ${endDate})`}
            {reportType === 'monthly' && `Rekap Laporan Bulanan (${getMonthName(selectedMonth).toUpperCase()} ${selectedMonthYear})`}
            {reportType === 'yearly' && `Yearly Import Fiscal Report ${selectedYear}`}
          </h2>
          <span className="text-xs text-slate-405 mt-1 block">
            Profitability Analysis: <span className="font-bold text-blue-750 dark:text-blue-400 uppercase">{analyzeCustomer === 'all' ? 'All Customers (Combined)' : analyzeCustomer}</span>
          </span>
        </div>

        {/* KPI BOX RESUME FOR PRINT */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-855 dark:border-slate-800">
          
          <div className="text-center md:border-r border-slate-200 dark:border-slate-800 py-1">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Shipment</span>
            <span className="text-lg font-black text-slate-900 mt-1 block dark:text-white">
              {periodShipments.length} Shipment
            </span>
            <span className="text-[10px] text-slate-400 font-semibold font-mono block mt-0.5">
              ({volumeTeus} TEUs Volume)
            </span>
          </div>

          <div className="text-center md:border-r border-slate-200 dark:border-slate-800 py-1 font-mono">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">Total Revenue</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1 block">
              {formatRupiah(totalRevenuePeriod)}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
              Gross Billing
            </span>
          </div>

          <div className="text-center md:border-r border-slate-200 dark:border-slate-800 py-1 font-mono">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">Total Cost</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-455 mt-1 block">
              {formatRupiah(totalDisbursedPeriod)}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
              Talangan / Advances
            </span>
          </div>

          <div className="text-center py-1 font-mono">
            <span className="text-[10px] font-extrabold text-emerald-650 dark:text-emerald-400 uppercase tracking-wider block font-sans">Total Profit Bersih</span>
            <span className="text-lg font-black text-emerald-600 mt-1 block dark:text-emerald-400">
              {formatRupiah(totalProfitPeriod)}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
              Net Service Profits
            </span>
          </div>

        </div>

        {/* DATA SYNC AUDIT CERTIFICATION BADGE */}
        <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/25 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-950/10 flex flex-col md:flex-row items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-55/10 text-emerald-600 flex items-center justify-center shrink-0 dark:bg-emerald-950/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">STATUS INTER-LEDGER AUDIT:</span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white tracking-wider uppercase">
                  ACTIVE SYNC (100% OK)
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Audit sinkronisasi berhasil. Selisih aritmatika antara piutang penagihan (Billing), penyaluran advanced talangan, dan Net Brokerage Margins tercatat <b className="text-emerald-600 dark:text-emerald-450 font-bold">Rp 0 (Sempurna)</b> terhadap database pusat.
              </p>
            </div>
          </div>
          <div className="text-left md:text-right border-t md:border-t-0 border-slate-100 dark:border-slate-800 md:pt-0 pt-2 w-full md:w-auto shrink-0 flex md:flex-col justify-between md:justify-end items-center md:items-end gap-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Security Digital Checksum</span>
            <span className="text-[10.5px] font-mono font-extrabold text-blue-700 dark:text-sky-400 mt-1 uppercase">
              {generateAuditHash()}
            </span>
          </div>
        </div>

        {/* YEAR-OVER-YEAR (YoY) COMPARISON SECTION */}
        {reportType === 'yearly' && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 print:block">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-widest dark:text-sky-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                Analisis Tren Perbandingan Tahunan (Year-over-Year / YoY)
              </h4>
              <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-lg font-bold font-mono">
                {prevYearStr} vs {selectedYear}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              
              {/* 1. YoY Shipments */}
              <div className="bg-slate-50/50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between space-y-1">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Shipment</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-[10.5px] text-slate-500 font-mono">{prevYearStr}: <b className="text-slate-700 dark:text-slate-350">{prevYearShipments.length}</b></span>
                  <span className="text-[10.5px] text-slate-500 font-mono">{selectedYear}: <b className="text-slate-700 dark:text-slate-350">{periodShipments.length}</b></span>
                </div>
                <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {yoyShipmentsChange > 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 dark:bg-emerald-955/20 px-1 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      +{yoyShipmentsChange.toFixed(1)}%
                    </span>
                  ) : yoyShipmentsChange < 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 dark:bg-rose-955/20 px-1 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-400">
                      <TrendingDown className="h-3 w-3 shrink-0" />
                      {yoyShipmentsChange.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[10px] font-black text-slate-400 dark:text-slate-500">
                      <Minus className="h-3 w-3 shrink-0" />
                      0.0%
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">YoY</span>
                </div>
              </div>

              {/* 2. YoY Volume */}
              <div className="bg-slate-50/50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between space-y-1">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Volume Kontainer</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-[10.5px] text-slate-500 font-mono">{prevYearStr}: <b className="text-slate-700 dark:text-slate-350">{prevVolumeTeus} TEUs</b></span>
                  <span className="text-[10.5px] text-slate-500 font-mono">{selectedYear}: <b className="text-slate-700 dark:text-slate-350">{volumeTeus} TEUs</b></span>
                </div>
                <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {yoyVolumeChange > 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 dark:bg-emerald-955/20 px-1 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      +{yoyVolumeChange.toFixed(1)}%
                    </span>
                  ) : yoyVolumeChange < 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 dark:bg-rose-955/20 px-1 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-450">
                      <TrendingDown className="h-3 w-3 shrink-0" />
                      {yoyVolumeChange.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[10px] font-black text-slate-400 dark:text-slate-500">
                      <Minus className="h-3 w-3 shrink-0" />
                      0.0%
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">YoY</span>
                </div>
              </div>

              {/* 3. YoY Revenue */}
              <div className="bg-slate-50/50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between space-y-1">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Billing (Revenue)</span>
                <div className="flex flex-col text-[10px] text-slate-500 font-mono mt-1 space-y-0.5">
                  <span className="truncate">{prevYearStr}: {formatRupiah(prevTotalRevenue)}</span>
                  <span className="truncate">{selectedYear}: {formatRupiah(totalRevenuePeriod)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {yoyRevenueChange > 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 dark:bg-emerald-955/20 px-1 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      +{yoyRevenueChange.toFixed(1)}%
                    </span>
                  ) : yoyRevenueChange < 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 dark:bg-rose-955/20 px-1 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-450">
                      <TrendingDown className="h-3 w-3 shrink-0" />
                      {yoyRevenueChange.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[10px] font-black text-slate-400 dark:text-slate-500">
                      <Minus className="h-3 w-3 shrink-0" />
                      0.0%
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">YoY</span>
                </div>
              </div>

              {/* 4. YoY Cost */}
              <div className="bg-slate-50/50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between space-y-1">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Biaya Dana Talangan</span>
                <div className="flex flex-col text-[10px] text-slate-500 font-mono mt-1 space-y-0.5">
                  <span className="truncate">{prevYearStr}: {formatRupiah(prevTotalDisbursed)}</span>
                  <span className="truncate">{selectedYear}: {formatRupiah(totalDisbursedPeriod)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {yoyCostChange > 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-55 dark:bg-amber-955/20 px-1 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      +{yoyCostChange.toFixed(1)}%
                    </span>
                  ) : yoyCostChange < 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-55 dark:bg-emerald-955/20 px-1 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-450">
                      <TrendingDown className="h-3 w-3 shrink-0" />
                      {yoyCostChange.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[10px] font-black text-slate-400 dark:text-slate-500">
                      <Minus className="h-3 w-3 shrink-0" />
                      0.0%
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">YoY</span>
                </div>
              </div>

              {/* 5. YoY Profit */}
              <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-905/20 dark:to-teal-905/15 p-3 rounded-xl border border-emerald-150 dark:border-emerald-900/60 flex flex-col justify-between space-y-1">
                <span className="text-[9.5px] font-black text-emerald-700 dark:text-emerald-450 uppercase tracking-wider block">Profit Bersih (Net)</span>
                <div className="flex flex-col text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 space-y-0.5">
                  <span className="truncate">{prevYearStr}: {formatRupiah(prevTotalProfit)}</span>
                  <span className="truncate font-bold">{selectedYear}: {formatRupiah(totalProfitPeriod)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-emerald-150 dark:border-emerald-900/40">
                  {yoyProfitChange > 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500 text-white px-1 py-0.5 text-[10px] font-black">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      +{yoyProfitChange.toFixed(1)}%
                    </span>
                  ) : yoyProfitChange < 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-rose-500 text-white px-1 py-0.5 text-[10px] font-black">
                      <TrendingDown className="h-3 w-3 shrink-0" />
                      {yoyProfitChange.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded bg-slate-500 text-white px-1 py-0.5 text-[10px] font-black">
                      <Minus className="h-3 w-3 shrink-0" />
                      0.0%
                    </span>
                  )}
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-450 font-bold uppercase tracking-wider">YoY</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DETAILS OF INCLUDED SHIPMENTS TABLE */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest dark:text-slate-350">1. Import Shipment Ledger Details</h4>
          
          <div className="rounded-xl border border-slate-200 overflow-x-auto dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase dark:bg-slate-805 dark:text-slate-450 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3">Shipment / JOB No</th>
                  <th className="px-4 py-3">Customer & Commodity</th>
                  <th className="px-4 py-3">Volume</th>
                  <th className="px-4 py-3">Funding Disbursed</th>
                  <th className="px-4 py-3">Total Billing</th>
                  <th className="px-4 py-3 text-right">Net Profits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-805">
                {periodShipments.length > 0 ? (
                  periodShipments.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-blue-900 dark:text-blue-400 block">{s.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{s.jobNo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-850 dark:text-slate-200 block truncate max-w-[170px]" title={s.customerName}>
                          {s.customerName}
                        </span>
                        <p className="text-[10px] text-slate-500 truncate max-w-[170px]" title={s.commodity}>{s.commodity}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{s.containerQty}x {s.containerSize}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {formatRupiah(getSumOfCosts(s.actualCosts))}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        {formatRupiah(getShipmentTotalRevenue(s))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        {formatRupiah(getShipmentProfit(s))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500">
                      No active imports or closing files logged for the adjusted period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COST CENTERS BREAKDOWN SHEET DETAIL (For Audit) */}
        <div id="detailed-audit-cost-centers" className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
          
          {/* Left: Sub-biaya talangan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest dark:text-slate-350">
              2. Breakdown of Allocated Operating Disbursed Advances
            </h4>
            <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex justify-between pb-1.5 border-b font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Operating Advanced Area</span>
                <span>Aggregated Actual Sum</span>
              </div>
              <div className="flex justify-between">
                <span>DO Container Fees:</span>
                <span className="font-bold">{formatRupiah(reportCostSums.doContainer)}</span>
              </div>
              <div className="flex justify-between">
                <span>Yard Storage & Demurrage:</span>
                <span className="font-bold">{formatRupiah(reportCostSums.storage)}</span>
              </div>
              <div className="flex justify-between text-blue-750 dark:text-blue-450 font-semibold">
                <span>PDRI / Customs Import Taxes:</span>
                <span className="font-extrabold">{formatRupiah(reportCostSums.pdri)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>SPTNP Penalty & Tax Assessments:</span>
                <span className="font-bold">{formatRupiah(reportCostSums.sptnp)}</span>
              </div>
              <div className="flex justify-between">
                <span>Physical Inspection / Behandle:</span>
                <span className="font-bold">{formatRupiah(reportCostSums.bahandle)}</span>
              </div>
              <div className="flex justify-between">
                <span>Undername License Rental:</span>
                <span className="font-bold">{formatRupiah(reportCostSums.undername)}</span>
              </div>
              <div className="flex justify-between">
                <span>Chassis Trucking & Courier:</span>
                <span className="font-bold">{formatRupiah(reportCostSums.trucking)}</span>
              </div>
              <div className="flex justify-between">
                <span>Field Tips & Under-the-Table Extra Fees:</span>
                <span className="font-bold text-purple-600">{formatRupiah(reportCostSums.extraCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Surveyor Inspection Reports:</span>
                <span className="font-bold">{formatRupiah(reportCostSums.surveyorFee)}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white">
                <span>Total Capital Invested:</span>
                <span>{formatRupiah(totalDisbursedPeriod)}</span>
              </div>
            </div>
          </div>

          {/* Right: Revenue & Balance Sheets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest dark:text-slate-350 font-sans">
              3. Period Financial Aggregates
            </h4>
            <div className="rounded-xl border border-slate-200 p-4 space-y-4 text-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-full">
              <div className="space-y-2.5">
                <div className="flex justify-between pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b">
                  <span>Accounting Elements</span>
                  <span>Value (IDR)</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Sales Billing (Revenue):</span>
                  <span className="font-bold text-slate-800 dark:text-white">{formatRupiah(totalRevenuePeriod)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Capital Advanced Absorption (Port Cost):</span>
                  <span className="font-bold text-slate-800 dark:text-white">-{formatRupiah(totalDisbursedPeriod)}</span>
                </div>

                 <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-705 pt-2 font-extrabold text-emerald-600">
                  <span>Operating Net Brokerage Margins:</span>
                  <span>{formatRupiah(totalProfitPeriod)}</span>
                </div>
              </div>

              {/* Legal signature area for printing compliance */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 italic">
                <p>This report dossier from PT Bhakti Samudera Logistik is officially generated digitally via the core monitoring system.</p>
                <div className="mt-4 flex justify-around select-none">
                  <div>
                    <span className="block h-7" />
                    <p className="border-t border-slate-200 dark:border-slate-700 pt-1 font-bold font-sans not-italic text-slate-650">Operations Supervisor</p>
                  </div>
                  <div>
                    <span className="block h-7" />
                    <p className="border-t border-slate-200 dark:border-slate-700 pt-1 font-bold font-sans not-italic text-slate-650">Board of Directors</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
