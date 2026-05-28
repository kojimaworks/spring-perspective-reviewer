import { useState } from 'react'
import './App.css'

function App() {
  const [code, setCode] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleReview = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      // review があればそれを、なければJSON全体を表示
      setResult(data.review ?? JSON.stringify(data, null, 2))
    } catch (e) {
      setResult('エラー: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Spring Perspective Reviewer</h1>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Javaコードをここに貼り付け"
        style={{ width: '100%', height: 200 }}
      />
      <button onClick={handleReview} disabled={loading}>
        {loading ? 'レビュー中...' : 'レビュー実行'}
      </button>
      <pre style={{ marginTop: 20, background: '#f4f4f4', padding: 10 }}>
        {result}
      </pre>
    </div>
  )
}

export default App