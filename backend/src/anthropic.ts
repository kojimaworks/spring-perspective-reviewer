import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY が未設定です。backend/.env を確認してください。",
  );
}

export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 使用モデル
export const MODEL = "claude-sonnet-4-6";
