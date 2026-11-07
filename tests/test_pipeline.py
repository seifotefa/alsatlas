from pathlib import Path
import json

import pandas as pd

from alsense.data.clean import clean_als
from alsense.ml.features import baseline_features


def test_cleaning_preserves_rows_and_excludes_longitudinal_features(tmp_path: Path):
    raw = tmp_path / "als.txt"
    raw.write_text("testset dFRS Onset.Delta Age Study.Arm.PLACEBO max.alsfrs.score\nFALSE -1 10 50 1 40\nTRUE -2 20 60 0 30\n")
    out = tmp_path / "clean.csv"
    df = clean_als(raw, out, tmp_path / "provenance.json")
    assert len(df) == 2
    assert baseline_features(df) == ["onset_delta", "age"]


def test_fictional_demo_is_never_training_eligible():
    profile_path = Path(__file__).resolve().parents[1] / "data/demo/alex_chen.json"
    profile = json.loads(profile_path.read_text())
    assert profile["fictional"] is True
    assert profile["training_eligible"] is False
    assert profile["safety_note"]

