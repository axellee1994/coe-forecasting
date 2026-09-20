/* Data layer — the ONE place that knows where COE data comes from.
   Components depend on `loadRounds()` and the types, never on the API
   or the snapshot directly (dependency inversion, kept lightweight).

   Live source: data.gov.sg (CORS-open), fetched in the browser.
   Fallback: the bundled snapshot, so the dashboard still renders fully
   if the API is slow or down while someone is viewing it. */

import snapshot from "@/data/snapshot.json";
import artifacts from "@/data/model_artifacts.json";

export type Category =
  | "Category A"
  | "Category B"
  | "Category C"
  | "Category D"
  | "Category E";

export const CATEGORIES: Category[] = [
  "Category A",
  "Category B",
  "Category C",
  "Category D",
  "Category E",
];

/** Classification criteria shown under each category name (one bullet per line). */
export const CATEGORY_LABEL: Record<Category, string[]> = {
  "Category A": [
    "Non-electric: up to 1,600cc and max output up to 97kW (≈130bhp)",
    "Fully electric: max output up to 110kW (≈147bhp)",
  ],
  "Category B": [
    "Non-electric: above 1,600cc or max output above 97kW (130bhp)",
    "Fully electric: max output above 110kW (147bhp)",
  ],
  "Category C": [
    "Goods vehicles & buses — trucks, prime movers, vans, buses",
  ],
  "Category D": [
    "Motorcycles — all two-wheeled vehicles",
  ],
  "Category E": [
    "Open — any vehicle type except motorcycles",
  ],
};

export interface Round {
  date: string; // ISO: 1st exercise -> day 01, 2nd -> day 15
  category: Category;
  premium: number;
}

export interface CoeData {
  rounds: Round[];
  source: "live" | "snapshot";
}

const API_URL = "https://data.gov.sg/api/action/datastore_search";
const DATASET_ID = "d_69b3380ad7e51aff3a7dcc84eba52b8a";
const PAGE_SIZE = 1000;

interface ApiRecord {
  month: string;
  bidding_no: string;
  vehicle_class: string;
  premium: string;
}

/** One API record -> a Round, or null for rows that aren't a modelled category. */
function toRound(record: ApiRecord): Round | null {
  if (!(CATEGORIES as string[]).includes(record.vehicle_class)) {
    return null;
  }
  const day = record.bidding_no === "1" ? "01" : "15";
  // values from mid-2023 carry thousands separators ("1,184")
  const premium = Number(record.premium.replace(/,/g, ""));
  if (!Number.isFinite(premium)) return null;
  return { date: `${record.month}-${day}`, category: record.vehicle_class as Category, premium };
}

async function fetchAllRecords(): Promise<ApiRecord[]> {
  const records: ApiRecord[] = [];
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({
      resource_id: DATASET_ID,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    const response = await fetch(`${API_URL}?${params}`);
    if (!response.ok) throw new Error(`data.gov.sg responded ${response.status}`);
    const { result } = await response.json();
    records.push(...result.records);
    if (records.length >= result.total) return records;
    offset += PAGE_SIZE;
  }
}

/** Live data with snapshot fallback. Never rejects — the page always renders. */
export async function loadRounds(): Promise<CoeData> {
  try {
    const records = await fetchAllRecords();
    const rounds = records
      .map(toRound)
      .filter((round): round is Round => round !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (rounds.length === 0) throw new Error("empty result");
    return { rounds, source: "live" };
  } catch {
    return { rounds: snapshot as Round[], source: "snapshot" };
  }
}

/* ---------- Model artifacts (computed offline by coe_forecast.ipynb) ---------- */

export interface CategoryArtifacts {
  order: number[];
  backtest_mape: number;
  naive_mape: number;
  latest_round: string;
  latest_premium: number;
  next_round: { forecast: number; low: number; high: number };
}

export const MODEL = artifacts as {
  generated: string;
  final_model: string;
  holdout_rounds: number;
  categories: Record<Category, CategoryArtifacts>;
};
