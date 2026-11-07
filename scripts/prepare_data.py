#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from alsense.data.clean import clean_als
from alsense.data.inspect import inspect_als, inspect_gait, write_quality_report


def main() -> None:
    source = ROOT / "data/raw/casidata/ALS.txt"
    if not source.exists():
        raise SystemExit("Missing data/raw/casidata/ALS.txt; see docs/DATASET_CATALOG.md")
    report = inspect_als(source)
    write_quality_report(report, ROOT / "reports/als_quality.json", ROOT / "docs/DATA_QUALITY_REPORT.md")
    clean_als(source, ROOT / "data/processed/als_progression.csv", ROOT / "reports/als_provenance.json")
    gait = ROOT / "data/raw/gaitndd/gait-in-neurodegenerative-disease-database-1.0.0"
    if gait.exists():
        import json
        (ROOT / "reports/gait_quality.json").write_text(json.dumps(inspect_gait(gait), indent=2) + "\n")
    print("Prepared data/processed/als_progression.csv")


if __name__ == "__main__":
    main()

