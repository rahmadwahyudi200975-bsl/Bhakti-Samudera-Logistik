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
  Search, 
  ArrowUpRight, 
  CheckCircle, 
  CreditCard, 
  Clock, 
  X,
  BadgeAlert,
  HelpCircle,
  Receipt
} from 'lucide-react';
import { Shipment, InvoiceStatus, CashFlowStatus } from '../types';

export default function RevenueView() {
  const { shipments, updateShipment } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedInvoice, setSelectedInvoice] = useState<Shipment | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Financial Aggregate Boxes
  const totalRevenue = shipments.reduce((acc, s) => acc + getShipmentTotalRevenue(s), 0);
  const totalProfits = shipments.reduce((acc, s) => acc + getShipmentProfit(s), 0);
  
  const uninvoicedRevenue = shipments
    .filter(s => s.invoiceStatus === 'Unbilled')
    .reduce((acc, s) => acc + getShipmentTotalRevenue(s), 0);

  const outstandingRevenue = shipments
    .filter(s => s.invoiceStatus === 'Invoiced')
    .reduce((acc, s) => acc + getShipmentTotalRevenue(s), 0);

  const collectedRevenue = shipments
    .filter(s => s.invoiceStatus === 'Paid')
    .reduce((acc, s) => acc + getShipmentTotalRevenue(s), 0);

  // CHANGE INVOICE STATUS
  const handleUpdateInvoiceStatus = (s: Shipment, nextStatus: InvoiceStatus) => {
    // If invoice is fully paid (Paid), then Cash Flow Status is solved! (Settled Paid)
    let cashStatus: CashFlowStatus = s.cashFlowStatus;
    if (nextStatus === 'Paid') {
      cashStatus = 'Settled (Paid)';
    } else if (getSumOfCosts(s.actualCosts) > 0) {
      cashStatus = 'Funded (Active)';
    } else {
      cashStatus = 'Unfunded';
    }

    const updated: Shipment = {
      ...s,
      invoiceStatus: nextStatus,
      cashFlowStatus: cashStatus
    };
    updateShipment(updated);
    setSelectedInvoice(null);
  };

  // FILTERING
  const filteredInvoices = shipments.filter(s => {
    const searchString = `${s.id} ${s.jobNo} ${s.customerName} ${s.commodity}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.invoiceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="revenue-view-wrapper" className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-850 dark:text-white uppercase tracking-tight font-sans">Revenue & Invoicing Portal</h2>
          <p className="text-xs text-slate-500">
            Compare service values, monitor active receivables, and verify the resulting trade gross margins.
          </p>
        </div>
        
        <button
          id="btn-explain-toggle"
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-700 px-4 py-2.5 text-xs font-bold dark:bg-blue-955/15 dark:text-blue-400 dark:border-slate-800"
        >
          <HelpCircle className="h-4 w-4" />
          {showExplanation ? "Hide Calculations" : "How BSL Computes Revenue"}
        </button>
      </div>

      {/* DETAILED LOGISTIC REVENUE EXPLANER BANNER */}
      {showExplanation && (
        <div id="bsl-formula-card" className="p-5 rounded-2xl border border-blue-150 bg-gradient-to-br from-blue-50 to-white dark:from-slate-855 dark:to-slate-900 shadow-sm text-xs leading-relaxed space-y-3">
          <h4 className="font-extrabold text-blue-900 dark:text-blue-400 uppercase tracking-widest text-xs">Billing Formulation Protocol | PT Bhakti Samudera Logistik</h4>
           <p className="text-slate-700 dark:text-slate-300 font-medium">
            Freight forwarding & customs clearance workflows require advanced disbursements at port gates prior to container release. Thus:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-slate-650 dark:text-slate-400 font-medium">
            <li>
              <strong>Total Invoice (Billing Value)</strong> = <span className="text-teal-750 font-bold dark:text-teal-400">Total Direct Service Brokerage Fees</span> (Exclusive of pass-through disbursements)
            </li>
            <li>
              <strong>Total Spend Advanced</strong> = Realized sum representing DO container, storage tariffs, PDRI Taxes, physical Inspection, and field operations.
            </li>
            <li>
              <strong>BSL Net Profit Margin</strong> = Clear brokerage service handle fee + trucking sell commission markup + undername license selling markup.
            </li>
            <li>
              <strong>Invoice Settled (Paid)</strong> = Updated when the importer pays their service fee invoice. This switches the cash flow to <strong>Settled (Paid)</strong> to free the working capital.
            </li>
          </ol>
        </div>
      )}

      {/* METRIC CARD PORTALS (AGREGASI BILLING STATUS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 col-span-1">
        
        {/* Unbilled Shipments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unbilled Drafts</span>
            <span className="h-2 w-2 rounded-full bg-slate-400 animate-ping" />
          </div>
          <p className="text-xl font-extrabold text-slate-850 dark:text-white mt-3">{formatRupiah(uninvoicedRevenue)}</p>
          <span className="text-[10px] text-slate-400 block mt-1">
            Accrued reimbursements & fees
          </span>
        </div>

        {/* Outstanding Receivables */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/15 p-5 shadow-soft-sm dark:border-amber-900/25 dark:bg-slate-850 session">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-705 uppercase tracking-widest">Outstanding Receivables</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-3">{formatRupiah(outstandingRevenue)}</p>
          <span className="text-[10px] text-slate-500 block mt-1">
            Invoiced, awaiting client payment
          </span>
        </div>

        {/* Paid / Collected Revenue */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/15 p-5 shadow-soft-sm dark:border-emerald-900/25 dark:bg-slate-850">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-705 uppercase tracking-widest font-sans">Collected Capital</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-3">{formatRupiah(collectedRevenue)}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
            Operational funding safely returned
          </span>
        </div>

        {/* Direct Net Profit Target */}
        <div className="rounded-2xl border border-slate-205 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Net Service Margins</span>
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-blue-900 dark:text-blue-450 mt-3">{formatRupiah(totalProfits)}</p>
          <span className="text-[10px] text-slate-400 block mt-1">
            Aggregated net brokerage profit
          </span>
        </div>

      </div>

      {/* FILTER CONTROLS */}
      <div className="rounded-2xl border border-slate-205 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850 flex flex-col sm:flex-row items-center gap-4">
        
        <div className="relative flex-1 w-full">
          <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            id="revenue-search-input"
            type="text"
            placeholder="Search by Shipment ID, Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-705 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200"
          />
        </div>

        <select
          id="revenue-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-202 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-805 dark:text-slate-300 w-full sm:w-60"
        >
          <option value="all">All Invoice Statuses ({shipments.length})</option>
          <option value="Unbilled">Unbilled</option>
          <option value="Invoiced">Invoiced (Outstanding)</option>
          <option value="Paid">Paid (Settled)</option>
        </select>

      </div>

      {/* INVOICE MASTER TABLE */}
      <div className="rounded-2xl border border-slate-205 bg-white shadow-soft-sm dark:border-slate-800 dark:bg-slate-850 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:border-slate-850 dark:bg-slate-800">
                <th className="px-5 py-4 min-w-[120px]">Shipment / JOB No</th>
                <th className="px-5 py-4 min-w-[160px]">Importer & Container</th>
                <th className="px-5 py-4 min-w-[130px]">Reimbursement Funding</th>
                <th className="px-5 py-4 min-w-[120px]">Direct Service Fees</th>
                <th className="px-5 py-4 min-w-[140px]">Final Client Billing</th>
                <th className="px-5 py-4 min-w-[110px]">Gross Profit</th>
                <th className="px-5 py-4 text-center min-w-[180px]">Billing & Payment Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-805">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((s) => {
                  const actualTalangan = getSumOfCosts(s.actualCosts);
                  const totalBilling = getShipmentTotalRevenue(s);
                  const profit = getShipmentProfit(s);
                  
                  const directJasaFee = 
                    s.revenue.handlingFee + 
                    s.revenue.truckingSelling + 
                    s.revenue.undernameSelling + 
                    s.revenue.reimbursementMarkup;

                  return (
                    <tr key={s.id} className="text-xs hover:bg-slate-50 dark:hover:bg-slate-805/40 transition-colors">
                      
                      {/* ID / JOB */}
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-slate-800 dark:text-white block">{s.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{s.jobNo}</span>
                      </td>

                      {/* Customer Info & Container Type */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-855 dark:text-slate-100 block max-w-[160px] truncate" title={s.customerName}>
                          {s.customerName}
                        </span>
                        <span className="text-[10px] text-slate-450 mt-1 block font-sans">
                          Size {s.containerQty}x {s.containerSize}
                        </span>
                      </td>

                      {/* ACTIVE REIMBURSEMENT VALUE */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {formatRupiah(actualTalangan)}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Disbursed port advance
                        </span>
                      </td>

                      {/* SERVICE CHARGES */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {formatRupiah(directJasaFee)}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Standard fee + markups
                        </span>
                      </td>

                      {/* TOTAL OUTSTANDING BILL FOR THE CLIENT */}
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-blue-900 dark:text-blue-400 block text-xs">
                          {formatRupiah(totalBilling)}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          (Reimbursement + Fees)
                        </span>
                      </td>

                      {/* PURE BSL MARGIN PROFIT */}
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-emerald-600 block">
                          {formatRupiah(profit)}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Brokerage net profit
                        </span>
                      </td>

                      {/* INVOICE & CASH FLOW STATUS CONTROLLER */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Visual Dynamic Badges */}
                          <span className={`inline-block rounded px-2.5 py-1 text-[11px] font-bold ${
                            s.invoiceStatus === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40 dark:bg-emerald-950/25 dark:text-emerald-400' 
                              : s.invoiceStatus === 'Invoiced'
                              ? 'bg-amber-50 text-amber-750 border border-amber-200/40 dark:bg-amber-955/20 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-655 border border-slate-200/40 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {s.invoiceStatus}
                          </span>

                          {/* Action update status */}
                          <button
                            id={`btn-charge-${s.id}`}
                            onClick={() => setSelectedInvoice(s)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1.5 transition-all outline-none"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Payment Settings
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Receipt className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-800 mb-3 animate-pulse" />
                    No invoice entries found matching the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTION PAYMENT CONTROL POPUP MODAL */}
      {selectedInvoice && (
        <div id="payment-control-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-250 bg-white shadow-2xl dark:border-slate-805 dark:bg-slate-900 animate-slide-up flex flex-col p-6 text-xs gap-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-805">
              <div>
                <h4 className="font-extrabold uppercase tracking-wide text-slate-855 dark:text-white font-sans">Alter Invoice & Payment Status</h4>
                <p className="text-[10px] text-slate-450 mt-0.5">Shipment ID: {selectedInvoice.id}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-slate-500 block">Final Invoice Breakdown:</span>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-805 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-medium">Customer Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455 font-medium">Funding Reimbursement:</span>
                  <span className="font-bold text-slate-805 dark:text-slate-200">{formatRupiah(getSumOfCosts(selectedInvoice.actualCosts))}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-700 pt-2 font-bold select-none">
                  <span className="text-blue-700 dark:text-blue-400">Total Client Invoice:</span>
                  <span className="text-blue-805 dark:text-blue-400">{formatRupiah(getShipmentTotalRevenue(selectedInvoice))}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-slate-500 block">Alter Invoicing Status Option:</span>
              
              <div className="grid grid-cols-1 gap-2">
                
                {/* 1. Unbilled */}
                <button
                  id="pay-opt-unbilled"
                  type="button"
                  onClick={() => handleUpdateInvoiceStatus(selectedInvoice, 'Unbilled')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedInvoice.invoiceStatus === 'Unbilled'
                      ? 'border-slate-350 bg-slate-50 font-bold text-slate-905 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-600 dark:border-slate-805 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-slate-400" />
                    <div>
                      <p className="font-bold">Unbilled (Draft)</p>
                      <p className="text-[10px] text-slate-400 mt-1">Keep invoice as draft for monthly closing</p>
                    </div>
                  </div>
                </button>

                {/* 2. Invoiced */}
                <button
                  id="pay-opt-outstanding"
                  type="button"
                  onClick={() => handleUpdateInvoiceStatus(selectedInvoice, 'Invoiced')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedInvoice.invoiceStatus === 'Invoiced'
                      ? 'border-amber-300 bg-amber-50/20 font-bold text-amber-805 dark:border-amber-805 dark:bg-amber-955/10 dark:text-amber-400'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-600 dark:border-slate-805 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BadgeAlert className="h-4.5 w-4.5 text-amber-500" />
                    <div>
                      <p className="font-bold">Invoiced (Outstanding)</p>
                      <p className="text-[10px] text-slate-405 mt-1">Invoice officially sent, awaiting client payment</p>
                    </div>
                  </div>
                </button>

                {/* 3. Paid */}
                <button
                  id="pay-opt-paid"
                  type="button"
                  onClick={() => handleUpdateInvoiceStatus(selectedInvoice, 'Paid')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedInvoice.invoiceStatus === 'Paid'
                      ? 'border-green-300 bg-green-50/20 font-bold text-green-800 dark:border-green-805 dark:bg-green-955/15 dark:text-green-400'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-650 dark:border-slate-805 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-green-500" />
                    <div>
                      <p className="font-bold">Paid (Settled - Funding Safely Returned)</p>
                      <p className="text-[10px] text-slate-405 mt-1">Disbursed capital & service commission fully returned</p>
                    </div>
                  </div>
                </button>

              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 font-bold text-slate-705 hover:bg-slate-50 dark:border-slate-705 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
