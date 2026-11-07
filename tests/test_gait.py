from pathlib import Path

import pandas as pd

from alsense.data.gait import extract_gait_features


def test_gait_feature_extraction_is_subject_level(tmp_path: Path):
    source = tmp_path / "raw"
    source.mkdir()
    (source / "subject-description.txt").write_text(
        "\tGROUP\tAGE(YRS)\nals1\tsubjects\t50\ncontrol1\tcontrol\t50\n"
    )
    row = " ".join(str(v) for v in [1, 1.0, 1.1, .4, .5, 40, 45, .6, .6, 60, 55, .2, 20])
    for subject in ["als1", "control1"]:
        (source / f"{subject}.ts").write_text(row + "\n" + row + "\n")
    result = extract_gait_features(source, tmp_path / "features.csv")
    assert len(result) == 2
    assert set(result["group"]) == {"als", "control"}
    assert "stride_asymmetry_mean" in result
