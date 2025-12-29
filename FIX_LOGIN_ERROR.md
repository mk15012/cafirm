# 🔧 Fix Login Error - Connection Refused

## Problem
Error: `ERR_CONNECTION_REFUSED` when trying to login

This means the **backend server is not running**.

## Solution

### Step 1: Start Backend Server

Open a terminal and run:

```bash
cd backend
npm run dev
```

**Wait until you see:**
```
🚀 Server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

### Step 2: Verify Backend is Running

In another terminal, test the connection:

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"2024-..."}
```

### Step 3: Try Login Again

1. Make sure backend is running (Step 1)
2. Go to http://localhost:3000/auth/login
3. Enter credentials:
   - Email: `ramesh@cafirm.com`
   - Password: `password123`
4. Click Login

## Quick Check

**Are both servers running?**

✅ **Backend**: Should show `🚀 Server running on http://localhost:3001`
✅ **Web App**: Should show `Ready` or similar on port 3000

If either is not running, start it!

## Common Issues

### Backend won't start?
- Check if MySQL is running
- Check `.env` file has correct DATABASE_URL
- Run: `cd backend && npx prisma generate`

### Port 3001 already in use?
- Kill the process using port 3001
- Or change the port in backend/src/index.ts

### Still not working?
1. Check backend terminal for error messages
2. Verify database connection
3. Check `.env` file configuration

