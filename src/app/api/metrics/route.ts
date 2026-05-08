import { NextResponse } from "next/server";
import os from "os";
import { query } from "@/lib/adapters/sql-adapter";

function getCpuUsage(): number {
  const cpus = os.cpus().length;
  const load = os.loadavg()[0];
  return Math.min(100, Math.round((load / cpus) * 100));
}

function getMemoryUsage(): { usedMB: number; totalMB: number; percent: number } {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  return {
    usedMB: Math.round(usedMem / (1024 * 1024)),
    totalMB: Math.round(totalMem / (1024 * 1024)),
    percent: Math.round((usedMem / totalMem) * 100),
  };
}

async function getConnectorStats(): Promise<
  {
    id: string;
    requestCount: number;
    errorCount: number;
    avgLatencyMs: number;
    totalPayloadBytes: number;
    networkMbps: number;
  }[]
> {
  try {
    const rows = await query(
      `SELECT connector,
              COUNT(*) AS total,
              SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) AS errors,
              AVG(latency_ms) AS avg_latency,
              SUM(payload_size) AS total_bytes
       FROM audit_log
       WHERE timestamp >= datetime('now', '-5 minutes')
       GROUP BY connector`
    );
    return rows.map((r: any) => {
      const totalBytes = r.total_bytes ?? 0;
      const avgLat = r.avg_latency ? parseFloat(r.avg_latency) : 0;
      const totalTimeSec = (avgLat * r.total) / 1000 || 1;
      const bits = totalBytes * 8;
      const mbps = +(bits / (totalTimeSec * 1_000_000)).toFixed(4);
      return {
        id: r.connector,
        requestCount: r.total,
        errorCount: r.errors ?? 0,
        avgLatencyMs: Math.round(avgLat),
        totalPayloadBytes: totalBytes,
        networkMbps: mbps,
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const cpuLoad = getCpuUsage();
  const sysMem = getMemoryUsage();
  const processMemMB = Math.round(process.memoryUsage().rss / (1024 * 1024));
  const stats = await getConnectorStats();

  const connectorIds = ["banking", "logistics", "healthcare"];
  const connectors = connectorIds.map((id) => {
    const st = stats.find((s) => s.id === id);
    const errorCount = st?.errorCount ?? 0;
    const requestCount = st?.requestCount ?? 0;
    const status: "online" | "degraded" | "offline" =
      errorCount > 0 ? "degraded" : "online";
    return {
      id,
      status,
      adapter: id === "banking" ? "sql" : id === "logistics" ? "flat-file" : "c-proc",
      cpu: cpuLoad,
      memory: sysMem.percent,
      cacheHitRate: 90,
      recentErrors: errorCount,
      uptimeHours: Math.round(process.uptime() / 3600),
      requestCount,
      avgLatencyMs: st?.avgLatencyMs ?? 0,
      networkMbps: st?.networkMbps ?? 0,
    };
  });

  const system = {
    translationEngineCpu: cpuLoad,
    sqlAdapterCpu: cpuLoad,
    lruCacheUsage: 58,
    healthcareFhirCpu: cpuLoad,
    websocketPoolUsage: 12,
    memoryUsage: sysMem.percent,
    processMemoryMB: processMemMB,
    systemMemoryUsedMB: sysMem.usedMB,
    systemMemoryTotalMB: sysMem.totalMB,
  };

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    connectors,
    system,
  });
}