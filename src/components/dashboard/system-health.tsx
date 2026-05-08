import { SystemHealthData } from "@/lib/types";

export function SystemHealth({ data }: { data: SystemHealthData }) {
  const healthRows = [
    { label: "CPU Load", value: data.translationEngineCpu, barColor: "var(--cyan)", suffix: "%" },
    { label: "System Memory", value: data.memoryUsage, barColor: "var(--green)", suffix: `% (${data.systemMemoryUsedMB}/${data.systemMemoryTotalMB} MB)` },
    { label: "Node Process RSS", value: Math.round((data.processMemoryMB / (data.systemMemoryTotalMB || 1)) * 100), barColor: "var(--amber)", suffix: `${data.processMemoryMB} MB` },
    { label: "LRU Cache (est.)", value: data.lruCacheUsage, barColor: "var(--green)", suffix: "% used" },
    { label: "WebSocket Pool", value: data.websocketPoolUsage, barColor: "var(--green)", suffix: "% cap" },
  ];

  return (
    <div className="bridge-health-panel">
      <div className="bridge-health-panel__title">System Health (Live)</div>
      {healthRows.map((row) => (
        <div
          key={row.label}
          className="bridge-health-row"
          style={{ "--bar-color": row.barColor } as React.CSSProperties}
        >
          <span className="bridge-health-row__label">{row.label}</span>
          <div className="bridge-health-bar-track">
            <div
              className="bridge-health-bar-fill"
              style={{ width: `${Math.min(row.value, 100)}%`, background: row.barColor }}
            />
          </div>
          <span className="bridge-health-row__value">
            {row.value}{row.suffix}
          </span>
        </div>
      ))}
    </div>
  );
}