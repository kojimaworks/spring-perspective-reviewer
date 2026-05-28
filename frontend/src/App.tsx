import { useEffect, useState } from 'react'
import './App.css'

type Aspect =
  | 'readability'
  | 'consistency'
  | 'maintainability'
  | 'safety'
  | 'reusability'
  | 'performance'

const ASPECT_LABEL: Record<Aspect, string> = {
  readability: '可読性',
  consistency: '一貫性',
  maintainability: '保守性',
  safety: '安全性',
  reusability: '再利用性',
  performance: '性能効率性',
}

function App() {
  const [code, setCode] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [aspects, setAspects] = useState<Aspect[]>([])
  const [selected, setSelected] = useState<Set<Aspect>>(new Set())

  // マウント時に観点一覧を取得
  useEffect(() => {
    fetch('http://localhost:3001/api/aspects')
      .then((r) => r.json())
      .then((d: { aspects: Aspect[] }) => {
        setAspects(d.aspects)
        setSelected(new Set(d.aspects)) // 初期は全観点ON
      })
  }, [])

  const toggle = (a: Aspect) => {
    const next = new Set(selected)
    if (next.has(a)) {
      next.delete(a)
    } else {
      next.add(a)
    }
    setSelected(next)
  }

  const handleReview = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, aspects: Array.from(selected) }),
      })
      const data = await res.json()
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

      <div style={{ marginBottom: 10 }}>
        <strong>観点選択:</strong>
        {aspects.map((a) => (
          <label key={a} style={{ marginLeft: 10 }}>
            <input
              type="checkbox"
              checked={selected.has(a)}
              onChange={() => toggle(a)}
            />
            {ASPECT_LABEL[a]}
          </label>
        ))}
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Javaコードをここに貼り付け"
        style={{ width: '100%', height: 200 }}
      />
      <button onClick={handleReview} disabled={loading || selected.size === 0}>
        {loading ? 'レビュー中...' : `レビュー実行 (観点 ${selected.size})`}
      </button>
      <pre style={{ marginTop: 20, background: '#f4f4f4', padding: 10 }}>
        {result}
      </pre>
    </div>
  )
}

export default App