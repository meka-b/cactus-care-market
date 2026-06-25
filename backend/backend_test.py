"""
Comprehensive backend API tests for Yeşil Dükkan
Tests all endpoints with proper auth handling
"""
import requests
import sys
from datetime import datetime

BASE_URL = "https://cactus-care-market.preview.emergentagent.com/api"

class YesilDukkanTester:
    def __init__(self):
        self.admin_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.product_slug = None
        self.coupon_id = None
        self.blog_id = None
        self.review_id = None

    def log(self, emoji, message):
        print(f"{emoji} {message}")

    def test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{BASE_URL}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log("✅", f"PASSED - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log("❌", f"FAILED - Expected {expected_status}, got {response.status_code}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                try:
                    self.log("📄", f"Response: {response.text[:200]}")
                except:
                    pass
                return False, {}

        except Exception as e:
            self.log("❌", f"FAILED - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def run_all_tests(self):
        print("=" * 60)
        print("🌿 Yeşil Dükkan Backend API Test Suite")
        print("=" * 60)

        # 1. Health Check
        print("\n" + "=" * 60)
        print("📋 SECTION 1: HEALTH & TAXONOMY")
        print("=" * 60)
        self.test("Health Check", "GET", "/", 200)
        success, data = self.test("Get Taxonomy", "GET", "/taxonomy", 200)
        if success:
            pot_sizes = data.get('pot_sizes', [])
            if len(pot_sizes) == 7:
                self.log("✓", f"pot_sizes has 7 values: {pot_sizes}")
            else:
                self.log("❌", f"pot_sizes should have 7 values, got {len(pot_sizes)}")

        # 2. Landing Pages
        print("\n" + "=" * 60)
        print("📋 SECTION 2: LANDING PAGES (SEO)")
        print("=" * 60)
        self.test("List All Landing Slugs", "GET", "/landing", 200)
        self.test("Landing: Kaktüsler", "GET", "/landing/kaktusler", 200)
        self.test("Landing: Kolay Bakım (multi-tag)", "GET", "/landing/kolay-bakim-bitkileri", 200)
        self.test("Landing: Pet Friendly", "GET", "/landing/pet-friendly-bitkiler", 200)

        # 3. Products (Public)
        print("\n" + "=" * 60)
        print("📋 SECTION 3: PRODUCTS (PUBLIC)")
        print("=" * 60)
        success, data = self.test("List Products", "GET", "/products", 200)
        if success and data.get('items'):
            self.product_slug = data['items'][0].get('slug')
            self.log("💾", f"Saved product slug: {self.product_slug}")

        self.test("List Products with Filters", "GET", "/products", 200, 
                 params={'category': 'Kaktüsler', 'care': 'Kolay Bakım'})
        self.test("List Products with Sort", "GET", "/products", 200, 
                 params={'sort': 'price_asc'})
        self.test("Featured Products", "GET", "/products/featured", 200)
        
        if self.product_slug:
            success, data = self.test("Get Product by Slug", "GET", f"/products/by-slug/{self.product_slug}", 200)
            if success:
                self.log("✓", f"Product returned with related products")

        # 4. Auth
        print("\n" + "=" * 60)
        print("📋 SECTION 4: AUTHENTICATION")
        print("=" * 60)
        
        # Register new user
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, data = self.test("Register New User", "POST", "/auth/register", 200, {
            "email": test_email,
            "password": "Test1234!",
            "name": "Test User"
        })
        if success and data.get('token'):
            self.customer_token = data['token']
            self.log("💾", "Saved customer token")

        # Login admin
        success, data = self.test("Login Admin", "POST", "/auth/login", 200, {
            "email": "admin@yesildukkan.com",
            "password": "Admin1234!"
        })
        if success and data.get('token'):
            self.admin_token = data['token']
            self.log("💾", "Saved admin token")

        # Login customer
        success, data = self.test("Login Customer", "POST", "/auth/login", 200, {
            "email": "demo@yesildukkan.com",
            "password": "Demo1234!"
        })

        # Test /me endpoint
        if self.admin_token:
            self.test("Get Current User (Admin)", "GET", "/auth/me", 200, token=self.admin_token)
        if self.customer_token:
            self.test("Get Current User (Customer)", "GET", "/auth/me", 200, token=self.customer_token)

        # Test invalid credentials
        self.test("Login with Invalid Credentials", "POST", "/auth/login", 401, {
            "email": "wrong@test.com",
            "password": "wrongpass"
        })

        # 5. Admin Endpoints (Authorization)
        print("\n" + "=" * 60)
        print("📋 SECTION 5: ADMIN ENDPOINTS (AUTH ONLY)")
        print("=" * 60)
        
        # Test AI analyze endpoint - TOKEN CHECK ONLY (no real file upload)
        self.test("AI Analyze - No Token (401)", "POST", "/admin/ai/analyze", 401)
        if self.customer_token:
            self.test("AI Analyze - Customer Token (403)", "POST", "/admin/ai/analyze", 403, token=self.customer_token)
        # NOTE: We do NOT test actual AI analysis as it's expensive
        self.log("⚠️", "Skipping real AI analysis test (expensive API calls)")

        # Admin products
        if self.admin_token:
            self.test("Admin: List Products", "GET", "/admin/products", 200, token=self.admin_token)
            self.test("Admin: Get Stats", "GET", "/admin/stats", 200, token=self.admin_token)
            self.test("Admin: List Orders", "GET", "/admin/orders", 200, token=self.admin_token)
        
        # Test unauthorized access
        self.test("Admin Products - No Token (401)", "GET", "/admin/products", 401)
        if self.customer_token:
            self.test("Admin Products - Customer Token (403)", "GET", "/admin/products", 403, token=self.customer_token)

        # 6. Orders / Checkout
        print("\n" + "=" * 60)
        print("📋 SECTION 6: ORDERS & CHECKOUT")
        print("=" * 60)
        
        # Test checkout (only verify payment_url is returned, don't complete payment)
        if self.product_slug:
            checkout_data = {
                "email": "test@test.com",
                "address": {
                    "full_name": "Test User",
                    "phone": "+905555555555",
                    "city": "İstanbul",
                    "district": "Kadıköy",
                    "address_line": "Test Mahallesi Test Sokak No:1",
                    "zip_code": "34000"
                },
                "items": [{
                    "product_id": "test-id",
                    "name": "Test Product",
                    "slug": self.product_slug,
                    "price": 99.90,
                    "quantity": 1,
                    "image": None
                }],
                "notes": "Test order"
            }
            success, data = self.test("Create Checkout", "POST", "/orders/checkout", 200, checkout_data)
            if success:
                if data.get('payment_url'):
                    self.log("✓", f"Payment URL returned: {data['payment_url'][:50]}...")
                    self.log("⚠️", "NOT completing actual payment (sandbox test)")
                    order_id = data.get('order_id')
                    if order_id:
                        self.test("Get Order by ID", "GET", f"/orders/{order_id}", 200)
                else:
                    self.log("❌", "No payment_url in response")

        # 7. SEO
        print("\n" + "=" * 60)
        print("📋 SECTION 7: SEO ENDPOINTS")
        print("=" * 60)
        success, data = self.test("Get Sitemap XML", "GET", "/seo/sitemap.xml", 200)
        if success:
            self.log("✓", "Sitemap XML returned")
        
        success, data = self.test("Get Robots.txt", "GET", "/seo/robots.txt", 200)
        if success:
            self.log("✓", "Robots.txt returned")

        # 8. PHASE 3: WISHLIST
        print("\n" + "=" * 60)
        print("📋 SECTION 8: WISHLIST (PHASE 3)")
        print("=" * 60)
        
        # Test without auth
        self.test("Wishlist Toggle - No Auth (401)", "POST", "/wishlist/toggle", 401, {"product_id": "test-id"})
        
        # Test with customer auth
        if self.customer_token and self.product_slug:
            # Get product ID first
            success, prod_data = self.test("Get Product for Wishlist", "GET", f"/products/by-slug/{self.product_slug}", 200)
            if success:
                product_id = prod_data.get('product', {}).get('id')
                if product_id:
                    # Add to wishlist
                    success, data = self.test("Wishlist Toggle - Add", "POST", "/wishlist/toggle", 200, 
                                            {"product_id": product_id}, token=self.customer_token)
                    if success and data.get('in_wishlist'):
                        self.log("✓", "Product added to wishlist")
                    
                    # Get wishlist
                    success, data = self.test("Get Wishlist", "GET", "/wishlist", 200, token=self.customer_token)
                    if success:
                        self.log("✓", f"Wishlist has {len(data.get('products', []))} products")
                    
                    # Get wishlist IDs
                    success, data = self.test("Get Wishlist IDs", "GET", "/wishlist/ids", 200, token=self.customer_token)
                    if success:
                        self.log("✓", f"Wishlist IDs: {data.get('ids', [])}")
                    
                    # Remove from wishlist
                    success, data = self.test("Wishlist Toggle - Remove", "POST", "/wishlist/toggle", 200, 
                                            {"product_id": product_id}, token=self.customer_token)
                    if success and not data.get('in_wishlist'):
                        self.log("✓", "Product removed from wishlist")

        # 9. PHASE 3: REVIEWS
        print("\n" + "=" * 60)
        print("📋 SECTION 9: REVIEWS (PHASE 3)")
        print("=" * 60)
        
        if self.product_slug:
            # Get reviews (public, should be empty or approved only)
            success, data = self.test("Get Product Reviews (Public)", "GET", f"/products/{self.product_slug}/reviews", 200)
            if success:
                self.log("✓", f"Reviews: {data.get('count', 0)} approved reviews")
            
            # Create review without auth
            self.test("Create Review - No Auth (401)", "POST", f"/products/{self.product_slug}/reviews", 401, 
                     {"rating": 5, "comment": "Great plant!"})
            
            # Create review with auth
            if self.customer_token:
                success, data = self.test("Create Review - With Auth", "POST", f"/products/{self.product_slug}/reviews", 200, 
                                        {"rating": 5, "comment": "Amazing plant! Very healthy and beautiful."}, 
                                        token=self.customer_token)
                if success:
                    self.review_id = data.get('id')
                    self.log("💾", f"Created review ID: {self.review_id}")
        
        # Admin review management
        if self.admin_token:
            success, data = self.test("Admin: List All Reviews", "GET", "/admin/reviews", 200, token=self.admin_token)
            if success:
                self.log("✓", f"Total reviews: {data.get('total', 0)}")
            
            success, data = self.test("Admin: List Pending Reviews", "GET", "/admin/reviews", 200, 
                                    params={"status": "pending"}, token=self.admin_token)
            if success:
                pending = data.get('items', [])
                self.log("✓", f"Pending reviews: {len(pending)}")
                if pending and not self.review_id:
                    self.review_id = pending[0].get('id')
            
            # Update review status
            if self.review_id:
                success, data = self.test("Admin: Approve Review", "PATCH", f"/admin/reviews/{self.review_id}", 200, 
                                        {"status": "approved"}, token=self.admin_token)
                if success:
                    self.log("✓", "Review approved")

        # 10. PHASE 3: COUPONS
        print("\n" + "=" * 60)
        print("📋 SECTION 10: COUPONS (PHASE 3)")
        print("=" * 60)
        
        # Test without auth
        self.test("Admin Coupons - No Auth (401)", "GET", "/admin/coupons", 401)
        
        if self.admin_token:
            # Create percentage coupon
            success, data = self.test("Admin: Create Percentage Coupon", "POST", "/admin/coupons", 200, {
                "code": "TEST10",
                "type": "percentage",
                "value": 10,
                "min_order": 100,
                "max_uses": 10,
                "is_active": True,
                "description": "10% off test coupon"
            }, token=self.admin_token)
            if success:
                self.coupon_id = data.get('id')
                self.log("💾", f"Created coupon ID: {self.coupon_id}")
            
            # Create fixed amount coupon
            self.test("Admin: Create Fixed Amount Coupon", "POST", "/admin/coupons", 200, {
                "code": "FIXED50",
                "type": "fixed_amount",
                "value": 50,
                "min_order": 200,
                "is_active": True,
                "description": "50 TL off"
            }, token=self.admin_token)
            
            # Create free shipping coupon
            self.test("Admin: Create Free Shipping Coupon", "POST", "/admin/coupons", 200, {
                "code": "FREESHIP",
                "type": "free_shipping",
                "value": 0,
                "min_order": 0,
                "is_active": True,
                "description": "Free shipping"
            }, token=self.admin_token)
            
            # List coupons
            success, data = self.test("Admin: List Coupons", "GET", "/admin/coupons", 200, token=self.admin_token)
            if success:
                self.log("✓", f"Total coupons: {len(data.get('items', []))}")
            
            # Update coupon
            if self.coupon_id:
                self.test("Admin: Update Coupon", "PATCH", f"/admin/coupons/{self.coupon_id}", 200, 
                         {"value": 15}, token=self.admin_token)
        
        # Validate coupon (public)
        self.test("Validate Coupon - Valid", "POST", "/coupons/validate", 200, {
            "code": "TEST10",
            "subtotal": 150
        })
        
        self.test("Validate Coupon - Invalid Code", "POST", "/coupons/validate", 404, {
            "code": "INVALID",
            "subtotal": 150
        })
        
        self.test("Validate Coupon - Below Min Order", "POST", "/coupons/validate", 400, {
            "code": "TEST10",
            "subtotal": 50
        })
        
        # Test checkout with coupon
        if self.product_slug:
            checkout_with_coupon = {
                "email": "test@test.com",
                "address": {
                    "full_name": "Test User",
                    "phone": "+905555555555",
                    "city": "İstanbul",
                    "district": "Kadıköy",
                    "address_line": "Test Mahallesi Test Sokak No:1",
                    "zip_code": "34000"
                },
                "items": [{
                    "product_id": "test-id",
                    "name": "Test Product",
                    "slug": self.product_slug,
                    "price": 150,
                    "quantity": 1,
                    "image": None
                }],
                "coupon_code": "TEST10"
            }
            success, data = self.test("Checkout with Coupon", "POST", "/orders/checkout", 200, checkout_with_coupon)
            if success and data.get('payment_url'):
                self.log("✓", "Checkout with coupon successful")

        # 11. PHASE 3: BLOG
        print("\n" + "=" * 60)
        print("📋 SECTION 11: BLOG (PHASE 3)")
        print("=" * 60)
        
        # Public blog list (should be empty or published only)
        success, data = self.test("Get Blog List (Public)", "GET", "/blog", 200)
        if success:
            self.log("✓", f"Blog posts: {data.get('total', 0)}")
        
        # Admin blog endpoints
        if self.admin_token:
            # Create blog post
            success, data = self.test("Admin: Create Blog Post", "POST", "/admin/blog", 200, {
                "title": "Kaktüs Bakımı Rehberi",
                "slug": "kaktus-bakimi-rehberi",
                "excerpt": "Kaktüslerinize nasıl bakmalısınız?",
                "content": {"blocks": [{"type": "paragraph", "data": {"text": "Test content"}}]},
                "meta_title": "Kaktüs Bakımı - Yeşil Dükkan",
                "meta_description": "Kaktüs bakımı hakkında her şey",
                "tags": ["kaktus", "bakim"],
                "status": "draft"
            }, token=self.admin_token)
            if success:
                self.blog_id = data.get('id')
                self.log("💾", f"Created blog post ID: {self.blog_id}")
            
            # List admin blogs
            success, data = self.test("Admin: List Blog Posts", "GET", "/admin/blog", 200, token=self.admin_token)
            if success:
                self.log("✓", f"Total blog posts: {data.get('total', 0)}")
            
            # Update blog post (publish it)
            if self.blog_id:
                success, data = self.test("Admin: Publish Blog Post", "PATCH", f"/admin/blog/{self.blog_id}", 200, 
                                        {"status": "published"}, token=self.admin_token)
                if success:
                    self.log("✓", "Blog post published")
                    if data.get('published_at'):
                        self.log("✓", f"published_at set: {data['published_at']}")
                
                # Get blog detail (admin)
                self.test("Admin: Get Blog Post", "GET", f"/admin/blog/{self.blog_id}", 200, token=self.admin_token)
        
        # Public blog detail
        if self.blog_id:
            success, data = self.test("Get Blog Post (Public)", "GET", "/blog/kaktus-bakimi-rehberi", 200)
            if success:
                self.log("✓", f"Blog post title: {data.get('post', {}).get('title')}")
        
        # Test AI Blog SEO (1 real call is OK per instructions)
        if self.admin_token:
            self.log("⚠️", "Testing AI Blog SEO (1 real Mistral call - text-only, cheaper)")
            success, data = self.test("Admin: AI Blog SEO", "POST", "/admin/ai/blog-seo", 200, {
                "title": "Kaktüs Bakımı Rehberi",
                "excerpt": "Kaktüslerinize nasıl bakmalısınız?",
                "target_keywords": "kaktüs bakımı"
            }, token=self.admin_token)
            if success:
                self.log("✓", f"AI SEO suggestions: meta_title={data.get('meta_title', '')[:50]}...")
        
        # Verify sitemap includes blog URLs
        success, data = self.test("Sitemap Includes Blog URLs", "GET", "/seo/sitemap.xml", 200)
        # Note: data will be XML string, we just verify it returns 200

        # 12. PHASE 4: SETTINGS
        print("\n" + "=" * 60)
        print("📋 SECTION 12: SETTINGS (PHASE 4)")
        print("=" * 60)
        
        # Public settings menu
        success, data = self.test("Get Public Settings Menu", "GET", "/settings/menu", 200)
        if success:
            self.log("✓", f"Site name: {data.get('site_name', 'N/A')}")
            self.log("✓", f"Header links: {len(data.get('header_links', []))}")
            self.log("✓", f"Landing visibility keys: {len(data.get('landing_visibility', {}))}")
        
        # Admin settings (requires auth)
        self.test("Admin Settings - No Auth (401)", "GET", "/admin/settings", 401)
        
        if self.admin_token:
            success, data = self.test("Admin: Get Settings", "GET", "/admin/settings", 200, token=self.admin_token)
            if success:
                self.log("✓", f"General settings: {list(data.get('general', {}).keys())}")
                self.log("✓", f"API keys (masked): {list(data.get('api_keys', {}).keys())}")
                self.log("✓", f"API keys has value: {data.get('api_keys_has_value', {})}")
                self.log("✓", f"Menu header links: {len(data.get('menu', {}).get('header_links', []))}")
            
            # Update general settings
            success, data = self.test("Admin: Update General Settings", "PATCH", "/admin/settings/general", 200, {
                "site_name": "Yeşil Dükkan Test",
                "contact_email": "test@yesildukkan.com"
            }, token=self.admin_token)
            if success:
                self.log("✓", "General settings updated")
            
            # Update menu settings
            success, data = self.test("Admin: Update Menu Settings", "PATCH", "/admin/settings/menu", 200, {
                "header_links": [
                    {"label": "Test Link", "url": "/test", "order": 1, "visible": True}
                ],
                "landing_visibility": {"kaktusler": True, "sukulentler": False}
            }, token=self.admin_token)
            if success:
                self.log("✓", "Menu settings updated")
            
            # Update API keys (test with empty values - should not change existing)
            success, data = self.test("Admin: Update API Keys (empty - no change)", "PATCH", "/admin/settings/api-keys", 400, {}, token=self.admin_token)
            # Should fail with 400 because no fields to update
            
            # Update API keys with actual value (test GA ID as it's safe)
            success, data = self.test("Admin: Update API Keys (GA ID)", "PATCH", "/admin/settings/api-keys", 200, {
                "ga_id": "G-TEST123456"
            }, token=self.admin_token)
            if success:
                self.log("✓", f"API keys updated: {data.get('fields', [])}")

        # 13. PHASE 4: YAVER CHAT
        print("\n" + "=" * 60)
        print("📋 SECTION 13: YAVER CHAT (PHASE 4)")
        print("=" * 60)
        
        self.log("⚠️", "Testing Yaver chat (1-2 real Mistral calls - text-only, cheap)")
        
        # Basic chat without context
        success, data = self.test("Yaver: Basic Chat", "POST", "/chat", 200, {
            "message": "Merhaba, kaktüs bakımı hakkında bilgi verir misin?",
            "history": [],
            "context": {}
        })
        if success:
            reply = data.get('reply', '')
            self.log("✓", f"Yaver reply (first 100 chars): {reply[:100]}...")
        
        # Chat with product context
        if self.product_slug:
            success, data = self.test("Yaver: Chat with Product Context", "POST", "/chat", 200, {
                "message": "Bu ürün hakkında bilgi verir misin?",
                "history": [],
                "context": {"product_slug": self.product_slug}
            })
            if success:
                reply = data.get('reply', '')
                self.log("✓", f"Yaver reply with context (first 100 chars): {reply[:100]}...")

        # 14. PHASE 4: BLOG ENHANCEMENTS
        print("\n" + "=" * 60)
        print("📋 SECTION 14: BLOG ENHANCEMENTS (PHASE 4)")
        print("=" * 60)
        
        # Blog tags
        success, data = self.test("Get Blog Tags", "GET", "/blog-tags", 200)
        if success:
            tags = data.get('items', [])
            self.log("✓", f"Blog tags count: {len(tags)}")
            if tags:
                self.log("✓", f"Sample tag: {tags[0]}")
        
        # Blog recent
        success, data = self.test("Get Recent Blog Posts", "GET", "/blog-recent", 200, params={"limit": 5})
        if success:
            recent = data.get('items', [])
            self.log("✓", f"Recent blog posts: {len(recent)}")
        
        # Update blog with related_product_ids
        if self.admin_token and self.blog_id:
            # First get a product ID
            success, prod_data = self.test("Get Product for Blog Related", "GET", "/products", 200)
            if success and prod_data.get('items'):
                product_id = prod_data['items'][0].get('id')
                success, data = self.test("Admin: Update Blog with Related Products", "PATCH", f"/admin/blog/{self.blog_id}", 200, {
                    "related_product_ids": [product_id]
                }, token=self.admin_token)
                if success:
                    self.log("✓", f"Blog updated with related_product_ids: {data.get('related_product_ids', [])}")
        
        # Get blog with related products
        if self.blog_id:
            success, data = self.test("Get Blog with Related Products", "GET", "/blog/kaktus-bakimi-rehberi", 200)
            if success:
                related_products = data.get('related_products', [])
                self.log("✓", f"Blog has {len(related_products)} related products")

        # 15. PHASE 4: PRODUCT ENHANCEMENTS
        print("\n" + "=" * 60)
        print("📋 SECTION 15: PRODUCT ENHANCEMENTS (PHASE 4)")
        print("=" * 60)
        
        # Products with in_stock filter
        success, data = self.test("List Products - In Stock Only", "GET", "/products", 200, params={"in_stock": True})
        if success:
            items = data.get('items', [])
            self.log("✓", f"In-stock products: {len(items)}")
            if items:
                # Verify all have stock > 0
                all_in_stock = all(item.get('stock', 0) > 0 for item in items)
                if all_in_stock:
                    self.log("✓", "All returned products have stock > 0")
                else:
                    self.log("❌", "Some products have stock = 0")
        
        # Landing with in_stock filter
        success, data = self.test("Landing - In Stock Only", "GET", "/landing/kaktusler", 200, params={"in_stock": True})
        if success:
            items = data.get('items', [])
            self.log("✓", f"In-stock landing products: {len(items)}")
        
        # Admin product search
        if self.admin_token:
            success, data = self.test("Admin: Product Search", "GET", "/admin/products/search", 200, 
                                    params={"q": "kaktus", "limit": 5}, token=self.admin_token)
            if success:
                items = data.get('items', [])
                self.log("✓", f"Product search results: {len(items)}")
                if items:
                    self.log("✓", f"Sample result: {items[0].get('common_name_tr', 'N/A')}")
        
        # Admin product edit (PATCH)
        if self.admin_token:
            # Get a product first
            success, prod_data = self.test("Get Product for Edit", "GET", "/admin/products", 200, token=self.admin_token)
            if success and prod_data.get('items'):
                product_id = prod_data['items'][0].get('id')
                original_name = prod_data['items'][0].get('common_name_tr')
                
                # Update product
                success, data = self.test("Admin: Edit Product", "PATCH", f"/admin/products/{product_id}", 200, {
                    "common_name_tr": f"{original_name} (Test Edit)",
                    "price": 99.99
                }, token=self.admin_token)
                if success:
                    self.log("✓", f"Product updated: {data.get('common_name_tr')}")
                    self.log("✓", f"New price: ₺{data.get('price')}")
                
                # Verify update
                success, verify_data = self.test("Verify Product Edit", "GET", f"/admin/products", 200, token=self.admin_token)
                if success:
                    updated_product = next((p for p in verify_data.get('items', []) if p.get('id') == product_id), None)
                    if updated_product and "(Test Edit)" in updated_product.get('common_name_tr', ''):
                        self.log("✓", "Product edit verified")

        # 16. PHASE 5: MULTI-IMAGE GALLERY
        print("\n" + "=" * 60)
        print("📋 SECTION 16: PHASE 5 - MULTI-IMAGE GALLERY")
        print("=" * 60)
        
        # Get a product to test with
        test_product_id = None
        if self.admin_token:
            success, prod_data = self.test("Get Product for Gallery Test", "GET", "/admin/products", 200, token=self.admin_token)
            if success and prod_data.get('items'):
                test_product_id = prod_data['items'][0].get('id')
                self.log("💾", f"Using product ID for gallery tests: {test_product_id}")
        
        if test_product_id:
            # Test auth requirements (401, 403)
            self.test("Add Image - No Token (401)", "POST", f"/admin/products/{test_product_id}/images/add", 401)
            if self.customer_token:
                self.test("Add Image - Customer Token (403)", "POST", f"/admin/products/{test_product_id}/images/add", 403, token=self.customer_token)
            
            self.test("Delete Image - No Token (401)", "DELETE", f"/admin/products/{test_product_id}/images/0", 401)
            if self.customer_token:
                self.test("Delete Image - Customer Token (403)", "DELETE", f"/admin/products/{test_product_id}/images/0", 403, token=self.customer_token)
            
            self.test("Update Alt - No Token (401)", "PATCH", f"/admin/products/{test_product_id}/images/0/alt", 401, {"alt": "test"})
            if self.customer_token:
                self.test("Update Alt - Customer Token (403)", "PATCH", f"/admin/products/{test_product_id}/images/0/alt", 403, {"alt": "test"}, token=self.customer_token)
            
            self.test("Reorder Images - No Token (401)", "POST", f"/admin/products/{test_product_id}/images/reorder", 401, {"order": [0]})
            if self.customer_token:
                self.test("Reorder Images - Customer Token (403)", "POST", f"/admin/products/{test_product_id}/images/reorder", 403, {"order": [0]}, token=self.customer_token)
            
            # Test actual functionality with admin token
            if self.admin_token:
                # Note: We can't test actual file upload via requests.post with json=data
                # We need multipart/form-data. Let's test with a simple 1x1 pixel PNG
                import io
                import base64
                
                # 1x1 transparent PNG (base64)
                tiny_png = base64.b64decode(
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                )
                
                # Test 1: Add image WITHOUT AI alt generation (fast, default)
                self.log("⚠️", "Testing image add WITHOUT AI alt generation (fast)")
                try:
                    files = {'file': ('test.png', io.BytesIO(tiny_png), 'image/png')}
                    data_form = {'generate_alt': 'false'}
                    response = requests.post(
                        f"{BASE_URL}/admin/products/{test_product_id}/images/add",
                        files=files,
                        data=data_form,
                        headers={'Authorization': f'Bearer {self.admin_token}'},
                        timeout=30
                    )
                    self.tests_run += 1
                    if response.status_code == 200:
                        self.tests_passed += 1
                        result = response.json()
                        self.log("✅", f"Image added (no AI): {result.get('image', {}).get('alt', 'N/A')}")
                        # Verify default alt text format: "name - Ürün Görseli N"
                        alt = result.get('image', {}).get('alt', '')
                        if 'Ürün Görseli' in alt:
                            self.log("✓", f"Default alt text format correct: {alt}")
                    else:
                        self.tests_passed += 0
                        self.log("❌", f"Image add failed: {response.status_code}")
                        self.failed_tests.append(f"Add Image (no AI): Expected 200, got {response.status_code}")
                except Exception as e:
                    self.tests_run += 1
                    self.log("❌", f"Image add error: {e}")
                    self.failed_tests.append(f"Add Image (no AI): {e}")
                
                # Test 2: Add image WITH AI alt generation (1 call only, expensive)
                self.log("⚠️", "Testing image add WITH AI alt generation (1 Mistral Pixtral call, ~20s, expensive)")
                try:
                    files = {'file': ('test2.png', io.BytesIO(tiny_png), 'image/png')}
                    data_form = {'generate_alt': 'true'}
                    response = requests.post(
                        f"{BASE_URL}/admin/products/{test_product_id}/images/add",
                        files=files,
                        data=data_form,
                        headers={'Authorization': f'Bearer {self.admin_token}'},
                        timeout=60  # Longer timeout for AI
                    )
                    self.tests_run += 1
                    if response.status_code == 200:
                        self.tests_passed += 1
                        result = response.json()
                        self.log("✅", f"Image added (AI alt): {result.get('image', {}).get('alt', 'N/A')[:80]}...")
                    else:
                        self.tests_passed += 0
                        self.log("❌", f"Image add with AI failed: {response.status_code}")
                        self.failed_tests.append(f"Add Image (AI): Expected 200, got {response.status_code}")
                except Exception as e:
                    self.tests_run += 1
                    self.log("❌", f"Image add with AI error: {e}")
                    self.failed_tests.append(f"Add Image (AI): {e}")
                
                # Get current product to check image count
                success, prod = self.test("Get Product After Image Add", "GET", "/admin/products", 200, token=self.admin_token)
                current_images = []
                if success:
                    p = next((x for x in prod.get('items', []) if x.get('id') == test_product_id), None)
                    if p:
                        current_images = p.get('images', [])
                        self.log("✓", f"Product now has {len(current_images)} images")
                
                # Test 3: Update alt text
                if len(current_images) > 0:
                    success, data = self.test("Update Image Alt Text", "PATCH", f"/admin/products/{test_product_id}/images/0/alt", 200, 
                                            {"alt": "Test Alt Text Updated"}, token=self.admin_token)
                    if success:
                        self.log("✓", "Alt text updated successfully")
                
                # Test 4: Invalid index for alt update
                self.test("Update Alt - Invalid Index (400)", "PATCH", f"/admin/products/{test_product_id}/images/999/alt", 400, 
                         {"alt": "test"}, token=self.admin_token)
                
                # Test 5: Reorder images (if we have 2+ images)
                if len(current_images) >= 2:
                    # Reverse order
                    new_order = list(range(len(current_images)))[::-1]
                    success, data = self.test("Reorder Images", "POST", f"/admin/products/{test_product_id}/images/reorder", 200, 
                                            {"order": new_order}, token=self.admin_token)
                    if success:
                        self.log("✓", f"Images reordered: {new_order}")
                else:
                    self.log("⚠️", "Skipping reorder test (need 2+ images)")
                
                # Test 6: Invalid reorder (wrong array length)
                if len(current_images) > 0:
                    self.test("Reorder - Invalid Order Array (400)", "POST", f"/admin/products/{test_product_id}/images/reorder", 400, 
                             {"order": [0, 1, 2, 3, 4]}, token=self.admin_token)
                
                # Test 7: Delete image
                if len(current_images) > 1:
                    # Delete last image (keep at least 1)
                    last_idx = len(current_images) - 1
                    success, data = self.test("Delete Image", "DELETE", f"/admin/products/{test_product_id}/images/{last_idx}", 200, 
                                            token=self.admin_token)
                    if success:
                        self.log("✓", f"Image at index {last_idx} deleted")
                else:
                    self.log("⚠️", "Skipping delete test (need 2+ images)")
                
                # Test 8: Delete invalid index
                self.test("Delete Image - Invalid Index (400)", "DELETE", f"/admin/products/{test_product_id}/images/999", 400, 
                         token=self.admin_token)

        # Final Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed} ✅")
        print(f"Failed: {len(self.failed_tests)} ❌")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"  {i}. {test}")
        
        return 0 if len(self.failed_tests) == 0 else 1

def main():
    tester = YesilDukkanTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
