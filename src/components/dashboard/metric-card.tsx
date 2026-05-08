type MetricCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaType?: "up" | "down";
  accent?: "cyan" | "green" | "amber" | "purple" | "red";
};

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaType,
  accent = "cyan",
}: MetricCardProps) {
  return (
    <div className={`bridge-metric-card bridge-metric-card--${accent}`}>
      <div className="bridge-metric-card__label">{label}</div>
      <div className="bridge-metric-card__value">
        {value}
        {unit && <span className="bridge-metric-card__unit">{unit}</span>}
      </div>
      {delta && (
        <div
          className={`bridge-metric-card__delta${
            deltaType ? ` bridge-metric-card__delta--${deltaType}` : ""
          }`}
        >
          {delta}
        </div>
      )}
    </div>
  );
}