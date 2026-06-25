"""Enums and landing page slug mappings for Yeşil Dükkan."""
from typing import Dict, List

CATEGORIES = [
    "Kaktüsler", "Sukulentler", "İç Mekan Bitkileri", "Dış Mekan Bitkileri",
    "Meyve Fidanları", "Çiçekler", "Tırmanıcı Bitkiler", "Palmiyeler", "Bonsailer"
]
CARE_LEVELS = ["Kolay Bakım", "Orta Bakım", "Uzman Bakım"]
LIGHT_NEEDS = ["Tam Güneş", "Yarı Gölge", "Gölge"]
WATER_NEEDS = ["Az", "Orta", "Yüksek"]
SIZES = ["Mini (0-20 cm)", "Küçük (20-50 cm)", "Orta (50-100 cm)", "Büyük (100+ cm)"]
POT_SIZES = ["5.5 CM", "8.5 CM", "10.5 CM", "12 CM", "15 CM", "17 CM", "21 CM"]

# Category slug mapping (TR -> slug)
CATEGORY_SLUG: Dict[str, str] = {
    "Kaktüsler": "kaktusler",
    "Sukulentler": "sukulentler",
    "İç Mekan Bitkileri": "ic-mekan-bitkileri",
    "Dış Mekan Bitkileri": "dis-mekan-bitkileri",
    "Meyve Fidanları": "meyve-fidanlari",
    "Çiçekler": "cicekler",
    "Tırmanıcı Bitkiler": "tirmanici-bitkiler",
    "Palmiyeler": "palmiyeler",
    "Bonsailer": "bonsailer",
}

CARE_SLUG: Dict[str, str] = {
    "Kolay Bakım": "kolay-bakim-bitkileri",
    "Orta Bakım": "orta-bakim-bitkileri",
    "Uzman Bakım": "uzman-bakim-bitkileri",
}
LIGHT_SLUG: Dict[str, str] = {
    "Tam Güneş": "tam-gunes-seven-bitkiler",
    "Yarı Gölge": "yari-golge-bitkileri",
    "Gölge": "golge-bitkileri",
}
WATER_SLUG: Dict[str, str] = {
    "Az": "az-sulanan-bitkiler",
    "Orta": "orta-sulanan-bitkiler",
    "Yüksek": "yuksek-sulanan-bitkiler",
}
SIZE_SLUG: Dict[str, str] = {
    "Mini (0-20 cm)": "mini-bitkiler",
    "Küçük (20-50 cm)": "kucuk-bitkiler",
    "Orta (50-100 cm)": "orta-boy-bitkiler",
    "Büyük (100+ cm)": "buyuk-bitkiler",
}

