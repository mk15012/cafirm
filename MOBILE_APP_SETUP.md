# Mobile Application Setup Guide

This guide will help you set up and run the React Native (Expo) mobile application for the CA Firm Management System.

## Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm package manager
- Backend API server running (see backend setup)
- **For iOS Development:**
  - macOS (required)
  - Xcode 14+ installed
  - CocoaPods installed
- **For Android Development:**
  - Android Studio installed
  - Android SDK configured
  - Java Development Kit (JDK) 11+
- **For Testing on Physical Device:**
  - Expo Go app installed on iOS/Android device
  - Device and computer on same network

## Step 1: Install Dependencies

1. Navigate to the mobile directory:
```bash
cd mobile
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

## Step 2: Install Expo CLI (Global)

Install Expo CLI globally for development:

```bash
npm install -g expo-cli
```

Or using npx (recommended):
```bash
npx expo start
```

## Step 3: Configure Environment Variables

1. Create a `.env` file in the `mobile` directory:
```bash
cp .env.example .env
```

2. Update the environment variables in `mobile/.env`:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**For Production:**
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

**For Physical Device Testing:**
Replace `localhost` with your computer's IP address:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

To find your IP address:
- **macOS/Linux**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: `ipconfig` (look for IPv4 Address)

## Step 4: Verify Backend Connection

Ensure the backend API server is running and accessible.

For physical device testing, ensure:
1. Backend server is running
2. Firewall allows connections on port 3001
3. Device and computer are on the same network
4. Backend CORS is configured to allow your device's IP

## Step 5: Start Development Server

Start the Expo development server:

```bash
npm start
```

Or:
```bash
npx expo start
```

This will:
1. Start the Metro bundler
2. Display a QR code in the terminal
3. Open Expo DevTools in your browser

## Step 6: Run on Device/Emulator

### Option 1: Physical Device (Recommended for Testing)

1. **Install Expo Go:**
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Scan QR Code:**
   - iOS: Open Camera app and scan QR code
   - Android: Open Expo Go app and scan QR code

3. The app will load on your device

### Option 2: iOS Simulator (macOS only)

1. Press `i` in the terminal where Expo is running
2. Or run: `npm run ios`
3. iOS Simulator will open automatically

### Option 3: Android Emulator

1. Start Android Emulator from Android Studio
2. Press `a` in the terminal where Expo is running
3. Or run: `npm run android`
4. App will install and launch on emulator

### Option 4: Web Browser (Limited)

1. Press `w` in the terminal where Expo is running
2. Or run: `npm run web`
3. Opens in browser (some features may not work)

## Available Screens

### Authentication
- `/auth/login` - User login
- `/auth/signup` - User registration (creates CA account)

### Main Screens
- `/dashboard` - Main dashboard with metrics
- `/tasks` - Task list and management
- `/tasks/[id]` - Task detail page
- `/clients` - Client list and management
- `/clients/[id]` - Client detail page
- `/firms` - Firm list and management
- `/firms/[id]` - Firm detail page
- `/invoices` - Invoice list and management
- `/invoices/[id]` - Invoice detail page with send functionality
- `/documents` - Document management
- `/approvals` - Approval requests management
- `/profile` - User profile and settings

### CA-Only Screens
- `/users` - User management (CA only)
- `/activity-logs` - Activity log viewer (CA only)

## Features

All features from the web application are available in the mobile app:

### Dashboard
- View key metrics
- Quick access to all modules
- Recent tasks and upcoming deadlines
- Pull-to-refresh

### Task Management
- Create, view, update tasks
- Filter by status, firm, and assigned user
- Update task status
- View task details

### Client Management
- Create, view, update, delete clients (CA only)
- View client details with firms
- Add firms to clients

### Firm Management
- Create, view, update firms
- View firm details with tasks, documents, invoices
- Statistics and recent activity

### Invoice Management
- Create invoices
- View invoice details
- Mark invoices as paid
- **Send invoices via email with PDF**

### Document Management
- Upload documents (camera or file picker)
- Filter by firm, task, document type
- Download and view documents

### Approvals
- View pending approvals
- Approve or reject requests
- Filter by status

### User Management (CA Only)
- Create users
- Assign users to firms
- View and update user information

### Activity Logs (CA Only)
- View audit trail
- Filter by user and action type

## Development

### Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── auth/              # Authentication screens
│   ├── dashboard.tsx      # Dashboard screen
│   ├── tasks/             # Task screens
│   ├── clients/           # Client screens
│   ├── firms/             # Firm screens
│   ├── invoices/          # Invoice screens
│   ├── documents.tsx      # Documents screen
│   ├── approvals.tsx      # Approvals screen
│   ├── users.tsx          # Users screen (CA only)
│   ├── activity-logs.tsx  # Activity logs (CA only)
│   ├── profile.tsx        # Profile screen
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home/redirect screen
├── components/            # React Native components
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   └── store.ts          # Zustand store
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
└── package.json          # Dependencies
```

