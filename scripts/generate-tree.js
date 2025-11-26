/* Tree generator for Lovable (Node-based replacement for tree-me)
 * Creates TREE.md at repo root with a clean directory listing.
 */

const fs = require("fs");
const path = require("path");

const IGNORE = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".DS_Store",
];

function walk(dir, prefix = "") {
  let items = fs.readdirSync(dir);
  items = items.filter(i => !IGNORE.includes(i));

  let output = "";

  items.forEach((item, index) => {
    const full = path.join(dir, item);
    const isDir = fs.statSync(full).isDirectory();
    const connector = index === items.length - 1 ? "└── " : "├── ";

    output += `${prefix}${connector}${item}\n`;

    if (isDir) {
      const nextPrefix =
        index === items.length - 1 ? `${prefix}    ` : `${prefix}│   `;
      output += walk(full, nextPrefix);
    }
  });

  return output;
}

function generate() {
  const tree = "# 📁 Finityo Repo Tree\n\n```\n" + walk(process.cwd()) + "```\n";
  fs.writeFileSync("TREE.md", tree, "utf8");
  console.log("TREE.md updated successfully.");
}

generate();
