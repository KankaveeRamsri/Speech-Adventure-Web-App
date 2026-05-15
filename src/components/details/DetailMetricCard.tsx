interface Props {
  label: string;
  value: string | number;
  valueColor?: string;
  subtext?: string;
}

export default function DetailMetricCard({ label, value, valueColor, subtext }: Props) {
  return (
    <div className="bg-bg dark:bg-white/5 border border-border rounded-xl p-4 text-center">
      <p className="text-xs font-medium text-text-muted mb-1">{label}</p>
      <p
        className="text-xl font-bold leading-none"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
    </div>
  );
}
