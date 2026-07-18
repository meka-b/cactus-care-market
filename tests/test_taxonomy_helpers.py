import pytest
from backend.taxonomy_helpers import get_slug_from_taxonomy, compute_tags_from_taxonomy, get_taxonomy_names

@pytest.fixture
def sample_taxonomy():
    return {
        "product_categories": [
            {"name": "Houseplants", "slug": "houseplants"},
            {"name": "Succulents", "slug": "succulents"},
        ],
        "filters": [
            {"name": "Easy", "slug": "care-easy", "type": "care_level"},
            {"name": "Medium", "slug": "care-medium", "type": "care_level"},
            {"name": "Low Light", "slug": "light-low", "type": "light_need"},
            {"name": "Bright Light", "slug": "light-bright", "type": "light_need"},
            {"name": "Weekly", "slug": "water-weekly", "type": "water_need"},
            {"name": "Small", "slug": "size-small", "type": "size"},
            {"name": "Pet Friendly", "slug": "pet-friendly", "type": "pet_safe"},
            {"name": "Non-Pet Safe", "slug": "non-pet-safe", "type": "pet_safe"},
        ]
    }

def test_get_slug_from_taxonomy_basic(sample_taxonomy):
    slug = get_slug_from_taxonomy(sample_taxonomy, "Houseplants", "product_categories")
    assert slug == "houseplants"

def test_get_slug_from_taxonomy_with_filter_type(sample_taxonomy):
    slug = get_slug_from_taxonomy(sample_taxonomy, "Easy", "filters", "care_level")
    assert slug == "care-easy"

def test_get_slug_from_taxonomy_wrong_filter_type(sample_taxonomy):
    slug = get_slug_from_taxonomy(sample_taxonomy, "Easy", "filters", "light_need")
    assert slug == ""

def test_get_slug_from_taxonomy_not_found(sample_taxonomy):
    slug = get_slug_from_taxonomy(sample_taxonomy, "Nonexistent", "product_categories")
    assert slug == ""

def test_get_slug_from_taxonomy_empty_name(sample_taxonomy):
    slug = get_slug_from_taxonomy(sample_taxonomy, "", "product_categories")
    assert slug == ""

def test_compute_tags_from_taxonomy_all_provided(sample_taxonomy):
    tags = compute_tags_from_taxonomy(
        sample_taxonomy,
        category="Houseplants",
        care="Easy",
        light="Low Light",
        water="Weekly",
        size="Small",
        pet_safe=True
    )
    assert tags == ["houseplants", "care-easy", "light-low", "water-weekly", "size-small", "pet-friendly"]

def test_compute_tags_from_taxonomy_some_missing(sample_taxonomy):
    tags = compute_tags_from_taxonomy(
        sample_taxonomy,
        category="Houseplants",
        care="",
        light="Low Light",
        water="",
        size="Small",
        pet_safe=False
    )
    assert tags == ["houseplants", "light-low", "size-small"]

def test_compute_tags_from_taxonomy_pet_safe_false(sample_taxonomy):
    tags = compute_tags_from_taxonomy(
        sample_taxonomy,
        category="", care="", light="", water="", size="", pet_safe=False
    )
    assert tags == []

def test_get_taxonomy_names_no_filter(sample_taxonomy):
    names = get_taxonomy_names(sample_taxonomy, "product_categories")
    assert names == ["Houseplants", "Succulents"]

def test_get_taxonomy_names_with_filter(sample_taxonomy):
    names = get_taxonomy_names(sample_taxonomy, "filters", "light_need")
    assert names == ["Low Light", "Bright Light"]

def test_get_taxonomy_names_not_found(sample_taxonomy):
    names = get_taxonomy_names(sample_taxonomy, "nonexistent")
    assert names == []
