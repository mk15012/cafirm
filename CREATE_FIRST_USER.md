# Creating Your First CA User

## ✅ MySQL Database is Ready!

Your database is set up and all tables are created. Now you need to create your first CA (Chartered Accountant) user to start using the system.

## Method 1: Using Prisma Studio (Recommended)

1. **Start Prisma Studio:**
   ```bash
   cd backend
   npx prisma studio
   ```

2. **Prisma Studio will open in your browser** (usually http://localhost:5555)

3. **Click on "User" table**

4. **Click "Add record"**

5. **Fill in the user details:**
   - `name`: Your name (e.g., "Ramesh Kumar")
   - `email`: Your email (e.g., "ramesh@cafirm.com")
   - `password`: **IMPORTANT** - You need to hash the password first!
     - Use this command to generate a hashed password:
     ```bash
     node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your_password', 10).then(hash => console.log(hash));"
     ```
     - Copy the hashed password and paste it in the password field
   - `role`: Select "CA"
   - `status`: Select "ACTIVE"
   - Leave other fields empty for now

6. **Click "Save 1 change"**

7. **You can now login** with your email and password!

## Method 2: Using MySQL Directly

1. **Generate password hash:**
   ```bash
   cd backend
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your_password', 10).then(hash => console.log(hash));"
   ```

2. **Insert user directly:**
   ```bash
   mysql -u root -h localhost -P 3306 ca_firm_db
   ```
   
   ```sql
   INSERT INTO User (id, name, email, password, role, status, createdAt, updatedAt)
   VALUES (
     'clx1234567890',  -- Generate a unique ID (or use cuid format)
     'Ramesh Kumar',
     'ramesh@cafirm.com',
     'PASTE_HASHED_PASSWORD_HERE',  -- From step 1
     'CA',
     'ACTIVE',
     NOW(),
     NOW()
   );
   ```

## Method 3: Using API (After First User Exists)

Once you have at least one CA user, you can use the API to create more users:

```bash
# Login first to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ramesh@cafirm.com","password":"your_password"}'

# Use the token to create users
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "New User",
    "email": "user@cafirm.com",
    "password": "password123",
    "role": "STAFF"
  }'
```

## Quick Password Hash Generator

Run this in the backend directory:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash(process.argv[1], 10).then(hash => console.log('Hashed password:', hash));" "your_password_here"
```

## ✅ After Creating User

1. **Open web app:** http://localhost:3000
2. **Login** with your email and password
3. **Start using the system!**

## 🎯 Default Roles

- **CA**: Full access, can manage users, view all data
- **MANAGER**: Team oversight, can approve tasks
- **STAFF**: Limited access, only assigned tasks/firms

---

**Note:** Make sure to use a strong password and keep it secure!

