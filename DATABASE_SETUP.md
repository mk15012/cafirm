# Database Setup Guide

This guide will help you set up the MySQL database for the CA Firm Management System.

## Prerequisites

- MySQL 8.0 or higher installed and running
- Node.js 18+ installed
- Access to MySQL root user or a user with database creation privileges

## Step 1: Create Database

Connect to MySQL and create the database:

```sql
CREATE DATABASE ca_firm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or if you prefer a different name:

```sql
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Step 2: Configure Database Connection

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a `.env` file (if it doesn't exist):
```bash
cp .env.example .env
```

3. Update the `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/ca_firm"
```

Replace:
- `root` with your MySQL username
- `your_password` with your MySQL password
- `localhost:3306` with your MySQL host and port (if different)
- `ca_firm` with your database name (if different)

## Step 3: Run Database Migrations

1. Install dependencies (if not already done):
```bash
npm install
```

2. Generate Prisma Client:
```bash
npx prisma generate
```

3. Run migrations to create all tables:
```bash
npx prisma migrate deploy
```

Or for development:
```bash
npx prisma migrate dev
```

## Step 4: Seed Initial Data (Optional)

To populate the database with test data:

```bash
npm run seed
```

This creates:
- Test users (CA, Manager, Staff)
- Sample clients and firms
- Sample tasks, documents, and invoices

## Database Schema

The following **11 tables** are created by the migrations:

### 1. User Table
Stores user accounts with role-based access control.

```sql
CREATE TABLE User (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  phone         VARCHAR(255),
  role          ENUM('CA', 'MANAGER', 'STAFF') DEFAULT 'STAFF',
  reportsToId   INT,
  status        ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  profilePicture VARCHAR(255),
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reportsToId) REFERENCES User(id)
);
```

**Indexes:**
- `email` (unique)
- `role`

### 2. Client Table
Stores client information.

```sql
CREATE TABLE Client (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(255) NOT NULL,
  contactPerson VARCHAR(255),
  email         VARCHAR(255),
  phone         VARCHAR(255),
  address       TEXT,
  notes         TEXT,
  createdById   INT NOT NULL,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdById) REFERENCES User(id)
);
```

**Indexes:**
- `createdById`

### 3. Firm Table
Stores firm/business information linked to clients.

```sql
CREATE TABLE Firm (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  clientId          INT NOT NULL,
  name              VARCHAR(255) NOT NULL,
  panNumber         VARCHAR(255) UNIQUE NOT NULL,
  gstNumber         VARCHAR(255) UNIQUE,
  registrationNumber VARCHAR(255),
  address           TEXT,
  status            VARCHAR(255) DEFAULT 'Active',
  createdById       INT NOT NULL,
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (createdById) REFERENCES User(id)
);
```

**Indexes:**
- `clientId`
- `panNumber` (unique)
- `gstNumber` (unique)

### 4. Task Table
Stores tasks assigned to users for firms.

```sql
CREATE TABLE Task (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  firmId        INT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  assignedToId  INT NOT NULL,
  status        ENUM('PENDING', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'ERROR', 'OVERDUE') DEFAULT 'PENDING',
  priority      ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
  dueDate       DATETIME NOT NULL,
  completedAt   DATETIME,
  createdById   INT NOT NULL,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firmId) REFERENCES Firm(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedToId) REFERENCES User(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);
```

**Indexes:**
- `firmId`
- `assignedToId`
- `status`
- `dueDate`

### 5. Approval Table
Stores approval requests for tasks.

```sql
CREATE TABLE Approval (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  taskId        INT UNIQUE NOT NULL,
  requestedById INT NOT NULL,
  approvedById  INT,
  status        ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  remarks       TEXT,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  approvedAt   DATETIME,
  rejectedAt    DATETIME,
  FOREIGN KEY (taskId) REFERENCES Task(id) ON DELETE CASCADE,
  FOREIGN KEY (requestedById) REFERENCES User(id),
  FOREIGN KEY (approvedById) REFERENCES User(id)
);
```

**Indexes:**
- `status`
- `requestedById`
- `taskId` (unique)

### 6. Document Table
Stores uploaded documents for firms and tasks.

```sql
CREATE TABLE Document (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  firmId        INT NOT NULL,
  taskId        INT,
  documentType  ENUM('ITR', 'GST', 'TDS', 'ROC', 'INVOICE', 'OTHER') DEFAULT 'OTHER',
  fileName      VARCHAR(255) NOT NULL,
  filePath      VARCHAR(255) NOT NULL,
  fileSize      INT NOT NULL,
  mimeType      VARCHAR(255) NOT NULL,
  uploadedById  INT NOT NULL,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firmId) REFERENCES Firm(id) ON DELETE CASCADE,
  FOREIGN KEY (taskId) REFERENCES Task(id) ON DELETE SET NULL,
  FOREIGN KEY (uploadedById) REFERENCES User(id)
);
```

**Indexes:**
- `firmId`
- `taskId`
- `documentType`

### 7. Invoice Table
Stores invoices for firms.

```sql
CREATE TABLE Invoice (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  firmId        INT NOT NULL,
  invoiceNumber VARCHAR(255) UNIQUE NOT NULL,
  amount        DECIMAL(10, 2) NOT NULL,
  taxAmount     DECIMAL(10, 2) DEFAULT 0,
  totalAmount   DECIMAL(10, 2) NOT NULL,
  dueDate       DATETIME NOT NULL,
  status        ENUM('UNPAID', 'PAID', 'OVERDUE', 'PARTIAL') DEFAULT 'UNPAID',
  paidDate      DATETIME,
  paymentReference VARCHAR(255),
  createdById   INT NOT NULL,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (firmId) REFERENCES Firm(id) ON DELETE CASCADE,
  FOREIGN KEY (createdById) REFERENCES User(id)
);
```

**Indexes:**
- `firmId`
- `invoiceNumber` (unique)
- `status`
- `dueDate`

### 8. Meeting Table
Stores scheduled meetings with clients.

```sql
CREATE TABLE Meeting (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  clientId      INT NOT NULL,
  firmId        INT,
  title         VARCHAR(255) NOT NULL,
  date          DATETIME NOT NULL,
  location      VARCHAR(255),
  notes         TEXT,
  createdById   INT NOT NULL,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE CASCADE,
  FOREIGN KEY (firmId) REFERENCES Firm(id) ON DELETE SET NULL,
  FOREIGN KEY (createdById) REFERENCES User(id)
);
```

**Indexes:**
- `clientId`
- `firmId`
- `date`

### 9. UserFirmMapping Table
Maps users to firms for access control.

```sql
CREATE TABLE UserFirmMapping (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  userId        INT NOT NULL,
  firmId        INT NOT NULL,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (firmId) REFERENCES Firm(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_firm (userId, firmId)
);
```

**Indexes:**
- `userId`
- `firmId`
- Unique constraint on `(userId, firmId)`

### 10. ActivityLog Table
Stores audit trail of user actions.

```sql
CREATE TABLE ActivityLog (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  userId        INT NOT NULL,
  actionType    VARCHAR(255) NOT NULL,
  entityType    VARCHAR(255) NOT NULL,
  entityId      VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  metadata      TEXT DEFAULT '{}',
  ipAddress     VARCHAR(255),
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
```

**Indexes:**
- `userId`
- `entityType, entityId` (composite)
- `createdAt`

### 11. Meeting Table
Stores scheduled meetings with clients.

```sql
CREATE TABLE Meeting (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  clientId            INT,
  firmId              INT,
  meetingDate         DATETIME NOT NULL,
  meetingTime         VARCHAR(255) NOT NULL,
  location            VARCHAR(255),
  notes               TEXT,
  googleCalendarLink  VARCHAR(255),
  createdById         INT NOT NULL,
  createdAt           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE SET NULL,
  FOREIGN KEY (firmId) REFERENCES Firm(id) ON DELETE SET NULL,
  FOREIGN KEY (createdById) REFERENCES User(id)
);
```

**Indexes:**
- `clientId`
- `firmId`
- `createdById`
- `meetingDate`

## Database Relationships

```
User (1) ──< (many) Client
User (1) ──< (many) Firm
User (1) ──< (many) Task (assigned)
User (1) ──< (many) Task (created)
User (1) ──< (many) Approval (requested)
User (1) ──< (many) Approval (approved)
User (1) ──< (many) Document
User (1) ──< (many) Invoice
User (1) ──< (many) Meeting
User (1) ──< (many) ActivityLog

Client (1) ──< (many) Firm
Client (1) ──< (many) Meeting

Firm (1) ──< (many) Task
Firm (1) ──< (many) Document
Firm (1) ──< (many) Invoice
Firm (1) ──< (many) Meeting
Firm (many) ──< (many) User (via UserFirmMapping)

Task (1) ──< (1) Approval
Task (1) ──< (many) Document

Meeting (many) ──< (1) Client (optional)
Meeting (many) ──< (1) Firm (optional)
Meeting (many) ──< (1) User (createdBy)
```

## Verification

After running migrations, verify the tables were created:

```sql
USE ca_firm;
SHOW TABLES;
```

You should see all 11 tables listed:
- User
- Client
- Firm
- Task
- Approval
- Document
- Invoice
- UserFirmMapping
- ActivityLog
- Meeting

## Troubleshooting

### Migration Errors

If you encounter migration errors:

1. **Reset database** (⚠️ WARNING: This deletes all data):
```bash
npx prisma migrate reset
```

2. **Check database connection**:
```bash
npx prisma db pull
```

3. **View migration status**:
```bash
npx prisma migrate status
```

### Connection Issues

1. Verify MySQL is running:
```bash
mysql -u root -p
```

2. Check database exists:
```sql
SHOW DATABASES;
```

3. Verify user permissions:
```sql
SHOW GRANTS FOR 'your_user'@'localhost';
```

### Common Issues

**Issue**: `Access denied for user`
- **Solution**: Check username and password in `.env` file

**Issue**: `Database doesn't exist`
- **Solution**: Create database manually or update `DATABASE_URL`

**Issue**: `Table already exists`
- **Solution**: Run `npx prisma migrate reset` or manually drop tables

## Next Steps

After database setup:
1. Configure backend environment variables (see `backend/.env`)
2. Start the backend server
3. Set up the web application (see `WEB_APP_SETUP.md`)
4. Set up the mobile application (see `MOBILE_APP_SETUP.md`)

## Database Maintenance

### Backup Database

```bash
mysqldump -u root -p ca_firm > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
mysql -u root -p ca_firm < backup_file.sql
```

### View Database Size

```sql
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'ca_firm'
GROUP BY table_schema;
```

