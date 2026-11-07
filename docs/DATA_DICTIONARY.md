# Data Dictionary

## Processed CASIdata table

`data/processed/als_progression.csv` preserves all 1,822 rows and 371 values while normalizing column names to lowercase snake case. The full source schema and descriptions are preserved in `data/raw/casidata/CASIdata/man/als.Rd`.

| Field/group | Meaning | Baseline use |
|---|---|---|
| `testset` | Source-provided logical train/test assignment | Split only |
| `dfrs` | Rate of progression of the ALS functional rating score | Target |
| `onset_delta` | Onset-related interval supplied by the source; exact units/sign convention require original challenge documentation | Included with caution |
| `symptom_*` | Reported symptom indicators | Included |
| `site_of_onset_*` | Bulbar/limb onset indicators | Included |
| `race_*`, `age`, `sex_*` | Demographic encodings | Included for baseline research; fairness audit required |
| family relationship fields | Family history indicators | Included |
| `neurological_disease_*` | Neurological-history indicators | Included |
| `study_arm_*` | Trial arm | Excluded |
| summary groups (`max_`, `min_`, `last_`, `mean_`, `sum_`, `sd_`, dates, visit counts) | Engineered longitudinal clinical summaries | Excluded from conservative baseline |
| slope fields | Engineered trends for ALSFRS items, respiratory, weight, blood pressure, etc. | Excluded as temporal leakage risk |

The table contains engineered absence flags rather than ordinary nulls. Source zeroes must not automatically be interpreted as measured clinical zeroes.

## Fictional demo schema

The JSON profile records PDF page provenance and `training_eligible: false`, then separates patient metadata, diagnosis, dated/relative timeline events, typed longitudinal measurements, and functional context. Measurements retain position, laterality, time of day, method, and units where supplied. Unknown fields are omitted rather than imputed.

