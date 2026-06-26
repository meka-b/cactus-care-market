def get_slug_from_taxonomy(taxonomy: dict, item_name: str, group_key: str, filter_type: str = None) -> str:
    if not item_name: return ""
    for item in taxonomy.get(group_key, []):
        if item.get("name") == item_name:
            if filter_type and item.get("type") != filter_type:
                continue
            return item.get("slug", "")
    return ""

def compute_tags_from_taxonomy(taxonomy: dict, category: str, care: str, light: str, water: str, size: str, pet_safe: bool) -> list:
    tags = []
    s = get_slug_from_taxonomy(taxonomy, category, "product_categories")
    if s: tags.append(s)
    s = get_slug_from_taxonomy(taxonomy, care, "filters", "care_level")
    if s: tags.append(s)
    s = get_slug_from_taxonomy(taxonomy, light, "filters", "light_need")
    if s: tags.append(s)
    s = get_slug_from_taxonomy(taxonomy, water, "filters", "water_need")
    if s: tags.append(s)
    s = get_slug_from_taxonomy(taxonomy, size, "filters", "size")
    if s: tags.append(s)
    if pet_safe:
        for fil in taxonomy.get("filters", []):
            if fil.get("type") == "pet_safe":
                tags.append(fil.get("slug"))
                break
    return tags

def get_taxonomy_names(taxonomy: dict, group_key: str, filter_type: str = None) -> list:
    names = []
    for item in taxonomy.get(group_key, []):
        if filter_type and item.get("type") != filter_type:
            continue
        names.append(item.get("name"))
    return names
