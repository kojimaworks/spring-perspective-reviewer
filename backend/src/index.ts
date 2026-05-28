import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import { client, MODEL } from './anthropic'

const app = express()
const PORT = process.env.PORT || 3001

// ミドルウェアを積む
app.use(cors())              // CORS対応（開発時は全許可）
app.use(express.json())      // POSTのJSONボディをパース

// ヘルスチェック
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'backend is running' })
})

// レビューエンドポイント
app.post('/api/review', async (req: Request, res: Response) => {
  const { code } = req.body

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'code (string) is required' })
    return
  }

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system:
        'あなたはJava/Springプロジェクトのコードレビュー専門家です。' +
        '提示されたコードを6つの品質観点（可読性・一貫性・保守性・安全性・再利用性・性能効率性）で' +
        'レビューし、観点別に指摘してください。指摘がない観点は「特になし」と記載してください。',
      messages: [
        {
          role: 'user',
          content: `以下のJavaコードをレビューしてください:\n\n\`\`\`java\n${code}\n\`\`\``,
        },
      ],
    })

    // レスポンスからテキストを抽出
    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')

    console.log('usage:', message.usage)

    res.json({
      review: text,
      usage: message.usage,  // 入出力トークン数も返しておく（学習用）
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
})