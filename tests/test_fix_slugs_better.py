import pytest
from backend.fix_slugs_better import slugify

def test_slugify_basic_english():
    assert slugify("Hello World") == "hello-world"
    assert slugify("Test case") == "test-case"

def test_slugify_turkish_lowercase():
    assert slugify("papatya çiçeği") == "papatya-cicegi"
    assert slugify("şemsiye") == "semsiye"
    assert slugify("fıstık") == "fistik"
    assert slugify("üzüm") == "uzum"
    assert slugify("ördek") == "ordek"
    assert slugify("ağaç") == "agac"
    assert slugify("ıspanak") == "ispanak"

def test_slugify_turkish_uppercase():
    assert slugify("PAPATYA ÇİÇEĞİ") == "papatya-cicegi"
    assert slugify("ŞEMSİYE") == "semsiye"
    assert slugify("FISTIK") == "fistik"
    assert slugify("ÜZÜM") == "uzum"
    assert slugify("ÖRDEK") == "ordek"
    assert slugify("AĞAÇ") == "agac"
    assert slugify("ISPANAK") == "ispanak"
    assert slugify("İSPİNOZ") == "ispinoz"

def test_slugify_punctuation_and_symbols():
    assert slugify("hello! world@#") == "hello-world"
    assert slugify("some &*() symbols") == "some-symbols"
    assert slugify("price 100$") == "price-100"

def test_slugify_numbers():
    assert slugify("Version 2.0") == "version-2-0"
    assert slugify("12345") == "12345"

def test_slugify_hyphens():
    assert slugify("hello---world") == "hello-world"
    assert slugify("-leading hyphen") == "leading-hyphen"
    assert slugify("trailing hyphen-") == "trailing-hyphen"
    assert slugify("-surrounded-") == "surrounded"
    assert slugify("---") == ""

def test_slugify_empty_and_special_only():
    assert slugify("") == ""
    assert slugify("!@#$%^&*()") == ""
    assert slugify("   ") == ""
