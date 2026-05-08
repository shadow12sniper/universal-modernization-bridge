import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export async function readCSV(
  filename: string,
  limit: number = 100,
  offset: number = 0
): Promise<Record<string, string>[]> {
  const baseDir = path.join(process.cwd(), "data");
  const filePath = path.join(baseDir, filename);

  if (!filePath.startsWith(baseDir)) {
    throw new Error("Invalid file path");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filename}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  // Fix: relax column consistency check – skip malformed rows
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,          // ← this is the key fix
    on_record: (record: any) => {
      // Skip rows that have merged data (too many fields)
      if (Object.keys(record).length > 5) return null;
      return record;
    },
  });

  return records.slice(offset, offset + limit);
}