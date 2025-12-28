# CA Firm Management System - Complete Requirements

## 📋 Overview

A comprehensive management system for Chartered Accountant firms to manage clients, firms, tasks, documents, invoices, and approvals with role-based access control.

---

## 👥 User Roles & Access Control

| Role | Access Level | Key Permissions |
|------|-------------|-----------------|
| **CA (Chartered Accountant)** | Full system access | • All clients, firms, users, approvals<br>• User management<br>• Activity log access<br>• All approvals |
| **Manager** | Team oversight | • Assigned clients/firms<br>• Task approvals<br>• Team management<br>• View team activity |
| **Staff** | Limited access | • Assigned tasks only<br>• Document uploads<br>• View assigned firms<br>• No approvals |

### Access Control Rules:
- Staff can only see tasks assigned to them
- Staff can only see firms they're assigned to (via User-Firm mapping)
- Managers can approve tasks for their team
- CA has full access to everything
- All actions are logged for audit

---

## 🏗️ Core Modules

### 1. 📊 Dashboard

**Features:**
- Role-specific statistics:
  - Active tasks count
  - Pending approvals count
  - Overdue items count
  - Documents count
  - Active clients count
  - Firms managed count
  - Monthly revenue (CA/Manager only)
  - Unpaid invoices count
- Recent tasks overview (last 5-10 tasks)
- Upcoming deadlines with priority indicators (High/Medium/Low)
- Activity feed (CA only - shows all system activity)
- Percentage changes and growth indicators

**Backend Logic:**
- Calculate metrics based on user role and assigned firms
- Filter data based on user permissions
- Calculate percentage changes (current vs previous period)
- Aggregate revenue for current month
- Identify overdue items (due_date < today)

---

### 2. 👥 Clients

**Features:**
- Client profile management:
  - Name
  - Contact person
  - Email
  - Phone
  - Address
  - Additional notes
- Multi-firm association (one client can have multiple firms)
- Active task count per client
- Last activity tracking
- Client list with search and filters

**Data Model:**
```
Client {
  id
  name
  contact_person
  email
  phone
  address
  notes
  created_at
  updated_at
  created_by (user_id)
}
```

**Relationships:**
- Client → Firms (one-to-many)
- Client → Tasks (through firms)

---

### 3. 🏢 Firms

**Features:**
- Multiple firms per client
- Firm profile:
  - Name
  - PAN number (unique)
  - GST number (unique)
  - Registration details
  - Address
- Firm-specific tasks, documents, invoices
- Active task count per firm
- Firm status (Active/Inactive)

**Data Model:**
```
Firm {
  id
  client_id (foreign key)
  name
  pan_number (unique)
  gst_number (unique)
  registration_number
  address
  status (Active/Inactive)
  created_at
  updated_at
  created_by (user_id)
}
```

**Relationships:**
- Firm → Client (many-to-one)
- Firm → Tasks (one-to-many)
- Firm → Documents (one-to-many)
- Firm → Invoices (one-to-many)
- Firm → Users (many-to-many via UserFirmMapping)

**Business Rules:**
- Tasks are firm-specific, not client-level
- Each firm must have unique PAN and GST numbers
- Staff can only access assigned firms

---

### 4. ✅ Tasks

**Features:**
- Task assignment to staff members
- Status workflow:
  - **Pending** → **In Progress** → **Awaiting Approval** → **Completed/Error**
- Priority levels: High, Medium, Low
- Due date tracking with overdue highlighting
- Linked to specific firms (not clients directly)
- Task details:
  - Title
  - Description
  - Assigned to (user_id)
  - Firm (firm_id)
  - Due date
  - Priority
  - Status
  - Comments/Notes

**Data Model:**
```
Task {
  id
  firm_id (foreign key)
  title
  description
  assigned_to (user_id - foreign key)
  status (Pending/In Progress/Awaiting Approval/Completed/Error)
  priority (High/Medium/Low)
  due_date
  completed_at
  created_at
  updated_at
  created_by (user_id)
}
```

**Backend Logic:**
- Auto-calculate priority based on due date proximity:
  - High: < 7 days
  - Medium: 7-30 days
  - Low: > 30 days
- Auto-update status to "Overdue" when due_date passes and status != "Completed"
- Validate assignment (user must have access to firm)
- Critical tasks require approval before completion

**Status Transitions:**
- Staff can: Pending → In Progress
- Staff can: In Progress → Awaiting Approval (for critical tasks)
- Manager/CA can: Awaiting Approval → Approved/Rejected
- Manager/CA can: Any status → Completed/Error

---

### 5. 🔐 Approvals

**Features:**
- Approval workflow for critical tasks
- Status: Pending → Approved/Rejected
- Remarks/comments on decisions
- CA/Manager approval authority
- Approval history tracking

