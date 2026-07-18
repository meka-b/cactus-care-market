import pytest
from taxonomy_helpers import compute_tags_from_taxonomy

MOCK_TAXONOMY = {
    "product_categories": [
        {"name": "Kaktüsler", "slug": "kaktusler", "type": "category"},
        {"name": "Sukulentler", "slug": "sukulentler", "type": "category"}
    ],
    "filters": [
        {"name": "Kolay Bakım", "slug": "kolay-bakim-bitkileri", "type": "care_level"},
        {"name": "Tam Güneş", "slug": "tam-gunes-seven-bitkiler", "type": "light_need"},
        {"name": "Yarı Gölge", "slug": "yari-golge-bitkileri", "type": "light_need"},
        {"name": "Az", "slug": "az-sulanan-bitkiler", "type": "water_need"},
        {"name": "Orta", "slug": "orta-sulanan-bitkiler", "type": "water_need"},
        {"name": "Mini (0-20 cm)", "slug": "mini-bitkiler", "type": "size"},
        {"name": "Pet Safe", "slug": "pet-friendly-bitkiler", "type": "pet_safe"}
    ]
}

def test_compute_tags_all_match():
    tags = compute_tags_from_taxonomy(
        taxonomy=MOCK_TAXONOMY,
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
        taxonomy=MOCK_TAXONOMY,
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
        taxonomy=MOCK_TAXONOMY,
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
        taxonomy=MOCK_TAXONOMY,
        category="",
        care="",
        light="",
        water="",
        size="",
        pet_safe=False
    )
    assert tags == []
