#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from alsense.ml.train import train_baselines


if __name__ == "__main__":
    result = train_baselines(
        ROOT / "data/processed/als_progression.csv",
        ROOT / "models",
        ROOT / "reports/model_evaluation.json",
    )
    print(result["results"])