**Data Model:**
```
Approval {
  id
  task_id (foreign key)
  requested_by (user_id)
  approved_by (user_id - nullable)
  status (Pending/Approved/Rejected)
  remarks
  created_at
  approved_at
  rejected_at
}
```

**Business Rules:**
- Only CA and Manager can approve
- Critical tasks must be approved before completion
- Approval requests are created when task status changes to "Awaiting Approval"
- Rejected tasks can be resubmitted

---

### 6. 📄 Documents

**Features:**
- Document types:
  - ITR (Income Tax Return)
  - GST (GST Returns)
  - TDS (TDS Returns)
  - ROC (Registrar of Companies)
  - Invoice
  - Other
- Firm-linked uploads
- Task-associated documents (optional)
- Upload tracking (who, when)
- Document metadata:
  - File name
  - File type
  - File size
  - Upload date
  - Uploaded by

**Data Model:**
```
Document {
  id
  firm_id (foreign key)
  task_id (foreign key - nullable)
  document_type (ITR/GST/TDS/ROC/Invoice/Other)
  file_name
  file_path
  file_size
  mime_type
  uploaded_by (user_id)
  created_at
  updated_at
}
```

**Backend Logic:**
- Validate file types and sizes
- Store files securely (AWS S3 or local storage)
- Generate unique file paths
- Track document versions (optional)

---

### 7. 💰 Invoices

**Features:**
- Firm-specific invoices
- Status: Unpaid → Paid/Overdue
- Amount & due date tracking
- Creator attribution
- Invoice details:
  - Invoice number (auto-generated)
  - Firm (firm_id)
  - Amount
  - Tax (GST/TDS)
  - Total amount
  - Due date
  - Status
  - Payment date (nullable)

**Data Model:**
```
Invoice {
  id
  firm_id (foreign key)
  invoice_number (unique, auto-generated)
  amount
  tax_amount
  total_amount
  due_date
  status (Unpaid/Paid/Overdue/Partial)
  paid_date (nullable)
  payment_reference
  created_at
  updated_at
  created_by (user_id)
}
```

**Backend Logic:**
- Auto-generate invoice numbers (format: INV-YYYY-XXXX)
- Calculate total (amount + tax)
- Auto-update status to "Overdue" when due_date passes and status = "Unpaid"
- Calculate monthly revenue (sum of paid invoices in current month)
- Track payment history

---

### 8. 👤 Users (CA only)

**Features:**
- User management (add/edit/remove)
- Role assignment (CA/Manager/Staff)
- Reporting hierarchy (reports_to)
- User profile:
  - Name
  - Email
  - Phone
  - Role
  - Reports to (user_id - nullable)
  - Status (Active/Inactive)

**Data Model:**
```
User {
  id
  name
  email (unique)
  password (hashed)
  phone
  role (CA/Manager/Staff)
  reports_to (user_id - nullable, foreign key)
  status (Active/Inactive)
  profile_picture
  created_at
  updated_at
}
```

**User-Firm Mapping (for fine-grained permissions):**
```
UserFirmMapping {
  id
  user_id (foreign key)
  firm_id (foreign key)
  assigned_at
  assigned_by (user_id)
}
```

**Business Rules:**
- Only CA can manage users
- Staff can only access firms they're assigned to
- Managers can see all firms assigned to their team members
- Reporting hierarchy determines approval chain

---

### 9. 📋 Activity Log (CA only)

**Features:**
- Complete audit trail
- Tracks: User, Action, Entity Type, Timestamp
- Entity types: User, Client, Firm, Task, Approval, Document, Invoice
- Filterable by:
  - User
  - Entity type
  - Date range
  - Action type

**Data Model:**
```
ActivityLog {
  id
  user_id (foreign key)
  action_type (Create/Update/Delete/View/Approve/Reject)
  entity_type (User/Client/Firm/Task/Approval/Document/Invoice)
  entity_id
  description
  metadata (JSON - stores before/after values)
  ip_address
  created_at
}
```

**Backend Logic:**
- Log all create, update, delete operations
- Log approval/rejection actions
- Store entity state changes (before/after)
- Auto-log all actions (middleware)

---

## 🗄️ Database Schema Overview

```
Users
  ↓ (reports_to)
Users (self-referential)
  ↓ (created_by)
Clients
  ↓ (one-to-many)
Firms
  ↓ (one-to-many)
Tasks ──→ Approvals
  ↓
Documents

Firms ──→ Invoices

Users ←→ Firms (many-to-many via UserFirmMapping)

ActivityLogs (tracks all entities)
```

