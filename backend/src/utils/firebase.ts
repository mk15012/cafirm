import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// You need to set FIREBASE_SERVICE_ACCOUNT_KEY environment variable
// with the path to your service account JSON file or the JSON content itself

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not set. Phone auth will not work.');
      // Initialize with default credentials (for development)
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'ca-firm-pro',
      });
    } else {
      // Try to parse as JSON first (inline JSON), otherwise treat as file path
      let credential: admin.credential.Credential;
      
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        credential = admin.credential.cert(serviceAccount);
      } catch {
        // It's a file path
        credential = admin.credential.cert(serviceAccountKey);
      }
      
      firebaseApp = admin.initializeApp({
        credential,
      });
    }
    
    console.log('✅ Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    throw error;
  }
}

export function getFirebaseAuth(): admin.auth.Auth {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
}

/**
 * Verify a Firebase ID token from client-side phone auth
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const auth = getFirebaseAuth();
  return auth.verifyIdToken(idToken);
}

/**
 * Get user by phone number
 */
export async function getFirebaseUserByPhone(phoneNumber: string): Promise<admin.auth.UserRecord | null> {
  try {
    const auth = getFirebaseAuth();
    return await auth.getUserByPhoneNumber(phoneNumber);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}


