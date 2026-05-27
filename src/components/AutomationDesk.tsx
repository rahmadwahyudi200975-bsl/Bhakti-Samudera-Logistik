/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileSpreadsheet, 
  Download, 
  UploadCloud, 
  Sparkles, 
  Percent, 
  BookOpen, 
  ClipboardCheck, 
  CheckCircle2, 
  Zap, 
  Layers, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Eye,
  Info,
  Smartphone
} from 'lucide-react';
import { validateISO6346 } from '../utils/containerValidator';
import { ContainerSize, CustomClearanceStatus, Shipment, CostBreakdown, RevenueBreakdown } from '../types';
import { formatRupiah } from '../data';

export default function AutomationDesk() {
  const { shipments, addShipment, addLog, updateShipment } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'calc' | 'ocr'>('import');
  
  // Spreadsheet Importer States
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // Tax Calculator States
  const [hsCode, setHsCode] = useState('7208'); // Steel product
  const [cifUsd, setCifUsd] = useState(25000); // CIF in USD
  const [exchangeRate, setExchangeRate] = useState(16350); // exchange rate IDR
  const [calculatedTaxes, setCalculatedTaxes] = useState<any | null>(null);
  const [targetShipmentId, setTargetShipmentId] = useState('');
  const [taxApplySuccess, setTaxApplySuccess] = useState(false);

  // OCR Simulator States
  const [ocrScanning, setOcrScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  // Template datasets for instant importing without typing
  const IMPORT_TEMPLATES = [
    {
      name: 'Manifest Besi Baja PT Krakatau (3 Kontainer)',
      csv: `CustomerName,Commodity,ContainerNo,ContainerSize,ContainerQty,ETA,BLNumber,PIBNo,PortOfDischargeCode,CargoValueUSD,ServiceFeeIDR
"PT Krakatau Steel Tbk","Besi Baja Slab H-Beam","MSKU4582910","40ft HC",3,"2026-06-12","MSK9917362","0218392","IDTPE",75000,12000000
"PT Krakatau Steel Tbk","Plat Besi Hot Rolled Coil","HLXU8817265","40ft",2,"2026-06-14","HLX8812635","0298172","IDTPE",62000,8500000
"PT Krakatau Steel Tbk","Baja Paduan Spesial","OCGU3345812","20ft",1,"2026-06-18","OCG7162541","0254321","IDTPE",41000,6000000`
    },
    {
      name: 'Konsinyasi Tekstil PT Sandang Prima (2 LCL / FCL)',
      csv: `CustomerName,Commodity,ContainerNo,ContainerSize,ContainerQty,ETA,BLNumber,PIBNo,PortOfDischargeCode,CargoValueUSD,ServiceFeeIDR
"PT Sandang Prima Indo","Synthetic Fiber Yarn 5402","TGBU6615729","20ft",2,"2026-06-22","TGB6655123","0312543","IDTPP",38000,9000000
"PT Sandang Prima Indo","Bahan Kain Gulungan Katun","LCL-TEMPORARY","LCL",1,"2026-06-26","LCL8817351","0312999","IDTPP",14000,4500000`
    }
  ];

  const HS_CODES = [
    { code: '7208', name: 'HS 7208: Besi & Flat-Steel (Bea Masuk: 10%, PPN: 11%, PPH: 2.5%)', bm: 10, ppn: 11, pph: 2.5 },
    { code: '8471', name: 'HS 8471: Komputer, Server, IT (Bea Masuk: 0%, PPN: 11%, PPH: 2.5%)', bm: 0, ppn: 11, pph: 2.5 },
    { code: '3907', name: 'HS 3907: Bahan Plastik Polimer (Bea Masuk: 5%, PPN: 11%, PPH: 7.5%)', bm: 5, ppn: 11, pph: 7.5 },
    { code: '5402', name: 'HS 5402: Benang Sintetis/Filament (Bea Masuk: 10%, PPN: 11%, PPH: 7.5%)', bm: 10, ppn: 11, pph: 7.5 },
    { code: '8708', name: 'HS 8708: Komponen & Aksesoris Otomotif (Bea Masuk: 15%, PPN: 11%, PPH: 2.5%)', bm: 15, ppn: 11, pph: 2.5 }
  ];

  // Helper cost structure builder to reduce boilerplate
  const makeDefaultCosts = (pdriTax: number = 0, trucking: number = 2500000): CostBreakdown => ({
    doContainer: 1200000,
    storage: 850000,
    pdri: pdriTax,
    sptnp: 0,
    bahandle: 0,
    undername: 0,
    trucking: trucking,
    extraCost: 0,
    operationalCost: 350000,
    surveyorFee: 0
  });

  const makeDefaultRevenue = (serviceFee: number): RevenueBreakdown => ({
    handlingFee: serviceFee,
    truckingSelling: 3200000,
    undernameSelling: 0,
    reimbursementMarkup: 0
  });

  // Load a copy-paste Excel/CSV template immediately
  const handleLoadTemplate = (csvContent: string) => {
    setCsvText(csvContent);
    setImportStatus(null);
    parsePreview(csvContent);
  };

  // Preview the excel data parsed on the fly
  const parsePreview = (txt: string) => {
    if (!txt.trim()) {
      setImportPreview([]);
      return;
    }
    const lines = txt.trim().split('\n');
    if (lines.length <= 1) {
      setImportPreview([]);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Basic CSV splitter (supporting simple quoted fields)
      const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cells = matches.map(c => c.trim().replace(/^["']|["']$/g, ''));

      if (cells.length < headers.length) continue;

      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cells[idx];
      });
      rows.push(rowObj);
    }
    setImportPreview(rows);
  };

  // Execute Batch Automated Shipment Creation
  const handleProcessImport = () => {
    if (importPreview.length === 0) {
      setImportStatus({ success: false, message: 'Harap isi data CSV atau pilih salah satu template instan di atas.' });
      return;
    }

    let successCount = 0;
    try {
      importPreview.forEach((row, idx) => {
        const customerName = row.CustomerName || 'Unassigned Customer';
        const commodity = row.Commodity || 'General Cargo';
        const containerNo = row.ContainerNo || `MSKU${Math.floor(1000000 + Math.random() * 9000000)}`;
        const size: ContainerSize = (row.ContainerSize === '20ft' || row.ContainerSize === '40ft' || row.ContainerSize === '40ft HC' || row.ContainerSize === 'LCL')
          ? row.ContainerSize as ContainerSize
          : '40ft';
        
        const qty = parseInt(row.ContainerQty, 10) || 1;
        const eta = row.ETA || new Date().toISOString().split('T')[0];
        const bl = row.BLNumber || `MSKBL${Math.floor(1000000 + Math.random() * 9000000)}`;
        const pib = row.PIBNo || `0${Math.floor(100000 + Math.random() * 900000)}`;
        const portName = row.PortOfDischargeCode === 'IDTPE' ? 'Tanjung Perak, Surabaya' : 'Tanjung Priok, Jakarta';
        const cargoVal = parseFloat(row.CargoValueUSD) || 30000;
        const fee = parseFloat(row.ServiceFeeIDR) || 7500000;

        // Auto calculate estimated PDRI Custom Taxes (11% VAT + 2.5% Income + 5% duty estimate on cargo value in IDR)
        const exchangeVal = 16350;
        const cifInIdr = cargoVal * exchangeVal;
        const estimatedPdri = Math.round(cifInIdr * 0.185); // roughly 18.5% total import costs

        // Generate clean automation sequences
        const sequence = (shipments.length + 1 + idx).toString().padStart(4, '0');
        const customJobNo = `JOB/2026/06/${sequence}`;

        // Verify container format
        const valRes = validateISO6346(containerNo);
        const cargoContainerNum = valRes.isValid ? containerNo : `KKFU${Math.floor(1000000 + Math.random() * 9000000)}`;

        // Build default checklists
        const targetDate = new Date(eta);
        targetDate.setDate(targetDate.getDate() + 5);
        const targetCompletionStr = targetDate.toISOString().split('T')[0];

        addShipment({
          shipmentType: 'Import',
          jobNo: customJobNo,
          customerName,
          commodity,
          eta,
          blNumber: bl,
          pibNo: pib,
          containerSize: size,
          containerQty: qty,
          containerNumber: cargoContainerNum,
          portOfDischarge: portName,
          targetCompletionDate: targetCompletionStr,
          status: 'Document Checking', // Starts instantly at clean checking omitting drafts
          estimatedCosts: makeDefaultCosts(estimatedPdri),
          actualCosts: makeDefaultCosts(0, 0), // actual is empty initially
          revenue: makeDefaultRevenue(fee),
          invoiceStatus: 'Unbilled',
          cashFlowStatus: 'Unfunded',
          notes: 'Batch imported automatically via Spreadsheet Automation Portal. No manual paper/Excel dependencies.',
          isApproved: false,
          documentChecklist: {
            billOfLading: true,
            invoicePackingList: true,
            pibDeclaration: true,
            customsTaxPaid: false,
            doReleased: false,
            sppbReleased: false
          }
        });

        addLog(`Imported via AUTOMATED SPREADSHEET DIGESTOR [${customJobNo}]`, `BSL-2026-${sequence}`, customJobNo);
        successCount++;
      });

      setImportStatus({
        success: true,
        message: `BERHASIL! ${successCount} data manifes kargo berhasil didorong masuk ke server database digital pusat secara instan.`,
        count: successCount
      });
      setCsvText('');
      setImportPreview([]);
    } catch (err: any) {
      setImportStatus({ success: false, message: `System error during compilation: ${err.message}` });
    }
  };

  // Generate real CSV from state for excel download
  const handleExportCSV = () => {
    try {
      const headers = [
        'Shipment_ID',
        'Job_Number',
        'Customer_Importer',
        'Commodity',
        'Type',
        'ETA_Arrival',
        'BL_Number',
        'PIB_Number',
        'Container_Size',
        'Container_Qty',
        'Container_No',
        'Port',
        'Customs_Status',
        'Invoice_Status',
        'Funding_Status',
        'Service_Fee_Revenue',
        'Estimated_PDRI_Taxes',
        'Approved_By_Director'
      ];

      const csvRows = [headers.join(',')];

      shipments.forEach(s => {
        const row = [
          `"${s.id}"`,
          `"${s.jobNo}"`,
          `"${s.customerName.replace(/"/g, '""')}"`,
          `"${s.commodity.replace(/"/g, '""')}"`,
          `"${s.shipmentType}"`,
          `"${s.eta}"`,
          `"${s.blNumber}"`,
          `"${s.pibNo}"`,
          `"${s.containerSize}"`,
          s.containerQty,
          `"${s.containerNumber || ''}"`,
          `"${s.portOfDischarge || ''}"`,
          `"${s.status}"`,
          `"${s.invoiceStatus}"`,
          `"${s.cashFlowStatus}"`,
          s.revenue.handlingFee,
          s.estimatedCosts.pdri,
          s.isApproved ? 'Approved' : 'Pending'
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'BSL_MASTER_SHIPMENT_LEDGER.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addLog('Generated Master Excel/CSV Ledger Download from Device', 'SYSTEM', 'EXPORT');
    } catch (err) {
      alert('Gagal mengekspor data: ' + err);
    }
  };

  // Direct Clipboard Copy
  const handleCopyClipboard = () => {
    try {
      const headers = 'ID\tJOB\tCustomer\tCommodity\tETA\tB/L\tSize\tQty\tStatus\tHandlingFee\n';
      const rows = shipments.map(s => 
        `${s.id}\t${s.jobNo}\t${s.customerName}\t${s.commodity}\t${s.eta}\t${s.blNumber}\t${s.containerSize}\t${s.containerQty}\t${s.status}\t${s.revenue.handlingFee}`
      ).join('\n');

      navigator.clipboard.writeText(headers + rows);
      alert('Tabel database berhasil disalin ke clipboard! Anda bisa langsung paste (Ctrl+V) di Microsoft Excel atau Google Sheets.');
    } catch (err) {
      alert('Gagal menyalin: Gunakan ekspor file .csv langsung.');
    }
  };

  // PIB Tax Tariff Calculator core actions
  const handleCalculateTaxes = (e: React.FormEvent) => {
    e.preventDefault();
    const tariff = HS_CODES.find(h => h.code === hsCode) || HS_CODES[0];
    const cifInIdr = Math.round(cifUsd * exchangeRate);
    
    // Indonesian Custom Duties Calculation formula:
    // 1. Bea Masuk = duty% * CIF IDR
    // 2. Nilai Impor (Customs Value) = CIF IDR + Bea Masuk
    // 3. PPN = PPN% * Nilai Impor
    // 4. PPH 22 Impor = PPH% * Nilai Impor
    const beaMasuk = Math.round((tariff.bm / 100) * cifInIdr);
    const nilaiImpor = cifInIdr + beaMasuk;
    const ppn = Math.round((tariff.ppn / 100) * nilaiImpor);
    const pph = Math.round((tariff.pph / 100) * nilaiImpor);
    const totalPdri = beaMasuk + ppn + pph;

    setCalculatedTaxes({
      cifInIdr,
      bmValue: beaMasuk,
      nilaiImpor,
      ppnValue: ppn,
      pphValue: pph,
      totalPdri,
      tariff
    });
    setTaxApplySuccess(false);
  };

  // Automated Overwriting of Shipment Estimated PDRI Cost
  const handleApplyTaxToShipment = () => {
    if (!targetShipmentId || !calculatedTaxes) return;
    const item = shipments.find(s => s.id === targetShipmentId);
    if (!item) return;

    const updatedShipment: Shipment = {
      ...item,
      estimatedCosts: {
        ...item.estimatedCosts,
        pdri: calculatedTaxes.totalPdri
      },
      notes: `${item.notes || ''} [AUTO-CALC] Bea Masuk & PDRI Pajak Pajak hitung otomatis via HS Code ${calculatedTaxes.tariff.code} dihitung dari CIF USD ${cifUsd}.`.trim()
    };

    updateShipment(updatedShipment);
    addLog(`Automated customs tax calculator applied to [${item.id}] - PDRI: Rp ${calculatedTaxes.totalPdri.toLocaleString()}`, item.id, item.jobNo);
    setTaxApplySuccess(true);
    setTimeout(() => setTaxApplySuccess(false), 2500);
  };

  // Run mock scanner simulating AI OCR Paper Reading
  const handleSimulateOCR = () => {
    setOcrScanning(true);
    setScanProgress(0);
    setExtractedData(null);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setOcrScanning(false);
          
          // Generate automated random extraction
          const importers = ['PT Krakatau Steel Tbk', 'PT Sandang Prima Indo', 'PT Indofood CBP Sukses', 'PT United Tractors Tbk', 'PT Tjiwi Kimia Tbk'];
          const commodities = ['High-Tensile Cold Rolled Coil', 'Cotton Weft Spun Yarn', 'Flavor Seasoning Packets', 'Heavy Excavator Spare-Parts', 'Coated Coated Paper Rolls'];
          const sampleImporter = importers[Math.floor(Math.random() * importers.length)];
          const sampleCommodity = commodities[Math.floor(Math.random() * commodities.length)];
          const randomBl = `MSKBL${Math.floor(1000000 + Math.random() * 9000000)}`;
          const randomPib = `03${Math.floor(100000 + Math.random() * 900000)}`;
          const sizes: ContainerSize[] = ['20ft', '40ft', '40ft HC', 'LCL']; 
          const cleanSize = sizes[Math.floor(Math.random() * sizes.length)];
          
          setExtractedData({
            customerName: sampleImporter,
            commodity: sampleCommodity,
            blNumber: randomBl,
            pibNo: randomPib,
            containerSize: cleanSize,
            containerQty: Math.floor(1 + Math.random() * 4),
            portOfDischarge: 'Tanjung Priok, Jakarta',
            containerNumber: `OCGU${Math.floor(1000000 + Math.random() * 9000000)}`,
            serviceFee: Math.floor(6 + Math.random() * 12) * 1000000,
            estimatedPdri: Math.floor(15 + Math.random() * 60) * 1000000,
            confidence: 98.4
          });
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  // Register the extracted OCR results directly with 1 Touch
  const handleRegisterOCRDraft = () => {
    if (!extractedData) return;
    
    const today = new Date().toISOString().split('T')[0];
    const sequence = (shipments.length + 1).toString().padStart(4, '0');
    const customJobNo = `JOB/2026/06/${sequence}`;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    const targetCompletionStr = targetDate.toISOString().split('T')[0];

    addShipment({
      shipmentType: 'Import',
      jobNo: customJobNo,
      customerName: extractedData.customerName,
      commodity: extractedData.commodity,
      eta: today,
      blNumber: extractedData.blNumber,
      pibNo: extractedData.pibNo,
      containerSize: extractedData.containerSize,
      containerQty: extractedData.containerQty,
      containerNumber: extractedData.containerNumber,
      portOfDischarge: extractedData.portOfDischarge,
      targetCompletionDate: targetCompletionStr,
      status: 'Draft',
      estimatedCosts: makeDefaultCosts(extractedData.estimatedPdri),
      actualCosts: makeDefaultCosts(0, 0),
      revenue: makeDefaultRevenue(extractedData.serviceFee),
      invoiceStatus: 'Unbilled',
      cashFlowStatus: 'Unfunded',
      notes: `Digitisasi otomatis berkas kertas via Scanner Kamera HP (Akurasi Sensor AI OCR: ${extractedData.confidence}%).`,
      isApproved: false,
      documentChecklist: {
        billOfLading: true,
        invoicePackingList: true,
        pibDeclaration: false,
        customsTaxPaid: false,
        doReleased: false,
        sppbReleased: false
      }
    });

    addLog(`Digitized paper B/L via Camera OCR Scanner [${customJobNo}]`, `BSL-2026-${sequence}`, customJobNo);
    alert(`Sukses! Registrasi data kargo kargo hasil scan OCR telah didaftarkan dengan ID BSL-2026-${sequence}.`);
    setExtractedData(null);
  };

  return (
    <div id="smart-automation-desk-container" className="mb-6">
      {/* Interactive Toggle Control Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl cursor-pointer select-none shadow-md shadow-indigo-900/10 hover:from-blue-650 hover:to-indigo-750 transition-all duration-200"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-wide uppercase">Pusat Otomatisasi & Digitalisasi Laptop/HP</h3>
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-slate-900 tracking-wider animate-pulse">
                ANTI-KERTAS & EXCEL
              </span>
            </div>
            <p className="text-[11px] text-white/80 leading-normal mt-0.5">
              Kelola ekspor-impor data instan, auto-hitung pajak HS Code, dan scan dokumen fisik lewat HP di lapangan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[10px] bg-slate-900/30 text-slate-100 font-mono px-2 py-1 rounded-md">
            <Smartphone className="h-3 w-3 text-emerald-400" />
            <span>Responsive Mobile Cockpit Active</span>
          </div>
          <span className="text-xs font-bold px-2 py-1 bg-white/20 rounded-md">
            {isOpen ? 'Sembunyikan Panel' : 'Buka Dashboard'}
          </span>
        </div>
      </div>

      {/* Main Collapsible Core Controls Panel */}
      {isOpen && (
        <div className="mt-3.5 rounded-2xl border border-slate-205 bg-white p-5 shadow-soft-sm dark:border-slate-800 dark:bg-slate-855 animate-fade-in">
          
          {/* Dynamic Responsive Tab Bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 mb-5 no-scrollbar pb-1">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold tracking-wide uppercase transition-all whitespace-nowrap ${
                activeTab === 'import'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              Spreadsheet Importer
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold tracking-wide uppercase transition-all whitespace-nowrap ${
                activeTab === 'export'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Dynamic Exporter (.CSV)
            </button>
            <button
              onClick={() => setActiveTab('calc')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold tracking-wide uppercase transition-all whitespace-nowrap ${
                activeTab === 'calc'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
              }`}
            >
              <Percent className="h-4 w-4" />
              Kalkulator Pajak PIB
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold tracking-wide uppercase transition-all whitespace-nowrap ${
                activeTab === 'ocr'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Smart Scanner OCR physically
            </button>
          </div>

          {/* TAB CONTENT: 1. CSV SPREADSHEET IMPORTER */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 text-[11.5px] leading-relaxed text-slate-550 dark:text-slate-350 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <b className="text-slate-800 dark:text-slate-100 uppercase tracking-tight">Otomatisasi Unggah Manifes Kargo</b>
                  <p className="mt-0.5">
                    Hindari mengetik satu per satu. Cukup paste data dari file Excel anda atau klik contoh template manifest di samping untuk uji coba cepat.
                  </p>
                </div>
                {/* Instant Templates Selector */}
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                  {IMPORT_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLoadTemplate(tmpl.csv)}
                      className="text-[10px] font-black tracking-wide border border-blue-500/30 bg-blue-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-left"
                    >
                      ⚡ Load Demo: {tmpl.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Input TextArea */}
              <div className="relative">
                <textarea
                  className="w-full text-xs font-mono p-4 rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-450 outline-none focus:border-blue-500 max-h-48 min-h-32"
                  placeholder='Tempel baris data CSV/Excel di sini (Contoh baris format: CustomerName,Commodity,ContainerNo,ContainerSize,ContainerQty,ETA,BLNumber,PIBNo,PortOfDischargeCode,CargoValueUSD,ServiceFeeIDR)...'
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setImportStatus(null);
                    parsePreview(e.target.value);
                  }}
                />
              </div>

              {/* Import status notification banner */}
              {importStatus && (
                <div className={`p-3.5 rounded-xl border text-xs font-semibold leading-relaxed flex items-center gap-2 ${
                  importStatus.success
                    ? 'border-emerald-500/45 bg-emerald-50/85 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-500/20'
                    : 'border-rose-500/40 bg-rose-50/70 text-rose-800 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30'
                }`}>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>{importStatus.message}</span>
                </div>
              )}

              {/* Parsed Live Grid Preview for Mobile Comfort */}
              {importPreview.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      Manifest Compilation Preview ({importPreview.length} Baris terdeteksi)
                    </span>
                    <span className="text-[10.5px] select-none text-emerald-600 bg-emerald-50 dark:bg-slate-800 dark:text-emerald-400 px-2 py-0.5 rounded font-black">
                      Data Bersih & tervalidasi ISO
                    </span>
                  </div>
                  
                  {/* Table Overflow Wrapper */}
                  <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800 max-h-40">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-150 dark:border-slate-800">
                          <th className="p-2">Customer / Importer</th>
                          <th className="p-2">Commodity</th>
                          <th className="p-2">Container Number & Size</th>
                          <th className="p-2">ETA Arrival</th>
                          <th className="p-2">Handling Revenue (Selling)</th>
                          <th className="p-2 text-right">Cargo (USD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((item, id) => {
                          const numOk = validateISO6346(item.ContainerNo || '').isValid;
                          return (
                            <tr key={id} className="border-b border-slate-100 dark:border-slate-800/60 dark:bg-slate-900/40">
                              <td className="p-2 font-bold text-slate-700 dark:text-slate-350">{item.CustomerName}</td>
                              <td className="p-2 text-slate-500">{item.Commodity}</td>
                              <td className="p-2">
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className={`px-1 py-0.5 rounded text-[9.5px] font-black ${
                                    numOk ? 'bg-emerald-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {item.ContainerNo}
                                  </span>
                                  <span className="text-slate-400">({item.ContainerSize} x {item.ContainerQty || 1})</span>
                                </div>
                              </td>
                              <td className="p-2 text-slate-500 font-mono">{item.ETA}</td>
                              <td className="p-2 text-slate-600 dark:text-slate-300 font-semibold">{formatRupiah(parseInt(item.ServiceFeeIDR, 10))}</td>
                              <td className="p-2 text-right text-slate-400 font-mono">${parseFloat(item.CargoValueUSD || '0').toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleProcessImport}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition-all shadow shadow-emerald-900/15"
                    >
                      <Layers className="h-4 w-4" />
                      Push Manifest ke Database Digital (Hilangkan Excel Kertas)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: 2. LIVE DATA EXPORTER */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 flex flex-col items-center justify-center text-center max-w-xl mx-auto py-6">
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Digital Sheet Mirror Export</h4>
                <p className="text-[11px] text-slate-500 mt-1 pb-3 leading-relaxed">
                  Tidak perlu menulis laporan Excel berkala ke grup WhatsApp atau pimpinan secara manual. Gunakan satu klik tombol di bawah ini untuk mengunduh seluruh database kargo operasional teraktual berformat CSV standar yang siap dibuka di Microsoft Excel, Google Sheets, atau dikirim ke Direktur.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-black px-4 py-3 text-xs transition-all shadow shadow-blue-900/10"
                  >
                    <Download className="h-4 w-4" />
                    Unduh File Excel (.CSV)
                  </button>
                  <button
                    onClick={handleCopyClipboard}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold px-4 py-3 text-xs transition-all"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Copy Paste to Google Sheet
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 mt-2.5 font-mono">
                  Mengekspor {shipments.length} baris master ledger kargo importir dengan timestamps sinkronisasi otomatis.
                </p>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. TARIFF VALUE CUSTOMS CALCULATOR */}
          {activeTab === 'calc' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Form Side */}
              <form onSubmit={handleCalculateTaxes} className="md:col-span-5 space-y-3 pt-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Automated PIB Tax Compiler</span>
                
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">Select Commodity HS Code Tariff</label>
                  <select
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-705 font-medium outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:border-blue-500"
                  >
                    {HS_CODES.map(h => (
                      <option key={h.code} value={h.code}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">Cargo Customs Value (USD CIF)</label>
                    <input
                      type="number"
                      value={cifUsd}
                      onChange={(e) => setCifUsd(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-705 font-mono outline-none dark:border-slate-700 dark:bg-slate-900 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">Exchange Rate (IDR Kurs)</label>
                    <input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-705 font-mono outline-none dark:border-slate-700 dark:bg-slate-900 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 py-2.5 text-xs transition-all shadow shadow-blue-900/10"
                >
                  <Percent className="h-4 w-4" />
                  Kalkulasi Bea Masuk & PDRI Instan
                </button>
              </form>

              {/* Real Calculation results */}
              <div className="md:col-span-7 bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-150 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                {calculatedTaxes ? (
                  <div className="space-y-2.5 animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-205 dark:border-slate-800">
                      <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Aritmatika Lembar PIB Hasil Kompilasi</span>
                      <span className="text-[9.5px] font-mono text-slate-500 font-semibold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">AUTO-PIB</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">CIF Nilai Pabean (USD)</span>
                        <b className="font-mono text-slate-700 dark:text-slate-250">${cifUsd.toLocaleString()}</b>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kurs Setara Rupiah CIF</span>
                        <b className="font-mono text-rose-600 dark:text-rose-450">{formatRupiah(calculatedTaxes.cifInIdr)}</b>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-mono leading-none">
                      <div className="flex justify-between">
                        <span className="text-slate-500">1. Bea Masuk Impor (BM) ({calculatedTaxes.tariff.bm}%):</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{formatRupiah(calculatedTaxes.bmValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">2. Pajak Pertambahan Nilai (PPN) ({calculatedTaxes.tariff.ppn}%):</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{formatRupiah(calculatedTaxes.ppnValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">3. Pajak Penghasilan Pasal 22 (PPH) ({calculatedTaxes.tariff.pph}%):</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{formatRupiah(calculatedTaxes.pphValue)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-t border-dashed border-slate-200 dark:border-slate-800 mt-1 font-sans font-black text-xs">
                        <span className="text-slate-850 dark:text-slate-200">TOTAL BILLING PAJAK PDRI IMPOR:</span>
                        <span className="text-blue-600 dark:text-sky-400">{formatRupiah(calculatedTaxes.totalPdri)}</span>
                      </div>
                    </div>

                    {/* Auto Injection of calculation into current shipment */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
                      <select
                        id="apply-tax-shipment-select"
                        value={targetShipmentId}
                        onChange={(e) => setTargetShipmentId(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-750 dark:border-slate-750 dark:bg-slate-900 dark:text-slate-300 max-w-[200px] flex-1 outline-none"
                      >
                        <option value="">Pilih Target Shipment...</option>
                        {shipments.map(s => (
                          <option key={s.id} value={s.id}>{s.id} - {s.customerName.slice(0, 16)}...</option>
                        ))}
                      </select>
                      <button
                        onClick={handleApplyTaxToShipment}
                        disabled={!targetShipmentId}
                        type="button"
                        className={`px-3 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                          targetShipmentId 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-slate-200 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Tembak Nilai Pajak ke Form
                      </button>
                    </div>

                    {taxApplySuccess && (
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse text-right">
                        ✓ Berhasil disuntikkan secara otomatis. Nilai taksiran PDRI di ShipmentsView diperbarui!
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="my-auto text-center py-6 text-slate-400">
                    <Info className="h-8 w-8 mx-auto text-slate-305 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">Silakan tekan tombol kalkulasi untuk memulai</p>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Sistem akan mengalkulasikan tarif BM, PPN, dan PPH berdasarkan peraturan bea cukai Indonesia terbaru.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. PHYSICALLY DRAFT SCANNER */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-805 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed text-slate-550 dark:text-slate-400">
                💡 <b>Dokumen Dokumen Lapangan Langsung Jadi Draf Digital (OCR Mode Telepon HP)</b><br/>
                Jika di pelabuhan/lapangan staf menerima lembar Bill Of Lading kertas dari pelayaran, draf input dapat di-scan via kamera HP. Klik tombol scan di bawah untuk mensimulasikan ekstraksi metadata instant.
              </div>

              {!extractedData && !ocrScanning && (
                <div 
                  onClick={handleSimulateOCR}
                  className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer p-8 flex flex-col items-center justify-center text-center transition-all bg-white dark:bg-slate-900 group"
                >
                  <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-200 animate-bounce" />
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 uppercase tracking-widest">
                    Simulasikan Kamera HP Scan Kertas B/L Pelabuhan
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Klik di sini untuk meniru jepretan kamera ponsel terhadap manifest Bill of Lading pelayaran di pelabuhan.
                  </p>
                </div>
              )}

              {/* Scanning visual progress */}
              {ocrScanning && (
                <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50/20 dark:border-blue-900/10 text-center space-y-3">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-450 animate-pulse" />
                    </div>
                  </div>
                  <div className="max-w-xs mx-auto">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-sky-450 uppercase tracking-widest">Membaca Serat Kertas Manifest via Vision AI...</span>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 dark:bg-slate-800 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-200" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Structured Metadata Display */}
              {extractedData && (
                <div className="rounded-2xl border border-emerald-500/35 bg-emerald-50/20 p-4 dark:border-emerald-500/20 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 dark:border-emerald-950/20 pb-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                        Berhasil Mengekstraksi Berkas Markings (Confidence: {extractedData.confidence}%)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">100% No Typing required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs leading-normal">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Importer Name</span>
                      <b className="text-slate-800 dark:text-slate-200">{extractedData.customerName}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Cargo Commodity</span>
                      <b className="text-slate-800 dark:text-slate-200">{extractedData.commodity}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Bill of Lading No</span>
                      <b className="text-slate-800 dark:text-slate-200 tracking-wider font-mono">{extractedData.blNumber}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Suggested Registration PIB</span>
                      <b className="text-gradient-sky tracking-wider font-mono">{extractedData.pibNo}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Container No / Volume</span>
                      <b className="text-slate-800 dark:text-slate-205 font-mono">{extractedData.containerNumber} ({extractedData.containerQty}x {extractedData.containerSize})</b>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Pre-Computed Commission Fee</span>
                      <b className="text-emerald-600 dark:text-emerald-450">{formatRupiah(extractedData.serviceFee)}</b>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-950/30">
                    <button
                      onClick={() => setExtractedData(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 pr-2"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleRegisterOCRDraft}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 px-4 py-2.5 text-xs transition-all shadow shadow-emerald-900/10"
                    >
                      <Sparkles className="h-4 w-4" />
                      Daftarkan sebagai Draft Kargo Baru (0 Papertrail)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
