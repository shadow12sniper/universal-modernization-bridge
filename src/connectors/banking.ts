import { query } from "@/lib/adapters/sql-adapter";

export const BankingConnector = {
  id: "banking",
  adapterType: "sql",
  schemaVersion: "1.0.0",

  async fetch(resource: string, params: Record<string, string>) {
    const limit = Number(params.limit ?? 100);
    const offset = Number(params.offset ?? 0);

    switch (resource) {
      case "transactions":
        // Read-only: parameterised query to prevent SQL injection
        return await query(
          `SELECT txn_id, account_no, amount, currency, posted_at, status
           FROM ledger_transactions
           ORDER BY posted_at DESC
           LIMIT ? OFFSET ?`,
          [limit, offset]
        );
      case "accounts":
        return await query(
          `SELECT account_no, holder_name, product_code, open_date, balance
           FROM core_accounts
           ORDER BY account_no
           LIMIT ? OFFSET ?`,
          [limit, offset]
        );
      default:
        throw new Error(`Unknown Banking resource: ${resource}`);
    }
  },

  normalise(raw: any) {
    return {
      transactionId: raw.txn_id,
      accountNumber: raw.account_no,
      amount: Number(raw.amount),
      currency: raw.currency?.trim() ?? "USD",
      postedAt: raw.posted_at,
      status: raw.status?.toLowerCase(),
    };
  },
};