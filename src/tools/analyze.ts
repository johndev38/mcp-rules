import { collectFiles } from "../core/file-utils.js";
import { loadRulePacks } from "../core/rule-loader.js";
import { analyzeFile, analyzeText } from "../core/analyzer.js";
import { renderMarkdown } from "../reporters/markdown.js";
import { renderJson } from "../reporters/json.js";

export function analyzePaths(inputPaths: string[], rulesDir: string, format: "json" | "markdown" = "markdown"): string {
  const packs = loadRulePacks(rulesDir);
  const files = collectFiles(inputPaths);
  const results = files.map((file) => analyzeFile(file, packs));

  return format === "json" ? renderJson(results) : renderMarkdown(results);
}

export function analyzeRawText(fileName: string, content: string, rulesDir: string, format: "json" | "markdown" = "markdown"): string {
  const packs = loadRulePacks(rulesDir);
  const result = analyzeText(fileName, content, packs);

  return format === "json" ? renderJson([result]) : renderMarkdown([result]);
}
