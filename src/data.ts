/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shipment, ActivityLog, CostBreakdown, RevenueBreakdown } from './types';

// Helper to sum standard cost breakdowns
export function getSumOfCosts(costs: CostBreakdown): number {
  return (
    costs.doContainer +
    costs.storage +
    costs.pdri +
    costs.sptnp +
    costs.bahandle +
    costs.undername +
    costs.trucking +
    costs.extraCost +
    costs.operationalCost +
    costs.surveyorFee
  );
}

// Helper to calculate total revenue
// Total Revenue = handlingFee + truckingSelling + undernameSelling + reimbursementMarkup (equal to Direct Service Fees)
export function getShipmentTotalRevenue(shipment: Shipment): number {
  const serviceRevenue = 
    shipment.revenue.handlingFee + 
    shipment.revenue.truckingSelling + 
    shipment.revenue.undernameSelling + 
    shipment.revenue.reimbursementMarkup;
  
  // Total client bill is equal to the direct service fees
  return serviceRevenue;
}

// Helper to calculate Gross Profit (Margin)
// Since total billing is equal to direct service fees, the profit is equal to this revenue.
export function getShipmentProfit(shipment: Shipment): number {
  return getShipmentTotalRevenue(shipment);
}

// Helpers for rupiah formatting
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

