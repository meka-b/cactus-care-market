import pytest
from pathlib import Path
from PIL import Image
import io
import uuid
import os

from backend import image_service

@pytest.fixture
def mock_dirs(tmp_path, monkeypatch):
    """Override PRODUCTS_DIR and THUMBS_DIR to use tmp_path."""
    products_dir = tmp_path / "products"
    thumbs_dir = tmp_path / "thumbs"
    products_dir.mkdir()
    thumbs_dir.mkdir()

    monkeypatch.setattr(image_service, "PRODUCTS_DIR", products_dir)
    monkeypatch.setattr(image_service, "THUMBS_DIR", thumbs_dir)
    return products_dir, thumbs_dir

def create_dummy_image(width, height, color="red"):
    img = Image.new("RGB", (width, height), color=color)
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

@pytest.fixture
def standard_image_bytes():
    return create_dummy_image(800, 600)

@pytest.fixture
def large_image_bytes():
    return create_dummy_image(2000, 1000)

def test_optimize_and_save_standard(mock_dirs, standard_image_bytes):
    products_dir, thumbs_dir = mock_dirs

    result = image_service.optimize_and_save(standard_image_bytes)

    assert "main" in result
    assert "thumb" in result
    assert "file_id" in result
    assert "main_local" in result
    assert "thumb_local" in result

    main_local = Path(result["main_local"])
    thumb_local = Path(result["thumb_local"])

    assert main_local.exists()
    assert thumb_local.exists()

    assert main_local.parent == products_dir
    assert thumb_local.parent == thumbs_dir

    # Verify main image
    with Image.open(main_local) as img:
        assert img.format == "WEBP"
        assert img.size == (800, 600)

    # Verify thumbnail
    with Image.open(thumb_local) as img:
        assert img.format == "WEBP"
        assert img.width == image_service.THUMB_WIDTH
        assert img.height == int(600 * (image_service.THUMB_WIDTH / 800))

def test_optimize_and_save_large(mock_dirs, large_image_bytes):
    products_dir, thumbs_dir = mock_dirs

    result = image_service.optimize_and_save(large_image_bytes)

    main_local = Path(result["main_local"])
    thumb_local = Path(result["thumb_local"])

    assert main_local.exists()
    assert thumb_local.exists()

    # Verify main image is resized to MAX_WIDTH
    with Image.open(main_local) as img:
        assert img.format == "WEBP"
        assert img.width == image_service.MAX_WIDTH
        assert img.height == int(1000 * (image_service.MAX_WIDTH / 2000))

    # Verify thumbnail
    with Image.open(thumb_local) as img:
        assert img.format == "WEBP"
        assert img.width == image_service.THUMB_WIDTH
        # thumbnail height is calculated based on resized main image.
        # original main size: 2000x1000, resized to 1600x800
        # thumbnail width 400. Ratio: 400/1600 = 0.25. 800*0.25 = 200.
        assert img.height == 200

def test_optimize_and_save_custom_public_base(mock_dirs, standard_image_bytes):
    result = image_service.optimize_and_save(standard_image_bytes, public_base="https://cdn.example.com")

    assert result["main"].startswith("https://cdn.example.com/products/")
    assert result["thumb"].startswith("https://cdn.example.com/thumbs/")
