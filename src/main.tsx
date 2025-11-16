import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safe, no-op verification (prevents startup crash)
import "./utils/verifyDemoEngine";

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service worker registered"))
      .catch((err) => console.error("Service worker registration failed:", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
