import pandas as pd

from alsense.data.clean import normalize_columns


def test_normalize_columns_handles_collisions():
    assert normalize_columns(["A.B", "A B", "..."]) == ["a_b", "a_b_2", "unnamed"]

