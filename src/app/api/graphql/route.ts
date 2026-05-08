import { createYoga, createSchema } from "graphql-yoga";
import { NextRequest, NextResponse } from "next/server";

async function buildSchema() {
  const connectors = await Promise.all([
    import("@/connectors/banking").then((m) => m.BankingConnector),
    import("@/connectors/logistics").then((m) => m.LogisticsConnector),
    import("@/connectors/healthcare").then((m) => m.HealthcareConnector),
  ]);

  const typeDefs = `
    type BridgeRecord {
      id: ID!
      source: String!
      connector: String!
      schema_version: String!
      timestamp: String!
      payload: JSON
      meta: Meta
    }

    type Meta {
      latency_ms: Int
      adapter: String
      cache_hit: Boolean
    }

    scalar JSON

    type Query {
      banking(resource: String!, limit: Int = 10): [BridgeRecord]
      logistics(resource: String!, limit: Int = 10): [BridgeRecord]
      healthcare(resource: String!, limit: Int = 10): [BridgeRecord]
      connectorList: [String!]!
    }
  `;

  const resolvers = {
    Query: {
      banking: async (_: any, args: { resource: string; limit: number }) => {
        const connector = connectors[0];
        const rows = await connector.fetch(args.resource, { limit: String(args.limit) });
        return rows.map((row, i) => ({
          id: `banking-${args.resource}-${Date.now()}-${i}`,
          source: "banking",
          connector: "banking",
          schema_version: connector.schemaVersion,
          timestamp: new Date().toISOString(),
          payload: connector.normalise(row),
          meta: {
            latency_ms: 0,
            adapter: connector.adapterType,
            cache_hit: false,
          },
        }));
      },
      logistics: async (_: any, args: { resource: string; limit: number }) => {
        const connector = connectors[1];
        const rows = await connector.fetch(args.resource, { limit: String(args.limit) });
        return rows.map((row, i) => ({
          id: `logistics-${args.resource}-${Date.now()}-${i}`,
          source: "logistics",
          connector: "logistics",
          schema_version: connector.schemaVersion,
          timestamp: new Date().toISOString(),
          payload: connector.normalise(row),
          meta: {
            latency_ms: 0,
            adapter: connector.adapterType,
            cache_hit: false,
          },
        }));
      },
      healthcare: async (_: any, args: { resource: string; limit: number }) => {
        const connector = connectors[2];
        const rows = await connector.fetch(args.resource, { limit: String(args.limit) });
        return rows.map((row, i) => ({
          id: `healthcare-${args.resource}-${Date.now()}-${i}`,
          source: "healthcare",
          connector: "healthcare",
          schema_version: connector.schemaVersion,
          timestamp: new Date().toISOString(),
          payload: connector.normalise(row),
          meta: {
            latency_ms: 0,
            adapter: connector.adapterType,
            cache_hit: false,
          },
        }));
      },
      connectorList: () => connectors.map((c) => c.id),
    },
  };

  return createSchema({ typeDefs, resolvers });
}

const yoga = createYoga({
  schema: buildSchema(),
  graphiql: process.env.NODE_ENV !== "production",
  maskedErrors: false,
});

export async function GET(req: NextRequest) {
  return yoga.fetch(req);
}

export async function POST(req: NextRequest) {
  return yoga.fetch(req);
}