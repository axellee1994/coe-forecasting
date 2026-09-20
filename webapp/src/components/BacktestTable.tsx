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
      <h2 className="font-medium">How accurate is this forecasting?</h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        Backtested is done over the most recent {MODEL.holdout_rounds} bidding rounds. The model trains on all data up to a given round, forecasts the next one, 
        then steps forward and repeats. Each prediction is made without seeing 
        its answer, then compared to the actual dataset.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink text-left">
              <th className="sticky left-0 bg-background py-2 pr-4 font-medium">Mean error (MAPE)</th>
              {CATEGORIES.map((category) => (
                <th key={category} className="whitespace-nowrap py-2 px-3 font-medium">
                  {category}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            <tr className="border-b">
              <td className="sticky left-0 bg-background py-2 pr-4 font-sans">This model</td>
              {CATEGORIES.map((category) => (
                <td key={category} className="py-2 px-3">
                  {MODEL.categories[category].backtest_mape.toFixed(2)}%
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="sticky left-0 bg-background py-2 pr-4 font-sans text-muted-foreground">Last price guess</td>
              {CATEGORIES.map((category) => (
                <td key={category} className="py-2 px-3 text-muted-foreground">
                  {MODEL.categories[category].naive_mape.toFixed(2)}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">
        In Cat {short(beats)}, the model's predictions were slightly more accurate
        than the last price guess.
        {loses.length > 0 && (
          <>
            {" "}However in Cat {short(loses)}, the last price guess was actually slightly
            more accurate.
          </>
        )}
        {" "}COE prices tend to fluctuate randomly, so no model predicts them dramatically
        well. The differences either way are small (fractions of a percent). 
      </p>
    </div>
  );
}
