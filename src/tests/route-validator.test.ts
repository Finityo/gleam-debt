import { describe, test, expect } from "vitest";
import fs from "fs";
import path from "path";

// Normalize paths across OS
const normalize = (p: string) => p.replace(/\\/g, "/");

// Paths
const ROUTES_FILE = normalize(path.join(process.cwd(), "src/routes.tsx"));
const SRC_PAGES = normalize(path.join(process.cwd(), "src/pages"));

describe("Route Integrity Validation", () => {
  test("All imported pages exist", () => {
    const routes = fs.readFileSync(ROUTES_FILE, "utf8");

    // Grab all dynamic lazy imports like "@/pages/X"
    const matches = [...routes.matchAll(/import\(["'`](.*?)["'`]\)/g)]
      .map((m) => m[1])
      .filter((p) => p.startsWith("@/pages"));

    const missing: string[] = [];
    for (const rel of matches) {
      const clean = rel.replace("@/pages/", "");
      const filePath = normalize(path.join(SRC_PAGES, clean + ".tsx"));
      if (!fs.existsSync(filePath)) {
        missing.push(filePath);
      }
    }

    expect(missing).toEqual([]);
  });

  test("Detect orphan pages with no routes", () => {
    const routes = fs.readFileSync(ROUTES_FILE, "utf8");
    const allPages: string[] = [];

    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = normalize(path.join(dir, e.name));
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith(".tsx")) {
          allPages.push(full.replace(SRC_PAGES + "/", "").replace(".tsx", ""));
        }
      }
    }
    walk(SRC_PAGES);

    const referenced = [
      ...routes.matchAll(/@\/pages\/([\w/.-]+)"/g),
    ].map((m) => m[1]);

    const orphans = allPages.filter((p) => !referenced.includes(p));
    const allowed = ["NotFound", "index", "Hero"]; // allowed standalone pages

    const filtered = orphans.filter(
      (o) => !allowed.some((a) => o.toLowerCase().includes(a.toLowerCase()))
    );

    expect(filtered).toEqual([]);
  });
});
