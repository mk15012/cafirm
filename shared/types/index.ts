// Shared types for CA Firm Management System

export enum UserRole {
  CA = 'CA',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  OVERDUE = 'OVERDUE',
}

export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum DocumentType {
  ITR = 'ITR',
  GST = 'GST',
  TDS = 'TDS',
  ROC = 'ROC',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER',
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  reportsToId?: string;
}

export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Firm {
  id: string;
  clientId: string;
  name: string;
  panNumber: string;
  gstNumber?: string;
  registrationNumber?: string;
  address?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  firmId: string;
  title: string;
  description?: string;
  assignedToId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  firmId: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  paidDate?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  firmId: string;
  taskId?: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  taskId: string;
  requestedById: string;
  approvedById?: string;
  status: ApprovalStatus;
  remarks?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface DashboardMetrics {
  activeTasks: number;
  activeTasksChange: number;
  pendingApprovals: number;
  overdueItems: number;
  overdueItemsChange: number;
  documents: number;
  documentsChange: number;
  activeClients: number;
  activeClientsChange: number;
  firmsManaged: number;
  firmsManagedChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  unpaidInvoices: number;
}

