import fs from "node:fs";
import type { AnalysisResult, Finding, RuleDefinition, RulePack } from "../types/domain.js";
import { sanitizeScl, hasUnclosedBlockComment } from "../utils/scl-sanitize.js";
import { getLineColumn, getLineExcerpt } from "../utils/source-map.js";
import { flattenRules } from "./rule-loader.js";

interface Context {
  filePath: string;
  content: string;
  codeOnly: string;
  commentsOnly: string;
}

export function analyzeFile(filePath: string, packs: RulePack[]): AnalysisResult {
  const content = fs.readFileSync(filePath, "utf8");
  return analyzeText(filePath, content, packs);
}

export function analyzeText(filePath: string, content: string, packs: RulePack[]): AnalysisResult {
  const sanitized = sanitizeScl(content);
  const context: Context = {
    filePath,
    content,
    codeOnly: sanitized.codeOnly,
    commentsOnly: sanitized.commentsOnly
  };

  const findings: Finding[] = [];

  for (const { rule } of flattenRules(packs)) {
    const ruleFindings = runRule(context, rule).map((item) => ({
      ...item,
      verification: verifyFindingSecondPass(context, rule, item)
    }));
    findings.push(...ruleFindings);
  }

  const sortedFindings = findings.sort((a, b) => a.line - b.line || a.column - b.column);

  return {
    filePath,
    findings: sortedFindings
  };
}

function verifyFindingSecondPass(
  ctx: Context,
  rule: RuleDefinition,
  findingItem: Finding
): NonNullable<Finding["verification"]> {
  const startLine = Math.max(1, findingItem.line - 2);
  const endLine = findingItem.line + 2;
  const localWindow = ctx.content
    .split(/\r?\n/)
    .slice(startLine - 1, endLine)
    .join("\n");

  const ruleChecksByType: Partial<Record<RuleDefinition["type"], RegExp>> = {
    forbidden_upstream_jump: /\b(?:GOTO|JUMP)\b/i,
    forbidden_set_reset: /\b(?:SET|RESET)\b/i,
    indexed_access_requires_bounds: /\[[A-Za-z_][\w]*\]/,
    strict_comparators_forbidden: /(?<![<>=:])<(?![=>])|(?<![<>=:])>(?![=>])/
  };

  const defaultCheck = findingItem.message.length > 0 && findingItem.excerpt.trim().length > 0;
  const specificRegex = ruleChecksByType[rule.type];
  const confirmed = specificRegex ? specificRegex.test(localWindow) : defaultCheck;

  if (confirmed) {
    return {
      status: "confirmed",
      note: "Le contrôle de seconde passe retrouve un motif cohérent à proximité de la ligne signalée.",
      secondPassRule: specificRegex ? "pattern-nearby" : "excerpt-presence"
    };
  }

  return {
    status: "potential_false_positive",
    note: "La seconde passe ne retrouve pas le motif attendu localement ; vérifier manuellement.",
    secondPassRule: specificRegex ? "pattern-nearby" : "excerpt-presence"
  };
}

function runRule(ctx: Context, rule: RuleDefinition): Finding[] {
  switch (rule.type) {
    case "module_header_comment":
      return checkModuleHeader(ctx, rule);
    case "structured_sections":
      return checkStructuredSections(ctx, rule);
    case "module_end_comment":
      return checkModuleEnd(ctx, rule);
    case "closed_comments":
      return checkClosedComments(ctx, rule);
    case "strict_comparators_forbidden":
      return checkStrictComparators(ctx, rule);
    case "line_comments_for_complex_logic":
      return checkLineCommentsForComplexLogic(ctx, rule);
    case "forbidden_upstream_jump":
      return checkForbiddenUpstreamJump(ctx, rule);
    case "module_type_comment_in_call_block":
      return checkModuleTypeCommentInCallBlock(ctx, rule);
    case "activation_guard":
      return checkActivationGuard(ctx, rule);
    case "module_localization_naming":
      return checkModuleLocalizationNaming(ctx, rule);
    case "indentation_and_one_instruction_per_line":
      return checkIndentationAndOneInstructionPerLine(ctx, rule);
    case "single_fb_instance_call":
      return checkSingleFbInstanceCall(ctx, rule);
    case "indexed_access_requires_bounds":
      return checkIndexedAccessRequiresBounds(ctx, rule);
    case "forbidden_set_reset":
      return checkForbiddenSetReset(ctx, rule);
    case "forbidden_token":
      return checkForbiddenToken(ctx, rule);
    default:
      return [finding(ctx, rule, 0, `Type de règle non supporté: ${rule.type}`, "low")];
  }
}

