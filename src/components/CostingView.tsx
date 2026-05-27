/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  getSumOfCosts, 
  formatRupiah 
} from '../data';
import { 
  Coins, 
  Search, 
  AlertTriangle, 
  X,
  Calculator
} from 'lucide-react';
import { Shipment, CostBreakdown, CashFlowStatus } from '../types';
import FormattedNumberInput from './FormattedNumberInput';

export default function CostingView() {
  const { 
    shipments, 
    updateShipment 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOverrunOnly, setFilterOverrunOnly] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // FORM BINDINGS FOR ACTUAL SPEND ENTRY
  const [actDo, setActDo] = useState(0);
  const [actStorage, setActStorage] = useState(0);
  const [actPdri, setActPdri] = useState(0);
  const [actSptnp, setActSptnp] = useState(0);
  const [actBahandle, setActBahandle] = useState(0);
  const [actUndername, setActUndername] = useState(0);
  const [actTrucking, setActTrucking] = useState(0);
  const [actExtra, setActExtra] = useState(0);
  const [actOperational, setActOperational] = useState(0);
  const [actSurveyor, setActSurveyor] = useState(0);

  // OPEN ACTUAL MODEL
  const handleOpenActualModal = (s: Shipment) => {
    setSelectedShipment(s);
    setActDo(s.actualCosts.doContainer);
    setActStorage(s.actualCosts.storage);
    setActPdri(s.actualCosts.pdri);
    setActSptnp(s.actualCosts.sptnp);
    setActBahandle(s.actualCosts.bahandle);
    setActUndername(s.actualCosts.undername);
    setActTrucking(s.actualCosts.trucking);
    setActExtra(s.actualCosts.extraCost);
    setActOperational(s.actualCosts.operationalCost);
    setActSurveyor(s.actualCosts.surveyorFee);
  };

  // SAVE ACTUAL OPERATIONAL SPENDINGS
  const handleSaveActualCosts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    const actualCosts: CostBreakdown = {
      doContainer: Number(actDo),
      storage: Number(actStorage),
      pdri: Number(actPdri),
      sptnp: Number(actSptnp),
      bahandle: Number(actBahandle),
      undername: Number(actUndername),
      trucking: Number(actTrucking),
      extraCost: Number(actExtra),
      operationalCost: Number(actOperational),
      surveyorFee: Number(actSurveyor)
    };

    // If actual spending is logged, status shifts to active funding
    let newCashStatus: CashFlowStatus = selectedShipment.cashFlowStatus;
    const actualSum = getSumOfCosts(actualCosts);
    if (actualSum > 0 && selectedShipment.cashFlowStatus === 'Unfunded') {
      newCashStatus = 'Funded (Active)';
    }

    const updated: Shipment = {
      ...selectedShipment,
      actualCosts,
      cashFlowStatus: newCashStatus
    };

    updateShipment(updated);
    setSelectedShipment(null);
  };

  // COST FILTERING LOGIC
  const filteredCostings = shipments.filter(s => {
    const searchString = `${s.id} ${s.jobNo} ${s.customerName} ${s.commodity}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const estSum = getSumOfCosts(s.estimatedCosts);
    const actSum = getSumOfCosts(s.actualCosts);
    const hasOverrun = actSum > estSum && estSum > 0;
    
    return matchesSearch && (!filterOverrunOnly || hasOverrun);
  });

  return (
    <div id="costing-view-wrapper" className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-850 dark:text-white uppercase tracking-tight font-sans">Costing & Funding Realization</h2>
          <p className="text-xs text-slate-500">
            Monitor pure operational advance disbursements (DO, Storage, PDRI import taxes, Field extra fees) vs original plan.
          </p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="rounded-2xl border border-slate-205 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-850">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              id="costing-search-input"
              type="text"
              placeholder="Search by Shipment ID, JOB Number, Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-705 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-805 dark:text-slate-200"
            />
          </div>

          {/* Toggle show overrun Warning */}
          <button
            id="costing-toggle-overrun"
            onClick={() => setFilterOverrunOnly(!filterOverrunOnly)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
              filterOverrunOnly 
                ? 'bg-rose-50 border-rose-250 text-rose-705 dark:bg-rose-955/20 dark:text-rose-400' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-805 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Overrun Costs Only
          </button>

        </div>
      </div>

      {/* TABULAR BUDGET VS ACTUAL MATRIX */}
      <div className="rounded-2xl border border-slate-205 bg-white shadow-soft-sm dark:border-slate-800 dark:bg-slate-850 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:border-slate-850 dark:bg-slate-800">
                <th className="px-5 py-4 min-w-[120px]">Shipment / JOB</th>
                <th className="px-5 py-4 min-w-[150px]">Customer</th>
                <th className="px-5 py-4 min-w-[140px]">Budgeted (Estimate)</th>
                <th className="px-5 py-4 min-w-[140px]">Disbursed (Actual)</th>
                <th className="px-5 py-4 min-w-[120px]">Cost Deviation Status</th>
                <th className="px-5 py-4 text-center min-w-[170px]">Disbursements Logging</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-805">
              {filteredCostings.length > 0 ? (
                filteredCostings.map((s) => {
                  const estSum = getSumOfCosts(s.estimatedCosts);
                  const actSum = getSumOfCosts(s.actualCosts);
                  const isOverrun = actSum > estSum && estSum > 0;
                  const variancePercent = estSum > 0 ? ((actSum - estSum) / estSum) * 100 : 0;

                  return (
                    <tr key={s.id} className="text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* ID / JOB */}
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-blue-900 dark:text-blue-450 block">{s.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">{s.jobNo}</span>
                      </td>

                      {/* Customer / Importir */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-805 dark:text-slate-100 block">{s.customerName}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[180px] block" title={s.commodity}>
                          {s.commodity}
                        </span>
                      </td>

                      {/* TOTAL ESTIMATED DO BUDGET (PLAN) */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {formatRupiah(estSum)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-none">
                          DO: {formatRupiah(s.estimatedCosts.doContainer)}
                        </span>
                      </td>

                      {/* TOTAL REALIZED DISBURSEMENT (ACTUAL) */}
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-slate-900 dark:text-white block">
                          {formatRupiah(actSum)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-none">
                          Storage: {formatRupiah(s.actualCosts.storage)}
                        </span>
                      </td>

                      {/* VARIANCE / COST EXCEEDED STATE */}
                      <td className="px-5 py-4">
                        {actSum === 0 ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-605 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">
                            Capital Undisbursed
                          </span>
                        ) : isOverrun ? (
                          <div className="space-y-0.5 leading-none">
                            <span className="font-bold text-rose-500 flex items-center gap-0.5">
                              ⚠️ OVERRUN
                            </span>
                            <span className="text-[10px] text-rose-450 font-bold font-mono">
                              +{variancePercent.toFixed(1)}% (+{formatRupiah(actSum - estSum)})
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5 leading-none">
                            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                              ✓ EFFICIENT
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Budget secured
                            </span>
                          </div>
                        )}
                      </td>

                      {/* RECORD ACTUAL BILLING OR ACC */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Record actual cash spent values */}
                          <button
                            id={`act-entry-${s.id}`}
                            onClick={() => handleOpenActualModal(s)}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 font-bold text-[10px] text-white hover:bg-blue-750 px-3 py-1.5 transition-all outline-none shadow-soft-sm"
                          >
                            <Coins className="h-3.5 w-3.5" /> Log Actual Disbursed
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-600">
                    <Calculator className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-700 mb-3 animate-bounce" />
                    No operational costing found for the adjusted filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED ACTUAL SPENDINGS INPUTTER BANNER MODAL */}
      {selectedShipment && (
        <div id="costing-actual-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-slide-up flex flex-col my-8 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-150 p-5 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-850 dark:text-slate-100 font-sans">
                  Log Actual Expenditures: {selectedShipment.id}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enter actual port funding costs. Retain physical slips & receipts for compliance audits.
                </p>
              </div>
              <button 
                onClick={() => setSelectedShipment(null)}
                className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comparison card */}
            <div className="m-6 p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-855 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Budget Plan (Estimate):</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white block mt-0.5">
                  {formatRupiah(getSumOfCosts(selectedShipment.estimatedCosts))}
                </span>
              </div>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSaveActualCosts} className="flex-1 overflow-y-auto px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
              
              <div>
                <label className="block font-bold text-slate-500 mb-1">Actual DO Container (IDR)</label>
                <FormattedNumberInput
                  value={actDo}
                  onChange={setActDo}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-805"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Actual Storage & Demurrage (IDR)</label>
                <FormattedNumberInput
                  value={actStorage}
                  onChange={setActStorage}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-805"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Actual PDRI Customs Import Taxes (IDR)</label>
                <FormattedNumberInput
                  value={actPdri}
                  onChange={setActPdri}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-805"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Actual SPTNP Customs Penalty (IDR)</label>
                <FormattedNumberInput
                  value={actSptnp}
                  onChange={setActSptnp}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-805"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Actual Physical Inspection / Behandle (IDR)</label>
                <FormattedNumberInput
                  value={actBahandle}
                  onChange={setActBahandle}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-805"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Actual Undername License Rental (IDR)</label>
                <FormattedNumberInput
                  value={actUndername}
                  onChange={setActUndername}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-805"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Actual Trucking Delivery Fee (IDR)</label>
                <FormattedNumberInput
                  value={actTrucking}
                  onChange={setActTrucking}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850"
                  id="act-trucking-input"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Actual Extra Costs (IDR)</label>
                <FormattedNumberInput
                  value={actExtra}
                  onChange={setActExtra}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-805"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-550 mb-1">Actual Operation Cost (IDR)</label>
                <FormattedNumberInput
                  value={actOperational}
                  onChange={setActOperational}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-550 mb-1">Actual Surveyor Report Assessment (IDR)</label>
                <FormattedNumberInput
                  value={actSurveyor}
                  onChange={setActSurveyor}
                  className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-805"
                />
              </div>

              {/* Grand Total comparison */}
              <div className="sm:col-span-2 mt-4 p-4 rounded-xl border border-blue-250 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-955/15 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-350">Total Actual Disbursements Logged:</span>
                <span className="text-lg font-extrabold text-blue-900 dark:text-blue-400">
                  {formatRupiah(
                    Number(actDo) + 
                    Number(actStorage) + 
                    Number(actPdri) + 
                    Number(actSptnp) + 
                    Number(actBahandle) + 
                    Number(actUndername) + 
                    Number(actTrucking) + 
                    Number(actExtra) + 
                    Number(actOperational) + 
                    Number(actSurveyor)
                  )}
                </span>
              </div>
            </form>

            {/* Bottom Controllers */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-150 p-5 dark:border-slate-800 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                className="rounded-xl border border-slate-250 bg-white px-5 py-2.5 font-bold text-slate-705 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-350"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveActualCosts}
                className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-900/35"
              >
                Save Disbursements
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
