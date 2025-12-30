# Web Application Setup Guide

This guide will help you set up and run the Next.js web application for the CA Firm Management System.

## Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm package manager
- Backend API server running (see backend setup)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Step 1: Install Dependencies

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

Or using pnpm:
```bash
pnpm install
```

## Step 2: Configure Environment Variables

1. Create a `.env.local` file in the `web` directory:
```bash
cp .env.example .env.local
```

2. Update the environment variables in `web/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**For Production:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Step 3: Verify Backend Connection

Ensure the backend API server is running on the port specified in `NEXT_PUBLIC_API_URL`.

You can test the connection:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"2025-01-01T00:00:00.000Z"}
```

## Step 4: Run Development Server

Start the development server:

```bash
npm run dev
```

Or using yarn:
```bash
yarn dev
```

Or using pnpm:
```bash
pnpm dev
```

The application will start on **http://localhost:3000**

## Step 5: Access the Application

1. Open your browser and navigate to:
```
http://localhost:3000
```

2. You will be redirected to the login page if not authenticated

3. **First Time Setup:**
   - Create a new CA account at: `http://localhost:3000/auth/signup`
   - Or use existing test credentials (if database was seeded)

## Available Routes

### Public Routes
- `/` - Home (redirects to dashboard or login)
- `/auth/login` - User login
- `/auth/signup` - User registration (creates CA account)

### Protected Routes (Requires Authentication)
- `/dashboard` - Main dashboard with metrics and quick access
- `/tasks` - Task list and management
- `/tasks/[id]` - Task detail page
- `/clients` - Client list and management
- `/clients/[id]` - Client detail page
- `/firms` - Firm list and management
- `/firms/[id]` - Firm detail page
- `/invoices` - Invoice list and management
- `/invoices/[id]` - Invoice detail page with PDF/email sending
- `/documents` - Document management
- `/approvals` - Approval requests management
- `/profile` - User profile and settings

### CA-Only Routes
- `/users` - User management (CA only)
- `/activity-logs` - Activity log viewer (CA only)

## Features

### Dashboard
- View key metrics (tasks, approvals, documents, clients, firms, revenue)
- Quick access to all modules
- Recent tasks and upcoming deadlines
- Schedule meetings

### Task Management
- Create, view, update, and delete tasks
- Filter by status, firm, and assigned user
- Update task status
- View task details with approval information

### Client Management
- Create, view, update, and delete clients (CA only)
- View client details with associated firms
- Add firms to clients

### Firm Management
- Create, view, update firms
- View firm details with tasks, documents, and invoices
- Link firms to clients

### Invoice Management
- Create invoices for firms
- View invoice details
- Mark invoices as paid
- **Send invoices via email with PDF attachment**

### Document Management
- Upload documents
- Filter by firm, task, and document type
- Download documents
- View document details

### Approvals
- View pending approval requests
- Approve or reject task requests
- Filter by status

### User Management (CA Only)
- Create users (Manager, Staff)
- Assign users to firms
- View user details
- Update user information

### Activity Logs (CA Only)
- View audit trail of all user actions
- Filter by user, action type, and date

## Development

### Project Structure

```
web/
├── app/                    # Next.js 14 App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── tasks/             # Task pages
│   ├── clients/           # Client pages
│   ├── firms/             # Firm pages
│   ├── invoices/          # Invoice pages
│   ├── documents/         # Document pages
│   ├── approvals/         # Approval pages
│   ├── users/             # User management (CA only)
│   ├── activity-logs/     # Activity logs (CA only)
│   ├── profile/           # User profile
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layout/           # Layout components
│   └── AuthProvider.tsx  # Auth context provider
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   └── store.ts          # Zustand store
├── public/                # Static assets
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json          # Dependencies
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server

# Production
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

### Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

The production server will start on port 3000 (or the port specified in `PORT` environment variable).

### Environment Variables for Production

Create a `.env.production` file:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Then build:
```bash
npm run build
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

1. Kill the process using port 3000:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

2. Or use a different port:
```bash
PORT=3001 npm run dev
```

### API Connection Errors

**Error**: `Network Error` or `Failed to fetch`

**Solutions:**
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS is configured in backend
4. Check browser console for detailed error messages

### Authentication Issues

**Error**: `401 Unauthorized` or redirect loop

**Solutions:**
1. Clear browser localStorage:
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage
2. Verify JWT token is being stored
3. Check backend authentication middleware
4. Try logging in again

### Build Errors

**Error**: TypeScript errors during build

**Solutions:**
1. Run type checking: `npm run type-check`
2. Fix TypeScript errors
3. Ensure all dependencies are installed: `npm install`
4. Clear Next.js cache: `rm -rf .next`

### Module Not Found Errors

**Error**: `Cannot find module` or `Module not found`

**Solutions:**
1. Reinstall dependencies: `rm -rf node_modules && npm install`
2. Clear Next.js cache: `rm -rf .next`
3. Verify import paths are correct
4. Check `tsconfig.json` paths configuration

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Tips

1. **Enable Production Mode**: Use `npm run build && npm run start` for better performance
2. **Optimize Images**: Use Next.js Image component for images
3. **Code Splitting**: Next.js automatically code-splits by route
4. **Caching**: API responses are cached where appropriate

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **API Keys**: Store sensitive keys server-side only
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS properly in backend
5. **Authentication**: Tokens stored in localStorage (consider httpOnly cookies for production)

## Next Steps

After web app setup:
1. Set up mobile application (see `MOBILE_APP_SETUP.md`)
2. Configure email service for invoice sending (optional)
3. Set up production deployment
4. Configure domain and SSL certificates

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend API is responding
3. Check network tab for failed requests
4. Review application logs

