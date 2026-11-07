"""Deterministic cleaning for the CASIdata ALS progression table."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd


def normalize_name(name: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return value or "unnamed"


def normalize_columns(columns: list[str]) -> list[str]:
    """Normalize names and make collisions explicit and stable."""
    seen: dict[str, int] = {}
    result: list[str] = []
    for source in columns:
        base = normalize_name(source)
        seen[base] = seen.get(base, 0) + 1
        result.append(base if seen[base] == 1 else f"{base}_{seen[base]}")
    return result


def load_als(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, sep=r"\s+")


def clean_als(source: Path, destination: Path, provenance_path: Path) -> pd.DataFrame:
    raw = load_als(source)
    cleaned = raw.copy()
    cleaned.columns = normalize_columns(list(raw.columns))
    cleaned["testset"] = cleaned["testset"].astype(bool)
    destination.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(destination, index=False)
    provenance = {
        "dataset": "CASIdata ALS",
        "source_file": str(source),
        "output_file": str(destination),
        "rows_before": len(raw),
        "rows_after": len(cleaned),
        "columns_before": raw.shape[1],
        "columns_after": cleaned.shape[1],
        "transformations": [
            "normalized column names to lowercase snake_case",
            "preserved all rows and values",
            "coerced predefined testset indicator to boolean",
        ],
        "target": "dfrs",
        "target_semantics": "rate of ALS functional-rating-score progression; not a 12-month forecast",
    }
    provenance_path.parent.mkdir(parents=True, exist_ok=True)
    provenance_path.write_text(json.dumps(provenance, indent=2) + "\n")
    return cleaned

