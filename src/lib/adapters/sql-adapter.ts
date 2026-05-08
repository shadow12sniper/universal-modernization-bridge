import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

let db: SqlJsDatabase | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const wasmPath = path.join(
    process.cwd(),
    "node_modules",
    "sql.js",
    "dist",
    "sql-wasm.wasm"
  );

  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "banking.db");

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
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
  }

  // Ensure audit_log table
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

  // Add column if missing (safe migration)
  try {
    db.run("ALTER TABLE audit_log ADD COLUMN payload_size INTEGER DEFAULT 0");
  } catch {
    // already exists
  }

  // Sample data if empty
  const txCount = db.exec("SELECT COUNT(*) FROM ledger_transactions");
  if (!txCount.length || (txCount[0].values[0][0] as number) === 0) {
    const insertTx = db.prepare(
      "INSERT INTO ledger_transactions (txn_id, account_no, amount, currency, posted_at, status) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const sampleTransactions = [
      ["TX001", "ACC100", 150.25, "USD", "2026-05-01T10:30:00Z", "completed"],
      ["TX002", "ACC200", 3200.0, "EUR", "2026-05-02T14:15:00Z", "pending"],
      ["TX003", "ACC100", -45.0, "USD", "2026-05-03T08:00:00Z", "completed"],
      ["TX004", "ACC300", 890.5, "USD", "2026-05-04T16:45:00Z", "completed"],
      ["TX005", "ACC200", -200.0, "EUR", "2026-05-05T11:20:00Z", "failed"],
    ];
    for (const row of sampleTransactions) {
      insertTx.run(row);
    }
    insertTx.free();

    const insertAcc = db.prepare(
      "INSERT INTO core_accounts (account_no, holder_name, product_code, open_date, balance) VALUES (?, ?, ?, ?, ?)"
    );
    const sampleAccounts = [
      ["ACC100", "Alice Johnson", "CHK", "2020-03-15", 4520.75],
      ["ACC200", "Bob Smith", "SAV", "2019-11-01", 12850.0],
      ["ACC300", "Carol Davis", "CHK", "2021-06-20", 3200.0],
    ];
    for (const row of sampleAccounts) {
      insertAcc.run(row);
    }
    insertAcc.free();
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  return db;
}

export async function query(sql: string, params: any[] = []): Promise<any[]> {
  const database = await getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export async function logRequest(entry: {
  level: string;
  connector: string;
  resource: string;
  latency_ms: number;
  cache: string;
  status: number;
  message: string;
  payload_size?: number;
}) {
  const database = await getDb();
  database.run(
    `INSERT INTO audit_log (timestamp, level, connector, resource, latency_ms, cache, status, message, payload_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      new Date().toISOString(),
      entry.level,
      entry.connector,
      entry.resource,
      entry.latency_ms,
      entry.cache,
      entry.status,
      entry.message,
      entry.payload_size ?? 0,
    ]
  );
  const data = database.export();
  fs.writeFileSync(path.join(process.cwd(), "data", "banking.db"), Buffer.from(data));
}