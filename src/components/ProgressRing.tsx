interface Props { value: number; target: number; color: string; }
export function ProgressRing({ value, target, color }: Props) {
  const percent = target > 0 ? Math.min(100, Math.round(value / target * 100)) : 0;
  return <div className="progress-ring" style={{background:`conic-gradient(${color} ${percent}%, #eceee8 0)`}}><span>{percent}%</span></div>;
}

