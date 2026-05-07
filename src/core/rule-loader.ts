import fs from "node:fs";
import path from "node:path";
import type { RulePack } from "../types/domain.js";

export function loadRulePacks(rulesDir: string): RulePack[] {
  if (!fs.existsSync(rulesDir)) {
    throw new Error(`Répertoire de règles introuvable: ${rulesDir}`);
  }

  const files: string[] = [];
  walk(rulesDir, files);

  const packs: RulePack[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");

    if (file.endsWith(".rules.json")) {
      const parsed = JSON.parse(content) as RulePack;
      parsed.sourcePath = file;
      packs.push(parsed);
      continue;
    }

    if (file.endsWith(".md") || file.endsWith(".markdown")) {
      const extracted = extractRulePacksFromMarkdown(content, file);
      packs.push(...extracted);
    }
  }

  return packs;
}

function walk(dir: string, files: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }

    if (
      entry.name.endsWith(".rules.json") ||
      entry.name.endsWith(".md") ||
      entry.name.endsWith(".markdown")
    ) {
      files.push(full);
    }
  }
}

export function extractRulePacksFromMarkdown(content: string, filePath: string): RulePack[] {
  const packs: RulePack[] = [];
  const regex = /```json\s+rulepack\s*([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const parsed = JSON.parse(match[1]) as RulePack;
    parsed.sourcePath = filePath;
    packs.push(parsed);
  }

  return packs;
}

export function flattenRules(packs: RulePack[]) {
  return packs.flatMap((pack) =>
    pack.rules
      .filter((rule) => rule.enabled !== false)
      .map((rule) => ({
        pack,
        rule
      }))
  );
}

export function validateRulePacks(packs: RulePack[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const pack of packs) {
    if (!pack.id) errors.push(`Rulepack sans id: ${pack.sourcePath ?? "inconnu"}`);
    if (!Array.isArray(pack.rules)) errors.push(`Rulepack sans rules[]: ${pack.id}`);

    for (const rule of pack.rules ?? []) {
      if (!rule.id) errors.push(`Règle sans id dans ${pack.id}`);
      if (ids.has(rule.id)) errors.push(`Règle dupliquée: ${rule.id}`);
      ids.add(rule.id);

      if (!rule.title) errors.push(`Règle sans title: ${rule.id}`);
      if (!rule.type) errors.push(`Règle sans type: ${rule.id}`);
      if (!["info", "warning", "error"].includes(rule.severity)) {
        errors.push(`Sévérité invalide pour ${rule.id}: ${rule.severity}`);
      }
    }
  }

  return errors;
}
