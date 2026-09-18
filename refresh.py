"""Refresh the model artifacts after a new COE bidding round.

Run by CI on a schedule (see .github/workflows/refresh.yml) or by hand:

    python refresh.py            # refit only if a new round was published
    python refresh.py --force    # refit regardless (for testing)

If the latest published round matches what the current artifacts were built
on, nothing is written and the deploy stays as-is. Otherwise the final model
spec — ARIMA on log(premium) with drift, orders fixed per category — is refit
on all data, the honest backtest (one round ahead, expanding window, refit
each round) is recomputed, and these files are rewritten:

    webapp/src/data/model_artifacts.json   forecasts + MAPEs the app displays
    webapp/src/data/snapshot.json          the app's offline data fallback
    dataset/coe_bidding_raw.csv            the notebook's cached raw data

The model spec itself is NOT re-searched here: the orders come from the AIC
grid in coe_forecast.ipynb (train data only) and changing them is a modelling
decision that belongs in the notebook, not in a cron job.
"""

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from statsmodels.tsa.statespace.sarimax import SARIMAX

ROOT = Path(__file__).parent
API_URL = "https://data.gov.sg/api/action/datastore_search"
DATASET_ID = "d_69b3380ad7e51aff3a7dcc84eba52b8a"

CATEGORIES = ["Category A", "Category B", "Category C", "Category D", "Category E"]

# From the AIC grid search in coe_forecast.ipynb (Step 4) — the locked spec
ORDER = {
    "Category A": (3, 1, 3),
    "Category B": (2, 1, 3),
    "Category C": (1, 1, 3),
    "Category D": (0, 1, 3),
    "Category E": (2, 1, 3),
}
HOLDOUT = 24

ARTIFACTS_JSON = ROOT / "webapp" / "src" / "data" / "model_artifacts.json"
SNAPSHOT_JSON = ROOT / "webapp" / "src" / "data" / "snapshot.json"
RAW_CSV = ROOT / "dataset" / "coe_bidding_raw.csv"


def fetch_all():
    """Every record in the dataset, paged 1000 at a time."""
    records = []
    offset = 0
    while True:
        response = requests.get(
            API_URL,
            params={"resource_id": DATASET_ID, "limit": 1000, "offset": offset},
            timeout=30,
        )
        response.raise_for_status()
        result = response.json()["result"]
        records.extend(result["records"])
        if len(records) >= result["total"]:
            return pd.DataFrame(records)
        offset += 1000


def prepare(raw):
    """Numeric premium (comma-stripped), a real date per round, sorted."""
    coe = raw.copy()
    coe["premium"] = pd.to_numeric(
        coe["premium"].astype(str).str.replace(",", ""), errors="coerce"
    )
    day = np.where(coe["bidding_no"].astype(str) == "1", "01", "15")
    coe["round_date"] = pd.to_datetime(coe["month"] + "-" + day)
    return coe.sort_values("round_date")


def backtest_mape(premiums):
    """Honest one-round-ahead MAPE over the last HOLDOUT rounds: (model, naive)."""
    y = premiums.to_numpy(float)
    start = len(y) - HOLDOUT
    model_errors = []
    naive_errors = []
    for i in range(start, len(y)):
        fitted = fit_final(y[:i], premiums.name)
        forecast = float(np.exp(fitted.forecast(1)[0]))
        model_errors.append(abs(forecast - y[i]) / y[i])
        naive_errors.append(abs(y[i - 1] - y[i]) / y[i])
    return (
        round(float(np.mean(model_errors)) * 100, 2),
        round(float(np.mean(naive_errors)) * 100, 2),
    )


def fit_final(values, category):
    """The final spec: ARIMA on log(premium) with drift, fixed order."""
    model = SARIMAX(
        np.log(values),
        order=ORDER[category],
        trend="c",
        enforce_stationarity=False,
        enforce_invertibility=False,
    )
    return model.fit(disp=False)


def next_round_forecast(premiums, category):
    """Fit on everything; forecast the next round with a 95% interval."""
    fitted = fit_final(premiums.to_numpy(float), category)
    prediction = fitted.get_forecast(1)
    mean = float(np.exp(prediction.predicted_mean[0]))
    low, high = np.exp(prediction.conf_int(alpha=0.05)[0])
    return {"forecast": round(mean), "low": round(float(low)), "high": round(float(high))}


def main():
    force = "--force" in sys.argv

    raw = fetch_all()
    coe = prepare(raw)
    latest_round = coe["round_date"].max().date().isoformat()

    current = json.loads(ARTIFACTS_JSON.read_text())
    built_on = max(c["latest_round"] for c in current["categories"].values())
    if latest_round == built_on and not force:
        print(f"no new round (latest is {latest_round}) — nothing to do")
        return

    print(f"new round {latest_round} (artifacts built on {built_on}) — refitting")

    artifacts = {
        "generated": pd.Timestamp.now().isoformat(timespec="seconds"),
        "final_model": current["final_model"],
        "holdout_rounds": HOLDOUT,
        "categories": {},
    }
    for category in CATEGORIES:
        premiums = coe.loc[coe["vehicle_class"] == category, "premium"]
        premiums.name = category
        model_mape, naive_mape = backtest_mape(premiums)
        artifacts["categories"][category] = {
            "order": list(ORDER[category]),
            "backtest_mape": model_mape,
            "naive_mape": naive_mape,
            "latest_round": latest_round,
            "latest_premium": int(premiums.iloc[-1]),
            "next_round": next_round_forecast(premiums, category),
        }
        print(f"  {category}: MAPE {model_mape}% (naive {naive_mape}%), "
              f"next {artifacts['categories'][category]['next_round']['forecast']:,}")

    ARTIFACTS_JSON.write_text(json.dumps(artifacts, indent=2) + "\n")

    snapshot = [
        {"date": row["round_date"].date().isoformat(),
         "category": row["vehicle_class"],
         "premium": int(row["premium"])}
        for _, row in coe.iterrows()
    ]
    snapshot.sort(key=lambda r: (r["date"], r["category"]))
    SNAPSHOT_JSON.write_text(json.dumps(snapshot, separators=(",", ":")) + "\n")

    raw.to_csv(RAW_CSV, index=False)
    print(f"wrote {ARTIFACTS_JSON.name}, {SNAPSHOT_JSON.name}, {RAW_CSV.name}")


if __name__ == "__main__":
    main()
