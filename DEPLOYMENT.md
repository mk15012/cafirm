# CA Firm Management - Production Deployment Guide (MySQL)

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │    Web App      │     │   Backend API   │
│  (App Stores)   │────▶│   (Vercel)      │────▶│  (AWS EC2/Railway)│
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │     MySQL       │
                                                │   (AWS RDS)     │
                                                └─────────────────┘
```

---

## 💰 AWS Free Tier Limits

| Service | Free Tier Limit | Duration |
|---------|-----------------|----------|
| **RDS MySQL** | 20 GB storage, db.t2.micro/db.t3.micro | 12 months |
| **EC2** | 750 hours/month, t2.micro | 12 months |
| **Data Transfer** | 15 GB/month outbound | Always |

---

## 1️⃣ AWS RDS MySQL Setup (Free Tier)

### Step 1: Create RDS Instance

1. Go to **AWS Console** → **RDS** → **Create database**

2. Choose options:
   - **Engine**: MySQL
   - **Version**: MySQL 8.0.x
   - **Templates**: Free tier ✓
   - **DB instance identifier**: `cafirm-db`
   - **Master username**: `admin`
   - **Master password**: (create a strong password, save it!)

3. Instance configuration:
   - **DB instance class**: db.t3.micro (or db.t2.micro)
   - **Storage**: 20 GB (General Purpose SSD)
   - **Storage autoscaling**: Disable (to stay in free tier)

4. Connectivity:
   - **VPC**: Default VPC
   - **Public access**: Yes (for development) or No (for production with EC2 in same VPC)
   - **VPC security group**: Create new → `cafirm-db-sg`

5. Additional configuration:
   - **Initial database name**: `cafirm`
   - **Backup retention**: 7 days
   - **Encryption**: Enable

6. Click **Create database** (takes 5-10 minutes)

### Step 2: Configure Security Group

1. Go to **EC2** → **Security Groups**
2. Find `cafirm-db-sg`
3. Edit **Inbound rules**:
   - **Type**: MySQL/Aurora
   - **Port**: 3306
   - **Source**: 
     - For EC2: Select your EC2 security group
     - For Railway/external: `0.0.0.0/0` (less secure, but needed for external access)

### Step 3: Get Connection String

1. Go to **RDS** → **Databases** → `cafirm-db`
2. Copy the **Endpoint** (e.g., `cafirm-db.xxxxx.us-east-1.rds.amazonaws.com`)
3. Your DATABASE_URL will be:
   ```
   mysql://admin:YOUR_PASSWORD@cafirm-db.xxxxx.us-east-1.rds.amazonaws.com:3306/cafirm
   ```

---

## 2️⃣ Backend Deployment

### Option A: AWS EC2 (Free Tier) - Recommended

#### Step 1: Launch EC2 Instance

1. Go to **EC2** → **Launch Instance**
2. Configure:
   - **Name**: `cafirm-backend`
   - **AMI**: Amazon Linux 2023
   - **Instance type**: t2.micro (free tier)
   - **Key pair**: Create new or select existing
   - **Security group**: Create new with:
     - SSH (22) from your IP
     - HTTP (80) from anywhere
     - HTTPS (443) from anywhere
     - Custom TCP (3001) from anywhere

3. Launch instance

#### Step 2: Connect and Setup

```bash
# Connect to your instance
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Update system
sudo yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 3: Deploy Backend

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/cafirm.git
cd cafirm/backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=mysql://admin:YOUR_PASSWORD@cafirm-db.xxxxx.us-east-1.rds.amazonaws.com:3306/cafirm
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:3000
PORT=3001
EOF

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed database (optional)
npm run seed

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name "cafirm-api"
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx as Reverse Proxy

```bash
sudo nano /etc/nginx/conf.d/cafirm.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;  # Or your domain

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: (Optional) Add SSL with Let's Encrypt

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot-renew.timer
```

### Option B: Railway (Simpler, but may have limits)

1. Go to **railway.app** → Create project
2. Deploy from GitHub, select `backend` folder
3. Add environment variables:
   ```
   DATABASE_URL=mysql://admin:PASSWORD@cafirm-db.xxxxx.rds.amazonaws.com:3306/cafirm
   JWT_SECRET=your-secret-key
   CORS_ORIGIN=https://your-app.vercel.app
   ```
4. Railway will auto-deploy

