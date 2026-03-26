export function busynessColor(pct: number): string {
  if (pct < 33) return "#22c55e";
  if (pct < 66) return "#f59e0b";
  return "#ef4444";
}

export function busynessLabel(pct: number): string {
  if (pct < 20) return "Very quiet right now";
  if (pct < 40) return "Not too busy";
  if (pct < 60) return "A little busy";
  if (pct < 80) return "Usually busy";
  return "Very busy right now";
}
