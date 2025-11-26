// Fancy Finityo Project Tree Generator
// Generates TREE.md with emojis, links, and clean formatting

const fs = require("fs");
const path = require("path");

// ------------ CONFIG ----------------
const ROOT = process.cwd();
const REPO_URL = "https://github.com/Finityo/gleam-debt/tree/main";

const IGNORE = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".cache",
  ".git",
  ".github",
  ".vercel",
  "public",
  "coverage",
  "pnpm-lock.yaml",
  "package-lock.json",
];

// Emojis for folders/files
const ICONS = {
  folder: "📁",
  file: "📄",
  pages: "📄",
  components: "🧩",
  hooks: "🪝",
  contexts: "🌐",
  engine: "⚙️",
  lib: "📚",
  types: "🔠",
  scripts: "🔧",
  styles: "🎨",
  api: "🛰️",
  default: "📦",
};

// File-type icons
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
  if (isDir) {
    return ICONS[name] || ICONS.folder;
  }
  const ext = path.extname(name);
  return FILE_ICONS[ext] || ICONS.file;
}

// ------------ TREE GENERATOR -------------
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
    const relPath = path.relative(ROOT, fullPath);

    // Emoji icon
    const icon = getIcon(entry.name, entry.isDirectory());

    // Make files clickable in GitHub
    const link = `${REPO_URL}/${relPath.replace(/\\/g, "/")}`;

    output += `${prefix}${pointer}${icon} [${entry.name}](${link})\n`;

    if (entry.isDirectory()) {
      output += walk(fullPath, nextPrefix);
    }
  });

  return output;
}

// ------------ OUTPUT --------------------
const header = `
# 🌳 Finityo Project Tree
A clean, organized, emoji-indexed map of your entire Finityo codebase.

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
console.log("🌳 Fancy TREE.md generated!");
