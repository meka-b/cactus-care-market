import pytest
from backend.constants import compute_tags_from_taxonomy

def test_compute_tags_all_match():
    tags = compute_tags_from_taxonomy(
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
        category="",
        care="",
        light="",
        water="",
        size="",
        pet_safe=False
    )
    assert tags == []
