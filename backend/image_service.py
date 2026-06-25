"""Image optimization (webp + thumbnail)."""
import os
import uuid
from pathlib import Path
from PIL import Image
import io

MEDIA_ROOT = Path(__file__).parent / "media"
PRODUCTS_DIR = MEDIA_ROOT / "products"
THUMBS_DIR = MEDIA_ROOT / "thumbs"
PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
THUMBS_DIR.mkdir(parents=True, exist_ok=True)

MAX_WIDTH = 1600
THUMB_WIDTH = 400


def optimize_and_save(image_bytes: bytes, public_base: str = "/api/media") -> dict:
    """Save image as webp main + thumb. Returns dict with public URLs and local paths."""
    file_id = uuid.uuid4().hex
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    if w > MAX_WIDTH:
        ratio = MAX_WIDTH / w
        img = img.resize((MAX_WIDTH, int(h * ratio)), Image.Resampling.LANCZOS)

    main_name = f"{file_id}.webp"
    main_path = PRODUCTS_DIR / main_name
    img.save(main_path, "WEBP", quality=85, method=6)

    # Thumb
    tw, th = img.size
    ratio = THUMB_WIDTH / tw
    thumb = img.resize((THUMB_WIDTH, int(th * ratio)), Image.Resampling.LANCZOS)
    thumb_name = f"{file_id}.webp"
    thumb_path = THUMBS_DIR / thumb_name
    thumb.save(thumb_path, "WEBP", quality=80, method=6)

    return {
        "main": f"{public_base}/products/{main_name}",
        "thumb": f"{public_base}/thumbs/{thumb_name}",
        "file_id": file_id,
        "main_local": str(main_path),
        "thumb_local": str(thumb_path),
    }
