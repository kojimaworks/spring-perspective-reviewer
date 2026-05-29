import { useEffect, useState } from "react";
import "./App.css";

type Aspect =
  | "readability"
  | "consistency"
  | "maintainability"
  | "safety"
  | "reusability"
  | "performance";

type Severity = "必須" | "推奨" | "任意";

interface Finding {
  aspect: Aspect;
  rule: string;
  severity: Severity;
  file: string;
  line?: number;
  message: string;
  suggestion: string;
  code_snippet?: string;
}

interface ReviewResult {
  summary: {
    total_findings: number;
    by_severity: Record<Severity, number>;
  };
  findings: Finding[];
}

const ASPECT_LABEL: Record<Aspect, string> = {
  readability: "可読性",
  consistency: "一貫性",
  maintainability: "保守性",
  safety: "安全性",
  reusability: "再利用性",
  performance: "性能効率性",
};

const SEVERITY_COLOR: Record<Severity, string> = {
  必須: "#d9534f",
  推奨: "#f0ad4e",
  任意: "#5bc0de",
};

function App() {
  const [code, setCode] = useState<string>("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [selected, setSelected] = useState<Set<Aspect>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/aspects")
      .then((r) => r.json())
      .then((d: { aspects: Aspect[] }) => {
        setAspects(d.aspects);
        setSelected(new Set(d.aspects));
      });
  }, []);

  const toggle = (a: Aspect) => {
    const next = new Set(selected);
    if (next.has(a)) {
      next.delete(a);
    } else {
      next.add(a);
    }
    setSelected(next);
  };

  const handleReview = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, aspects: Array.from(selected) }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "unknown" }));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data.result ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
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
        style={{ width: "100%", height: 200, fontFamily: "monospace" }}
      />
      <button onClick={handleReview} disabled={loading || selected.size === 0}>
        {loading ? "レビュー中..." : `レビュー実行 (観点 ${selected.size})`}
      </button>

      {error && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            background: "#fee",
            color: "#900",
            borderRadius: 4,
          }}
        >
          エラー: {error}
        </div>
      )}

      {result && result.summary && Array.isArray(result.findings) && (
        <div style={{ marginTop: 20 }}>
          <h2>サマリ</h2>
          <p>
            合計 <strong>{result.summary.total_findings ?? 0}</strong> 件 —
            必須: {result.summary.by_severity?.["必須"] ?? 0} / 推奨:{" "}
            {result.summary.by_severity?.["推奨"] ?? 0} / 任意:{" "}
            {result.summary.by_severity?.["任意"] ?? 0}
          </p>

          {Array.from(selected).map((a) => {
            const items = result.findings.filter((f) => f.aspect === a);
            return (
              <section key={a} style={{ marginTop: 16 }}>
                <h3>
                  {ASPECT_LABEL[a]}{" "}
                  <span style={{ color: "#888" }}>({items.length})</span>
                </h3>
                {items.length === 0 ? (
                  <p style={{ color: "#888" }}>特になし</p>
                ) : (
                  <ul style={{ paddingLeft: 20 }}>
                    {items.map((f, i) => (
                      <li key={i} style={{ marginBottom: 12 }}>
                        <span
                          style={{
                            background: SEVERITY_COLOR[f.severity],
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: 3,
                            fontSize: 12,
                            marginRight: 6,
                          }}
                        >
                          {f.severity}
                        </span>
                        <strong>{f.message}</strong>
                        <div
                          style={{ fontSize: 13, color: "#555", marginTop: 4 }}
                        >
                          📁 {f.file}
                          {f.line ? `:${f.line}` : ""} — rule:{" "}
                          <code>{f.rule}</code>
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          💡 {f.suggestion}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
