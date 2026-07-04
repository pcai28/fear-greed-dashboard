import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const roots = ["backend/src", "frontend/src", "shared/src"];
const checkedExtensions = new Set([".js", ".css", ".html"]);
const maxLines = 200;
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (checkedExtensions.has(extname(entry.name))) {
      const text = await readFile(path, "utf8");
      const lines = text.split(/\r?\n/).length;
      if (lines > maxLines) failures.push({ path: relative(process.cwd(), path), lines });
    }
  }
}

await Promise.all(roots.map(walk));

if (failures.length) {
  console.error(`Source files must not exceed ${maxLines} lines:`);
  for (const failure of failures) console.error(`- ${failure.path}: ${failure.lines}`);
  process.exitCode = 1;
} else {
  console.log(`Structure check passed: all source files are ${maxLines} lines or fewer.`);
}
