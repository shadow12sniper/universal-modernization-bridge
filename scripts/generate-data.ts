import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

// ── Helpers ────────────────────────────────────────────────────
const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const randomAmount = () => (Math.random() * 5000 - 1000).toFixed(2);
const randomId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

// ── Database setup (standalone – no import from @/lib) ─────────
let db: any = null;

async function getDb(): Promise<any> {
  if (db) return db;

  const wasmPath = path.join(
    process.cwd(),
    "node_modules",
    "sql.js",
    "dist",
    "sql-wasm.wasm"
  );

  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "banking.db");

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS ledger_transactions (
        txn_id TEXT PRIMARY KEY,
        account_no TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        posted_at TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS core_accounts (
        account_no TEXT PRIMARY KEY,
        holder_name TEXT NOT NULL,
        product_code TEXT NOT NULL,
        open_date TEXT NOT NULL,
        balance REAL NOT NULL
      );
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL DEFAULT 'INFO',
        connector TEXT NOT NULL,
        resource TEXT NOT NULL,
        latency_ms INTEGER,
        cache TEXT NOT NULL DEFAULT 'MISS',
        status INTEGER DEFAULT 200,
        message TEXT,
        payload_size INTEGER DEFAULT 0
      );
    `);

    // Insert sample data
    const insertTx = db.prepare(
      "INSERT INTO ledger_transactions (txn_id, account_no, amount, currency, posted_at, status) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const sampleTx = [
      ["TX001", "ACC100", 150.25, "USD", "2026-05-01T10:30:00Z", "completed"],
      ["TX002", "ACC200", 3200.0, "EUR", "2026-05-02T14:15:00Z", "pending"],
      ["TX003", "ACC100", -45.0, "USD", "2026-05-03T08:00:00Z", "completed"],
      ["TX004", "ACC300", 890.5, "USD", "2026-05-04T16:45:00Z", "completed"],
      ["TX005", "ACC200", -200.0, "EUR", "2026-05-05T11:20:00Z", "failed"],
    ];
    for (const row of sampleTx) insertTx.run(row);
    insertTx.free();

    const insertAcc = db.prepare(
      "INSERT INTO core_accounts (account_no, holder_name, product_code, open_date, balance) VALUES (?, ?, ?, ?, ?)"
    );
    const sampleAcc = [
      ["ACC100", "Alice Johnson", "CHK", "2020-03-15", 4520.75],
      ["ACC200", "Bob Smith", "SAV", "2019-11-01", 12850.0],
      ["ACC300", "Carol Davis", "CHK", "2021-06-20", 3200.0],
    ];
    for (const row of sampleAcc) insertAcc.run(row);
    insertAcc.free();
  }

  // Migration: add payload_size column if missing
  try {
    db.run("ALTER TABLE audit_log ADD COLUMN payload_size INTEGER DEFAULT 0");
  } catch { /* already exists */ }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  return db;
}

// ── Insert random transaction + audit log entry ─────────────────
async function insertTransaction() {
  const database = await getDb();
  const txnId = randomId("TX");
  const account = random(["ACC100", "ACC200", "ACC300"]);
  const amount = randomAmount();
  const currency = random(["USD", "EUR", "GBP"]);
  const status = random(["completed", "pending", "failed"]);
  const postedAt = new Date().toISOString();

  // Every value is guaranteed non‑undefined
  database.run(
    `INSERT INTO ledger_transactions (txn_id, account_no, amount, currency, posted_at, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [txnId, account, amount, currency, postedAt, status]
  );

  const latency = Math.floor(Math.random() * 30) + 5;
  const payloadSize = Math.floor(Math.random() * 500) + 100;
  // Audit entry with all required fields
  database.run(
    `INSERT INTO audit_log (timestamp, level, connector, resource, latency_ms, cache, status, message, payload_size)
     VALUES (?, 'OK', 'banking', 'transactions', ?, 'MISS', 200, ?, ?)`,
    [
      new Date().toISOString(),
      latency,
      `banking/transactions → 200 · ${latency}ms · cache MISS`,
      payloadSize,
    ]
  );

  const data = database.export();
  fs.writeFileSync(path.join(process.cwd(), "data", "banking.db"), Buffer.from(data));
  console.log(`[generator] + banking transaction ${txnId}`);
}

// ── Append shipment to CSV (safe, no corruption) ────────────────
function appendShipment() {
  const csvPath = path.join(process.cwd(), "data", "shipments.csv");

  // If file missing or empty, write header
  if (!fs.existsSync(csvPath) || fs.readFileSync(csvPath, "utf-8").trim() === "") {
    fs.writeFileSync(csvPath, "shipment_id,tracking_num,scac_code,status,eta\n");
  }

  // Ensure file ends with a newline before appending
  let content = fs.readFileSync(csvPath, "utf-8");
  if (!content.endsWith("\n")) {
    fs.appendFileSync(csvPath, "\n");
  }

  const shipId = randomId("SHP");
  const tracking = `TRK${Math.floor(Math.random() * 9000 + 1000)}`;
  const scac = random(["UPSN", "FDEG", "SCDU"]);
  const status = random(["In Transit", "Delivered", "Pending", "Out for Delivery"]);
  const eta = new Date(Date.now() + Math.random() * 10 * 86400000).toISOString().split("T")[0];

  const line = `${shipId},${tracking},${scac},${status},${eta}\n`;
  fs.appendFileSync(csvPath, line);
  console.log(`[generator] + logistics shipment ${shipId}`);
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log("[generator] Initialising database and starting...");
  await getDb(); // creates DB + tables + sample data if not present

  // Insert one of each immediately so dashboard sees activity
  await insertTransaction();
  appendShipment();

  setInterval(() => insertTransaction().catch((e) => console.error("[generator] tx error:", e.message)), 7000);
  setInterval(() => appendShipment(), 10000);
}

main();