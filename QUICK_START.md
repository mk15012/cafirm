# 🚀 Quick Start Guide

## How to Login and View Data

### Step 1: Start Backend Server
```bash
cd backend
npm run dev
```
Wait for: `🚀 Server running on http://localhost:3001`

### Step 2: Create Test User (If Needed)

If you don't have a user yet, create one:

**Option A: Use Signup Feature (Recommended)**
1. Go to http://localhost:3000/auth/signup
2. Fill in the form and create your CA account
3. You'll be automatically logged in!

**Option B: Create via Script**
```bash
cd backend
node scripts/create-first-user.js "Ramesh Kumar" "ramesh@cafirm.com" "password123"
```

**Option C: Seed All Test Data**
```bash
cd backend
npm run seed
```
This creates 4 test users with sample data (clients, firms, tasks, invoices).

### Step 3: Start Web App
```bash
cd web
npm run dev
```

### Step 4: Login

Go to http://localhost:3000/auth/login

**Test Credentials (if you ran seed):**
- **Email:** `ramesh@cafirm.com`
- **Password:** `password123`

Or use any account you created via signup!

### Step 5: Explore the Dashboard

After logging in, you'll see:
- Dashboard with metrics
- Clients list
- Firms list
- Tasks list
- Invoices list
- Documents list
- Approvals (if any)
- Users management (CA only)
- Activity logs (CA only)

---

## 🔑 Available Test Users (After Seed)

| Role | Email | Password | Access |
|------|-------|----------|--------|
| CA | ramesh@cafirm.com | password123 | Full access |
| Manager | priya@cafirm.com | password123 | Team oversight |
| Staff | raj@cafirm.com | password123 | Limited access |
| Staff | anita@cafirm.com | password123 | Limited access |

---

## 🆕 New Feature: Signup

**New CAs can now create their own accounts!**

1. Go to http://localhost:3000/auth/signup
2. Fill in your details
3. Create your account
4. You'll be automatically logged in

---

## 📝 Need Help?

- Check `SETUP.md` for detailed setup instructions
- Check `TEST_CREDENTIALS.md` for test user information
- Check `CREATE_FIRST_USER.md` for creating your first user manually

