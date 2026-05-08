export interface ConnectorHealth {
  id: string;
  status: "online" | "degraded" | "offline";
  adapter: string;
  cpu: number;
  memory: number;
  cacheHitRate: number;
  recentErrors: number;
  uptimeHours: number;
  requestCount: number;
  avgLatencyMs: number;
  networkMbps: number;
}

export interface SystemHealthData {
  translationEngineCpu: number;
  sqlAdapterCpu: number;
  lruCacheUsage: number;
  healthcareFhirCpu: number;
  websocketPoolUsage: number;
  memoryUsage: number;
  processMemoryMB: number;
  systemMemoryUsedMB: number;
  systemMemoryTotalMB: number;
}

export interface MetricsResponse {
  ok: boolean;
  timestamp: string;
  connectors: ConnectorHealth[];
  system: SystemHealthData;
}