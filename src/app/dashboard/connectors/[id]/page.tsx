const connectorDetails: Record<string, any> = {
  banking: {
    name: "Banking",
    status: "ONLINE",
    badgeClass: "bridge-badge--ok",
    adapter: "SQL",
    schemaVersion: "1.0.0",
    protocols: ["SWIFT", "FIX", "ISO20022"],
    description: "Core banking & payment system integration. Connects to legacy ledger databases.",
    health: { cpu: 18, memory: 44, cacheHitRate: 94 },
    recentErrors: 0,
  },
  logistics: {
    name: "Logistics",
    status: "ONLINE",
    badgeClass: "bridge-badge--ok",
    adapter: "Flat File",
    schemaVersion: "1.0.0",
    protocols: ["EDI", "SCAC", "GS1"],
    description: "Supply chain & shipment data layer. Reads from EDI CSV files.",
    health: { cpu: 32, memory: 40, cacheHitRate: 88 },
    recentErrors: 1,
  },
  healthcare: {
    name: "Healthcare",
    status: "DEGRADED",
    badgeClass: "bridge-badge--warn",
    adapter: "C-Procedure",
    schemaVersion: "2.1.0",
    protocols: ["HL7", "FHIR", "DICOM"],
    description: "Clinical & administrative records bridge. Interfaces with legacy C binaries.",
    health: { cpu: 81, memory: 62, cacheHitRate: 72 },
    recentErrors: 4,
  },
};

export default async function ConnectorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const info = connectorDetails[id];

  if (!info) {
    return <div style={{ color: "var(--text-secondary)" }}>Connector not found.</div>;
  }

  return (
    <div>
      <div className="bridge-section">
        <h2 className="bridge-section__title">Connector Detail</h2>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600, color: "var(--cyan)" }}>
            {info.name}
          </span>
          <span className={`bridge-badge ${info.badgeClass}`}>{info.status}</span>
        </div>
        <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>{info.description}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>ADAPTER</div>
            <div style={{ fontFamily: "var(--font-mono)" }}>{info.adapter}</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>SCHEMA VERSION</div>
            <div style={{ fontFamily: "var(--font-mono)" }}>{info.schemaVersion}</div>
          </div>
        </div>
        <div className="bridge-connector-card__protocols">
          {info.protocols.map((p: string) => (
            <span key={p} className="bridge-protocol-chip">{p}</span>
          ))}
        </div>
      </div>

      {/* Health panel for this connector */}
      <div className="bridge-health-panel">
        <div className="bridge-health-panel__title">Resource Usage</div>
        <div className="bridge-health-row">
          <span className="bridge-health-row__label">CPU</span>
          <div className="bridge-health-bar-track">
            <div className="bridge-health-bar-fill" style={{ width: `${info.health.cpu}%`, background: info.health.cpu > 70 ? "var(--amber)" : "var(--green)" }} />
          </div>
          <span className="bridge-health-row__value">{info.health.cpu}%</span>
        </div>
        <div className="bridge-health-row">
          <span className="bridge-health-row__label">Memory</span>
          <div className="bridge-health-bar-track">
            <div className="bridge-health-bar-fill" style={{ width: `${info.health.memory}%`, background: "var(--cyan)" }} />
          </div>
          <span className="bridge-health-row__value">{info.health.memory}%</span>
        </div>
        <div className="bridge-health-row">
          <span className="bridge-health-row__label">Cache Hit Rate</span>
          <div className="bridge-health-bar-track">
            <div className="bridge-health-bar-fill" style={{ width: `${info.health.cacheHitRate}%`, background: "var(--green)" }} />
          </div>
          <span className="bridge-health-row__value">{info.health.cacheHitRate}%</span>
        </div>
      </div>

      {info.recentErrors > 0 && (
        <div style={{ marginTop: "16px", color: "var(--amber)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          ⚠ {info.recentErrors} recent error{info.recentErrors > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}