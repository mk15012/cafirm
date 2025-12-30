import { UserRole, TaskStatus, TaskPriority, ApprovalStatus, DocumentType, InvoiceStatus } from '@prisma/client';

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
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

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  reportsToId?: number;
}

export interface CreateClientDto {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface CreateFirmDto {
  clientId: number;
  name: string;
  panNumber: string;
  gstNumber?: string;
  registrationNumber?: string;
  address?: string;
}

export interface CreateTaskDto {
  firmId: number;
  title: string;
  description?: string;
  assignedToId: number;
  priority: TaskPriority;
  dueDate: string;
}

export interface CreateInvoiceDto {
  firmId: number;
  amount: number;
  taxAmount?: number;
  totalAmount?: number;
  dueDate: string;
}

export interface CreateDocumentDto {
  firmId: number;
  taskId?: number;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export interface CreateApprovalDto {
  taskId: number;
  remarks?: string;
}

export interface UpdateTaskStatusDto {
  status: TaskStatus;
}

export interface ApproveRequestDto {
  remarks?: string;
}

export interface RejectRequestDto {
  remarks: string;
}

