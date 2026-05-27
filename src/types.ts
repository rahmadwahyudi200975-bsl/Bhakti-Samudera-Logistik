/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User Role Definition
export type UserRole =
  | 'President Director'
  | 'Director of Operation'
  | 'Director of Finance'
  | 'Finance Staff'
  | 'Operation Staff'
  | 'Staff'
  | 'Director';

export const isDirectorRole = (role: UserRole): boolean => {
  return ['President Director', 'Director of Operation', 'Director of Finance', 'Director'].includes(role);
};

export const isStaffRole = (role: UserRole): boolean => {
  return ['Finance Staff', 'Operation Staff', 'Staff'].includes(role);
};

export interface User {
  username: string;
  role: UserRole;
  fullName: string;
}

// Container Details
export type ContainerSize = '20ft' | '40ft' | '40ft HC' | 'LCL';

// Operational Customs Clearance Status
export type CustomClearanceStatus =
  | 'Draft'
  | 'Document Checking'
  | 'Submit PIB'
  | 'Billing Issued'
  | 'Paid Pending SPPB'
  | 'Red Channel / Behandle'
  | 'SPPB Issued'
  | 'Gate Out / Delivery'
  | 'Completed'
  | 'Cancelled';

export const STATUS_FLOW: CustomClearanceStatus[] = [
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

// Financial Statuses
export type InvoiceStatus = 'Unbilled' | 'Invoiced' | 'Paid';
export type CashFlowStatus = 'Unfunded' | 'Funded (Active)' | 'Settled (Paid)';

// Operational Cost Categories (Talangan)
export interface CostBreakdown {
  doContainer: number;      // DO Container
  storage: number;          // Storage/Demurrage
  pdri: number;             // PDRI (Import Taxes)
  sptnp: number;            // SPTNP (Tax Penalties)
  bahandle: number;         // Behandle / Physical Inspection Cost
  undername: number;        // Undername fee
  trucking: number;         // Trucking Cost
  extraCost: number;        // Extra Cost (Port tips / auxiliary fees, etc.)
  operationalCost: number;  // Operational Cost (courier / small field expenses)
  surveyorFee: number;      // Surveyor Report (LS) fee
}

// Revenue / Selling Price breakdown
export interface RevenueBreakdown {
  handlingFee: number;      // Handling / Customs clearance fee
  truckingSelling: number;   // Trucking rate to client
  undernameSelling: number;  // Undername rate to client
  reimbursementMarkup: number; // Markup on funding elements if any
}

// Detailed Shipment Item
export interface DocumentChecklist {
  billOfLading: boolean;
  invoicePackingList: boolean;
  pibDeclaration: boolean;
  customsTaxPaid: boolean;
  doReleased: boolean;
  sppbReleased: boolean;
}

export interface ShipmentAttachment {
  id: string;
  name: string;
  type: string;
  url: string; // Base64 or local blob URI
  uploadDate: string;
}

export interface Shipment {
  id: string;                         // Unique ID (e.g., BSL-2026-0001)
  shipmentType: 'Export' | 'Import';  // Shipment Type: Export or Import
  jobNo: string;                      // JOB/2026/05/XXXX
  customerName: string;               // Customer / Importer
  commodity: string;                  // Commodity
  eta: string;                        // Estimated Arrival Date (YYYY-MM-DD)
  blNumber: string;                   // Bill of Lading
  pibNo: string;                      // PIB Registration No (Aju PIB)
  containerSize: ContainerSize;       // Container Size
  containerQty: number;               // Container Quantity
  containerNumber?: string;           // Custom container valid No (e.g. MSKU1234567)
  portOfDischarge?: string;           // Port of Discharge
  targetCompletionDate?: string;      // Estimasi Waktu Selesai (YYYY-MM-DD)
  documentChecklist?: DocumentChecklist; // Document Checklist
  attachments?: ShipmentAttachment[];  // Physical Uploaded Docs (PDF/JPG)
  status: CustomClearanceStatus;      // Clearance status
  estimatedCosts: CostBreakdown;      // Estimated funding budget
  actualCosts: CostBreakdown;         // Actual funding expenditures
  revenue: RevenueBreakdown;          // Service Revenue (Selling Price)
  invoiceStatus: InvoiceStatus;       // Invoice status
  cashFlowStatus: CashFlowStatus;     // Cash Flow Funding Status
  notes: string;                      // Issues / Notes
  isApproved: boolean;                // Director approval for actual funding expenditures
  createdAt: string;                  // YYYY-MM-DD
  updatedAt: string;                  // YYYY-MM-DD
}

export interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  shipmentId: string;
  jobNo: string;
  username: string;
  role: UserRole;
  action: string;
  timestamp: string;
}
