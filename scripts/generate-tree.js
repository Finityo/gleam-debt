// scripts/generate-tree.js
// Generates TREE.md showing project structure – safe for Lovable

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const IGNORE = [
  "node_modules",
  ".git",
  ".npm",
  "dist",
  "build",
  ".next",
  ".vercel",
  ".turbo"
];

function walk(dir, prefix = "") {
  let output = "";
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(e => !IGNORE.includes(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const pointer = isLast ? "└── " : "├── ";
    const nextPrefix = prefix + (isLast ? "    " : "│   ");

    output += `${prefix}${pointer}${entry.name}\n`;

    if (entry.isDirectory()) {
      output += walk(path.join(dir, entry.name), nextPrefix);
    }
  });

  return output;
}

const tree = `# Finityo Project Tree\n\n\`\`\`\n${walk(ROOT)}\`\`\`\n`;

fs.writeFileSync("TREE.md", tree);
console.log("TREE.md successfully generated!");
