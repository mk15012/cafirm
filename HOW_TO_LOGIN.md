# 🔐 How to Login and View Your Data

## Quick Steps

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
✅ Wait until you see: `🚀 Server running on http://localhost:3001`

### 2. Create Your Account (Choose One Method)

#### Method A: Signup via Web (Easiest - New Feature!)
1. Start web app in a new terminal:
   ```bash
   cd web
   npm run dev
   ```
2. Open browser: http://localhost:3000/auth/signup
3. Fill in:
   - Your Name
   - Your Email
   - Password (minimum 6 characters)
   - Phone (optional)
4. Click "Sign Up"
5. ✅ You'll be automatically logged in and redirected to dashboard!

#### Method B: Create Test User via Script
```bash
cd backend
node scripts/create-first-user.js "Ramesh Kumar" "ramesh@cafirm.com" "password123"
```

#### Method C: Seed All Test Data (Includes Sample Clients, Firms, Tasks, etc.)
```bash
cd backend
npm run seed
```

### 3. Login (If You Used Method B or C)

1. Make sure web app is running:
   ```bash
   cd web
   npm run dev
   ```
2. Open browser: http://localhost:3000/auth/login
3. Enter credentials:
   - **Email:** ramesh@cafirm.com (or your email)
   - **Password:** password123 (or your password)
4. Click "Login"
5. ✅ You'll be redirected to the dashboard!

### 🔧 If Login Fails

If login fails with existing credentials, reset the password:

```bash
cd backend
node scripts/reset-user-password.js "ramesh@cafirm.com" "password123"
```

This will reset the password and ensure the user status is ACTIVE.

---

## 📊 What You'll See After Login

### Dashboard
- Active tasks count
- Pending approvals
- Overdue items
- Documents count
- Active clients
- Firms managed
- Monthly revenue
- Unpaid invoices

### Main Features
- **Clients** - Manage client list
- **Firms** - Manage firms with PAN/GST numbers
- **Tasks** - Create and track tasks
- **Invoices** - Generate and track invoices
- **Documents** - Upload and manage documents
- **Approvals** - Approve/reject task requests
- **Users** - Manage team members (CA only)
- **Activity Logs** - View audit trail (CA only)

---

## 🔑 Test Credentials (After Running Seed)

If you ran `npm run seed` in the backend, you can use these credentials:

| Role | Email | Password | What They Can Do |
|------|-------|----------|------------------|
| **CA** | ramesh@cafirm.com | password123 | Full access - can see everything |
| **Manager** | priya@cafirm.com | password123 | Team oversight - can approve tasks |
| **Staff** | raj@cafirm.com | password123 | Limited - only assigned tasks/firms |

---

## ✅ Everything is Ready!

- ✅ Signup feature is working
- ✅ Login feature is working
- ✅ All navigation links work
- ✅ All features are implemented

**Just start the servers and login!** 🎉

---

## 🆘 Troubleshooting

### ❌ Login Error: "ERR_CONNECTION_REFUSED" or "Login failed"

**This means the backend server is NOT running!**

**Fix:**
1. Open a terminal
2. Run: `cd backend && npm run dev`
3. Wait for: `🚀 Server running on http://localhost:3001`
4. Try login again

**Check if backend is running:**
```bash
curl http://localhost:3001/health
```
Should return: `{"status":"ok",...}`

### Backend won't start?
- Check if MySQL is running
- Check `.env` file in backend folder has correct DATABASE_URL
- Run: `cd backend && npx prisma generate`

### Can't login? (Backend is running)
- Make sure you created a user first (use signup or create-first-user script)
- Check email and password are correct
- Reset password: `cd backend && node scripts/reset-user-password.js "ramesh@cafirm.com" "password123"`

### No data showing?
- Run the seed script to populate test data:
  ```bash
  cd backend
  npm run seed
  ```

---

**Need more help?** Check [QUICK_START.md](./QUICK_START.md) or [SETUP.md](./SETUP.md)

