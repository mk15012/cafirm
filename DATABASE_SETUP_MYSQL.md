# MySQL Database Setup Guide

## ✅ Database Changed to MySQL

The system has been successfully configured to use **MySQL** instead of PostgreSQL.

## 🚀 Quick Setup

### Step 1: Install MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
```

**Windows:**
Download and install from: https://dev.mysql.com/downloads/mysql/

### Step 2: Create Database

Connect to MySQL:
```bash
mysql -u root -p
```

Create the database:
```sql
CREATE DATABASE ca_firm_db;
CREATE USER 'ca_firm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ca_firm_db.* TO 'ca_firm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Configure Connection String

Create/update `backend/.env` file:
```env
DATABASE_URL="mysql://ca_firm_user:your_password@localhost:3306/ca_firm_db"
```

**Connection String Format:**
```
mysql://[username]:[password]@[host]:[port]/[database_name]
```

### Step 4: Run Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create all tables in MySQL
- Set up all relationships
- Create indexes
- Set up foreign keys

### Step 5: Verify Setup

```bash
# Check tables
mysql -u ca_firm_user -p ca_firm_db -e "SHOW TABLES;"

# Or use Prisma Studio
npx prisma studio
```

## 📊 MySQL vs PostgreSQL

### Why MySQL is Good for This Project:

✅ **Widely Available** - Easy to install and set up  
✅ **Good Performance** - Excellent for read-heavy workloads  
✅ **Simple Setup** - Less configuration needed  
✅ **Compatible** - Works well with Prisma  
✅ **No Scaling Issues** - MySQL handles this project's scale easily  
✅ **Familiar** - Most developers know MySQL  

### MySQL Features Used:

- Relational tables with foreign keys
- Indexes for performance
- Enums for status fields
- Transactions for data integrity
- Auto-increment IDs (via Prisma cuid)

## 🔧 Troubleshooting

### Connection Issues:
```bash
# Check MySQL is running
brew services list  # macOS
sudo systemctl status mysql  # Linux

# Test connection
mysql -u ca_firm_user -p -h localhost ca_firm_db
```

### Migration Issues:
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Port Conflicts:
Default MySQL port is 3306. If different, update connection string:
```
mysql://user:pass@localhost:3307/ca_firm_db
```

## 📝 Notes

- MySQL doesn't use schemas like PostgreSQL, so no `?schema=public` needed
- All Prisma features work the same with MySQL
- The application code doesn't need any changes - Prisma handles the differences
- MySQL is perfect for this CA firm management system's requirements

## ✅ Ready to Use

Once migrations are complete, your MySQL database is ready and the application will work exactly the same as with PostgreSQL!

