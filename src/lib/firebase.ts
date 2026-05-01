import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// NOTE: Firebase App Check has been disabled.
//
// App Check requires a reCAPTCHA *Enterprise* site key (not a regular v3 key)
// registered in Google Cloud Console AND added to Firebase App Check settings.
//
// It was causing:
//   - AppCheck: ReCAPTCHA error (appCheck/recaptcha-error)
//   - auth/captcha-check-failed on phone login
//
// To re-enable App Check later:
//   1. Go to Google Cloud Console → reCAPTCHA Enterprise → Create site key
//   2. Go to Firebase Console → App Check → Register your app with that key
//   3. Add your domain to the reCAPTCHA Enterprise allowlist
//   4. Uncomment the block below and set NEXT_PUBLIC_RECAPTCHA_SITE_KEY

// import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
// if (typeof window !== "undefined" && !getApps().find(a => a.name === "__appCheck__")) {
//   initializeAppCheck(app, {
//     provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
//     isTokenAutoRefreshEnabled: true,
//   });
// }

const auth = getAuth(app);
auth.useDeviceLanguage();

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };