interface Props {
  label: string;
  value: string | number;
  suffix?: string;
  colorClass?: string;
  subLabel?: string;
}

export default function ReportMetricCard({
  label,
  value,
  suffix,
  colorClass = "text-text",
  subLabel,
}: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center print:border-gray-200 print:rounded-lg">
      <p className="text-xs font-medium text-text-muted mb-2 print:text-gray-500">{label}</p>
      <p className={`text-3xl font-bold leading-none ${colorClass} print:text-black`}>
        {value}
        {suffix && <span className="text-base font-semibold ml-0.5">{suffix}</span>}
      </p>
      {subLabel && (
        <p className="text-xs text-text-muted mt-1.5 print:text-gray-400">{subLabel}</p>
      )}
    </div>
  );
}
