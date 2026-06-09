import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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
