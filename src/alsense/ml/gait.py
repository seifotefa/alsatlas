"""Exploratory subject-disjoint gait classification; not a diagnostic model."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import balanced_accuracy_score, confusion_matrix, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline


def evaluate_gait_models(data_path: Path, report_path: Path) -> dict:
    data = pd.read_csv(data_path)
    feature_names = [c for c in data if c not in {"subject_id", "group"}]
    x = data[feature_names]
    y = (data["group"] == "als").astype(int)
    models = {
        "random_forest": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("model", RandomForestClassifier(
                n_estimators=100, min_samples_leaf=4, max_features="sqrt",
                class_weight="balanced", random_state=2026, n_jobs=-1,
            )),
        ]),
    }
    results = {}
    cv = StratifiedKFold(n_splits=6, shuffle=True, random_state=2026)
    for name, model in models.items():
        probability = cross_val_predict(model, x, y, cv=cv, method="predict_proba", n_jobs=1)[:, 1]
        prediction = (probability >= 0.5).astype(int)
        results[name] = {
            "roc_auc": float(roc_auc_score(y, probability)),
            "balanced_accuracy": float(balanced_accuracy_score(y, prediction)),
            "confusion_matrix": confusion_matrix(y, prediction, labels=[0, 1]).tolist(),
        }
    report = {
        "task": "exploratory ALS-versus-non-ALS classification from derived gait summaries",
        "subjects": int(len(data)),
        "als_subjects": int(y.sum()),
        "non_als_subjects": int((1 - y).sum()),
        "feature_count": len(feature_names),
        "validation": "six-fold stratified subject-disjoint cross-validation",
        "results": results,
        "clinical_use": False,
        "limitations": [
            "Only 13 ALS subjects are available.",
            "The negative group mixes controls, Parkinson's disease, and Huntington's disease.",
            "Age and demographic fields were intentionally excluded to reduce shortcut learning.",
            "This is research exploration and must not produce patient-facing diagnostic probabilities.",
        ],
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    return report

