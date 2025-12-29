# Mobile App Setup Guide

The mobile app is built using **Expo**, which allows you to run and test the app on your phone or emulator without needing to set up native development environments (Xcode/Android Studio).

## Prerequisites

1. **Node.js** (v18 or higher recommended)
2. **npm** or **yarn**
3. **Expo Go app** on your phone (optional, for physical device testing)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Running the Mobile App

### Option 1: Run on Your Phone (Recommended for Quick Testing)

1. **Install dependencies** (if not already done):
   ```bash
   cd mobile
   npm install
   ```

2. **Start the Expo development server**:
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

3. **Open Expo Go on your phone**:
   - Install the Expo Go app from your app store
   - Make sure your phone and computer are on the same Wi-Fi network
   - Scan the QR code that appears in your terminal/browser
   - The app will load on your phone!

4. **Alternative: Use Tunnel Mode** (if on different networks):
   ```bash
   npx expo start --tunnel
   ```
   This creates a tunnel, so you can test even if your devices are on different networks (may be slower).

### Option 2: Run on iOS Simulator (Mac only)

1. **Install Xcode** from the Mac App Store
2. **Start Expo**:
   ```bash
   cd mobile
   npm start
   ```
3. **Press `i`** in the terminal to open iOS simulator
   - Or use: `npm run ios`

### Option 3: Run on Android Emulator

1. **Install Android Studio** and set up an Android Virtual Device (AVD)
2. **Start the emulator** from Android Studio
3. **Start Expo**:
   ```bash
   cd mobile
   npm start
   ```
4. **Press `a`** in the terminal to open Android emulator
   - Or use: `npm run android`

### Option 4: Run in Web Browser (for quick UI checks)

```bash
cd mobile
npm run web
```

This will open the app in your browser, but keep in mind it's designed for mobile, so the UI might look different.

## Configuration

### Backend API URL

Make sure your mobile app is pointing to the correct backend URL. Check the API configuration:

- File: `mobile/lib/api.ts`
- Update the `baseURL` to match your backend server
- For physical device testing, use your computer's local IP address (e.g., `http://192.168.1.100:5000`) instead of `localhost`
- You can find your IP address with:
  - **Mac/Linux**: `ifconfig | grep "inet "`
  - **Windows**: `ipconfig`

### Example API Configuration

```typescript
// mobile/lib/api.ts
const baseURL = __DEV__ 
  ? 'http://192.168.1.100:5000/api'  // Your computer's local IP for device testing
  : 'https://your-production-api.com/api';  // Production URL
```

## Building for Production

When you're ready to deploy to the Play Store or App Store:

### 1. Using EAS Build (Expo Application Services) - Recommended

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure your project
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### 2. Local Build (Advanced)

For local builds, you'll need:
- **Android**: Android Studio and Android SDK
- **iOS**: Xcode (Mac only)

```bash
# Generate native projects
npx expo prebuild

# Then build using native tools
```

## Troubleshooting

### App won't connect to backend
- Make sure your backend server is running
- Check that the API URL in `mobile/lib/api.ts` is correct
- For physical device testing, ensure both devices are on the same network OR use tunnel mode
- Check firewall settings on your computer

### QR code not scanning
- Make sure Expo Go app is installed and updated
- Try using tunnel mode: `npx expo start --tunnel`
- Check your network connection

### Build errors
- Clear cache: `npx expo start -c` or `npm start -- --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

## Development Workflow

1. **Start backend server** (in one terminal):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start mobile app** (in another terminal):
   ```bash
   cd mobile
   npm start
   ```

3. **Scan QR code** with Expo Go app or press `i`/`a` for simulator/emulator

4. **Make changes** - The app will automatically reload when you save files!

## Notes

- The mobile app code is in the `/mobile` directory
- It uses the same backend API as the web app
- Expo makes development easy but you can also "eject" to native code if needed later
- For production deployment, use EAS Build or build locally with native tools





