"""Prospectively defensible feature policy for the initial baseline."""

from __future__ import annotations

import pandas as pd


def baseline_features(df: pd.DataFrame) -> list[str]:
    """Select the documented static block before study-arm/visit summaries.

    Column order is part of the published CASIdata schema: static intake-like
    fields end immediately before ``study_arm_placebo``. This boundary avoids
    both ordinary summaries and suffix-form slope features.
    """
    boundary = "study_arm_placebo"
    if boundary not in df.columns:
        raise ValueError(f"Expected feature boundary {boundary!r} is missing")
    static_block = list(df.columns[: df.columns.get_loc(boundary)])
    return [c for c in static_block if c not in {"testset", "dfrs"}]

