"use client";

import { useEffect, useState } from "react";

interface AuditEntry {
  id: number;
  timestamp: string;
  level: string;
  connector: string;
  resource: string;
  latency_ms: number;
  cache: string;
  status: number;
  message: string;
}

export function RecentRequests() {
  const [requests, setRequests] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch("/api/audit");
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests);
        }
      } catch {}
    };

    fetchAudit();
    const interval = setInterval(fetchAudit, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bridge-table-wrap">
      <div className="bridge-table-header">
        <span className="bridge-table-title">Recent Requests</span>
        <span className="bridge-badge bridge-badge--ok">LIVE</span>
      </div>
      <table className="bridge-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Connector</th>
            <th>Resource</th>
            <th>Latency</th>
            <th>Cache</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td className="mono">{new Date(r.timestamp).toLocaleTimeString("en-GB")}</td>
              <td>{r.connector}</td>
              <td>{r.resource}</td>
              <td
                className="mono"
                style={{ color: r.latency_ms < 30 ? "var(--green)" : r.latency_ms < 80 ? "var(--amber)" : "var(--red)" }}
              >
                {r.latency_ms}ms
              </td>
              <td>
                <span className={`bridge-badge ${r.cache === "HIT" ? "bridge-badge--ok" : "bridge-badge--inactive"}`}>
                  {r.cache}
                </span>
              </td>
              <td>
                <span className={`bridge-badge ${r.status === 200 ? "bridge-badge--ok" : "bridge-badge--warn"}`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}