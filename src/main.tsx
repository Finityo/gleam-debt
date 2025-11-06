import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safe, no-op verification (prevents startup crash)
import "./utils/verifyDemoEngine";

createRoot(document.getElementById("root")!).render(<App />);
