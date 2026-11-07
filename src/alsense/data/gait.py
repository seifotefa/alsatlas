"""Subject-level feature extraction for the small PhysioNet gait cohort."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd


TS_COLUMNS = [
    "elapsed_seconds", "left_stride_seconds", "right_stride_seconds",
    "left_swing_seconds", "right_swing_seconds", "left_swing_percent",
    "right_swing_percent", "left_stance_seconds", "right_stance_seconds",
    "left_stance_percent", "right_stance_percent",
    "double_support_seconds", "double_support_percent",
]


def _summarize_record(path: Path) -> dict[str, float | str]:
    values = pd.read_csv(path, sep=r"\s+", names=TS_COLUMNS)
    row: dict[str, float | str] = {"subject_id": path.stem, "stride_count": len(values)}
    for column in TS_COLUMNS[1:]:
        series = values[column].replace([np.inf, -np.inf], np.nan).dropna()
        row[f"{column}_mean"] = float(series.mean())
        row[f"{column}_std"] = float(series.std(ddof=1))
        row[f"{column}_median"] = float(series.median())
        row[f"{column}_iqr"] = float(series.quantile(0.75) - series.quantile(0.25))
    row["stride_asymmetry_mean"] = float(
        (values["left_stride_seconds"] - values["right_stride_seconds"]).abs().mean()
    )
    row["swing_asymmetry_mean"] = float(
        (values["left_swing_seconds"] - values["right_swing_seconds"]).abs().mean()
    )
    return row


def extract_gait_features(source_dir: Path, destination: Path) -> pd.DataFrame:
    metadata = pd.read_csv(source_dir / "subject-description.txt", sep="\t", index_col=0)
    metadata = metadata.loc[metadata.index.notna()].copy()
    metadata.index.name = "subject_id"
    metadata = metadata.reset_index()
    metadata["GROUP"] = metadata["GROUP"].replace({"subjects": "als"})
    feature_rows = [_summarize_record(path) for path in sorted(source_dir.glob("*.ts"))]
    features = pd.DataFrame(feature_rows)
    result = features.merge(
        metadata[["subject_id", "GROUP"]], on="subject_id", how="left", validate="one_to_one"
    ).rename(columns={"GROUP": "group"})
    if result["group"].isna().any():
        raise ValueError("A gait record is missing group metadata")
    destination.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(destination, index=False)
    return result

