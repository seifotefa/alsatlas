# Data Quality Report

## CASIdata ALS progression table

- Shape: 1,822 observations × 371 columns.
- Predefined split: {'False': 1197, 'True': 625}.
- Exact duplicate rows: 0.
- Missing cells: 0 across 0 columns.
- Constant columns: 0.
- Patient identifier: not supplied; the package describes each row as an individual.
- `dFRS`: min -3.103, median -0.592, mean -0.686, max 1.208; 0 missing.

No rows or clinically plausible extremes were removed. Zero missing cells does not mean every measurement was observed: this feature-engineered table includes explicit `no_*_data` and `lessthan2_*` indicators and may encode absence through derived values.

## Leakage assessment

The supplied 369 predictors include longitudinal summaries such as last values, visit-window means, and slopes. Without the original visit-level table and a documented prediction cutoff, these cannot be established as prospectively available. The initial model therefore uses only demographics, onset delay, reported symptoms, onset site, family-history indicators, and neurological-history indicators. It excludes study arm and all longitudinal clinical summaries. This conservative subset reduces—but cannot eliminate—leakage risk because the exact `dFRS` construction remains undocumented in the source artifact.

## Gait dataset

The PhysioNet archive contains 64 subject records (13 ALS, 15 Parkinson's, 20 Huntington's, 16 controls), each with left/right force signals, headers, and an unfiltered 13-column derived stride time series. Its small, heterogeneous cohort is suitable for exploratory signal engineering only, not a clinically reliable ALS detector. No gait model is trained in this phase.

## Blocked assessments

ALS Focus requires acceptance of its current data-sharing terms through NeuroVERSE. VOC-ALS requires a Synapse account and applicable terms. Those datasets were not downloaded, so content-level quality assessment remains pending authorized access.

## Fictional demonstration profile

The Alex Chen profile was transcribed from pages 7-15 of the BioHacks 2026 hacker package and validated as JSON. It includes 31 typed measurements plus dated clinical events and functional context. The package identifies the case as fictional; `fictional: true` and `training_eligible: false` are enforced in the artifact. No values were inferred and no model prediction was produced.
