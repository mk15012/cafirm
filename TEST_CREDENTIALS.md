# 🔑 Test Credentials - CA Firm Management System

## Quick Login

**Web App URL:** http://localhost:3000/auth/login

---

## 👤 Available Test Users

All users have the same password: **`password123`**

### 1. CA (Chartered Accountant) - Full Access ⭐
```
Email: ramesh@cafirm.com
Password: password123
```

**What you can do:**
- ✅ View all clients, firms, tasks, invoices
- ✅ Manage all users (create, edit, delete)
- ✅ View activity logs (complete audit trail)
- ✅ Approve/reject all tasks
- ✅ Access dashboard with all metrics including revenue
- ✅ Full system access

**Recommended for:** Testing all features

---

### 2. Manager - Team Oversight
```
Email: priya@cafirm.com
Password: password123
```

**What you can do:**
- ✅ View assigned clients and firms
- ✅ View tasks for your team
- ✅ Approve/reject tasks
- ✅ View dashboard metrics (including revenue)
- ✅ Manage team members' tasks
- ❌ Cannot manage users
- ❌ Cannot view activity logs

**Recommended for:** Testing manager workflow and approvals

---

### 3. Staff - Limited Access
```
Email: raj@cafirm.com
Password: password123
```

**What you can do:**
- ✅ View only assigned firms (ABC Traders, XYZ Industries - Main)
- ✅ View and update assigned tasks
- ✅ Upload documents for assigned firms
- ✅ View assigned invoices
- ❌ Cannot see other staff's tasks
- ❌ Cannot approve tasks
- ❌ Cannot view all clients/firms
- ❌ Cannot view revenue metrics

**Recommended for:** Testing staff-level restrictions

---

### 4. Staff - Limited Access
```
Email: anita@cafirm.com
Password: password123
```

**What you can do:**
- ✅ View only assigned firms (XYZ Industries - Branch, DEF Enterprises)
- ✅ View and update assigned tasks
- ✅ Upload documents for assigned firms
- ✅ View assigned invoices
- ❌ Same restrictions as Raj (Staff role)

**Recommended for:** Testing multiple staff members

---

## 🧪 Testing Scenarios

### Scenario 1: Full System Testing (Use CA Account)
1. Login as `ramesh@cafirm.com`
2. View dashboard - see all metrics
3. Go to Clients - see all 3 clients
4. Go to Firms - see all 4 firms
5. Go to Tasks - see all 6 tasks
6. Go to Invoices - see all 5 invoices
7. Go to Approvals - approve/reject the pending approval
8. Go to Users - see all 4 users, create/edit users
9. Go to Activity Logs - see audit trail

### Scenario 2: Manager Workflow (Use Manager Account)
1. Login as `priya@cafirm.com`
2. View dashboard - see team metrics
3. Go to Approvals - approve the pending task
4. View tasks - see tasks assigned to team members
5. Try to access Users - should be restricted (CA only)

### Scenario 3: Staff Restrictions (Use Staff Account)
1. Login as `raj@cafirm.com`
2. View dashboard - limited metrics (no revenue)
3. Go to Clients - see only clients with assigned firms
4. Go to Tasks - see only assigned tasks
5. Try to approve a task - should be restricted
6. Try to access Users - should be restricted

---

## 📊 Sample Data Overview

After logging in, you'll see:

- **3 Clients**: ABC Traders, XYZ Industries, DEF Enterprises
- **4 Firms**: Multiple firms with PAN/GST numbers
- **6 Tasks**: Various statuses (Pending, In Progress, Awaiting Approval, Completed, Overdue)
- **5 Invoices**: Mix of Paid, Unpaid, and Overdue
- **1 Approval**: Pending approval request
- **4 Activity Logs**: Audit trail entries

---

## 🎯 Quick Test Checklist

### As CA (ramesh@cafirm.com):
- [ ] Login successfully
- [ ] View dashboard with all metrics
- [ ] Create a new client
- [ ] Create a new firm
- [ ] Create a new task
- [ ] Create a new invoice
- [ ] Approve the pending approval
- [ ] View activity logs
- [ ] Create a new user
- [ ] Upload a document

### As Manager (priya@cafirm.com):
- [ ] Login successfully
- [ ] View dashboard (with revenue)
- [ ] Approve/reject tasks
- [ ] View team tasks
- [ ] Try to access Users (should fail)

### As Staff (raj@cafirm.com or anita@cafirm.com):
- [ ] Login successfully
- [ ] View dashboard (no revenue)
- [ ] See only assigned tasks
- [ ] Update task status
- [ ] Try to approve task (should fail)
- [ ] Try to access Users (should fail)

---

## 💡 Tips

1. **Start with CA account** to see all features
2. **Test role restrictions** by logging in as different users
3. **Check the dashboard** - metrics change based on role
4. **Try creating records** - forms are fully functional
5. **Test approvals** - create a task, set to "Awaiting Approval", then approve as Manager/CA

---

## 🔄 Switching Between Users

Simply logout and login with different credentials to test different roles!

---

**Happy Testing! 🎉**

