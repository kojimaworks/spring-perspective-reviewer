import type Anthropic from "@anthropic-ai/sdk";
import type { Aspect } from "./prompts";

export type Severity = "必須" | "推奨" | "任意";

export interface Finding {
  aspect: Aspect;
  rule: string;
  severity: Severity;
  file: string;
  line?: number;
  message: string;
  suggestion: string;
  code_snippet?: string;
}

export interface ReviewResult {
  summary: {
    total_findings: number;
    by_severity: Record<Severity, number>;
  };
  findings: Finding[];
}

// Anthropic Tool 定義（Claudeに渡すスキーマ）
export const REPORT_FINDINGS_TOOL: Anthropic.Messages.Tool = {
  name: "report_findings",
  description: "観点別のレビュー指摘をレポートする",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "object",
        properties: {
          total_findings: { type: "number", description: "指摘合計件数" },
          by_severity: {
            type: "object",
            properties: {
              必須: { type: "number" },
              推奨: { type: "number" },
              任意: { type: "number" },
            },
          },
        },
        required: ["total_findings", "by_severity"],
      },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            aspect: {
              type: "string",
              enum: [
                "readability",
                "consistency",
                "maintainability",
                "safety",
                "reusability",
                "performance",
              ],
              description: "観点ID",
            },
            rule: {
              type: "string",
              description: "違反した観点ルール名（例: naming-convention）",
            },
            severity: { type: "string", enum: ["必須", "推奨", "任意"] },
            file: {
              type: "string",
              description: "ファイル名（不明な場合は「不明」）",
            },
            line: { type: "number", description: "行番号（不明な場合は省略）" },
            message: { type: "string", description: "指摘内容" },
            suggestion: { type: "string", description: "修正提案" },
            code_snippet: {
              type: "string",
              description: "該当コード片（任意）",
            },
          },
          required: [
            "aspect",
            "rule",
            "severity",
            "file",
            "message",
            "suggestion",
          ],
        },
      },
    },
    required: ["summary", "findings"],
  },
};
