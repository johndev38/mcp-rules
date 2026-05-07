#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { analyzePaths } from "./tools/analyze.js";
import { loadRulePacks, validateRulePacks } from "./core/rule-loader.js";

const args = process.argv.slice(2);
const command = args[0];

function readArg(name: string, fallback?: string): string | undefined {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

if (command === "validate") {
  const rulesDir = readArg("--rules", process.env.SCL_RULES_DIR ?? "rules")!;
  const packs = loadRulePacks(rulesDir);
  const errors = validateRulePacks(packs);

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }

  console.log(`OK - ${packs.length} rulepack(s) chargé(s).`);
  process.exit(0);
}

if (command === "analyze") {
  const input = readArg("--input", "samples")!;
  const rulesDir = readArg("--rules", process.env.SCL_RULES_DIR ?? "rules")!;
  const format = readArg("--format", "markdown") as "markdown" | "json";
  const output = readArg("--output");
  const rendered = analyzePaths([path.resolve(input)], path.resolve(rulesDir), format);

  if (output) {
    const outPath = path.resolve(output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered, "utf8");
    console.log(`Rapport généré: ${outPath}`);
  } else {
    console.log(rendered);
  }
  process.exit(0);
}

console.error(`Commande inconnue.
Usage:
  node dist/cli.js validate --rules rules
  node dist/cli.js analyze --input samples --rules rules --format markdown
  node dist/cli.js analyze --input samples --rules rules --format json --output reports/analysis-report.json
`);
process.exit(1);
