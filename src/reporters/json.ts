import type { AnalysisResult } from "../types/domain.js";

export function renderJson(results: AnalysisResult[]): string {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalFindings: results.reduce((sum, result) => sum + result.findings.length, 0),
    results
  }, null, 2);
}
