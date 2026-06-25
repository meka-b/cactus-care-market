"""Pydantic models for Yeşil Dükkan."""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal, Dict
from datetime import datetime, timezone
import uuid


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProductImage(BaseModel):
    main: str  # URL to webp
    thumb: str  # URL to thumbnail webp
    alt: Optional[str] = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scientific_name: str
    scientific_species: Optional[str] = None
    common_name_tr: str
    slug: str
    species_slug: Optional[str] = None
    category: str
    care_level: str
    light_need: str
    water_need: str
    size: str
    pet_safe: bool = False
    pot_size: Optional[str] = None
    tags: List[str] = []  # SEO landing slugs
    short_description: str = ""
    description: str = ""
    care_tips: List[str] = []
    meta_title: str = ""
    meta_description: str = ""
    images: List[ProductImage] = []
    advanced_guide: Optional[dict] = Field(default_factory=dict)
    price: float = 0.0
    stock: int = 0
    is_published: bool = True
    is_featured: bool = False
    created_at: str = Field(default_factory=now)
    updated_at: str = Field(default_factory=now)


class ProductCreate(BaseModel):
    scientific_name: str
    scientific_species: Optional[str] = None
    common_name_tr: str
    slug: str
    species_slug: Optional[str] = None
    category: str
    care_level: str
    light_need: str
    water_need: str
    size: str
    pet_safe: bool = False
    pot_size: Optional[str] = None
    short_description: str = ""
    description: str = ""
    care_tips: List[str] = []
    meta_title: str = ""
    meta_description: str = ""
    images: List[ProductImage] = []
    advanced_guide: Optional[dict] = Field(default_factory=dict)
    price: float = 0.0
    stock: int = 0
    is_published: bool = True
    is_featured: bool = False


class ProductUpdate(BaseModel):
    common_name_tr: Optional[str] = None
    scientific_species: Optional[str] = None
    slug: Optional[str] = None
    species_slug: Optional[str] = None
    category: Optional[str] = None
    care_level: Optional[str] = None
    light_need: Optional[str] = None
    water_need: Optional[str] = None
    size: Optional[str] = None
    pet_safe: Optional[bool] = None
    pot_size: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    care_tips: Optional[List[str]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    images: Optional[List[ProductImage]] = None
    advanced_guide: Optional[dict] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: Literal["customer", "admin"] = "customer"
    phone: Optional[str] = None
    addresses: List[dict] = []
    created_at: str = Field(default_factory=now)


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    name: str


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

class Address(BaseModel):
    full_name: str
    phone: str
    city: str
    district: str
    address_line: str
    zip_code: Optional[str] = None


class OrderItem(BaseModel):
    product_id: str
    name: str
    slug: str
    price: float
    quantity: int
    image: Optional[str] = None
    campaign_id: Optional[str] = None  # Phase 9: Bundle item ise hangi kampanyaya ait


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    email: EmailStr
    items: List[OrderItem]
    subtotal: float
    shipping: float = 0.0
    discount: float = 0.0
    coupon_code: Optional[str] = None
    bundle_discount: float = 0.0          # Phase 9: tüm bundle indirimleri toplamı
    applied_campaign_ids: List[str] = []  # Phase 9: hangi kampanyalar uygulandı
    total: float
    address: Address
    status: Literal["pending", "paid", "failed", "shipped", "delivered", "cancelled"] = "pending"
    payment_provider: str = "iyzico"
    payment_ref: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=now)
    updated_at: str = Field(default_factory=now)


class CheckoutRequest(BaseModel):
    email: EmailStr
    address: Address
    items: List[OrderItem]
    notes: Optional[str] = None
    coupon_code: Optional[str] = None
    # Phase 9: Sepetteki bundle'lar (her biri kendi item'ları ile)
    applied_campaigns: Optional[List[Dict]] = None  # [{campaign_id, items:[{product_id, quantity}]}]


class AISuggestion(BaseModel):
    """Output of admin AI analysis (PlantNet + Mistral)."""
    scientific_name: str
    scientific_species: Optional[str] = None
    common_name_tr: str
    slug: str
    species_slug: Optional[str] = None
    category: str
    care_level: str
    light_need: str
    water_need: str
    size: str
    pet_safe: bool
    tags: List[str]
    short_description: str
    description: str
    care_tips: List[str]
    alt_text: str
    meta_title: str
    meta_description: str
    plantnet_score: float = 0.0
    common_names: List[str] = []
    images: List[ProductImage] = []
    advanced_guide: Optional[dict] = Field(default_factory=dict)
    image: Optional[ProductImage] = None


