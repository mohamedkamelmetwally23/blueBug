import type { LucideIcon } from "lucide-react";
import { ProgressRing } from "./ProgressRing.js";
interface Props { label: string; value: number; target: number; icon: LucideIcon; tone: "green" | "orange" | "violet"; onClick: () => void; showTarget?: boolean; subtitle?: string; }
export function MetricCard({ label, value, target, icon: Icon, tone, onClick, showTarget = true, subtitle }: Props) {
  const gap = Math.max(0, target - value);
  const colors = { green: "#087bc1", orange: "#19a5dc", violet: "#1556a6" };
  return <button className="metric-card" onClick={onClick}><div className={`metric-icon ${tone}`}><Icon size={20}/></div><div className="metric-copy"><span>{label}</span><strong>{value}{showTarget && <small> / {target}</small>}</strong><p>{subtitle ?? (gap === 0 ? "Target reached" : `${gap} remaining`)}</p></div>{showTarget && <ProgressRing value={value} target={target} color={colors[tone]} />}</button>;
}
