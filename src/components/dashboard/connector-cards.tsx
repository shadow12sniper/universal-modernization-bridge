import Link from "next/link";

const modules = [
  {
    id: "banking",
    name: "Banking",
    desc: "Core banking & payment system integration",
    protocols: ["SWIFT", "FIX", "ISO20022"],
    tier: "ENTERPRISE",
  },
  {
    id: "logistics",
    name: "Logistics",
    desc: "Supply chain & shipment data layer",
    protocols: ["EDI", "SCAC", "GS1"],
    tier: "ENTERPRISE",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    desc: "Clinical & administrative records bridge",
    protocols: ["HL7", "FHIR", "DICOM"],
    tier: "ENTERPRISE",
    degraded: true,
  },
  {
    id: "custom",
    name: "Custom SDK",
    desc: "Build & sign your own connector module",
    protocols: ["Plugin API", "White-label"],
    tier: "OEM",
    dashed: true,
  },
];

export function ConnectorCards() {
  return (
    <div className="bridge-connector-grid">
      {modules.map((mod) => (
        <Link
          key={mod.id}
          href={`/dashboard/connectors/${mod.id}`}
          className="bridge-connector-card"
          style={{
            ...(mod.dashed ? { borderStyle: "dashed", opacity: 0.6 } : {}),
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <div className="bridge-connector-card__tier">{mod.tier}</div>
          <div className="bridge-connector-card__name">{mod.name}</div>
          <div className="bridge-connector-card__desc">{mod.desc}</div>
          <div className="bridge-connector-card__protocols">
            {mod.protocols.map((p) => (
              <span key={p} className="bridge-protocol-chip">
                {p}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
