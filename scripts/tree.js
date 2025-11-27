// ==========================================================
//  Finityo Fancy TREE.md Generator with Metadata
// ==========================================================

const fs = require("fs");
const path = require("path");

// ------------ CONFIG ----------------
const ROOT = process.cwd();
const REPO_URL = "https://github.com/Finityo/gleam-debt/tree/main";

const IGNORE = [
  "node_modules", ".next", "dist", "build", ".cache",
  ".git", ".github", ".vercel", "coverage", "public",
  "pnpm-lock.yaml", "package-lock.json"
];

// ------------ ARCHITECTURAL METADATA ----------------
const META = {
  "src/engine": "⚙️ Core Debt Engine Logic — do not modify unless updating math or plan structure.",
  "src/hooks": "🪝 React hooks for retrieving plan, comparing strategies, and what-if simulations.",
  "src/context": "🌐 Global state providers. All live data flows through here.",
  "src/live/context": "📡 Live plan persistence and Supabase sync logic.",
  "src/lib": "📚 Utility libraries, plan compute logic, comparison modules.",
  "src/components": "🧩 UI components for charts, cards, tables.",
  "src/pages": "📄 App routes & UI screens.",
  "src/engine/compat": "♻️ Compatibility layer mapping old engine output → new engine shape.",
};

// ------------ ICONS ----------------
const ICONS = {
  folder: "📁",
  file: "📄",
  pages: "📄",
  components: "🧩",
  hooks: "🪝",
  contexts: "🌐",
  engine: "⚙️",
  lib: "📚",
  scripts: "🔧",
  styles: "🎨",
  api: "🛰️",
  default: "📦",
};

const FILE_ICONS = {
  ".tsx": "🟦",
  ".ts": "🟩",
  ".js": "🟨",
  ".jsx": "🟪",
  ".json": "📝",
  ".md": "📘",
  ".html": "🌐",
  ".css": "🎨",
  ".svg": "🖼️",
};

function getIcon(name, isDir) {
  if (isDir) return ICONS[name] || ICONS.folder;
  const ext = path.extname(name);
  return FILE_ICONS[ext] || ICONS.file;
}


// ------------ TREE GENERATOR ----------------
function walk(dir, prefix = "") {
  let output = "";

  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !IGNORE.includes(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const pointer = isLast ? "└── " : "├── ";
    const nextPrefix = prefix + (isLast ? "    " : "│   ");

    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(ROOT, fullPath).replace(/\\/g, "/");
    const icon = getIcon(entry.name, entry.isDirectory());
    const link = `${REPO_URL}/${rel}`;

    output += `${prefix}${pointer}${icon} [${entry.name}](${link})\n`;

    // Add metadata if folder has notes
    if (entry.isDirectory() && META[rel]) {
      output += `${nextPrefix}💡 ${META[rel]}\n`;
    }

    if (entry.isDirectory()) {
      output += walk(fullPath, nextPrefix);
    }
  });

  return output;
}


// ------------ BUILD OUTPUT ----------------
const header = `
# 🌳 Finityo Project Tree with Architecture Notes
_Auto-generated overview of the entire codebase structure._

_Last generated: ${new Date().toLocaleString()}_

---

\`\`\`
`;

const footer = `\`\`\`

## Legend
📁 Folder  
📄 File  
⚙️ Engine Logic  
🧩 Components  
🪝 Hooks  
🌐 Context Providers  
📚 Libraries  
🔧 Scripts  
🎨 Styles  
📝 JSON  
🟦 TSX  
🟩 TS  
🟨 JS  
🖼️ Assets  

---

Generated automatically by **Finityo Tree Engine™**
`;

fs.writeFileSync("TREE.md", header + walk(ROOT) + footer);
console.log("🌳 Fancy TREE.md with metadata generated!");
