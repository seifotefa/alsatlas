#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from alsense.data.gait import extract_gait_features
from alsense.ml.gait import evaluate_gait_models


if __name__ == "__main__":
    source = ROOT / "data/raw/gaitndd/gait-in-neurodegenerative-disease-database-1.0.0"
    output = ROOT / "data/processed/gait_subject_features.csv"
    frame = extract_gait_features(source, output)
    report = evaluate_gait_models(output, ROOT / "reports/gait_model_evaluation.json")
    print(f"Prepared {len(frame)} gait subjects")
    print(report["results"])

