import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

def now_utc():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class DBUser(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="customer")
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    addresses: Mapped[list] = mapped_column(JSON, default=list) # Storing list of dicts
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class DBProduct(Base):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    scientific_name: Mapped[str] = mapped_column(String(255))
    scientific_species: Mapped[str] = mapped_column(String(100), nullable=True)
    common_name_tr: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    species_slug: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    category: Mapped[str] = mapped_column(String(100))
    care_level: Mapped[str] = mapped_column(String(50))
    light_need: Mapped[str] = mapped_column(String(50))
    water_need: Mapped[str] = mapped_column(String(50))
    size: Mapped[str] = mapped_column(String(50))
    pet_safe: Mapped[bool] = mapped_column(Boolean, default=False)
    pot_size: Mapped[str] = mapped_column(String(50), nullable=True)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    short_description: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    care_tips: Mapped[list] = mapped_column(JSON, default=list)
    meta_title: Mapped[str] = mapped_column(String(255), default="")
    meta_description: Mapped[str] = mapped_column(Text, default="")
    images: Mapped[list] = mapped_column(JSON, default=list)
    advanced_guide: Mapped[dict] = mapped_column(JSON, default=dict)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

class DBOrder(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    email: Mapped[str] = mapped_column(String(255))
    subtotal: Mapped[float] = mapped_column(Float)
    shipping: Mapped[float] = mapped_column(Float, default=0.0)
    discount: Mapped[float] = mapped_column(Float, default=0.0)
    coupon_code: Mapped[str] = mapped_column(String(100), nullable=True)
    bundle_discount: Mapped[float] = mapped_column(Float, default=0.0)
    applied_campaign_ids: Mapped[list] = mapped_column(JSON, default=list)
    total: Mapped[float] = mapped_column(Float)
    address: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    tracking_code: Mapped[str] = mapped_column(String(100), nullable=True)
    payment_provider: Mapped[str] = mapped_column(String(50), default="iyzico")
    payment_ref: Mapped[str] = mapped_column(String(255), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(50), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    
    items: Mapped[list["DBOrderItem"]] = relationship("DBOrderItem", back_populates="order", cascade="all, delete-orphan")

class DBOrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id"))
    product_id: Mapped[str] = mapped_column(String(36))
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255))
    price: Mapped[float] = mapped_column(Float)
    quantity: Mapped[int] = mapped_column(Integer)
    image: Mapped[str] = mapped_column(String(255), nullable=True)
    campaign_id: Mapped[str] = mapped_column(String(36), nullable=True)

    order: Mapped["DBOrder"] = relationship("DBOrder", back_populates="items")

class DBWishlistItem(Base):
    __tablename__ = "wishlist_items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class DBReview(Base):
    __tablename__ = "reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"))
    product_slug: Mapped[str] = mapped_column(String(255))
    user_id: Mapped[str] = mapped_column(String(36), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class DBCoupon(Base):
    __tablename__ = "coupons"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(50))
    value: Mapped[float] = mapped_column(Float, default=0.0)
    min_order: Mapped[float] = mapped_column(Float, default=0.0)
    max_uses: Mapped[int] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class DBBlogPost(Base):
    __tablename__ = "blog_posts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    excerpt: Mapped[str] = mapped_column(Text, default="")
    cover_image: Mapped[str] = mapped_column(String(255), nullable=True)
    content: Mapped[dict] = mapped_column(JSON, default=dict)
    meta_title: Mapped[str] = mapped_column(String(255), default="")
    meta_description: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list] = mapped_column(JSON, default=list)
    author_name: Mapped[str] = mapped_column(String(255), default="Yeşil Dükkan")
    related_product_ids: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

class DBCampaign(Base):
    __tablename__ = "campaigns"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[int] = mapped_column(Integer, default=100)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    primary_product_id: Mapped[str] = mapped_column(String(36))
    related_product_ids: Mapped[list] = mapped_column(JSON, default=list)
    bundle_price: Mapped[float] = mapped_column(Float, nullable=True)
    discount_pct: Mapped[float] = mapped_column(Float, nullable=True)
    discount_amount: Mapped[float] = mapped_column(Float, nullable=True)
    free_product_id: Mapped[str] = mapped_column(String(36), nullable=True)
    free_qty: Mapped[int] = mapped_column(Integer, default=1)
    quantity_tiers: Mapped[list] = mapped_column(JSON, default=list)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    badge_text: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

class DBSettings(Base):
    """Store application settings since we don't have MongoDB's dynamic collections anymore."""
    __tablename__ = "settings"
    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class DBRagDocument(Base):
    __tablename__ = "rag_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    filename: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    source_type: Mapped[str] = mapped_column(String(50)) # 'json' or 'markdown'
    char_count: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    chunks: Mapped[list["DBRagChunk"]] = relationship("DBRagChunk", back_populates="document", cascade="all, delete-orphan")


class DBRagChunk(Base):
    __tablename__ = "rag_chunks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("rag_documents.id"))
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list] = mapped_column(JSON) # Store vector as JSON array
    chunk_index: Mapped[int] = mapped_column(Integer)

    document: Mapped["DBRagDocument"] = relationship("DBRagDocument", back_populates="chunks")

# ============================================================
# KNOWLEDGE GRAPH & TAXONOMY (Phase 10)
# ============================================================

class DBTaxonomyFamily(Base):
    __tablename__ = "taxonomy_families"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class DBTaxonomyGenus(Base):
    __tablename__ = "taxonomy_genuses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    family_slug: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class DBSpecies(Base):
    __tablename__ = "kg_species"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    scientific_name: Mapped[str] = mapped_column(String(255))
    common_names: Mapped[list] = mapped_column(JSON, default=list) # list of str
    family_slug: Mapped[str] = mapped_column(String(255), index=True, nullable=True)
    genus_slug: Mapped[str] = mapped_column(String(255), index=True, nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    etymology: Mapped[str] = mapped_column(Text, default="")
    care_guide: Mapped[dict] = mapped_column(JSON, default=dict) # {light, water, temperature, humidity, toxicity, growth_rate}
    faqs: Mapped[list] = mapped_column(JSON, default=list) # [{question, answer}]
    images: Mapped[list] = mapped_column(JSON, default=list) # [{url, alt, source}]
    similar_species_slugs: Mapped[list] = mapped_column(JSON, default=list)
    diseases_slugs: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

class DBDisease(Base):
    __tablename__ = "kg_diseases"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    symptoms: Mapped[list] = mapped_column(JSON, default=list) # list of str
    treatment: Mapped[str] = mapped_column(Text, default="")
    images: Mapped[list] = mapped_column(JSON, default=list) # [{url, alt, source}]
    affected_species_slugs: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

class DBKnowledgeGraphJob(Base):
    __tablename__ = "kg_jobs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    product_id: Mapped[str] = mapped_column(String(36))
    scientific_name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="pending") # pending, researching, completed, failed
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

