import { readCSV } from "@/lib/adapters/flat-file-adapter";

export const LogisticsConnector = {
  id: "logistics",
  adapterType: "flat-file",
  schemaVersion: "1.0.0",

  async fetch(resource: string, params: Record<string, string>) {
    const limit = Number(params.limit ?? 100);
    const offset = Number(params.offset ?? 0);

    switch (resource) {
      case "shipments":
        return await readCSV("shipments.csv", limit, offset);
      default:
        throw new Error(`Unknown Logistics resource: ${resource}`);
    }
  },

  normalise(raw: any) {
    return {
      shipmentId: raw.shipment_id,
      trackingNumber: raw.tracking_num,
      originSCAC: raw.scac_code?.trim(),
      status: raw.status,
      estimatedDelivery: raw.eta,
    };
  },
};