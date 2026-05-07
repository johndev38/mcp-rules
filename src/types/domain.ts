export type Severity = "info" | "warning" | "error";

export interface RuleDefinition {
  id: string;
  title: string;
  description?: string;
  severity: Severity;
  type: string;
  enabled?: boolean;
  params?: Record<string, unknown>;
}

export interface RulePack {
  id: string;
  title: string;
  version?: string;
  sourcePath?: string;
  rules: RuleDefinition[];
}

export interface Finding {
  ruleId: string;
  title: string;
  severity: Severity;
  message: string;
  filePath: string;
  line: number;
  column: number;
  excerpt: string;
  confidence: "high" | "medium" | "low";
}

export interface AnalysisResult {
  filePath: string;
  findings: Finding[];
}

export interface LoadedSource {
  path: string;
  content: string;
}
