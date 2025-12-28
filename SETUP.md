# CA Firm Management System - Setup Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ installed and running
- npm, yarn, or pnpm

### Step 1: Install Dependencies

```bash
# Install all dependencies for all packages
npm run install:all

# Or install individually:
cd backend && npm install
cd ../web && npm install
cd ../mobile && npm install
cd ../shared && npm install
```

### Step 2: Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE ca_firm_db;
```

2. Configure backend environment:
```bash
cd backend
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

3. Run database migrations:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Step 3: Configure Environment Variables

#### Backend (.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/ca_firm_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"
```

#### Web App (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Mobile App (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

### Step 4: Create First User (CA)

You can create the first CA user using Prisma Studio or by making an API call:

```bash
# Using Prisma Studio
cd backend
npx prisma studio

# Or create a seed script (recommended)
```

### Step 5: Start Development Servers

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3001

#### Terminal 2: Web App
```bash
cd web
npm run dev
```
Web app will run on http://localhost:3000

#### Terminal 3: Mobile App (Optional)
```bash
cd mobile
npm start
```
Then press `i` for iOS simulator or `a` for Android emulator

## 📁 Project Structure

```
ca-firm-management/
├── backend/          # Node.js + Express + TypeScript + Prisma
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/      # Auth, logging
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   └── types/           # TypeScript types
│   └── prisma/              # Database schema
│
├── web/              # Next.js 14 + TypeScript
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   └── lib/          # API client, stores
│
├── mobile/           # React Native + Expo
│   ├── app/          # Expo router screens
│   ├── components/   # React Native components
│   └── lib/          # API client, stores
│
└── shared/           # Shared TypeScript types
    └── types/        # Common type definitions
```

## 🔐 Default Setup

After setup, you'll need to:

1. **Create first CA user** - Use Prisma Studio or API
2. **Login** - Use the CA credentials
3. **Create users** - CA can create Manager and Staff users
4. **Assign firms** - Assign firms to staff members
5. **Start using** - Create clients, firms, tasks, etc.

## 🧪 Testing the Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Login Test:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email","password":"your-password"}'
   ```

3. **Web App:** Open http://localhost:3000 and login

4. **Mobile App:** Run on simulator/emulator

## 📝 API Endpoints

All API endpoints are prefixed with `/api`:

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/dashboard/metrics` - Dashboard metrics
- `GET /api/clients` - List clients
- `GET /api/firms` - List firms
- `GET /api/tasks` - List tasks
- `GET /api/invoices` - List invoices
- `GET /api/documents` - List documents
- `GET /api/approvals` - List approvals
- `GET /api/users` - List users (CA only)
- `GET /api/activity-logs` - Activity logs (CA only)

See `REQUIREMENTS.md` for complete API documentation.

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database exists

### Port Already in Use
- Change PORT in backend/.env
- Update CORS_ORIGIN if needed
- Update NEXT_PUBLIC_API_URL in web/.env.local

### Prisma Issues
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # WARNING: This deletes all data
```

### Mobile App Issues
```bash
cd mobile
npm start -- --clear
```

## 📚 Next Steps

1. Read `REQUIREMENTS.md` for feature details
2. Read `TECH_STACK_GUIDE.md` for architecture decisions
3. Customize the UI in `web/app/` and `mobile/app/`
4. Add more features as needed

## 🚢 Production Deployment

### Backend
- Deploy to AWS, Railway, DigitalOcean, etc.
- Set production environment variables
- Use production database
- Enable HTTPS

### Web App
- Deploy to Vercel, Netlify, etc.
- Set NEXT_PUBLIC_API_URL to production backend URL

### Mobile App
- Build with Expo EAS Build
- Submit to App Store and Play Store

## 📞 Support

For issues or questions, refer to:
- `REQUIREMENTS.md` - Feature requirements
- `TECH_STACK_GUIDE.md` - Technology decisions
- `UI_ANALYSIS.md` - UI design analysis

