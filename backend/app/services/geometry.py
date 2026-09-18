from typing import Tuple, List, Dict
import geopandas as gpd
from shapely.validation import explain_validity
from backend.app.models.dataset import GeometryValidationSummary


def validate_geometries(gdf: gpd.GeoDataFrame) -> Tuple[GeometryValidationSummary, List[str], str]:
    """
    Deterministically evaluates topology and validity of a GeoDataFrame's geometry column.
    Returns:
      - GeometryValidationSummary
      - list of unique geometry types found
      - primary geometry type string
    """
    if "geometry" not in gdf.columns:
        return (
            GeometryValidationSummary(
                valid=0,
                invalid=0,
                empty=0,
                missing=len(gdf),
                total=len(gdf),
                invalid_reasons=["No 'geometry' column present in dataset."],
            ),
            ["None"],
            "None",
        )

    valid_count = 0
    invalid_count = 0
    empty_count = 0
    missing_count = 0
    invalid_reasons = []
    geom_types_set = set()

    for geom in gdf.geometry:
        if geom is None:
            missing_count += 1
            continue

        if geom.is_empty:
            empty_count += 1
            continue

        geom_types_set.add(geom.geom_type)

        if not geom.is_valid:
            invalid_count += 1
            reason = explain_validity(geom)
            if reason not in invalid_reasons and len(invalid_reasons) < 5:
                invalid_reasons.append(reason)
        else:
            valid_count += 1

    total = len(gdf)
    geom_types = sorted(list(geom_types_set)) if geom_types_set else ["None"]

    # Primary geometry type (most frequent or single)
    if len(geom_types) == 1:
        primary_geom_type = geom_types[0]
    elif len(geom_types) > 1:
        primary_geom_type = f"Mixed ({', '.join(geom_types)})"
    else:
        primary_geom_type = "None"

    summary = GeometryValidationSummary(
        valid=valid_count,
        invalid=invalid_count,
        empty=empty_count,
        missing=missing_count,
        total=total,
        invalid_reasons=invalid_reasons,
    )

    return summary, geom_types, primary_geom_type
