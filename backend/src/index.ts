import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import { client, MODEL } from './anthropic'
import { buildSystemPrompt, ALL_ASPECTS, type Aspect } from './prompts'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())              // CORS対応（開発時は全許可）
app.use(express.json())      // POSTのJSONボディをパース

// ヘルスチェック
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// 観点一覧を返すエンドポイント
app.get('/api/aspects', (req: Request, res: Response) => {
  res.json({ aspects: ALL_ASPECTS })
})

// レビューエンドポイント
app.post('/api/review', async (req: Request, res: Response) => {
  const { code, aspects } = req.body as { code: string; aspects?: Aspect[] }

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'code (string) is required' })
    return
  }

  // aspects 未指定なら全観点
  const selectedAspects: Aspect[] = aspects && aspects.length > 0 ? aspects : ALL_ASPECTS

  try {
    const systemPrompt = await buildSystemPrompt(selectedAspects)

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `以下のJavaコードをレビューしてください:\n\n\`\`\`java\n${code}\n\`\`\`` },
      ],
    })

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')

    console.log('usage:', message.usage)
    console.log('aspects:', selectedAspects)

    res.json({ review: text, usage: message.usage, aspects: selectedAspects })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: String(e) })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
})