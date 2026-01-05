# Firebase Phone Auth Setup Guide

This guide explains how to set up Firebase Phone Authentication for CA Firm Pro.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it "ca-firm-pro" (or your preferred name)
4. Follow the setup wizard

## Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Phone** and enable it
3. Add your test phone numbers (for development)

## Step 3: Add Your Apps

### For Web App
1. Go to **Project Settings** > **General**
2. Click "Add app" and select **Web**
3. Register your app
4. Copy the config values

### For Android App
1. Click "Add app" and select **Android**
2. Package name: `com.cafirm.management`
3. Download `google-services.json`
4. Place it in `mobile/android/app/google-services.json`
5. Get SHA-1 fingerprint:
   ```bash
   cd mobile/android
   ./gradlew signingReport
   ```
6. Add SHA-1 to Firebase Console

### For iOS App
1. Click "Add app" and select **iOS**
2. Bundle ID: `com.cafirm.management`
3. Download `GoogleService-Info.plist`
4. Place it in `mobile/ios/CAFirmPro/GoogleService-Info.plist`

## Step 4: Environment Variables

### Backend (.env)
```env
# Firebase Admin SDK - download from Firebase Console > Project Settings > Service accounts
FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json
# OR paste the JSON directly (for production environments like Vercel)
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# Optional - if not using service account key
FIREBASE_PROJECT_ID=your-project-id
```

### Web App (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Mobile App (.env)
The mobile app uses native Firebase configuration through the config files:
- `google-services.json` for Android
- `GoogleService-Info.plist` for iOS

## Step 5: Download Service Account Key

For the backend to verify Firebase tokens:

1. Go to **Project Settings** > **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json` in `backend/`
4. Add to `.gitignore` (already done)

## Step 6: Configure reCAPTCHA (Web)

Firebase uses reCAPTCHA for phone auth. For production:

1. Go to Firebase Console > Authentication > Settings
2. Under "Authorized domains", add your production domains

## Testing Phone Auth

### Test Phone Numbers (Development Only)
In Firebase Console > Authentication > Sign-in method > Phone:
1. Add test phone numbers with fixed OTP codes
2. Example: +91 1234567890 with code 123456

### Free Tier Limits
Firebase Phone Auth is free for:
- **10,000 verifications/month** for free
- No DLT registration required
- Works globally

## Troubleshooting

### Common Issues

1. **"Invalid phone number"**: Ensure format is +91XXXXXXXXXX
2. **"Too many attempts"**: Wait a few hours or use test phone numbers
3. **"reCAPTCHA verification failed"**: Clear browser cache, check authorized domains
4. **"Invalid token"**: Verify service account key is correct

### For Android Development
If testing on physical device:
1. Ensure device has Google Play Services
2. Add SHA-256 fingerprint to Firebase Console

### For iOS Development
1. Enable Push Notifications capability
2. Configure APNs in Firebase Console

## Security Notes

- Never commit `firebase-service-account.json` to git
- Never expose `FIREBASE_SERVICE_ACCOUNT_KEY` in client-side code
- Use environment variables in production
- Regularly rotate service account keys

