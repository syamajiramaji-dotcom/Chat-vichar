import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Catch any uncaught error that would otherwise leave a blank screen
window.addEventListener("error", (e) => {
  const root = document.getElementById("root");
  if (root && root.childNodes.length === 0) {
    root.innerHTML = `
      <div style="font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#f1f1f1;padding:2rem">
        <div style="max-width:480px;width:100%">
          <div style="font-size:2rem;margin-bottom:.5rem">💥</div>
          <h1 style="margin:0 0 .5rem;font-size:1.1rem;color:#f87171">Something went wrong</h1>
          <pre style="background:#111;border:1px solid #333;border-radius:.5rem;padding:1rem;font-size:.8rem;white-space:pre-wrap;color:#fca5a5">${e.message}</pre>
          <p style="margin:.75rem 0 0;font-size:.8rem;color:#6b7280">Check browser console for details.</p>
        </div>
      </div>`;
  }
});

// Register service worker for Web Push notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // SW registration failed — push notifications won't work, but app still runs
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
