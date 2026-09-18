# COE Price Forecasting Dashboard — Discussion Log

#
## Why Banking/Finance, and Why COE Specifically
The reasoning was explicit: the NTUC Eco Run tracker's actual success wasn't just "built a dashboard" — it was the sequence *real unmet need → built a tool → found the exact community that needed it (r/SingaporeFitness) → got real, organic usage*. Several banking/finance ideas were floated as candidates for repeating that same playbook:
- **COE price forecasting** (top recommendation)


COE was chosen as the clear top pick for one specific reason beyond the general community-fit logic: it **reuses a skill already proven in the SingHealth work** — SARIMAX, the same model family behind the 4.24% MAPE ED-admissions forecast. This creates a consistent "I am reliably good at forecasting" narrative across the resume, rather than a one-off result. COE is also a genuinely high-stakes, high-engagement topic in Singapore, with constant discussion on r/singapore, r/askSingapore, and r/singaporefi — a real, findable audience, mirroring NTUC's exact distribution channel logic.

## The Differentiation Problem, and How It Was Resolved
Before committing, a competing site was found and checked: **coe.datainsg.com**, which already tracks live COE premiums, historical bidding results since 2002, and supply/demand trends. This initially looked like it could make a plain "COE dashboard" derivative. The resolution: that site appears to be **descriptive** (live/historical data, trend direction) rather than **predictive** — nothing in its description suggests an actual forecasting model with a backtested accuracy figure. The differentiator settled on was therefore explicit: build a real predictive model and **report a backtested, honest accuracy number** (MAPE), which the existing site does not appear to do.

## Data Sources (Verified, Not Assumed)
Two `data.gov.sg` datasets were directly checked and confirmed live during scoping:
- `d_69b3380ad7e51aff3a7dcc84eba52b8a` — COE Bidding Results/Prices, monthly since 2010, live OpenAPI endpoint, updated after every bidding round.
- `d_22094bf608253d36c0c63b52d852dd6e` — Motor Vehicle Quota, Quota Premium, Prevailing Quota Premium (monthly) — used as exogenous regressor features (quota size, bids received).

## Scope Decision
Start with **Category A and B only** — the two most-discussed, highest-stakes categories — rather than all 5 from day one, specifically to get a shippable v1 faster. This was later reinforced under deadline pressure (see below).

## Confirmed Build Logic (locked in before coding)
- **One SARIMAX model per category, not a single combined model.** Cat A and Cat B behave differently (different vehicle types, different demand pools) — combining them would blur the signal.
- **Backtesting must be honest, not fitted-and-reported.** The model must be evaluated by holding out the most recent real bidding rounds, forecasting them as if unknown, and comparing forecast vs. actual — that gap is the real, defensible MAPE, not a fit-to-known-data number.
- **Keep v1 simple.** Exogenous inputs limited to quota size and bids-received only. Additional features (holidays, broader economic indicators) are only added if the simple version's backtested accuracy is clearly inadequate — complexity is earned, not assumed.
- **Demo reliability fallback:** cache a local snapshot of the data/forecast so the dashboard still displays correctly even if the live data.gov.sg API is slow or briefly down while someone is viewing it.

## File Format
`.ipynb` for the exploration/tuning phase (model iteration benefits from inline visual feedback). A separate `.py` file is required for the final deployment, since Streamlit apps must be run via `streamlit run app.py` — a notebook cannot be deployed directly.

## Deadline Context (Career Fair, Sept 24, 2026)
When a hard external deadline emerged (website links needed live before a Sept 24 career fair, working with roughly 1–2 hrs/day of weekend/weekday capacity — about 25–30 realistic hours total over ~19 days), an initial plan to ship COE + HDB + NTUC v2 together was walked back to **COE alone** as the safe, committed target. The reasoning: COE has the least unfamiliar territory (SARIMAX already proven fast, Streamlit already known), whereas NTUC v2 introduces Power BI as a genuine cold-start tool with unpredictable learning-curve risk, and HDB has more inherent scope (cluster, then forecast, then compare the two). COE was judged the safest single bet specifically *because* nothing about it requires learning something new under time pressure.

A per-project "Working Method" instruction (normally: guide via Socratic questioning, only give full answers if genuinely stuck) was explicitly and temporarily suspended for this deadline-driven build, with the person's own stated intent to re-learn and validate the reasoning afterward. This exception is recorded in the project's build-spec file and is meant to lapse once the deadline has passed.

## Coding Standard Note
A `/simplify` code-simplifier standard was provided for adaptation, but it was written specifically for a JS/TS/React codebase (ES modules, explicit TypeScript return types, React Props patterns). Since this project is Python-based, only the language-agnostic parts of that spec apply: preserve exact functionality when refining, reduce unnecessary nesting/complexity, avoid nested ternaries or dense one-liners in favor of explicit conditionals, prefer clarity over cleverness, avoid over-consolidating multiple concerns into one function, and only refine recently-touched code.

## Outstanding / Not Yet Resolved
- Model order and any additional exogenous features beyond quota/bids-received are intentionally left open — to be decided only if the simple version's backtested accuracy proves inadequate.
- The actual NTUC-style Reddit launch post (for r/singaporefi or r/askSingapore) has not been drafted — this should happen once the dashboard has a real, honest backtested MAPE to report.