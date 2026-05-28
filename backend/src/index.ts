import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'

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
app.post('/api/review', (req: Request, res: Response) => {
  const { code } = req.body
  res.json({
    summary: { total_findings: 1, by_severity: { '必須': 1 } },
    findings: [
      {
        aspect: 'readability',
        rule: 'mock',
        severity: '必須',
        message: 'これはモック応答です。受け取ったコードの先頭50文字: ' + (code?.slice(0, 50) ?? '(空)'),
      },
    ],
  })
})

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
})