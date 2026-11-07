# ALSense data foundation

ALSense is an accessibility-first research prototype for symptom documentation and ALS progression research. It is **not** a diagnostic tool, does not rule ALS in or out, and must not replace neurological evaluation.

This phase contains a reproducible CASIdata pipeline, conservative `dFRS` research baselines, a subject-level PhysioNet gait feature pipeline, a quality audit, an isolated fictional demo profile, and a verified dataset catalog. The two real datasets remain separate evidence modules because their participants and outcomes cannot be joined. It intentionally contains no frontend, clinical inference, sponsor integration, or deployment.

## Reproduce

Use Python 3.11+ in a virtual environment, install with `pip install -e '.[dev]'`, then run:

```bash
python scripts/prepare_data.py
python scripts/train_baseline.py
python scripts/prepare_gait.py
python -m pytest -q
```

The source files are ignored by Git. Acquisition instructions and restrictions are in [the dataset catalog](docs/DATASET_CATALOG.md). Generated machine-readable reports are written to `reports/`; model artifacts to `models/`.

## Safety boundary

The model predicts the packaged `dFRS` progression-rate target for a cohort already diagnosed with ALS. It is not an ALS screening model and not a validated individual forecast. Fictional demo data in `data/demo/` is never part of training or evaluation.

