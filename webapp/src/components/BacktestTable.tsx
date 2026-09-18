import { CATEGORIES, MODEL } from "@/lib/coe";

/* The honesty section: the backtested MAPE next to the naive baseline
   it has to beat. The beats/loses sentence is computed from the data,
   so a model refresh can never leave stale claims on the page. */
export function BacktestTable() {
  const beats = CATEGORIES.filter(
    (c) => MODEL.categories[c].backtest_mape < MODEL.categories[c].naive_mape
  );
  const loses = CATEGORIES.filter((c) => !beats.includes(c));
  const short = (list: typeof CATEGORIES) =>
    list.map((c) => c.replace("Category ", "")).join(", ");

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-medium">How accurate is it, honestly?</h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        Backtested by forecasting the most recent {MODEL.holdout_rounds} bidding rounds
        one round ahead, each made without seeing its answer, then compared to what
        actually happened. The naive baseline — “next premium = last premium” — is the
        bar any real model must clear.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink text-left">
              <th className="py-2 pr-4 font-medium">Mean error (MAPE)</th>
              {CATEGORIES.map((category) => (
                <th key={category} className="py-2 pr-4 font-medium">
                  {category}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            <tr className="border-b">
              <td className="py-2 pr-4 font-sans">This model</td>
              {CATEGORIES.map((category) => (
                <td key={category} className="py-2 pr-4">
                  {MODEL.categories[category].backtest_mape.toFixed(2)}%
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4 font-sans text-muted-foreground">Naive baseline</td>
              {CATEGORIES.map((category) => (
                <td key={category} className="py-2 pr-4 text-muted-foreground">
                  {MODEL.categories[category].naive_mape.toFixed(2)}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        The model beats naive in {beats.length === CATEGORIES.length ? "every category" : `Cat ${short(beats)}`}
        {loses.length > 0 && (
          <>
            {" "}and loses narrowly in Cat {short(loses)} — shown here rather than hidden
          </>
        )}
        . The margins are modest — COE premiums are close to a random walk, and anyone
        claiming dramatically better one-round accuracy should be asked how they
        backtested. Forecasts lag sharp turns by about one round; treat the interval,
        not the point, as the promise.
      </p>
    </div>
  );
}
