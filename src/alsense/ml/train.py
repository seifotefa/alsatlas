"""Train and evaluate conservative dFRS baselines on the supplied split."""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from alsense.data.validate import validate_clean_als
from .features import baseline_features


def metrics(y_true: pd.Series, predicted: np.ndarray) -> dict[str, float]:
    return {
        "mae": float(mean_absolute_error(y_true, predicted)),
        "rmse": float(mean_squared_error(y_true, predicted) ** 0.5),
        "r2": float(r2_score(y_true, predicted)),
    }


def train_baselines(data_path: Path, model_dir: Path, report_path: Path) -> dict:
    df = pd.read_csv(data_path)
    df["testset"] = df["testset"].astype(bool)
    validate_clean_als(df)
    features = baseline_features(df)
    train = df.loc[~df["testset"]]
    test = df.loc[df["testset"]]
    x_train, y_train = train[features], train["dfrs"]
    x_test, y_test = test[features], test["dfrs"]

    median_prediction = np.full(len(test), y_train.median())
    models = {
        "ridge": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("model", Ridge(alpha=10.0, solver="lsqr")),
        ]),
        "random_forest": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", RandomForestRegressor(
                n_estimators=400, min_samples_leaf=8, max_features="sqrt",
                random_state=2026, n_jobs=-1,
            )),
        ]),
    }
    results = {"median_baseline": metrics(y_test, median_prediction)}
    model_dir.mkdir(parents=True, exist_ok=True)
    for name, model in models.items():
        model.fit(x_train, y_train)
        results[name] = metrics(y_test, model.predict(x_test))
        joblib.dump({"model": model, "features": features}, model_dir / f"{name}.joblib")

    report = {
        "outcome": "dFRS progression-rate target supplied by CASIdata",
        "not_outcome": "individual ALS diagnosis or validated 12-month ALSFRS-R forecast",
        "split": "source-provided testset indicator",
        "train_rows": int(len(train)),
        "test_rows": int(len(test)),
        "feature_count": len(features),
        "features": features,
        "feature_policy": "static/intake-like fields only; longitudinal summaries and study arm excluded",
        "results": results,
        "limitations": [
            "The package does not document the precise dFRS formula or feature observation cutoff.",
            "The source cohort consists of people with ALS and cannot validate early detection.",
            "No external cohort validation, calibration study, or uncertainty model was performed.",
            "Metrics are research baselines and must not drive individual clinical decisions.",
        ],
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    return report

