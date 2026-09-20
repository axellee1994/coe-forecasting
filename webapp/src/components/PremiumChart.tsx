import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CATEGORIES, type Round } from "@/lib/coe";
import { roundLabel, sgd, shortDate } from "@/lib/format";
import { CATEGORY_COLOR } from "@/lib/palette";
import { cn } from "@/lib/utils";

/* Premium history, both categories on one time axis (same unit, one
   y-axis). Range buttons slice client-side — recent rounds are what
   most visitors care about, but the full 2010 story stays one click away. */

const RANGES = [
  { label: "1y", rounds: 24 },
  { label: "5y", rounds: 120 },
  { label: "All", rounds: Infinity },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

interface ChartPoint {
  date: string;
  [category: string]: string | number;
}

/** Long rows -> one point per round date with a value column per category. */
function toChartPoints(rounds: Round[]): ChartPoint[] {
  const byDate = new Map<string, ChartPoint>();
  for (const round of rounds) {
    const point = byDate.get(round.date) ?? { date: round.date };
    point[round.category] = round.premium;
    byDate.set(round.date, point);
  }
  return [...byDate.values()];
}

export function PremiumChart({ rounds }: { rounds: Round[] }) {
  const [range, setRange] = useState<RangeLabel>("5y");

  const points = useMemo(() => {
    const all = toChartPoints(rounds);
    const keep = RANGES.find((r) => r.label === range)?.rounds ?? Infinity;
    return keep === Infinity ? all : all.slice(-keep);
  }, [rounds, range]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Premium history</h2>
        <div className="flex gap-1" role="group" aria-label="Chart time range">
          {RANGES.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setRange(label)}
              aria-pressed={range === label}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-xs transition-colors duration-150",
                range === label
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] sm:h-[360px] md:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              minTickGap={64}
            />
            <YAxis
              tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={(value) => sgd(Number(value))}
              labelFormatter={(value) => roundLabel(String(value))}
              contentStyle={{
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                fontSize: "0.8rem",
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "var(--foreground)", fontSize: "0.8rem" }}>{value}</span>
              )}
            />
            {CATEGORIES.map((category) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={CATEGORY_COLOR[category]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
