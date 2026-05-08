import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — UMB Bridge",
};

export default function SettingsPage() {
  return (
    <div>
      <div className="bridge-section">
        <h2 className="bridge-section__title">Settings</h2>
      </div>

      {/* White-label configuration */}
      <div className="bridge-table-wrap" style={{ marginBottom: "20px" }}>
        <div className="bridge-table-header">
          <span className="bridge-table-title">White-label Branding</span>
        </div>
        <div style={{ padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "12px", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>Brand Name</span>
            <input className="bridge-input" type="text" defaultValue="UMB Bridge" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>Primary Color</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input className="bridge-input" type="text" defaultValue="#00D4FF" style={{ width: "120px" }} />
              <span style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#00D4FF", border: "1px solid var(--border)" }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>Logo URL</span>
            <input className="bridge-input" type="text" placeholder="/logo.svg" />
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bridge-table-wrap" style={{ marginBottom: "20px" }}>
        <div className="bridge-table-header">
          <span className="bridge-table-title">API Keys</span>
          <button className="bridge-btn bridge-btn--primary" style={{ fontSize: "11px", padding: "4px 12px" }}>+ Generate Key</button>
        </div>
        <table className="bridge-table">
          <thead>
            <tr>
              <th>Key Name</th>
              <th>Prefix</th>
              <th>Scopes</th>
              <th>Created</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">test-key-123</td>
              <td className="mono">umb-tk...</td>
              <td>
                <span className="bridge-badge bridge-badge--ok">all</span>
              </td>
              <td className="mono">2026-05-07</td>
              <td>
                <span className="bridge-badge bridge-badge--ok">ACTIVE</span>
              </td>
            </tr>
            <tr>
              <td className="mono">read-only-key</td>
              <td className="mono">umb-ro...</td>
              <td>
                <span className="bridge-badge" style={{ color: "var(--amber)", borderColor: "var(--amber)", background: "var(--amber-dim)" }}>read</span>
              </td>
              <td className="mono">2026-05-06</td>
              <td>
                <span className="bridge-badge bridge-badge--ok">ACTIVE</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Danger zone */}
      <div className="bridge-table-wrap" style={{ borderColor: "var(--red)", background: "var(--red-dim)" }}>
        <div className="bridge-table-header" style={{ borderBottomColor: "var(--red)" }}>
          <span className="bridge-table-title" style={{ color: "var(--red)" }}>Danger Zone</span>
        </div>
        <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)" }}>Remove all connectors</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>This will unregister all enterprise modules and clear caches.</div>
          </div>
          <button className="bridge-btn bridge-btn--danger">Unregister All</button>
        </div>
      </div>
    </div>
  );
}