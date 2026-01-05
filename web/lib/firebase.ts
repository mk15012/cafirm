import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  Auth,
  ConfirmationResult as FirebaseConfirmationResult 
} from 'firebase/auth';

// Re-export the type
export type ConfirmationResult = FirebaseConfirmationResult;

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

export function initializeFirebase() {
  if (typeof window === 'undefined') return { app: null, auth: null };
  
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  return { app, auth };
}

export function getFirebaseAuth() {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth();
  
  const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    },
  });
  
  return recaptchaVerifier;
}

export async function sendOTP(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<FirebaseConfirmationResult> {
  const auth = getFirebaseAuth();
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export { RecaptchaVerifier };