### Available Scripts

```bash
# Development
npm start                 # Start Expo development server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in web browser

# Building
npm run build:ios        # Build iOS app
npm run build:android    # Build Android app

# Type Checking
npm run type-check       # TypeScript type checking
```

### Building for Production

#### iOS Build

1. **Configure app.json:**
   - Update `app.json` with your app details
   - Configure bundle identifier

2. **Build:**
```bash
eas build --platform ios
```

Or using Expo:
```bash
expo build:ios
```

#### Android Build

1. **Configure app.json:**
   - Update package name
   - Configure version

2. **Build:**
```bash
eas build --platform android
```

Or using Expo:
```bash
expo build:android
```

### Environment Variables

For production builds, set environment variables:

```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### Metro Bundler Issues

**Error**: `Metro bundler failed to start`

**Solutions:**
1. Clear Metro cache:
```bash
npx expo start -c
```

2. Clear watchman (if installed):
```bash
watchman watch-del-all
```

3. Clear npm cache:
```bash
npm start -- --reset-cache
```

### Network Connection Issues

**Error**: `Network request failed` or `Cannot connect to API`

**Solutions:**
1. **For Physical Device:**
   - Verify device and computer are on same Wi-Fi network
   - Use computer's IP address instead of `localhost`
   - Check firewall settings
   - Verify backend CORS configuration

2. **For Emulator/Simulator:**
   - iOS Simulator: Use `localhost` or `127.0.0.1`
   - Android Emulator: Use `10.0.2.2` instead of `localhost`

3. **Test API Connection:**
```bash
# From device/emulator, test:
curl http://your-api-url/health
```

### Build Errors

**Error**: `Failed to build` or dependency errors

**Solutions:**
1. Clear all caches:
```bash
rm -rf node_modules
rm -rf .expo
npm install
```

2. Clear iOS build cache (macOS):
```bash
cd ios
pod deintegrate
pod install
cd ..
```

3. Clear Android build cache:
```bash
cd android
./gradlew clean
cd ..
```

### TypeScript Errors

**Error**: Type errors in development

**Solutions:**
1. Run type check: `npm run type-check`
2. Ensure all types are properly imported
3. Check `tsconfig.json` configuration

### Expo Go App Issues

**Error**: App won't load or crashes

**Solutions:**
1. Update Expo Go app to latest version
2. Clear Expo Go app cache (uninstall/reinstall)
3. Check Expo SDK version compatibility
4. Verify all dependencies are compatible

### iOS Simulator Issues

**Error**: Simulator won't start

**Solutions:**
1. Open Xcode and verify simulators are installed
2. Run: `xcrun simctl list devices`
3. Select a simulator: `xcrun simctl boot "iPhone 14"`
4. Try: `npm run ios`

### Android Emulator Issues

**Error**: Emulator won't start or app won't install

**Solutions:**
1. Verify Android SDK is installed
2. Check `ANDROID_HOME` environment variable
3. Start emulator from Android Studio first
4. Verify emulator is running: `adb devices`
5. Try: `npm run android`

## Device-Specific Configuration

### iOS Configuration

1. **Update app.json:**
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.cafirm",
      "buildNumber": "1.0.0"
    }
  }
}
```

2. **Configure Info.plist** (if needed):
   - Camera permissions
   - Photo library permissions
   - Network permissions

### Android Configuration

1. **Update app.json:**
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.cafirm",
      "versionCode": 1
    }
  }
}
```

2. **Configure AndroidManifest.xml** (if needed):
   - Internet permissions
   - Camera permissions
   - Storage permissions

## Performance Tips

1. **Enable Hermes** (Android): Improves performance
2. **Optimize Images**: Use appropriate image sizes
3. **Code Splitting**: Expo Router automatically code-splits
4. **Cache Management**: Use AsyncStorage efficiently

## Security Considerations

1. **API Keys**: Never commit `.env` files
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Tokens stored in AsyncStorage (consider secure storage for production)
4. **Certificate Pinning**: Consider implementing for production

## Testing Checklist

- [ ] Login/Logout works
- [ ] All screens load correctly
- [ ] Navigation works between screens
- [ ] API calls succeed
- [ ] Forms submit correctly
- [ ] File uploads work (camera/gallery)
- [ ] Pull-to-refresh works
- [ ] Error messages display properly
- [ ] Role-based access works (CA/Manager/Staff)
- [ ] Offline handling (if implemented)

## Next Steps

After mobile app setup:
1. Test all features on physical device
2. Configure app icons and splash screens
3. Set up app store accounts (iOS/Android)
4. Prepare for production builds
5. Configure push notifications (if needed)

## Support

For issues:
1. Check Expo documentation: https://docs.expo.dev
2. Check React Native documentation: https://reactnative.dev
3. Review error messages in terminal and device logs
4. Check Expo DevTools for detailed errors

## Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [TypeScript with React Native](https://reactnative.dev/docs/typescript)