function finding(
  ctx: Context,
  rule: RuleDefinition,
  index: number,
  message: string,
  confidence: Finding["confidence"] = "high"
): Finding {
  const pos = getLineColumn(ctx.content, Math.max(0, index));
  return {
    ruleId: rule.id,
    title: rule.title,
    severity: rule.severity,
    message,
    filePath: ctx.filePath,
    line: pos.line,
    column: pos.column,
    excerpt: getLineExcerpt(ctx.content, pos.line),
    confidence
  };
}

function checkModuleHeader(ctx: Context, rule: RuleDefinition): Finding[] {
  const begin = ctx.content.search(/\bBEGIN\b/i);
  const headerArea = begin >= 0 ? ctx.content.slice(0, Math.min(ctx.content.length, begin + 500)) : ctx.content.slice(0, 1200);

  const hasHeader = /\(\*[\s\S]{10,}?(MODULE|INITIALISATION|SECTION|CONFIGURATION|TABLEAU|DEFAUT|PARAMETRE|GESTION|ACTIVATION|VARIANTE|VERSION|REV)[\s\S]*?\*\)/i.test(headerArea);

  return hasHeader ? [] : [finding(ctx, rule, begin >= 0 ? begin : 0, "Commentaire d'entête module absent ou trop peu explicite.", "medium")];
}

