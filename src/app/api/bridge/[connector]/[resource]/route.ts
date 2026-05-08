import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logBus } from "@/lib/log-bus";
import { logRequest } from "@/lib/adapters/sql-adapter";

function getResponseBodySize(body: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return 0;
  }
}

type ConnectorId = "banking" | "logistics" | "healthcare" | string;

interface BridgeRecord {
  id: string;
  source: string;
  connector: ConnectorId;
  schema_version: string;
  timestamp: string;
  payload: Record<string, unknown>;
  meta: {
    latency_ms: number;
    adapter: "sql" | "c-proc" | "flat-file";
    cache_hit: boolean;
  };
}

interface ConnectorModule {
  id: ConnectorId;
  adapterType: "sql" | "c-proc" | "flat-file";
  schemaVersion: string;
  fetch(resource: string, params: Record<string, string>): Promise<unknown[]>;
  normalise(raw: unknown): Record<string, unknown>;
}

const CONNECTOR_REGISTRY = new Map<ConnectorId, () => Promise<ConnectorModule>>();
CONNECTOR_REGISTRY.set("banking", () => import("@/connectors/banking").then(m => m.BankingConnector));
CONNECTOR_REGISTRY.set("logistics", () => import("@/connectors/logistics").then(m => m.LogisticsConnector));
CONNECTOR_REGISTRY.set("healthcare", () => import("@/connectors/healthcare").then(m => m.HealthcareConnector));

const LRU_CAPACITY = 512;
const LRU_TTL_MS = 5_000;
interface CacheEntry { data: BridgeRecord[]; expiresAt: number; }
const lruCache = new Map<string, CacheEntry>();

function cacheGet(key: string): BridgeRecord[] | null {
  const entry = lruCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { lruCache.delete(key); return null; }
  lruCache.delete(key);
  lruCache.set(key, entry);
  return entry.data;
}
function cacheSet(key: string, data: BridgeRecord[], ttlMs = LRU_TTL_MS): void {
  if (lruCache.size >= LRU_CAPACITY) {
    const firstKey = lruCache.keys().next().value;
    if (firstKey !== undefined) lruCache.delete(firstKey);
  }
  lruCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const VALID_API_KEYS = new Set(
  (process.env.BRIDGE_API_KEYS ?? "").split(",").map(k => k.trim()).filter(Boolean)
);
function verifyAuth(req: NextRequest): { ok: true } | { ok: false; error: string } {
  const auth = req.headers.get("authorization") ?? "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return { ok: false, error: "Missing Bearer token" };
  if (!VALID_API_KEYS.has(token)) return { ok: false, error: "Invalid API key" };
  return { ok: true };
}

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
}).catchall(z.string());

const RATE_LIMIT_RPS = 50;
const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();
function checkRateLimit(apiKey: string): boolean {
  const now = Date.now();
  let bucket = tokenBuckets.get(apiKey);
  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_RPS, lastRefill: now };
    tokenBuckets.set(apiKey, bucket);
  }
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(RATE_LIMIT_RPS, bucket.tokens + elapsed * RATE_LIMIT_RPS);
  bucket.lastRefill = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

// ── Safe log helper – ensures no undefined values ───────────
async function safeLog(entry: {
  level?: string;
  connector?: string;
  resource?: string;
  latency?: number;
  cache?: string;
  status?: number;
  message?: string;
  payload_size?: number;
}) {
  const logEntry = {
    level: entry.level ?? "OK",
    connector: entry.connector ?? "unknown",
    resource: entry.resource ?? "unknown",
    latency: entry.latency ?? 0,
    cache: entry.cache ?? "MISS",
    status: entry.status ?? 200,
    message: entry.message ?? "",
    payload_size: entry.payload_size ?? 0,
  };
  try {
    logBus.publish(JSON.stringify({ ...logEntry, timestamp: new Date().toISOString() }));
  } catch {}
  try {
    await logRequest(logEntry);
  } catch {}
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ connector: string; resource: string }> }
): Promise<NextResponse> {
  const t0 = performance.now();

  const auth = verifyAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const apiKey = req.headers.get("authorization")!.split(" ")[1];
  if (!checkRateLimit(apiKey)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "1" } }
    );
  }

  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parseResult = QuerySchema.safeParse(rawParams);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }
  const query = parseResult.data;

  const resolved = await params;
  const { connector: connectorId, resource } = resolved;

  const connectorLoader = CONNECTOR_REGISTRY.get(connectorId);
  if (!connectorLoader) {
    return NextResponse.json({ error: `Unknown connector: '${connectorId}'` }, { status: 404 });
  }

  const cacheKey = `${connectorId}:${resource}:${JSON.stringify(query)}`;
  const cachedResult = cacheGet(cacheKey);
  if (cachedResult) {
    const latency = Math.round(performance.now() - t0);
    const responseBody = {
      ok: true,
      count: cachedResult.length,
      latency_ms: latency,
      cache_hit: true,
      records: cachedResult,
    };
    await safeLog({
      level: "OK",
      connector: connectorId,
      resource,
      latency,
      cache: "HIT",
      status: 200,
      message: `${connectorId}/${resource} → 200 · ${latency}ms · cache HIT`,
      payload_size: getResponseBodySize(responseBody),
    });
    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=5, stale-while-revalidate=10",
        "X-Bridge-Latency": `${latency}ms`,
        "X-Bridge-Cache": "HIT",
      },
    });
  }

  let connector: ConnectorModule;
  try {
    connector = await connectorLoader();
  } catch (err) {
    console.error(`[bridge] Failed to load connector:`, err);
    return NextResponse.json({ error: "Connector unavailable" }, { status: 503 });
  }

  let rawRows: unknown[];
  try {
    rawRows = await connector.fetch(resource, query as Record<string, string>);
  } catch (err) {
    console.error(`[bridge] Adapter error [${connectorId}/${resource}]:`, err);
    await safeLog({
      level: "ERR",
      connector: connectorId,
      resource,
      latency: Math.round(performance.now() - t0),
      cache: "MISS",
      status: 502,
      message: `${connectorId}/${resource} → 502 · adapter error`,
      payload_size: 0,
    });
    return NextResponse.json({ error: "Upstream adapter error" }, { status: 502 });
  }

  const latencyMs = Math.round(performance.now() - t0);
  const records: BridgeRecord[] = rawRows.map((row, i) => ({
    id: `${connectorId}-${resource}-${Date.now()}-${i}`,
    source: connectorId,
    connector: connectorId,
    schema_version: connector.schemaVersion,
    timestamp: new Date().toISOString(),
    payload: connector.normalise(row),
    meta: {
      latency_ms: latencyMs,
      adapter: connector.adapterType,
      cache_hit: false,
    },
  }));

  const page = records.slice(query.offset, query.offset + query.limit);
  cacheSet(cacheKey, page);

  const responseBody = {
    ok: true,
    count: page.length,
    latency_ms: latencyMs,
    cache_hit: false,
    records: page,
  };

  const logLevel = latencyMs < 50 ? "OK" : latencyMs < 100 ? "WARN" : "ERR";
  await safeLog({
    level: logLevel,
    connector: connectorId,
    resource,
    latency: latencyMs,
    cache: "MISS",
    status: 200,
    message: `${connectorId}/${resource} → 200 · ${latencyMs}ms · cache MISS`,
    payload_size: getResponseBodySize(responseBody),
  });

  return NextResponse.json(responseBody, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=5, stale-while-revalidate=10",
      "X-Bridge-Latency": `${latencyMs}ms`,
      "X-Bridge-Cache": "MISS",
    },
  });
}