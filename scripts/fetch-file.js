// scripts/fetch-file.js
// Fetch and display file contents by search string

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SEARCH = process.env.SEARCH || "";
const IGNORE = ["node_modules", "dist", ".git", ".github", "build", ".next"];

const matches = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE.includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT, fullPath);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else {
      // Check if filename matches search string (case-insensitive)
      if (entry.name.toLowerCase().includes(SEARCH.toLowerCase())) {
        matches.push(relativePath);
      }
    }
  }
}

if (!SEARCH) {
  console.log("❌ No search string provided. Set SEARCH environment variable.");
  process.exit(1);
}

console.log(`🔍 Searching for files matching: "${SEARCH}"\n`);

walk(ROOT);

if (matches.length === 0) {
  console.log("No files found");
  process.exit(0);
}

console.log(`✅ Found ${matches.length} file(s):\n`);

matches.forEach((filePath) => {
  const fullPath = path.join(ROOT, filePath);
  const content = fs.readFileSync(fullPath, "utf8");

  console.log("=".repeat(80));
  console.log(`FILE: ${filePath}`);
  console.log("=".repeat(80));
  console.log(content);
  console.log("\n");
});

console.log(`\n✅ Complete. Displayed ${matches.length} file(s).`);
