interface LatencyEntry {
  connector: string;
  resource: string;
  latency_ms: number;
  status: "success" | "error" | "degraded";
}

export function ConnectorLatency({ entries }: { entries: LatencyEntry[] }) {
  return (
    <div className="bridge-health-panel">
      <div className="bridge-health-panel__title">Last Request Latency</div>
      {entries.map((entry) => {
        const color =
          entry.status === "success"
            ? "var(--green)"
            : entry.status === "degraded"
            ? "var(--amber)"
            : "var(--red)";
        return (
          <div key={entry.connector} className="bridge-health-row">
            <span className="bridge-health-row__label">
              {entry.connector} / {entry.resource}
            </span>
            <div className="bridge-health-bar-track">
              <div
                className="bridge-health-bar-fill"
                style={{
                  width: `${Math.min(entry.latency_ms, 100)}%`,
                  background: color,
                }}
              />
            </div>
            <span
              className="bridge-health-row__value"
              style={{ color }}
            >
              {entry.latency_ms}ms
            </span>
          </div>
        );
      })}
    </div>
  );
}