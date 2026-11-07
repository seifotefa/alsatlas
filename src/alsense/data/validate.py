"""Schema checks that fail loudly before model training."""

from __future__ import annotations

import pandas as pd


REQUIRED_ALS_COLUMNS = {"testset", "dfrs", "onset_delta", "age"}


def validate_clean_als(df: pd.DataFrame) -> None:
    missing = REQUIRED_ALS_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    if df.empty:
        raise ValueError("ALS dataset is empty")
    if df["dfrs"].isna().any():
        raise ValueError("Target dfrs contains missing values")
    if not set(df["testset"].unique()).issubset({True, False}):
        raise ValueError("testset must be boolean")
    if not df["age"].between(18, 100).all():
        raise ValueError("Age outside the conservative adult plausibility range")

