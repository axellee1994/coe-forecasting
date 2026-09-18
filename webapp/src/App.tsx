import { useEffect, useState } from "react";

import { BacktestTable } from "@/components/BacktestTable";
import { ForecastCard } from "@/components/ForecastCard";
import { PremiumChart } from "@/components/PremiumChart";
import { CATEGORIES, MODEL, loadRounds, type CoeData } from "@/lib/coe";
import { roundLabel } from "@/lib/format";

/* Single-page dashboard, V9 layout language: mono metadata lines,
   1px ink dividers between sections, generous whitespace. The page
   renders immediately from the snapshot-typed state and swaps to live
   data when the fetch resolves — no spinner-first experience. */
export default function App() {
  const [data, setData] = useState<CoeData | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadRounds().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Live data can be ahead of the offline-computed forecast for a few hours
  // after a bidding round — say so instead of presenting a stale forecast.
  const latestLive = data?.rounds.at(-1)?.date ?? null;
  const modelBuiltOn = MODEL.categories["Category A"].latest_round;
  const forecastStale = latestLive !== null && latestLive > modelBuiltOn;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-5 py-10 md:py-14">
      {/* header */}
      <header className="animate-content-in flex flex-col gap-2">
        <p className="text-meta">Singapore · Certificate of Entitlement</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">COE Price Forecast</h1>
        <p className="max-w-prose text-muted-foreground">
          One-bidding-round-ahead forecasts for all five COE categories — cars, goods
          vehicles, motorcycles and the open category — each from its own SARIMA model
          with an honestly backtested error rate.
        </p>
        <p className="text-meta">
          model refreshed {new Date(MODEL.generated).toLocaleDateString("en-SG")} · data:{" "}
          {data === null ? "loading…" : data.source === "live" ? "live from data.gov.sg" : "cached snapshot"}
          {forecastStale && (
            <span className="text-highlight">
              {" "}· a newer bidding round is published — forecast refresh pending
            </span>
          )}
        </p>
      </header>

      <div className="border-t border-ink" />

      {/* forecast headlines */}
      <section className="animate-content-in grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <ForecastCard key={category} category={category} artifacts={MODEL.categories[category]} />
        ))}
        <p className="text-meta sm:col-span-2 lg:col-span-3">
          forecasting the round after {roundLabel(MODEL.categories["Category A"].latest_round)} ·{" "}
          {MODEL.final_model}
        </p>
      </section>

      <div className="border-t border-ink" />

      {/* history chart */}
      <section className="animate-content-in">
        {data === null ? (
          <div className="h-[340px]" aria-hidden />
        ) : (
          <PremiumChart rounds={data.rounds} />
        )}
      </section>

      <div className="border-t border-ink" />

      {/* honesty section */}
      <section className="animate-content-in">
        <BacktestTable />
      </section>

      <footer className="text-meta border-t border-ink pt-4">
        data: LTA via data.gov.sg · model: seasonal-free ARIMA on log premiums with drift,
        refit after every bidding round · not financial advice
      </footer>
    </main>
  );
}
