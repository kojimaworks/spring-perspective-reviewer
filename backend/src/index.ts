import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { client, MODEL } from "./anthropic";
import { buildSystemPrompt, ALL_ASPECTS, type Aspect } from "./prompts";
import { REPORT_FINDINGS_TOOL, type ReviewResult } from "./tools";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // CORS対応（開発時は全許可）
app.use(express.json()); // POSTのJSONボディをパース

// ヘルスチェック
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// 観点一覧を返すエンドポイント
app.get("/api/aspects", (req: Request, res: Response) => {
  res.json({ aspects: ALL_ASPECTS });
});

// レビューエンドポイント
app.post("/api/review", async (req: Request, res: Response) => {
  const { code, aspects } = req.body as { code: string; aspects?: Aspect[] };

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "code (string) is required" });
    return;
  }

  // aspects 未指定なら全観点
  const selectedAspects: Aspect[] =
    aspects && aspects.length > 0 ? aspects : ALL_ASPECTS;

  try {
    const systemPrompt = await buildSystemPrompt(selectedAspects);

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: systemPrompt,
      tools: [REPORT_FINDINGS_TOOL],
      tool_choice: { type: "tool", name: "report_findings" }, // 必ずこのツールを呼ばせる
      messages: [
        {
          role: "user",
          content: `以下のJavaコードをレビューしてください:\n\n\`\`\`java\n${code}\n\`\`\``,
        },
      ],
    });

    // トークン打ち切り警告
    if (message.stop_reason === "max_tokens") {
      console.warn("⚠️ 出力が max_tokens で切れました");
    }

    // tool_use ブロックを抽出
    const toolUseBlock = message.content.find((b) => b.type === "tool_use");
    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      throw new Error("Claudeがツールを呼び出しませんでした");
    }

    const result = toolUseBlock.input as ReviewResult;

    // 構造健全性チェック
    if (!result?.summary || !Array.isArray(result?.findings)) {
      throw new Error(
        message.stop_reason === "max_tokens"
          ? "出力が max_tokens 上限で切れて壊れています。max_tokens を増やすか観点を減らしてください"
          : "Claudeの出力が想定外の構造でした",
      );
    }

    console.log("usage:", message.usage);
    console.log("summary:", result.summary);

    res.json({ result, usage: message.usage, aspects: selectedAspects });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
