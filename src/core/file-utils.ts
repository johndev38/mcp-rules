import fs from "node:fs";
import path from "node:path";

export function collectFiles(inputs: string[], extensions = [".scl", ".txt"]): string[] {
  const result: string[] = [];

  for (const input of inputs) {
    const stat = fs.statSync(input);

    if (stat.isDirectory()) {
      walk(input, extensions, result);
      continue;
    }

    if (extensions.some((ext) => input.toLowerCase().endsWith(ext))) {
      result.push(input);
    }
  }

  return result.sort();
}

function walk(dir: string, extensions: string[], result: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, extensions, result);
      continue;
    }

    if (extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
      result.push(full);
    }
  }
}
