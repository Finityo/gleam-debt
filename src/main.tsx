import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 🔍 Run demo engine verification on startup
import "./utils/verifyDemoEngine";

createRoot(document.getElementById("root")!).render(<App />);