### Key Relationships:
1. **Users → Clients**: One-to-many (created_by)
2. **Clients → Firms**: One-to-many
3. **Firms → Tasks**: One-to-many
4. **Firms → Documents**: One-to-many
5. **Firms → Invoices**: One-to-many
6. **Tasks → Approvals**: One-to-one (optional)
7. **Tasks → Documents**: One-to-many (optional)
8. **Users → Firms**: Many-to-many (via UserFirmMapping)
9. **Users → Users**: One-to-many (reports_to - self-referential)

---

## 🔑 Key Business Rules

1. **Firm-Centric Tasks**: Tasks are always firm-specific, never client-level
2. **Unique Identifiers**: PAN and GST numbers must be unique per firm
3. **Approval Workflow**: Critical tasks require approval before completion
4. **Access Control**: Staff can only see assigned firms/tasks (via UserFirmMapping)
5. **Audit Trail**: All actions are logged in ActivityLog
6. **Status Automation**: 
   - Tasks auto-marked as "Overdue" when due_date passes
   - Invoices auto-marked as "Overdue" when due_date passes
   - Priority auto-calculated based on due date proximity
7. **Revenue Calculation**: Monthly revenue = sum of paid invoices in current month
8. **Hierarchical Permissions**: Managers can see all data for their team members

---

## 🔐 Security Requirements

1. **Authentication**: JWT-based authentication
2. **Authorization**: Role-based access control (RBAC)
3. **Data Isolation**: Staff can only access assigned firms
4. **Audit Logging**: All actions logged with user, timestamp, IP
5. **Password Security**: Bcrypt hashing, minimum complexity requirements
6. **API Security**: Rate limiting, input validation, SQL injection prevention
7. **File Security**: Secure file storage, access control for documents

---

## 📱 API Endpoints Summary

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

### Dashboard
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/recent-tasks`
- `GET /api/dashboard/upcoming-deadlines`
- `GET /api/dashboard/activity-feed` (CA only)

### Clients
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/clients/:id/firms`

### Firms
- `GET /api/firms`
- `POST /api/firms`
- `GET /api/firms/:id`
- `PUT /api/firms/:id`
- `DELETE /api/firms/:id`
- `GET /api/firms/:id/tasks`
- `GET /api/firms/:id/documents`
- `GET /api/firms/:id/invoices`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PUT /api/tasks/:id/status`
- `GET /api/tasks/overdue`

### Approvals
- `GET /api/approvals`
- `POST /api/approvals`
- `GET /api/approvals/:id`
- `PUT /api/approvals/:id/approve`
- `PUT /api/approvals/:id/reject`

### Documents
- `GET /api/documents`
- `POST /api/documents` (with file upload)
- `GET /api/documents/:id`
- `GET /api/documents/:id/download`
- `DELETE /api/documents/:id`

### Invoices
- `GET /api/invoices`
- `POST /api/invoices`
- `GET /api/invoices/:id`
- `PUT /api/invoices/:id`
- `PUT /api/invoices/:id/pay`
- `GET /api/invoices/stats`

### Users (CA only)
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/:id/assign-firm`
- `DELETE /api/users/:id/unassign-firm`

### Activity Logs (CA only)
- `GET /api/activity-logs`
- `GET /api/activity-logs/:id`

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project structure setup
- [ ] Database schema creation
- [ ] Authentication system
- [ ] User management (CA only)
- [ ] Basic CRUD for Clients

### Phase 2: Core Features (Weeks 3-5)
- [ ] Firm management
- [ ] Task management with status workflow
- [ ] User-Firm mapping
- [ ] Basic dashboard with metrics
- [ ] Document upload (basic)

### Phase 3: Workflows (Weeks 6-8)
- [ ] Approval workflow
- [ ] Invoice management
- [ ] Activity logging
- [ ] Advanced dashboard features
- [ ] Deadline tracking

### Phase 4: Advanced Features (Weeks 9-10)
- [ ] Email notifications
- [ ] File storage integration (S3/Cloudinary)
- [ ] Advanced reporting
- [ ] Search and filters
- [ ] Export functionality

### Phase 5: Mobile App (Weeks 11-14)
- [ ] React Native setup
- [ ] Core mobile features
- [ ] Push notifications
- [ ] Mobile-specific optimizations

### Phase 6: Polish & Deploy (Weeks 15-16)
- [ ] Testing (unit, integration, e2e)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Deployment
- [ ] Documentation

---

## 📝 Notes

- All business logic resides in the **backend**
- Frontend (web/mobile) only handles UI and API calls
- Database should use MySQL for relational data
- File storage can be local (dev) or cloud (production)
- Consider using Redis for caching dashboard metrics
- Email notifications for deadlines and approvals
- Consider SMS notifications for critical deadlines

---

This document consolidates requirements from both the UI design and the Lovable agent summary.

