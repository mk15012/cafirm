# CA Firm Management System

A comprehensive management system for Chartered Accountant firms to manage clients, firms, tasks, documents, invoices, and approvals with role-based access control.

## 🏗️ Architecture

This is a monorepo containing:
- **Backend**: Node.js + Express + TypeScript + MySQL
- **Web App**: Next.js 14 + TypeScript + Tailwind CSS
- **Mobile App**: React Native (Expo) + TypeScript
- **Shared**: Common TypeScript types and utilities

## 📁 Project Structure

```
ca-firm-management/
├── backend/          # Node.js API server
├── web/              # Next.js web application
├── mobile/           # React Native mobile app
├── shared/           # Shared TypeScript code
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn or pnpm

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env` and configure
   - Copy `web/.env.example` to `web/.env.local` and configure

3. Set up database:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

4. Start development servers:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Web App
npm run dev:web

# Terminal 3: Mobile App (optional)
npm run dev:mobile
```

## 🔐 Authentication & Login

### New Feature: Signup
**New CAs can now create their own accounts!**
- Go to http://localhost:3000/auth/signup
- Fill in your details and create your account
- You'll be automatically logged in

### Creating First User

**Option 1: Use Signup (Recommended)**
1. Start backend: `cd backend && npm run dev`
2. Start web app: `cd web && npm run dev`
3. Visit http://localhost:3000/auth/signup
4. Create your CA account

**Option 2: Create via Script**
```bash
cd backend
node scripts/create-first-user.js "Your Name" "your@email.com" "yourpassword"
```

**Option 3: Seed Test Data**
```bash
cd backend
npm run seed
```
This creates test users with sample data:
- CA: ramesh@cafirm.com / password123
- Manager: priya@cafirm.com / password123
- Staff: raj@cafirm.com / password123

### Login
Visit http://localhost:3000/auth/login and use your credentials.

See [WEB_APP_SETUP.md](./WEB_APP_SETUP.md) for detailed setup and login instructions.

## 📚 Documentation

- [Database Setup Guide](./DATABASE_SETUP.md) - Complete database schema and setup instructions
- [Web App Setup Guide](./WEB_APP_SETUP.md) - Web application setup and running instructions
- [Mobile App Setup Guide](./MOBILE_APP_SETUP.md) - Mobile application setup and running instructions

## 📝 License

Private project

