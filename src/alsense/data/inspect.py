"""Machine-readable and Markdown data-quality assessment."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from .clean import load_als


def inspect_als(path: Path) -> dict:
    df = load_als(path)
    missing = df.isna().sum().sort_values(ascending=False)
    constant = [c for c in df.columns if df[c].nunique(dropna=False) <= 1]
    report = {
        "dataset": "CASIdata ALS progression",
        "source": str(path),
        "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
        "duplicate_rows": int(df.duplicated().sum()),
        "patient_identifier": None,
        "patient_identifier_note": "No identifier is included; documentation describes one observation per individual.",
        "predefined_split": {str(k): int(v) for k, v in df["testset"].value_counts().items()},
        "target": {
            "name": "dFRS",
            "missing": int(df["dFRS"].isna().sum()),
            "min": float(df["dFRS"].min()),
            "median": float(df["dFRS"].median()),
            "mean": float(df["dFRS"].mean()),
            "max": float(df["dFRS"].max()),
        },
        "missing_cells": int(df.isna().sum().sum()),
        "columns_with_missing": {k: int(v) for k, v in missing[missing > 0].items()},
        "constant_columns": constant,
        "dtypes": {k: int(v) for k, v in df.dtypes.astype(str).value_counts().items()},
        "leakage_risks": [
            "ALSFRS summary, last-value, and slope features may use observations after the intended prediction time.",
            "The target-construction formula and observation cutoff are not documented in the packaged table.",
            "Study-arm indicators may encode trial context and should not be treated as general clinical predictors.",
            "No patient IDs or visit-level timestamps are provided, so temporal re-derivation cannot be audited.",
        ],
    }
    return report


def inspect_gait(directory: Path) -> dict:
    description = pd.read_csv(directory / "subject-description.txt", sep="\t", index_col=0)
    description.columns = [c.strip() for c in description.columns]
    malformed_rows = int(description.index.isna().sum())
    description = description.loc[description.index.notna()].copy()
    description["GROUP"] = description["GROUP"].replace({"subjects": "als"})
    time_series = sorted(directory.glob("*.ts"))
    return {
        "dataset": "PhysioNet Gait in Neurodegenerative Disease v1.0.0",
        "subjects": int(len(description)),
        "group_counts": {str(k): int(v) for k, v in description["GROUP"].value_counts().items()},
        "subject_metadata_missing_cells": int(description.isna().sum().sum()),
        "subject_metadata_duplicate_rows": int(description.duplicated().sum()),
        "malformed_source_rows_excluded": malformed_rows,
        "time_series_files": len(time_series),
        "time_series_bytes": int(sum(path.stat().st_size for path in time_series)),
        "time_series_columns": 13,
        "note": "File inventory and subject metadata were inspected. Source documentation says derived time series are unfiltered; signal-level invalid/outlier assessment remains future work and must not automatically delete extremes.",
    }


def write_quality_report(report: dict, json_path: Path, markdown_path: Path) -> None:
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(report, indent=2) + "\n")
    shape = report["shape"]
    target = report["target"]
    md = f"""# Data Quality Report

## CASIdata ALS progression table

- Shape: {shape['rows']:,} observations × {shape['columns']:,} columns.
- Predefined split: {report['predefined_split']}.
- Exact duplicate rows: {report['duplicate_rows']}.
- Missing cells: {report['missing_cells']} across {len(report['columns_with_missing'])} columns.
- Constant columns: {len(report['constant_columns'])}.
- Patient identifier: not supplied; the package describes each row as an individual.
- `dFRS`: min {target['min']:.3f}, median {target['median']:.3f}, mean {target['mean']:.3f}, max {target['max']:.3f}; {target['missing']} missing.

No rows or clinically plausible extremes were removed. Zero missing cells does not mean every measurement was observed: this feature-engineered table includes explicit `no_*_data` and `lessthan2_*` indicators and may encode absence through derived values.

## Leakage assessment

The supplied 369 predictors include longitudinal summaries such as last values, visit-window means, and slopes. Without the original visit-level table and a documented prediction cutoff, these cannot be established as prospectively available. The initial model therefore uses only demographics, onset delay, reported symptoms, onset site, family-history indicators, and neurological-history indicators. It excludes study arm and all longitudinal clinical summaries. This conservative subset reduces—but cannot eliminate—leakage risk because the exact `dFRS` construction remains undocumented in the source artifact.

## Gait dataset

The PhysioNet archive contains 64 subject records (13 ALS, 15 Parkinson's, 20 Huntington's, 16 controls), each with left/right force signals, headers, and an unfiltered 13-column derived stride time series. Its small, heterogeneous cohort is suitable for exploratory signal engineering only, not a clinically reliable ALS detector. No gait model is trained in this phase.

## Blocked assessments

ALS Focus requires acceptance of its current data-sharing terms through NeuroVERSE. VOC-ALS requires a Synapse account and applicable terms. Those datasets were not downloaded, so content-level quality assessment remains pending authorized access.
"""
    markdown_path.write_text(md)

