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

## 📚 Documentation

- [Tech Stack Guide](./TECH_STACK_GUIDE.md)
- [Requirements](./REQUIREMENTS.md)
- [UI Analysis](./UI_ANALYSIS.md)

## 🔐 Default Credentials

After initial setup, create your first CA user through the API or seed script.

## 📝 License

Private project