# Landing page meta (slug -> {title, description, filter})
LANDING_PAGES: Dict[str, dict] = {
    # Categories
    "kaktusler": {"title": "Kaktüsler - Yeşil Dükkan", "desc": "Çeşit çeşit kaktüs türleri uygun fiyatlarla. Mini kaktüsten dev türlere binlerce seçenek.", "filter": {"category": "Kaktüsler"}, "h1": "Kaktüsler"},
    "sukulentler": {"title": "Sukulentler - Yeşil Dükkan", "desc": "Bakımı kolay sukulent çeşitleri. İç mekan ve ofis için ideal.", "filter": {"category": "Sukulentler"}, "h1": "Sukulentler"},
    "ic-mekan-bitkileri": {"title": "İç Mekan Bitkileri - Yeşil Dükkan", "desc": "Eviniz ve ofisiniz için iç mekan bitki seçkisi.", "filter": {"category": "İç Mekan Bitkileri"}, "h1": "İç Mekan Bitkileri"},
    "dis-mekan-bitkileri": {"title": "Dış Mekan Bitkileri - Yeşil Dükkan", "desc": "Bahçe ve teras için dış mekan bitkileri.", "filter": {"category": "Dış Mekan Bitkileri"}, "h1": "Dış Mekan Bitkileri"},
    "meyve-fidanlari": {"title": "Meyve Fidanları - Yeşil Dükkan", "desc": "Bahçeniz için meyve fidanı çeşitleri.", "filter": {"category": "Meyve Fidanları"}, "h1": "Meyve Fidanları"},
    "cicekler": {"title": "Çiçekler - Yeşil Dükkan", "desc": "Renkli çiçek çeşitleri.", "filter": {"category": "Çiçekler"}, "h1": "Çiçekler"},
    "tirmanici-bitkiler": {"title": "Tırmanıcı Bitkiler - Yeşil Dükkan", "desc": "Sarmaşık ve tırmanıcı bitki çeşitleri.", "filter": {"category": "Tırmanıcı Bitkiler"}, "h1": "Tırmanıcı Bitkiler"},
    "palmiyeler": {"title": "Palmiyeler - Yeşil Dükkan", "desc": "İç ve dış mekan palmiye çeşitleri.", "filter": {"category": "Palmiyeler"}, "h1": "Palmiyeler"},
    "bonsailer": {"title": "Bonsailer - Yeşil Dükkan", "desc": "El yapımı bonsai ağaç çeşitleri.", "filter": {"category": "Bonsailer"}, "h1": "Bonsailer"},
    # Care
    "kolay-bakim-bitkileri": {"title": "Kolay Bakım Bitkileri - Yeşil Dükkan", "desc": "Yeni başlayanlar için bakımı kolay bitki çeşitleri.", "filter": {"care_level": "Kolay Bakım"}, "h1": "Kolay Bakım Bitkileri"},
    "orta-bakim-bitkileri": {"title": "Orta Bakım Bitkileri - Yeşil Dükkan", "desc": "Orta düzey bakım gerektiren bitkiler.", "filter": {"care_level": "Orta Bakım"}, "h1": "Orta Bakım Bitkileri"},
    "uzman-bakim-bitkileri": {"title": "Uzman Bakım Bitkileri - Yeşil Dükkan", "desc": "Bitki uzmanları için özel çeşitler.", "filter": {"care_level": "Uzman Bakım"}, "h1": "Uzman Bakım Bitkileri"},
    # Light
    "tam-gunes-seven-bitkiler": {"title": "Tam Güneş Seven Bitkiler - Yeşil Dükkan", "desc": "Bol güneş seven bitki çeşitleri.", "filter": {"light_need": "Tam Güneş"}, "h1": "Tam Güneş Seven Bitkiler"},
    "yari-golge-bitkileri": {"title": "Yarı Gölge Bitkiler - Yeşil Dükkan", "desc": "Yarı gölge seven bitki çeşitleri.", "filter": {"light_need": "Yarı Gölge"}, "h1": "Yarı Gölge Bitkileri"},
    "golge-bitkileri": {"title": "Gölge Bitkileri - Yeşil Dükkan", "desc": "Az ışıkta yetişen bitki çeşitleri.", "filter": {"light_need": "Gölge"}, "h1": "Gölge Bitkileri"},
    # Water
    "az-sulanan-bitkiler": {"title": "Az Sulanan Bitkiler - Yeşil Dükkan", "desc": "Az su isteyen kurakçıl bitki çeşitleri.", "filter": {"water_need": "Az"}, "h1": "Az Sulanan Bitkiler"},
    "orta-sulanan-bitkiler": {"title": "Orta Sulanan Bitkiler - Yeşil Dükkan", "desc": "Düzenli sulama gerektiren bitkiler.", "filter": {"water_need": "Orta"}, "h1": "Orta Sulanan Bitkiler"},
    "yuksek-sulanan-bitkiler": {"title": "Bol Su Seven Bitkiler - Yeşil Dükkan", "desc": "Bol su seven bitki çeşitleri.", "filter": {"water_need": "Yüksek"}, "h1": "Bol Su Seven Bitkiler"},
    # Size
    "mini-bitkiler": {"title": "Mini Bitkiler - Yeşil Dükkan", "desc": "0-20 cm arası mini bitki çeşitleri.", "filter": {"size": "Mini (0-20 cm)"}, "h1": "Mini Bitkiler"},
    "kucuk-bitkiler": {"title": "Küçük Boy Bitkiler - Yeşil Dükkan", "desc": "20-50 cm arası küçük boy bitkiler.", "filter": {"size": "Küçük (20-50 cm)"}, "h1": "Küçük Boy Bitkiler"},
    "orta-boy-bitkiler": {"title": "Orta Boy Bitkiler - Yeşil Dükkan", "desc": "50-100 cm arası orta boy bitkiler.", "filter": {"size": "Orta (50-100 cm)"}, "h1": "Orta Boy Bitkiler"},
    "buyuk-bitkiler": {"title": "Büyük Boy Bitkiler - Yeşil Dükkan", "desc": "100+ cm büyük boy bitki çeşitleri.", "filter": {"size": "Büyük (100+ cm)"}, "h1": "Büyük Boy Bitkiler"},
    # Special
    "pet-friendly-bitkiler": {"title": "Pet Friendly Bitkiler - Yeşil Dükkan", "desc": "Evcil hayvanlar için güvenli bitki çeşitleri.", "filter": {"pet_safe": True}, "h1": "Pet Friendly Bitkiler"},
}


def compute_tags_from_taxonomy(category: str, care: str, light: str, water: str, size: str, pet_safe: bool) -> List[str]:
    """Generate list of landing page slugs this product belongs to."""
    tags = []
    if category in CATEGORY_SLUG:
        tags.append(CATEGORY_SLUG[category])
    if care in CARE_SLUG:
        tags.append(CARE_SLUG[care])
    if light in LIGHT_SLUG:
        tags.append(LIGHT_SLUG[light])
    if water in WATER_SLUG:
        tags.append(WATER_SLUG[water])
    if size in SIZE_SLUG:
        tags.append(SIZE_SLUG[size])
    if pet_safe:
        tags.append("pet-friendly-bitkiler")
    return tags