function checkStructuredSections(ctx: Context, rule: RuleDefinition): Finding[] {
  const matches = ctx.content.match(/\(\*[\s\S]*?(={4,}|-{4,}|#{4,})[\s\S]*?\*\)/g);
  return matches && matches.length > 0 ? [] : [finding(ctx, rule, 0, "Aucun commentaire structurant détecté.", "medium")];
}

function checkModuleEnd(ctx: Context, rule: RuleDefinition): Finding[] {
  const ok = /\(\*\s*#+\s*FIN\s*\*\)/i.test(ctx.content);
  return ok ? [] : [finding(ctx, rule, ctx.content.length - 1, "Commentaire de fin de module absent.", "high")];
}

function checkClosedComments(ctx: Context, rule: RuleDefinition): Finding[] {
  return hasUnclosedBlockComment(ctx.content).map((pos) =>
    finding(ctx, rule, pos, "Commentaire bloc ouvert mais non fermé.", "high")
  );
}

function checkStrictComparators(ctx: Context, rule: RuleDefinition): Finding[] {
  const findings: Finding[] = [];
  const regex = /(?<![<>=:])<(?![=>])|(?<![<>=:])>(?![=>])/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(ctx.codeOnly)) !== null) {
    findings.push(finding(ctx, rule, match.index, "Utiliser <= ou >=, pas < ou > seuls.", "high"));
  }

  return findings;
}

function checkLineCommentsForComplexLogic(ctx: Context, rule: RuleDefinition): Finding[] {
  const findings: Finding[] = [];
  const lines = ctx.content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const complex = /\b(IF|ELSIF|FOR|WHILE|CASE)\b|\bAND\b.*\bOR\b|\bOR\b.*\bAND\b/i.test(line);
    const hasCommentNear =
      /\(\*|\/\//.test(line) ||
      /\(\*|\/\//.test(lines[i - 1] ?? "") ||
      /\(\*|\/\//.test(lines[i - 2] ?? "");

    if (complex && !hasCommentNear) {
      const index = lines.slice(0, i).join("\n").length + (i === 0 ? 0 : 1);
      findings.push(finding(ctx, rule, index, "Logique non triviale sans commentaire proche.", "low"));
    }
  }

  return findings;
}

function checkForbiddenUpstreamJump(ctx: Context, rule: RuleDefinition): Finding[] {
  const findings: Finding[] = [];
  const labelRegex = /^\s*([A-Za-z_][\w]*)\s*:/gmi;
  const labels = new Map<string, number>();
  let lm: RegExpExecArray | null;

  while ((lm = labelRegex.exec(ctx.codeOnly)) !== null) {
    labels.set(lm[1].toUpperCase(), lm.index);
  }

  const jumpRegex = /\b(?:GOTO|JUMP)\s+([A-Za-z_][\w]*)\b/gi;
  let jm: RegExpExecArray | null;

  while ((jm = jumpRegex.exec(ctx.codeOnly)) !== null) {
    const target = jm[1].toUpperCase();
    const labelPos = labels.get(target);

    if (labelPos !== undefined && labelPos < jm.index) {
      findings.push(finding(ctx, rule, jm.index, `Saut amont interdit vers l'étiquette ${jm[1]}.`, "high"));
    } else if (labelPos === undefined) {
      findings.push(finding(ctx, rule, jm.index, `Instruction de saut détectée vers une étiquette non résolue: ${jm[1]}.`, "medium"));
    }
  }

  return findings;
}

function checkModuleTypeCommentInCallBlock(ctx: Context, rule: RuleDefinition): Finding[] {
  const isCallBlock = /FUNCTION\s+"?10_SYSTEME"?|SECTION D'APPEL|APPEL DES SECTIONS/i.test(ctx.content);
  if (!isCallBlock) return [];

  const begin = ctx.content.search(/\bBEGIN\b/i);
  const area = begin >= 0 ? ctx.content.slice(begin, begin + 800) : ctx.content.slice(0, 1000);
  const hasModuleTypeComment = /\(\*[\s\S]*(MODULE TYPE|SECTION D'APPEL|APPEL DES SECTIONS)[\s\S]*\*\)/i.test(area);

  return hasModuleTypeComment ? [] : [finding(ctx, rule, begin >= 0 ? begin : 0, "Le bloc d'appel du module type doit contenir le commentaire du module type.", "medium")];
}

function checkActivationGuard(ctx: Context, rule: RuleDefinition): Finding[] {
  const nameArea = ctx.filePath.toUpperCase() + "\n" + ctx.content.slice(0, 400).toUpperCase();
  const applies = /(ENTREE|ENTR[EÉ]E|SORTIE|FORCAGE|FORÇAGE|ACTIV)/i.test(nameArea);
  if (!applies) return [];

  const bodyIndex = ctx.codeOnly.search(/\bBEGIN\b/i);
  const body = bodyIndex >= 0 ? ctx.codeOnly.slice(bodyIndex) : ctx.codeOnly;
  const hasGuard = /\bIF\b[\s\S]{0,160}\b(Activ|Activation|Autorisation|Cdi|AcFo|Binit|Enable)\b[\s\S]{0,160}\bTHEN\b/i.test(body);

  return hasGuard ? [] : [finding(ctx, rule, bodyIndex >= 0 ? bodyIndex : 0, "Aucun IF/THEN d'activation clair détecté pour conditionner la logique principale.", "low")];
}

function checkModuleLocalizationNaming(ctx: Context, rule: RuleDefinition): Finding[] {
  const file = ctx.filePath.replace(/\\/g, "/").split("/").pop() ?? ctx.filePath;
  const block = /\b(FUNCTION|FUNCTION_BLOCK)\s+"([^"]+)"/i.exec(ctx.content);
  if (!block) return [];
  const blockName = block[2];

  if (/OB1|MAIN/i.test(blockName)) return [];

  const ok = /_\d{2}_|\d{2}_.+_\d{2}_|SYSTEME|MODULE|DEFAUTS|CONF/i.test(blockName) || /\d{2}_.+/.test(file);
  return ok ? [] : [finding(ctx, rule, block.index, "Localisation module fonctionnel non démontrable par le nom du bloc/fichier.", "low")];
}

function checkIndentationAndOneInstructionPerLine(ctx: Context, rule: RuleDefinition): Finding[] {
  const findings: Finding[] = [];
  const begin = ctx.content.search(/\bBEGIN\b/i);
  if (begin < 0) return [];

  const lines = ctx.content.slice(begin).split(/\r?\n/);
  let absoluteIndex = begin;

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      trimmed &&
      !trimmed.startsWith("(*") &&
      !trimmed.startsWith("//") &&
      !/^END_?/.test(trimmed) &&
      !/^\w+\s*:/.test(trimmed)
    ) {
      const semicolons = (trimmed.match(/;/g) ?? []).length;
      if (semicolons > 1) {
        findings.push(finding(ctx, rule, absoluteIndex, "Plusieurs instructions sur une même ligne.", "medium"));
      }

      const leading = line.match(/^\s*/)?.[0] ?? "";
      if (/^ +\S/.test(line) && leading.length >= 2 && !leading.includes("\t")) {
        findings.push(finding(ctx, rule, absoluteIndex, "Indentation avec espaces détectée ; tabulation recommandée pour l'imbrication.", "low"));
      }
    }

    absoluteIndex += line.length + 1;
  }

  return findings;
}

function checkSingleFbInstanceCall(ctx: Context, rule: RuleDefinition): Finding[] {
  const findings: Finding[] = [];
  const regex = /"([A-Za-z0-9_]+_DB)"\s*\(/g;
  const seen = new Map<string, number>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(ctx.codeOnly)) !== null) {
    const db = match[1].toUpperCase();
    const previous = seen.get(db);

    if (previous !== undefined) {
      findings.push(finding(ctx, rule, match.index, `Instance DB appelée plusieurs fois dans le fichier: ${match[1]}.`, "high"));
    } else {
      seen.set(db, match.index);
    }
  }

  return findings;
}

function checkIndexedAccessRequiresBounds(ctx: Context, rule: RuleDefinition): Finding[] {
  const findings: Finding[] = [];
  const regex = /\[[A-Za-z_][\w]*\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(ctx.codeOnly)) !== null) {
    const start = Math.max(0, match.index - 300);
    const end = Math.min(ctx.codeOnly.length, match.index + 300);
    const around = ctx.codeOnly.slice(start, end);

    const hasBoundCheck = /\b(LIMIT|MIN|MAX)\b|<=|>=|\bIF\b[\s\S]{0,120}\bTHEN\b/i.test(around);

    if (!hasBoundCheck) {
      findings.push(finding(ctx, rule, match.index, `Accès indexé ${match[0]} sans bornage évident à proximité.`, "medium"));
    }
  }

  return findings;
}

function checkForbiddenSetReset(ctx: Context, rule: RuleDefinition): Finding[] {
  const findings: Finding[] = [];
  const regex = /\b(SET|RESET)\s+[A-Za-z_#"][\w".#]*/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(ctx.codeOnly)) !== null) {
    findings.push(finding(ctx, rule, match.index, `${match[1].toUpperCase()} interdit : utiliser une affectation TRUE/FALSE.`, "high"));
  }

  return findings;
}

function checkForbiddenToken(ctx: Context, rule: RuleDefinition): Finding[] {
  const tokens = Array.isArray(rule.params?.tokens) ? rule.params.tokens.map(String) : [];
  const findings: Finding[] = [];

  for (const token of tokens) {
    const regex = new RegExp(`\\b${escapeRegExp(token)}\\b`, "gi");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(ctx.codeOnly)) !== null) {
      findings.push(finding(ctx, rule, match.index, `Token interdit détecté: ${token}.`, "high"));
    }
  }

  return findings;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
