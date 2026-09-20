import { TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CATEGORY_LABEL, type Category, type CategoryArtifacts } from "@/lib/coe";
import { roundLabel, sgd } from "@/lib/format";
import { CATEGORY_COLOR } from "@/lib/palette";

/* One category's headline: next-round forecast, 95% interval, and the
   move vs. the latest actual premium. The number is the hero — the
   uncertainty is stated right beside it, never hidden. */
export function ForecastCard({
  category,
  artifacts,
}: {
  category: Category;
  artifacts: CategoryArtifacts;
}) {
  const { forecast, low, high } = artifacts.next_round;
  const delta = forecast - artifacts.latest_premium;
  const rising = delta >= 0;
  const DeltaIcon = rising ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="gap-0.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: CATEGORY_COLOR[category] }}
          />
          <CardTitle>{category}</CardTitle>
          <span className="text-meta ml-auto">next round</span>
        </div>
        <CardDescription className="text-xs">
          {CATEGORY_LABEL[category].map((line) => {
            const sep = line.indexOf(": ") !== -1 ? ": " : line.indexOf(" — ") !== -1 ? " — " : null;
            if (!sep) return <span key={line} className="block">{line}</span>;
            const [prefix, ...rest] = line.split(sep);
            return (
              <span key={line} className="block">
                <span className="font-medium text-foreground">{prefix}</span>: {rest.join(sep)}
              </span>
            );
          })}
        </CardDescription>
      </CardHeader>
      {/* mt-auto anchors the numbers to the card bottom, so they stay on one
          line across the row even when the criteria text above differs in height */}
      <CardContent className="mt-auto flex flex-col gap-1.5">
        <div className="text-2xl font-bold tracking-tight sm:text-[1.35rem] md:text-3xl xl:text-[1.7rem] 2xl:text-3xl">
          {sgd(forecast)}
        </div>
        <div className="text-xs text-muted-foreground sm:text-sm">
          95% interval {sgd(low)} – {sgd(high)}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          <DeltaIcon aria-hidden className="size-4 text-muted-foreground" />
          <span>
            {rising ? "+" : "−"}
            {sgd(Math.abs(delta)).slice(2)} vs. {sgd(artifacts.latest_premium)}
          </span>
          <span className="text-muted-foreground">
            ({roundLabel(artifacts.latest_round)})
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
