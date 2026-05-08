import { ConnectorHealth } from "@/lib/types";

export function ConnectorStatus({ connectors }: { connectors: ConnectorHealth[] }) {
  return (
    <div className="bridge-health-panel">
      <div className="bridge-health-panel__title">Connector Activity (5 min)</div>
      {connectors.map((c) => {
        const badgeClass =
          c.status === "online"
            ? "bridge-badge--ok"
            : c.status === "degraded"
            ? "bridge-badge--warn"
            : "bridge-badge--inactive";
        return (
          <div key={c.id} className="bridge-health-row">
            <span className="bridge-health-row__label">{c.id}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
              {c.requestCount} req, {c.avgLatencyMs}ms, {c.networkMbps.toFixed(2)} Mbps
            </span>
            <span className={`bridge-badge ${badgeClass}`}>
              {c.status.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}