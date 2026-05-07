import type { AnalysisResult } from "../types/domain.js";

export function renderMarkdown(results: AnalysisResult[]): string {
  const total = results.reduce((sum, result) => sum + result.findings.length, 0);
  let out = `# Rapport SCL\n\nTotal anomalies: **${total}**\n\n`;

  for (const result of results) {
    out += `## ${result.filePath}\n\n`;

    if (result.findings.length === 0) {
      out += "Aucune anomalie.\n\n";
      continue;
    }

    for (const finding of result.findings) {
      out += `- **${finding.severity.toUpperCase()}** ${finding.ruleId} — ${finding.message}\n`;
      out += `  - Ligne ${finding.line}, colonne ${finding.column}\n`;
      out += `  - Extrait: \`${finding.excerpt.replace(/`/g, "\\`")}\`\n`;
      out += `  - Confiance: ${finding.confidence}\n`;
    }

    out += "\n";
  }

  return out;
}