// 6 Detailed, realistic shipments representing different stages and statuses
export const initialShipments: Shipment[] = [
  {
    id: 'BSL-2026-0001',
    shipmentType: 'Import',
    jobNo: 'JOB/2026/05/0122',
    customerName: 'PT Indo Jaya Makmur',
    commodity: 'CNC & Lathe Machine Spare Parts',
    eta: '2026-05-18',
    blNumber: 'MSKU98375102',
    pibNo: '023412-10839-2026',
    containerSize: '40ft HC',
    containerQty: 2,
    portOfDischarge: 'Tanjung Priok, Jakarta',
    status: 'Completed',
    estimatedCosts: {
      doContainer: 3500000,
      storage: 4200000,
      pdri: 45000000,
      sptnp: 0,
      bahandle: 1500000,
      undername: 0,
      trucking: 4500000,
      extraCost: 800000,
      operationalCost: 500000,
      surveyorFee: 1200000
    },
    actualCosts: {
      doContainer: 3500000,
      storage: 4800000, // Slightly higher than budget
      pdri: 45000000,
      sptnp: 0,
      bahandle: 1500000,
      undername: 0,
      trucking: 4500000,
      extraCost: 950000, // Slightly higher due to port congestion
      operationalCost: 500000,
      surveyorFee: 1200000
    },
    revenue: {
      handlingFee: 3500000,
      truckingSelling: 1500000, // margin we take on trucking
      undernameSelling: 0,
      reimbursementMarkup: 0
    },
    invoiceStatus: 'Paid',
    cashFlowStatus: 'Settled (Paid)',
    notes: 'Operations completed smoothly. All documents handed over.',
    isApproved: true,
    createdAt: '2026-05-10',
    updatedAt: '2026-05-24'
  },
  {
    id: 'BSL-2026-0002',
    shipmentType: 'Import',
    jobNo: 'JOB/2026/05/0123',
    customerName: 'CV Sinar Abadi Sentosa',
    commodity: 'Chemical Raw Material (Sodium Carbonate)',
    eta: '2026-05-21',
    blNumber: 'OCGBL45210988',
    pibNo: '023412-10922-2026',
    containerSize: '20ft',
    containerQty: 5,
    portOfDischarge: 'Tanjung Perak, Surabaya',
    status: 'Gate Out / Delivery',
    estimatedCosts: {
      doContainer: 5000000,
      storage: 8000000,
      pdri: 120000000,
      sptnp: 5000000, // Predicted possible penalty
      bahandle: 2500000,
      undername: 2500000, // Undername service used
      trucking: 12500000,
      extraCost: 1500000,
      operationalCost: 750000,
      surveyorFee: 3000000
    },
    actualCosts: {
      doContainer: 5000000,
      storage: 8000000,
      pdri: 120000000,
      sptnp: 0, // Thankfully no SPTNP
      bahandle: 2500000,
      undername: 2500005,
      trucking: 12500000,
      extraCost: 1200000,
      operationalCost: 700000,
      surveyorFee: 3000000
    },
    revenue: {
      handlingFee: 5000000,
      truckingSelling: 2500000,
      undernameSelling: 1500005,
      reimbursementMarkup: 1000000 // administrative fee
    },
    invoiceStatus: 'Invoiced',
    cashFlowStatus: 'Funded (Active)',
    notes: 'Goods successfully loaded onto trucks, delivery to customer warehouse in Cikarang is underway.',
    isApproved: true,
    createdAt: '2026-05-12',
    updatedAt: '2026-05-25'
  },
  {
    id: 'BSL-2026-0003',
    shipmentType: 'Import',
    jobNo: 'JOB/2026/05/0124',
    customerName: 'PT Multi Baja Nusantara',
    commodity: 'Steel Coil & Plate',
    eta: '2026-05-25',
    blNumber: 'ONEK83901123',
    pibNo: '023412-10991-2026',
    containerSize: '40ft',
    containerQty: 3,
    portOfDischarge: 'Tanjung Priok, Jakarta',
    status: 'Red Channel / Behandle',
    estimatedCosts: {
      doContainer: 4500000,
      storage: 6000000,
      pdri: 95000000,
      sptnp: 15000000, // Warning! high probability SPTNP
      bahandle: 3500000,
      undername: 0,
      trucking: 7500000,
      extraCost: 2000000,
      operationalCost: 600000,
      surveyorFee: 0
    },
    actualCosts: {
      doContainer: 4500000,
      storage: 4000000, // Temp actual logic before complete
      pdri: 95000000,
      sptnp: 15000000, // Absorb SPTNP
      bahandle: 3500000,
      undername: 0,
      trucking: 0, // Trucking not yet paid
      extraCost: 2500000, // Coping with Behandle inspections
      operationalCost: 600000,
      surveyorFee: 0
    },
    revenue: {
      handlingFee: 4500000,
      truckingSelling: 1000000,
      undernameSelling: 0,
      reimbursementMarkup: 500000
    },
    invoiceStatus: 'Unbilled',
    cashFlowStatus: 'Funded (Active)',
    notes: 'Assigned Red Channel. Physical inspection (behandle) scheduled today at 10:00 with Customs officers.',
    isApproved: true,
    createdAt: '2026-05-15',
    updatedAt: '2026-05-26'
  },
  {
    id: 'BSL-2026-0004',
    shipmentType: 'Import',
    jobNo: 'JOB/2026/05/0125',
    customerName: 'PT Nusantara Tekstil Utama',
    commodity: 'Yarn Material & Polyester Fiber',
    eta: '2026-05-27',
    blNumber: 'EGLV092305531',
    pibNo: '',
    containerSize: '40ft HC',
    containerQty: 1,
    portOfDischarge: 'Belawan, Medan',
    status: 'Submit PIB',
    estimatedCosts: {
      doContainer: 2000000,
      storage: 3000000,
      pdri: 32000000,
      sptnp: 0,
      bahandle: 0,
      undername: 0,
      trucking: 2500000,
      extraCost: 500000,
      operationalCost: 400000,
      surveyorFee: 1500000
    },
    actualCosts: {
      doContainer: 0,
      storage: 0,
      pdri: 32000000, // Paid billing
      sptnp: 0,
      bahandle: 0,
      undername: 0,
      trucking: 0,
      extraCost: 200000,
      operationalCost: 300000,
      surveyorFee: 1500000
    },
    revenue: {
      handlingFee: 2500000,
      truckingSelling: 500000,
      undernameSelling: 0,
      reimbursementMarkup: 0
    },
    invoiceStatus: 'Unbilled',
    cashFlowStatus: 'Funded (Active)',
    notes: 'Draft PIB approved. Tax billing issued and paid.',
    isApproved: true,
    createdAt: '2026-05-18',
    updatedAt: '2026-05-25'
  },
  {
    id: 'BSL-2026-0005',
    shipmentType: 'Import',
    jobNo: 'JOB/2026/05/0126',
    customerName: 'PT Berkah Pangan Mandiri',
    commodity: 'Food Filter & Sterilization Equipments',
    eta: '2026-05-29',
    blNumber: 'HDMU11920835',
    pibNo: '',
    containerSize: '20ft',
    containerQty: 1,
    portOfDischarge: 'Tanjung Emas, Semarang',
    status: 'Document Checking',
    estimatedCosts: {
      doContainer: 1800000,
      storage: 2500000,
      pdri: 18000000,
      sptnp: 0,
      bahandle: 1200000,
      undername: 0,
      trucking: 2200000,
      extraCost: 500000,
      operationalCost: 400000,
      surveyorFee: 0
    },
    actualCosts: {
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
    },
    revenue: {
      handlingFee: 2200000,
      truckingSelling: 400000,
      undernameSelling: 0,
      reimbursementMarkup: 0
    },
    invoiceStatus: 'Unbilled',
    cashFlowStatus: 'Unfunded',
    notes: 'Awaiting original Packing List & Invoice from Importer for document compliance check.',
    isApproved: false,
    createdAt: '2026-05-22',
    updatedAt: '2026-05-24'
  },
  {
    id: 'BSL-2026-0006',
    shipmentType: 'Import',
    jobNo: 'JOB/2026/05/0127',
    customerName: 'CV Electro Tech Indonesia',
    commodity: 'Microcontroller & Sensor Modules',
    eta: '2026-05-30',
    blNumber: 'HLCU20893322',
    pibNo: '',
    containerSize: 'LCL',
    containerQty: 1,
    portOfDischarge: 'Soekarno-Hatta, Banten',
    status: 'Draft',
    estimatedCosts: {
      doContainer: 1200000,
      storage: 1500000,
      pdri: 8000000,
      sptnp: 0,
      bahandle: 800000,
      undername: 0,
      trucking: 1500000,
      extraCost: 300000,
      operationalCost: 300000,
      surveyorFee: 0
    },
    actualCosts: {
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
    },
    revenue: {
      handlingFee: 1800000,
      truckingSelling: 300000,
      undernameSelling: 0,
      reimbursementMarkup: 0
    },
    invoiceStatus: 'Unbilled',
    cashFlowStatus: 'Unfunded',
    notes: 'Vessel in transit. ETA at Tanjung Priok Port expected on May 30th.',
    isApproved: false,
    createdAt: '2026-05-24',
    updatedAt: '2026-05-25'
  },
  {
    id: 'BSL-2025-1001',
    shipmentType: 'Import',
    jobNo: 'JOB/2025/05/0088',
    customerName: 'PT Indo Jaya Makmur',
    commodity: 'Electrical Generator Component Parts',
    eta: '2025-05-12',
    blNumber: 'MSKU88219351',
    pibNo: '023412-00511-2025',
    containerSize: '40ft HC',
    containerQty: 1,
    portOfDischarge: 'Tanjung Priok, Jakarta',
    status: 'Completed',
    estimatedCosts: {
      doContainer: 3000000,
      storage: 3500000,
      pdri: 35000000,
      sptnp: 0,
      bahandle: 1250000,
      undername: 0,
      trucking: 4000000,
      extraCost: 600000,
      operationalCost: 400000,
      surveyorFee: 1000000
    },
    actualCosts: {
      doContainer: 3000000,
      storage: 3200000,
      pdri: 35000000,
      sptnp: 0,
      bahandle: 1250000,
      undername: 0,
      trucking: 4000000,
      extraCost: 750000,
      operationalCost: 400000,
      surveyorFee: 1000000
    },
    revenue: {
      handlingFee: 3000000,
      truckingSelling: 1200000,
      undernameSelling: 0,
      reimbursementMarkup: 0
    },
    invoiceStatus: 'Paid',
    cashFlowStatus: 'Settled (Paid)',
    notes: 'Historical cargo archived. Port handling complete.',
    isApproved: true,
    createdAt: '2025-05-10',
    updatedAt: '2025-05-15'
  },
  {
    id: 'BSL-2025-1002',
    shipmentType: 'Import',
    jobNo: 'JOB/2025/05/0089',
    customerName: 'CV Sinar Abadi Sentosa',
    commodity: 'Sodium Silicate Powder',
    eta: '2025-05-20',
    blNumber: 'OCGBL38920152',
    pibNo: '023412-00588-2025',
    containerSize: '20ft',
    containerQty: 2,
    portOfDischarge: 'Tanjung Perak, Surabaya',
    status: 'Completed',
    estimatedCosts: {
      doContainer: 2000000,
      storage: 3000000,
      pdri: 50000000,
      sptnp: 0,
      bahandle: 1500000,
      undername: 2000000,
      trucking: 5000000,
      extraCost: 800000,
      operationalCost: 500000,
      surveyorFee: 0
    },
    actualCosts: {
      doContainer: 2000000,
      storage: 3000000,
      pdri: 50000000,
      sptnp: 0,
      bahandle: 1500000,
      undername: 2000000,
      trucking: 5000000,
      extraCost: 650000,
      operationalCost: 500005,
      surveyorFee: 0
    },
    revenue: {
      handlingFee: 4000000,
      truckingSelling: 1500000,
      undernameSelling: 1000000,
      reimbursementMarkup: 300000
    },
    invoiceStatus: 'Paid',
    cashFlowStatus: 'Settled (Paid)',
    notes: 'Undername logistics processed successfully.',
    isApproved: true,
    createdAt: '2025-05-15',
    updatedAt: '2025-05-22'
  }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'LOG-001',
    shipmentId: 'BSL-2026-0001',
    jobNo: 'JOB/2026/05/0122',
    username: 'Robby_Ops',
    role: 'Staff',
    action: 'Changed status to [Completed]',
    timestamp: '2026-05-24T09:12:00Z'
  },
  {
    id: 'LOG-002',
    shipmentId: 'BSL-2026-0002',
    jobNo: 'JOB/2026/05/0123',
    username: 'Robby_Ops',
    role: 'Staff',
    action: 'Entered actual cost for trucking category of Rp 12,500,000',
    timestamp: '2026-05-25T11:45:00Z'
  },
  {
    id: 'LOG-003',
    shipmentId: 'BSL-2026-0003',
    jobNo: 'JOB/2026/05/0124',
    username: 'Director_Imron',
    role: 'Director',
    action: 'Approved funding budget for physical inspection of Red Channel shipment',
    timestamp: '2026-05-26T02:30:00Z'
  }
];
