import { MetricCard } from "@/components/dashboard/metric-card";
import { SystemHealth } from "@/components/dashboard/system-health";
import { ConnectorStatus } from "@/components/dashboard/connector-status";
import { ConnectorLatency } from "@/components/dashboard/connector-latency";
import { RecentRequests } from "@/components/dashboard/recent-requests";
import { LiveLogStream } from "@/components/dashboard/log-stream";
import { ConnectorCards } from "@/components/dashboard/connector-cards";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { LiveCharts } from "@/components/dashboard/live-charts";
import { MetricsResponse } from "@/lib/types";

const API_KEY = process.env.BRIDGE_API_KEYS?.split(",")[0]?.trim() || "test-key-123";

interface BridgeResponse {
  ok: boolean;
  count: number;
  latency_ms: number;
  cache_hit: boolean;
  records: any[];
}

async function fetchConnector(
  connector: string,
  resource: string,
  limit: number
): Promise<BridgeResponse | null> {
  try {
    const url = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/bridge/${connector}/${resource}?limit=${limit}`
      : `http://localhost:3000/api/bridge/${connector}/${resource}?limit=${limit}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch ${connector}/${resource}:`, err);
    return null;
  }
}

async function fetchMetrics(): Promise<MetricsResponse | null> {
  try {
    const url = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/metrics`
      : "http://localhost:3000/api/metrics";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch metrics:", err);
    return null;
  }
}

export default async function OverviewPage() {
  const [bankingData, logisticsData, healthcareData] = await Promise.all([
    fetchConnector("banking", "transactions", 20),
    fetchConnector("logistics", "shipments", 20),
    fetchConnector("healthcare", "patients", 20),
  ]);

  const metricsData = await fetchMetrics();

  const responses = [bankingData, logisticsData, healthcareData].filter(Boolean) as BridgeResponse[];

  const avgLatency =
    responses.length > 0
      ? Math.round(responses.reduce((sum, r) => sum + r.latency_ms, 0) / responses.length)
      : 0;

  const totalRecords = responses.reduce((sum, r) => sum + r.count, 0);

  const cacheHits = responses.filter((r) => r.cache_hit).length;
  const cacheHitRate =
    responses.length > 0 ? Math.round((cacheHits / responses.length) * 100) : 100;

  const activeConnectors = responses.length;
  const totalConnectors = 3;
  const degradedConnector = healthcareData ? null : "healthcare";

  const systemHealth = metricsData?.system || {
    translationEngineCpu: 0,
    sqlAdapterCpu: 0,
    lruCacheUsage: 0,
    healthcareFhirCpu: 0,
    websocketPoolUsage: 0,
    memoryUsage: 0,
    processMemoryMB: 0,
    systemMemoryUsedMB: 0,
    systemMemoryTotalMB: 0,
  };

  const connectorList = metricsData?.connectors || [];

  return (
    <div>
      <AutoRefresh interval={5000} />
      <div className="bridge-metric-grid">
        <MetricCard
          label="Avg Latency"
          value={avgLatency}
          unit="ms"
          delta={avgLatency < 30 ? "↓ Good" : "↑ High"}
          deltaType={avgLatency < 30 ? "up" : "down"}
          accent="cyan"
        />
        <MetricCard
          label="Records Fetched"
          value={totalRecords}
          unit="rows"
          delta="Last refresh"
          accent="green"
        />
        <MetricCard
          label="Cache Hit Rate"
          value={cacheHitRate}
          unit="%"
          delta={cacheHitRate > 90 ? "→ Excellent" : "↓ Low"}
          deltaType={cacheHitRate > 90 ? "up" : "down"}
          accent="amber"
        />
        <MetricCard
          label="Active Connectors"
          value={`${activeConnectors}/${totalConnectors}`}
          delta={degradedConnector ? `⚠ ${degradedConnector} degraded` : "All healthy"}
          deltaType={degradedConnector ? "down" : "up"}
          accent="purple"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "14px", marginTop: "20px" }}>
        <SystemHealth data={systemHealth} />
        <ConnectorStatus connectors={connectorList} />
        <ConnectorLatency
          entries={[
            {
              connector: "banking",
              resource: "transactions",
              latency_ms: bankingData?.latency_ms ?? 0,
              status: bankingData ? "success" : "error",
            },
            {
              connector: "logistics",
              resource: "shipments",
              latency_ms: logisticsData?.latency_ms ?? 0,
              status: logisticsData ? "success" : "error",
            },
            {
              connector: "healthcare",
              resource: "patients",
              latency_ms: healthcareData?.latency_ms ?? 0,
              status: healthcareData
                ? healthcareData.latency_ms > 80
                  ? "degraded"
                  : "success"
                : "error",
            },
          ]}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <RecentRequests />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "20px" }}>
        <div className="panel">
          <div className="panel-hd">
            <span className="panel-title">Live Log Stream</span>
            <span className="bridge-badge bridge-badge--ok">STREAMING</span>
          </div>
          <div className="panel-body">
            <LiveLogStream />
          </div>
        </div>
        <div className="panel">
          <div className="panel-hd">
            <span className="panel-title">Enterprise Modules</span>
          </div>
          <ConnectorCards />
        </div>
      </div>

      {/* Live moving charts */}
      <LiveCharts />
    </div>
  );
}