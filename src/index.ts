#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import path from "node:path";
import { analyzePaths, analyzeRawText } from "./tools/analyze.js";
import { loadRulePacks, validateRulePacks } from "./core/rule-loader.js";

const server = new McpServer({
  name: "mcp-scl-rules",
  version: "2.1.0"
});

server.tool(
  "analyze_scl_paths",
  "Analyse des fichiers ou répertoires SCL/TXT avec les règles chargées depuis un répertoire.",
  {
    inputPaths: z.array(z.string()).min(1),
    rulesDir: z.string().optional(),
    format: z.enum(["markdown", "json"]).default("markdown")
  },
  async ({ inputPaths, rulesDir, format }) => {
    const effectiveRulesDir = path.resolve(rulesDir ?? process.env.SCL_RULES_DIR ?? "rules");
    const output = analyzePaths(inputPaths.map((p) => path.resolve(p)), effectiveRulesDir, format);

    return {
      content: [
        {
          type: "text",
          text: output
        }
      ]
    };
  }
);

server.tool(
  "analyze_scl_text",
  "Analyse du code SCL fourni directement en texte.",
  {
    fileName: z.string().default("inline.scl"),
    content: z.string(),
    rulesDir: z.string().optional(),
    format: z.enum(["markdown", "json"]).default("markdown")
  },
  async ({ fileName, content, rulesDir, format }) => {
    const effectiveRulesDir = path.resolve(rulesDir ?? process.env.SCL_RULES_DIR ?? "rules");
    const output = analyzeRawText(fileName, content, effectiveRulesDir, format);

    return {
      content: [
        {
          type: "text",
          text: output
        }
      ]
    };
  }
);

server.tool(
  "validate_rulepack",
  "Valide les rulepacks chargés depuis un répertoire de règles .md/.rules.json.",
  {
    rulesDir: z.string().optional()
  },
  async ({ rulesDir }) => {
    const effectiveRulesDir = path.resolve(rulesDir ?? process.env.SCL_RULES_DIR ?? "rules");
    const packs = loadRulePacks(effectiveRulesDir);
    const errors = validateRulePacks(packs);

    return {
      content: [
        {
          type: "text",
          text: errors.length === 0
            ? `OK - ${packs.length} rulepack(s) chargé(s).`
            : `Erreurs:\n${errors.join("\n")}`
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
