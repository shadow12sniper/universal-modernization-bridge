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

  // Security: ensure file is inside data/ directory
  if (!filePath.startsWith(baseDir)) {
    throw new Error("Invalid file path");
  }

  // If the file doesn't exist, create it with just the header
  if (!fs.existsSync(filePath)) {
    const header =
      filename === "shipments.csv"
        ? "shipment_id,tracking_num,scac_code,status,eta\n"
        : "";
    fs.writeFileSync(filePath, header, "utf-8");
  }

  const content = fs.readFileSync(filePath, "utf-8");

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    on_record: (record: any) => {
      // Skip rows with more than 5 fields (merged lines)
      if (Object.keys(record).length > 5) return null;
      return record;
    },
  });

  return records.slice(offset, offset + limit);
}