# ============================================================
# Phase 3 models: Wishlist, Review, Coupon, Blog
# ============================================================

class WishlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    created_at: str = Field(default_factory=now)


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_slug: str
    user_id: Optional[str] = None
    name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    status: Literal["pending", "approved", "rejected"] = "pending"
    created_at: str = Field(default_factory=now)


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=2000)


class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    type: Literal["percentage", "fixed_amount", "free_shipping"]
    value: float = 0.0  # % for percentage, TL for fixed
    min_order: float = 0.0
    max_uses: Optional[int] = None
    used_count: int = 0
    valid_until: Optional[str] = None  # ISO date
    is_active: bool = True
    description: Optional[str] = None
    created_at: str = Field(default_factory=now)


class CouponCreate(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    type: Literal["percentage", "fixed_amount", "free_shipping"]
    value: float = 0.0
    min_order: float = 0.0
    max_uses: Optional[int] = None
    valid_until: Optional[str] = None
    is_active: bool = True
    description: Optional[str] = None


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    type: Optional[Literal["percentage", "fixed_amount", "free_shipping"]] = None
    value: Optional[float] = None
    min_order: Optional[float] = None
    max_uses: Optional[int] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class CouponValidate(BaseModel):
    code: str
    subtotal: float


class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    excerpt: str = ""
    cover_image: Optional[str] = None
    content: dict = {}  # EditorJS JSON
    meta_title: str = ""
    meta_description: str = ""
    tags: List[str] = []
    author_name: str = "Yeşil Dükkan"
    related_product_ids: List[str] = []
    status: Literal["draft", "published"] = "draft"
    published_at: Optional[str] = None
    view_count: int = 0
    created_at: str = Field(default_factory=now)
    updated_at: str = Field(default_factory=now)


class BlogPostCreate(BaseModel):
    slug: str
    title: str
    excerpt: str = ""
    cover_image: Optional[str] = None
    content: dict = {}
    meta_title: str = ""
    meta_description: str = ""
    tags: List[str] = []
    author_name: str = "Yeşil Dükkan"
    related_product_ids: List[str] = []
    status: Literal["draft", "published"] = "draft"


class BlogPostUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    content: Optional[dict] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = None
    author_name: Optional[str] = None
    related_product_ids: Optional[List[str]] = None
    status: Optional[Literal["draft", "published"]] = None


class BlogSEORequest(BaseModel):
    title: str
    excerpt: Optional[str] = ""
    target_keywords: Optional[str] = ""


# ============================================================
# Phase 4: Chat + Settings
# ============================================================
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: Optional[List[dict]] = None
    context: Optional[dict] = None


class APIKeysUpdate(BaseModel):
    plantnet: Optional[str] = None
    mistral: Optional[str] = None
    exa: Optional[str] = None
    iyzico_api: Optional[str] = None
    iyzico_secret: Optional[str] = None
    resend: Optional[str] = None
    ga_id: Optional[str] = None


class MenuLink(BaseModel):
    label: str
    url: str
    order: int = 99
    visible: bool = True


class MenuUpdate(BaseModel):
    header_links: Optional[List[MenuLink]] = None
    landing_visibility: Optional[Dict[str, bool]] = None


class GeneralUpdate(BaseModel):
    site_name: Optional[str] = None
    contact_email: Optional[str] = None
    free_shipping_threshold: Optional[float] = None
    shipping_fee: Optional[float] = None


# ============================================================
# Phase 9: Product Bundles / Campaigns
# ============================================================
CampaignType = Literal[
    "fixed_bundle",       # A+B+C = Sabit toplam fiyat (ör: 1000 TL yerine 750 TL)
    "percentage_bundle",  # Bundle'a yüzdesel indirim (ör: %25 indirim)
    "fixed_amount_bundle",# Bundle'a sabit TL indirim (ör: -200 TL)
    "buy_x_get_y",        # X al Y ücretsiz (ör: Saksı al bakım spreyi bedava)
    "quantity_break",     # Tek üründe miktar indirimi (2 al %10, 3 al %15, ...)
]


class QuantityTier(BaseModel):
    min_qty: int = Field(ge=2)
    discount_pct: float = Field(ge=0, le=100)


class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: CampaignType
    is_active: bool = True
    priority: int = 100  # düşük sayı = yüksek öncelik
    start_at: Optional[str] = None  # ISO datetime
    end_at: Optional[str] = None    # ISO datetime
    # Bundle products
    primary_product_id: str
    related_product_ids: List[str] = []  # fixed/pct/fix_amount/bxgy için ek ürünler
    # Type-specific
    bundle_price: Optional[float] = None        # fixed_bundle
    discount_pct: Optional[float] = None        # percentage_bundle
    discount_amount: Optional[float] = None     # fixed_amount_bundle
    free_product_id: Optional[str] = None       # buy_x_get_y (Y ürün, ücretsiz gelen)
    free_qty: int = 1                           # buy_x_get_y
    quantity_tiers: List[QuantityTier] = []     # quantity_break
    # Display
    description: Optional[str] = None
    badge_text: Optional[str] = None
    created_at: str = Field(default_factory=now)
    updated_at: str = Field(default_factory=now)


class CampaignCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    type: CampaignType
    is_active: bool = True
    priority: int = 100
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    primary_product_id: str
    related_product_ids: List[str] = []
    bundle_price: Optional[float] = None
    discount_pct: Optional[float] = None
    discount_amount: Optional[float] = None
    free_product_id: Optional[str] = None
    free_qty: int = 1
    quantity_tiers: List[QuantityTier] = []
    description: Optional[str] = None
    badge_text: Optional[str] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[CampaignType] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    primary_product_id: Optional[str] = None
    related_product_ids: Optional[List[str]] = None
    bundle_price: Optional[float] = None
    discount_pct: Optional[float] = None
    discount_amount: Optional[float] = None
    free_product_id: Optional[str] = None
    free_qty: Optional[int] = None
    quantity_tiers: Optional[List[QuantityTier]] = None
    description: Optional[str] = None
    badge_text: Optional[str] = None


class BundleCalcRequest(BaseModel):
    """Bundle hesaplamasını frontend'in backend'den doğrulaması için."""
    campaign_id: str
    selected_product_ids: List[str]  # kullanıcının checkbox ile seçtikleri


class BundleCartItem(BaseModel):
    """Checkout sırasında bundle'a bağlı item'lar."""
    product_id: str
    name: str
    slug: str
    price: float
    quantity: int = 1
    image: Optional[str] = None
    campaign_id: str  # Hangi kampanyaya ait


# ============================================================
# Phase 10: Knowledge Graph & Taxonomy
# ============================================================

class TaxonomyFamily(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    name: str
    description: Optional[str] = None
    created_at: str = Field(default_factory=now)

class TaxonomyFamilyCreate(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None

class TaxonomyGenus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    name: str
    family_slug: str
    description: Optional[str] = None
    created_at: str = Field(default_factory=now)

class TaxonomyGenusCreate(BaseModel):
    slug: str
    name: str
    family_slug: str
    description: Optional[str] = None

class SpeciesFAQ(BaseModel):
    question: str
    answer: str

class SpeciesImage(BaseModel):
    url: str
    alt: str
    source: Optional[str] = None

class Species(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    scientific_name: str
    common_names: List[str] = []
    family_slug: Optional[str] = None
    genus_slug: Optional[str] = None
    description: str = ""
    etymology: str = ""
    care_guide: dict = {}
    faqs: List[SpeciesFAQ] = []
    images: List[SpeciesImage] = []
    similar_species_slugs: List[str] = []
    diseases_slugs: List[str] = []
    created_at: str = Field(default_factory=now)
    updated_at: str = Field(default_factory=now)

class SpeciesCreate(BaseModel):
    slug: str
    scientific_name: str
    common_names: List[str] = []
    family_slug: Optional[str] = None
    genus_slug: Optional[str] = None
    description: str = ""
    etymology: str = ""
    care_guide: dict = {}
    faqs: List[SpeciesFAQ] = []
    images: List[SpeciesImage] = []
    similar_species_slugs: List[str] = []
    diseases_slugs: List[str] = []

class Disease(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    name: str
    description: str = ""
    symptoms: List[str] = []
    treatment: str = ""
    images: List[SpeciesImage] = []
    affected_species_slugs: List[str] = []
    created_at: str = Field(default_factory=now)
    updated_at: str = Field(default_factory=now)

class DiseaseCreate(BaseModel):
    slug: str
    name: str
    description: str = ""
    symptoms: List[str] = []
    treatment: str = ""
    images: List[SpeciesImage] = []
    affected_species_slugs: List[str] = []

