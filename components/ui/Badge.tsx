const TONES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600",
  slateDark: "bg-slate-200 text-slate-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  brand: "bg-brand-50 text-brand-700",
  gold: "bg-gold/10 text-gold",
};

export default function Badge({
  tone = "slate",
  className = "",
  children,
}: {
  tone?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={`badge ${TONES[tone] ?? TONES.slate} ${className}`}>{children}</span>;
}