---

## 3️⃣ Web Frontend (Vercel - Free)

### Step 1: Prepare for Production

Update `web/.env.local` (for local testing):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 2: Deploy to Vercel

1. Go to **vercel.com** → Sign in with GitHub
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `web`
   - **Framework Preset**: Next.js (auto-detected)
   
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:3001
   ```
   Or if using domain with HTTPS:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

6. Click **Deploy**

### Step 3: Update Backend CORS

After Vercel deployment, update your backend `.env`:
```
CORS_ORIGIN=https://your-app.vercel.app,https://yourdomain.com
```

Then restart PM2:
```bash
pm2 restart cafirm-api
```

---

## 4️⃣ Mobile App Deployment

### Step 1: Update API URL

Create `mobile/.env.production`:
```
EXPO_PUBLIC_API_URL=http://YOUR_EC2_IP:3001
```
Or with domain:
```
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

### Step 2: Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Step 3: Configure EAS

The `mobile/eas.json` is already configured. Update `mobile/app.json`:

```json
{
  "expo": {
    "name": "CA Firm Management",
    "slug": "ca-firm-management",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.cafirm"
    },
    "android": {
      "package": "com.yourcompany.cafirm"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### Step 4: Build Android APK

```bash
cd mobile

# Build APK (free, runs on Expo servers)
eas build --platform android --profile production

# Wait for build to complete (10-20 minutes)
# Download APK from the link provided
```

### Step 5: Build iOS (Requires Apple Developer Account - $99/year)

```bash
eas build --platform ios --profile production
```

### Step 6: Distribution

**Android:**
- Share APK directly for testing
- Publish to Google Play Store ($25 one-time)

**iOS:**
- TestFlight for beta testing
- App Store for public release

---

## 📋 Environment Variables Summary

### Backend (.env)
```env
# Database
DATABASE_URL=mysql://admin:PASSWORD@cafirm-db.xxx.rds.amazonaws.com:3306/cafirm

# Security
JWT_SECRET=your-64-char-random-string

# CORS (comma-separated URLs)
CORS_ORIGIN=https://your-app.vercel.app,https://yourdomain.com

# Server
PORT=3001

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Web (.env.local or Vercel env vars)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Mobile (.env.production)
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 🔐 Security Checklist

- [ ] Use strong, unique passwords for RDS
- [ ] Generate random JWT_SECRET: `openssl rand -hex 32`
- [ ] Enable RDS encryption at rest
- [ ] Restrict RDS security group to EC2 only (if possible)
- [ ] Use HTTPS for all production URLs
- [ ] Never commit .env files to git
- [ ] Enable AWS CloudWatch for monitoring
- [ ] Set up database backups

---

## 💰 Cost Breakdown (Free Tier)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| AWS RDS MySQL | $0 | Free tier: 12 months |
| AWS EC2 | $0 | Free tier: 750 hrs/month |
| Vercel | $0 | Hobby plan |
| Expo EAS | $0 | 30 builds/month |
| **Total** | **$0** | For 12 months |

After free tier expires:
- RDS db.t3.micro: ~$12-15/month
- EC2 t3.micro: ~$8-10/month

---

## 🛠️ Useful Commands

### EC2 Backend Management
```bash
# View logs
pm2 logs cafirm-api

# Restart app
pm2 restart cafirm-api

# Update code
cd ~/cafirm && git pull
cd backend && npm install && npm run build
pm2 restart cafirm-api

# Check status
pm2 status
```

### Database Management
```bash
# Connect to MySQL from EC2
mysql -h cafirm-db.xxx.rds.amazonaws.com -u admin -p cafirm

# Run migrations
cd ~/cafirm/backend
npx prisma migrate deploy

# Open Prisma Studio (local only)
npx prisma studio
```

---

## 🆘 Troubleshooting

### Can't connect to RDS
- Check security group allows your IP/EC2
- Verify RDS is publicly accessible (if needed)
- Test with: `nc -zv your-rds-endpoint 3306`

### Backend 502 errors
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs`
- Restart: `pm2 restart cafirm-api`

### CORS errors
- Verify CORS_ORIGIN includes your frontend URL
- Include both http and https versions
- Restart backend after changes

### Mobile app can't connect
- Check EXPO_PUBLIC_API_URL is correct
- Ensure backend is accessible from internet
- Test API endpoint in browser first
