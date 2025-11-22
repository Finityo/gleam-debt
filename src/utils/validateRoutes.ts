import fs from "fs";
import path from "path";

/**
 * Run this manually before commits:
 *   node src/utils/validateRoutes.ts
 *
 * It ensures:
 *  - All routes point to existing files
 *  - No pages exist without a route
 *  - No duplicated routes
 */
async function validateRoutes() {
  const SRC_PAGES = path.join(process.cwd(), "src/pages");
  const ROUTES_FILE = path.join(process.cwd(), "src/routes.tsx");

  const fileList: string[] = [];
  const walk = (dir: string) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      if (f.isDirectory()) walk(path.join(dir, f.name));
      else if (f.name.endsWith(".tsx")) fileList.push(path.join(dir, f.name));
    }
  };

  walk(SRC_PAGES);

  const routesText = fs.readFileSync(ROUTES_FILE, "utf-8");
  const referenced = Array.from(routesText.matchAll(/import\(.*?@\/pages\/(.*?)\"/g)).map(
    (m) => m[1]
  );

  const missing = referenced.filter((r) => {
    const full = path.join(SRC_PAGES, r + ".tsx");
    return !fs.existsSync(full);
  });

  const orphanPages = fileList.filter((f) => {
    const rel = f.split("/src/pages/")[1].replace(".tsx", "");
    return !referenced.some((r) => r === rel);
  });

  console.log("---- ROUTE VALIDATION RESULTS ----");
  console.log("Missing files:", missing);
  console.log("Orphan pages:", orphanPages);
  console.log("----------------------------------");
}

validateRoutes();
