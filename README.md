# COE Price Forecast

**Live site: [coe-forecasting.vercel.app](https://coe-forecasting.vercel.app)**

One-bidding-round-ahead forecasts for Singapore's Certificate of Entitlement (COE)
premiums — all five categories, each from its own SARIMA model, with an **honestly
backtested error rate** shown next to the naive baseline it has to beat.

Existing COE sites tell you what premiums *were*. This one predicts the next bidding
round and is upfront about exactly how accurate that prediction has been.

## The honest numbers

Backtested by forecasting the most recent 24 bidding rounds one round ahead —
expanding window, refit every round, each forecast made without seeing its answer.
The naive baseline is "next premium = last premium", which is embarrassingly hard
to beat for a near-random-walk auction series.

| MAPE (as of Sep 2026) | Cat A | Cat B | Cat C | Cat D | Cat E |
|---|---|---|---|---|---|
| This model | **3.65%** | **4.54%** | **1.86%** | 4.63% | 2.71% |
| Naive baseline | 3.83% | 4.64% | 1.94% | 4.52% | 2.69% |

The model beats naive in A, B and C, and loses narrowly in D and E — reported
rather than hidden. The dashboard recomputes this table on every model refresh,
so the site can never show stale claims.

**Kept honest by construction:**

- Model orders were chosen by AIC on training data only; the holdout never
  influenced any modelling decision, including which variant ships.
- One a-priori spec for all categories — ARIMA on log(premium) with drift.
  Cherry-picking a different variant per category off the holdout would quietly
  turn the test set into training data.
- `bids_received` was rejected as a feature despite correlating with price moves:
  it isn't knowable when a real forecast has to be made, so using it would be
  leakage. `quota` (published in advance) was tested honestly and didn't help.

## How it works

```
LTA via data.gov.sg ──► refresh.py (daily cron, GitHub Actions)
                           │  new bidding round? refit + re-backtest
                           │  no new round? exit, nothing changes
                           ▼
                        model_artifacts.json + snapshot.json  (committed)
                           │
                           ▼
                        static React app (Vercel auto-redeploys on commit)
                           │  history chart: live browser fetch from data.gov.sg,
                           │  bundled snapshot as offline fallback
                           ▼
                        visitor
```

There is **no backend**. The statistics run offline in Python (statsmodels); the
site ships the results as static JSON and fetches live premium history directly
from data.gov.sg in the browser (the API is CORS-open). If live data is ahead of
the last model refresh, the page says "forecast refresh pending" instead of
presenting a stale forecast as current.

## Repository layout

| Path | What it is |
|---|---|
| `coe_forecast.ipynb` | The full modelling story: data checks, order selection, honest backtest, every claim shown with its evidence |
| `refresh.py` | CI refresh: refits the locked spec when a new round is published; reproduces the notebook's numbers exactly |
| `webapp/` | Static dashboard — Vite + React 19 + TypeScript + Tailwind v4 |
| `dataset/` | Cached raw data + backtest results |
| `.github/workflows/refresh.yml` | Daily 18:30 SGT cron (results publish ~16:00 SGT on bidding Wednesdays) |

## Running locally

```bash
# dashboard
cd webapp
npm install
npm run dev            # http://localhost:5173

# model refresh (needs pandas, numpy, statsmodels, requests)
pip install -r requirements.txt
python refresh.py            # refits only if a new round was published
python refresh.py --force    # refit regardless
```

## Data

[COE bidding results](https://data.gov.sg/datasets/d_69b3380ad7e51aff3a7dcc84eba52b8a/view)
(LTA via data.gov.sg) — monthly since 2010, one row per category per bidding
exercise: premium, quota, bids received.

Not financial advice.
