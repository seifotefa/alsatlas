# Baseline Model Evaluation

The target is the packaged `dFRS` progression rate—not diagnosis and not a validated 12-month ALSFRS-R forecast. The source-provided split contains 1,197 training and 625 test rows. Forty-seven static/intake-like variables are used; study arm and every longitudinal clinical summary/slope are excluded.

| Model | Test MAE | Test RMSE | Test R² |
|---|---:|---:|---:|
| Training-median constant | 0.4565 | 0.5778 | -0.0428 |
| Ridge (`alpha=10`, LSQR) | **0.4245** | **0.5260** | **0.1357** |
| Random forest | 0.4315 | 0.5326 | 0.1140 |

The ridge model improves MAE by about 7.1% over the median baseline, but its low R² indicates limited explanatory performance. This is an honest research baseline, not evidence of clinical utility.

## Limitations

- CASIdata documentation identifies `dFRS` but does not specify its exact formula or the clinical cutoff for each engineered feature.
- No external validation, subgroup/fairness analysis, calibration, confidence interval, or uncertainty model is included.
- The cohort contains people with ALS; it cannot evaluate early detection among symptomatic or general populations.
- A prospective model requires original visit-level data, a declared index date and horizon, patient-grouped splits, and evaluation on a separate cohort.

Machine-readable metrics and the ordered feature list are in `reports/model_evaluation.json`.

