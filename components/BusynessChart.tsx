"use client";

type Props = {
  hourly: number[];
  currentHour: number;
};

function hourLabel(h: number): string {
  const ampm = h >= 12 ? "p" : "a";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${ampm}`;
}

export function BusynessChart({ hourly, currentHour }: Props) {
  const max = Math.max(1, ...hourly);
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex min-w-[520px] items-end gap-0.5 pt-2">
        {hourly.map((v, clockHour) => {
          const hPct = Math.round((v / max) * 100);
          const isNow = clockHour === currentHour;
          return (
            <div
              key={clockHour}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="relative w-full rounded-sm bg-black/5"
                style={{ height: 72 }}
                title={`${hourLabel(clockHour)}: ${Math.round(v)}%`}
              >
                <div
                  className={`absolute bottom-0 left-0 right-0 rounded-sm transition-colors ${
                    isNow ? "bg-amber-500" : "bg-emerald-600/70"
                  }`}
                  style={{ height: `${hPct}%`, minHeight: v > 0 ? 4 : 0 }}
                />
              </div>
              <span
                className={`text-[10px] leading-none ${
                  isNow ? "font-semibold text-amber-700" : "text-black/45"
                }`}
              >
                {hourLabel(clockHour)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
