"use client";

import { useState } from "react";

export default function ExplorerPage() {
  const [connector, setConnector] = useState("banking");
  const [resource, setResource] = useState("transactions");
  const [limit, setLimit] = useState(10);
  const [apiKey, setApiKey] = useState("test-key-123");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const url = `/api/bridge/${connector}/${resource}?limit=${limit}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="bridge-section">
        <h2 className="bridge-section__title">Data Explorer</h2>
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "16px",
          marginBottom: "20px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 100px",
          gap: "10px",
          alignItems: "end",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "4px" }}>
            CONNECTOR
          </div>
          <input
            className="bridge-input"
            value={connector}
            onChange={(e) => setConnector(e.target.value)}
            placeholder="banking"
          />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "4px" }}>
            RESOURCE
          </div>
          <input
            className="bridge-input"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder="transactions"
          />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "4px" }}>
            LIMIT
          </div>
          <input
            className="bridge-input"
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </div>
        <button
          className="bridge-btn bridge-btn--primary"
          onClick={handleRun}
          disabled={loading}
          style={{ height: "40px" }}
        >
          {loading ? "..." : "RUN"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "var(--red-dim)",
            border: "1px solid var(--red)",
            borderRadius: "var(--radius-md)",
            padding: "12px",
            marginBottom: "16px",
            color: "var(--red)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div className="bridge-table-wrap">
          <div className="bridge-table-header">
            <span className="bridge-table-title">
              Response ({result.count} records, {result.latency_ms}ms, cache {result.cache_hit ? "HIT" : "MISS"})
            </span>
          </div>
          <pre
            style={{
              padding: "16px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              maxHeight: "400px",
              overflowY: "auto",
              margin: 0,
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}