// =========================================================
// 🏁 FINITYO LIVE STARTER PACK
// For Lovable → Creates a clean, production-only environment
// that runs parallel to your demo version.
// =========================================================

import { createRoot } from "react-dom/client";
import AppLive from "./AppLive";
import "../index.css";
import "./utils/verifyLiveBuild";

createRoot(document.getElementById("root")!).render(<AppLive />);
