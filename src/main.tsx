import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force dark theme globally (ignore system preferences)
document.documentElement.classList.add("dark");
document.documentElement.style.colorScheme = "dark";

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
