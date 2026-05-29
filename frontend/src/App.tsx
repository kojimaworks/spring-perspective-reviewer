import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Aspect =
  | "readability"
  | "consistency"
  | "maintainability"
  | "safety"
  | "reusability"
  | "performance";

type Severity = "必須" | "推奨" | "任意";
type SeverityFilter = "必須のみ" | "推奨以上" | "全部";

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

interface Usage {
  input_tokens: number;
  output_tokens: number;
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

// Sonnet 4.6 価格: input $3/Mtok, output $15/Mtok
const calcCost = (u: Usage): string => {
  const cost = (u.input_tokens * 3 + u.output_tokens * 15) / 1_000_000;
  return `≈ $${cost.toFixed(4)}`;
};

const filterBySeverity = (
  findings: Finding[],
  filter: SeverityFilter,
): Finding[] => {
  if (filter === "全部") return findings;
  if (filter === "推奨以上")
    return findings.filter((f) => f.severity !== "任意");
  return findings.filter((f) => f.severity === "必須");
};

const toMarkdown = (
  result: ReviewResult,
  aspects: Aspect[],
  filter: SeverityFilter,
): string => {
  const lines: string[] = [];
  lines.push(`# レビュー結果`);
  lines.push(``);
  lines.push(
    `**サマリ**: 合計 ${result.summary.total_findings} 件 (必須:${result.summary.by_severity["必須"] ?? 0} / 推奨:${result.summary.by_severity["推奨"] ?? 0} / 任意:${result.summary.by_severity["任意"] ?? 0})`,
  );
  lines.push(`**フィルタ**: ${filter}`);
  lines.push(``);

  const filtered = filterBySeverity(result.findings, filter);
  aspects.forEach((a) => {
    const items = filtered.filter((f) => f.aspect === a);
    lines.push(`## ${ASPECT_LABEL[a]} (${items.length})`);
    if (items.length === 0) {
      lines.push(`特になし`);
    } else {
      items.forEach((f) => {
        lines.push(`- **[${f.severity}]** ${f.message}`);
        lines.push(
          `  - 📁 ${f.file}${f.line ? `:${f.line}` : ""} (rule: ${f.rule})`,
        );
        lines.push(`  - 💡 ${f.suggestion}`);
      });
    }
    lines.push(``);
  });

  return lines.join("\n");
};

function App() {
  const [code, setCode] = useState<string>("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [selected, setSelected] = useState<Set<Aspect>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("全部");
  const [copyToast, setCopyToast] = useState<string | null>(null);

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

  // プリセット
  const selectAll = () => setSelected(new Set(aspects));
  const selectNone = () => setSelected(new Set());
  const presetSecurity = () => setSelected(new Set(["safety"]));
  const presetMaintain = () =>
    setSelected(new Set(["maintainability", "safety"]));

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
      setUsage(data.usage ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const md = toMarkdown(result, Array.from(selected), severityFilter);
    try {
      await navigator.clipboard.writeText(md);
      setCopyToast("コピーしました");
    } catch {
      setCopyToast("コピーに失敗しました");
    }
    setTimeout(() => setCopyToast(null), 2000);
  };

  const filteredFindings = useMemo(
    () => (result ? filterBySeverity(result.findings, severityFilter) : []),
    [result, severityFilter],
  );

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Spring Perspective Reviewer</h1>

      <div style={{ marginBottom: 10 }}>
        <strong>観点:</strong>
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

      <div style={{ marginBottom: 10, fontSize: 13 }}>
        <strong>プリセット:</strong>
        <button onClick={selectAll} style={{ marginLeft: 6 }}>
          全選択
        </button>
        <button onClick={selectNone} style={{ marginLeft: 6 }}>
          全解除
        </button>
        <button onClick={presetSecurity} style={{ marginLeft: 6 }}>
          セキュリティ重視
        </button>
        <button onClick={presetMaintain} style={{ marginLeft: 6 }}>
          保守性重視
        </button>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0 }}>結果</h2>
            <span>
              合計 <strong>{result.summary.total_findings}</strong> 件 (必須:
              {result.summary.by_severity?.["必須"] ?? 0} / 推奨:
              {result.summary.by_severity?.["推奨"] ?? 0} / 任意:
              {result.summary.by_severity?.["任意"] ?? 0})
            </span>
            <label>
              フィルタ:
              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value as SeverityFilter)
                }
                style={{ marginLeft: 4 }}
              >
                <option value="必須のみ">必須のみ</option>
                <option value="推奨以上">推奨以上</option>
                <option value="全部">全部</option>
              </select>
            </label>
            <button onClick={handleCopy}>Markdownコピー</button>
            {copyToast && <span style={{ color: "#2a8" }}>{copyToast}</span>}
          </div>

          {Array.from(selected).map((a) => {
            const items = filteredFindings.filter((f) => f.aspect === a);
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

          {usage && (
            <div
              style={{
                marginTop: 20,
                padding: 10,
                background: "#f4f4f4",
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              💰 input: {usage.input_tokens} tok / output: {usage.output_tokens}{" "}
              tok / {calcCost(usage)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
