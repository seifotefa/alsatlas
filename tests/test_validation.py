import pandas as pd
import pytest

from alsense.data.validate import validate_clean_als


def test_valid_minimal_frame():
    validate_clean_als(pd.DataFrame({
        "testset": [False, True], "dfrs": [-1.0, -0.5],
        "onset_delta": [-100, -200], "age": [40, 65],
    }))


def test_rejects_missing_target():
    frame = pd.DataFrame({"testset": [False], "dfrs": [None], "onset_delta": [-1], "age": [50]})
    with pytest.raises(ValueError, match="missing"):
        validate_clean_als(frame)

