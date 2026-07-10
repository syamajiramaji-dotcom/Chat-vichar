import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_DATABASE_URL",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

const missing = REQUIRED_VARS.filter((key) => !import.meta.env[key]);

if (missing.length > 0) {
  const list = missing.map((k) => `  • ${k}`).join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#f1f1f1;padding:2rem">
      <div style="max-width:520px;width:100%">
        <div style="font-size:2rem;margin-bottom:.5rem">⚙️</div>
        <h1 style="margin:0 0 .5rem;font-size:1.25rem;color:#f87171">Firebase not configured</h1>
        <p style="margin:0 0 1rem;font-size:.9rem;color:#9ca3af;line-height:1.6">
          Add the following environment variables in your
          <strong style="color:#e5e7eb">Cloudflare Pages</strong> dashboard
          (Settings → Environment variables):
        </p>
        <pre style="background:#111;border:1px solid #333;border-radius:.5rem;padding:1rem;font-size:.8rem;line-height:1.8;color:#34d399;white-space:pre-wrap">${list}</pre>
        <p style="margin:.75rem 0 0;font-size:.8rem;color:#6b7280">
          Get these values from Firebase Console → Project Settings → Your Apps.
        </p>
      </div>
    </div>`;
  document.body.innerHTML = html;
  throw new Error(`Missing Firebase env vars:\n${list}`);
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app            = initializeApp(firebaseConfig);
export const auth           = getAuth(app);
export const db             = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
