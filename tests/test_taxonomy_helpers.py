import pytest
from backend.taxonomy_helpers import compute_tags_from_taxonomy

# We need to mock taxonomy data for testing
mock_taxonomy = {
    "product_categories": [
        {"name": "Kaktüsler", "slug": "kaktusler"},
        {"name": "Sukulentler", "slug": "sukulentler"}
    ],
    "filters": [
        {"name": "Kolay Bakım", "type": "care_level", "slug": "kolay-bakim-bitkileri"},
        {"name": "Tam Güneş", "type": "light_need", "slug": "tam-gunes-seven-bitkiler"},
        {"name": "Yarı Gölge", "type": "light_need", "slug": "yari-golge-bitkileri"},
        {"name": "Az", "type": "water_need", "slug": "az-sulanan-bitkiler"},
        {"name": "Orta", "type": "water_need", "slug": "orta-sulanan-bitkiler"},
        {"name": "Mini (0-20 cm)", "type": "size", "slug": "mini-bitkiler"},
        {"name": "Evcil Hayvan Dostu", "type": "pet_safe", "slug": "pet-friendly-bitkiler"}
    ]
}

def test_compute_tags_all_match():
    tags = compute_tags_from_taxonomy(
        taxonomy=mock_taxonomy,
        category="Kaktüsler",
        care="Kolay Bakım",
        light="Tam Güneş",
        water="Az",
        size="Mini (0-20 cm)",
        pet_safe=True
    )
    assert tags == [
        "kaktusler",
        "kolay-bakim-bitkileri",
        "tam-gunes-seven-bitkiler",
        "az-sulanan-bitkiler",
        "mini-bitkiler",
        "pet-friendly-bitkiler"
    ]

def test_compute_tags_no_match():
    tags = compute_tags_from_taxonomy(
        taxonomy=mock_taxonomy,
        category="Invalid",
        care="Invalid",
        light="Invalid",
        water="Invalid",
        size="Invalid",
        pet_safe=False
    )
    assert tags == []

def test_compute_tags_partial_match():
    tags = compute_tags_from_taxonomy(
        taxonomy=mock_taxonomy,
        category="Sukulentler",
        care="Invalid",
        light="Yarı Gölge",
        water="Orta",
        size="Invalid",
        pet_safe=False
    )
    assert tags == [
        "sukulentler",
        "yari-golge-bitkileri",
        "orta-sulanan-bitkiler"
    ]

def test_compute_tags_empty_strings():
    tags = compute_tags_from_taxonomy(
        taxonomy=mock_taxonomy,
        category="",
        care="",
        light="",
        water="",
        size="",
        pet_safe=False
    )
    assert tags == []
