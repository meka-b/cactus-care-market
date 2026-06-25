{
  "brand": {
    "name": "Yeşil Dükkan",
    "visual_personality": [
      "ferah + premium (Apple Store düzeni + nursery sıcaklığı)",
      "botanik ama modern (temiz beyaz yüzeyler, canlı yeşil aksan)",
      "SEO-odaklı keşif (taksonomi etiketleri, hızlı landing kartları)",
      "mobile-first, tek elle kullanım, hızlı filtreleme"
    ],
    "tone_of_voice_tr": {
      "style": "kısa, güven veren, bakım odaklı",
      "microcopy_examples": {
        "primary_cta": "Sepete Ekle",
        "secondary_cta": "Bakım Detayları",
        "filter_apply": "Filtrele",
        "filter_clear": "Sıfırla",
        "ai_upload": "Görsel Yükle",
        "ai_analyze": "AI ile Tanı",
        "ai_confirm": "Onayla ve Yayınla"
      }
    }
  },

  "design_tokens": {
    "notes": [
      "NO TRANSPARENT BACKGROUNDS: yüzeyler solid olmalı.",
      "Global radius MUTLAKA 10px: --radius = 10px.",
      "Renkler WCAG AA kontrastı sağlayacak şekilde seçildi.",
      "Yeşil aksan: CTA + seçili durumlar; okuma alanları beyaz/çok açık yeşil."
    ],

    "css_custom_properties": {
      "where": "/app/frontend/src/index.css :root",
      "add_or_replace": "Replace shadcn default tokens with below (HSL values).",
      "tokens": {
        "--background": "0 0% 100%",
        "--foreground": "155 35% 12%",

        "--card": "0 0% 100%",
        "--card-foreground": "155 35% 12%",

        "--popover": "0 0% 100%",
        "--popover-foreground": "155 35% 12%",

        "--primary": "142 72% 33%",
        "--primary-foreground": "0 0% 100%",

        "--secondary": "142 35% 96%",
        "--secondary-foreground": "155 35% 12%",

        "--muted": "142 25% 96%",
        "--muted-foreground": "155 18% 35%",

        "--accent": "142 35% 94%",
        "--accent-foreground": "155 35% 12%",

        "--destructive": "0 84% 55%",
        "--destructive-foreground": "0 0% 100%",

        "--border": "142 18% 88%",
        "--input": "142 18% 88%",
        "--ring": "142 72% 33%",

        "--radius": "10px",

        "--success": "142 72% 33%",
        "--warning": "38 92% 50%",
        "--info": "199 89% 48%",

        "--shadow-sm": "0 1px 2px rgba(16, 24, 16, 0.06)",
        "--shadow-md": "0 10px 24px rgba(16, 24, 16, 0.10)",
        "--shadow-lg": "0 18px 50px rgba(16, 24, 16, 0.14)",

        "--surface": "0 0% 100%",
        "--surface-2": "142 35% 96%",
        "--surface-3": "142 35% 94%"
      }
    },

    "palette": {
      "hex": {
        "green_600": "#16A34A",
        "green_500": "#22C55E",
        "green_50": "#F0FDF4",
        "green_100": "#DCFCE7",
        "ink": "#0F1A12",
        "ink_muted": "#2B3A31",
        "border": "#D7E6DA",
        "bg": "#FFFFFF",
        "bg_soft": "#F7FBF8",
        "warning": "#F59E0B",
        "danger": "#EF4444",
        "info": "#06B6D4"
      },
      "usage": {
        "backgrounds": ["bg (white)", "green_50 for section bands", "bg_soft for admin panels"],
        "text": ["ink for headings", "ink_muted for body", "muted-foreground for meta"],
        "borders": ["border for cards/inputs", "green_100 for subtle separators"],
        "interactive": ["green_600 primary", "green_500 hover", "ring uses primary"],
        "status": ["warning, danger, info (solid only)"],
        "badges": ["taxonomy chips use green_50 + green_600 text"]
      }
    },

    "gradients_and_texture": {
      "rule": "Gradients only as decorative section background overlays; max 20% viewport; never on small elements or reading areas.",
      "allowed_gradients": [
        {
          "name": "hero-mist",
          "css": "radial-gradient(900px circle at 20% 10%, rgba(34,197,94,0.14), transparent 55%), radial-gradient(700px circle at 85% 20%, rgba(22,163,74,0.10), transparent 60%)",
          "usage": "Home hero background only (behind content)."
        },
        {
          "name": "landing-strip-wash",
          "css": "linear-gradient(90deg, rgba(240,253,244,1) 0%, rgba(255,255,255,1) 55%, rgba(240,253,244,1) 100%)",
          "usage": "SEO landing strip section background band."
        }
      ],
      "noise_overlay": {
        "css": "background-image: url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"2\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.06\"/%3E%3C/svg%3E');",
        "usage": "Only on large section wrappers (hero band / admin header), never on cards.",
        "tailwind_hint": "Use a pseudo-element: before:absolute before:inset-0 before:opacity-[0.06] before:pointer-events-none"
      }
    },

    "spacing_scale": {
      "base": "4px",
      "tokens": {
        "--space-1": "4px",
        "--space-2": "8px",
        "--space-3": "12px",
        "--space-4": "16px",
        "--space-5": "20px",
        "--space-6": "24px",
        "--space-8": "32px",
        "--space-10": "40px",
        "--space-12": "48px",
        "--space-16": "64px"
      },
      "layout_defaults": {
        "page_padding": "px-4 sm:px-6 lg:px-8",
        "section_padding": "py-10 sm:py-14 lg:py-16",
        "card_padding": "p-4 sm:p-5",
        "grid_gap": "gap-4 sm:gap-5 lg:gap-6"
      }
    },

    "typography": {
      "fonts": {
        "heading": "Space Grotesk",
        "body": "Figtree"
      },
      "google_fonts_import": {
        "where": "/app/frontend/public/index.html (or CSS import if used)",
        "href": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&display=swap"
      },
      "tailwind_font_setup": {
        "note": "Tailwind config may need fontFamily extension; if not available, apply via CSS on body + headings.",
        "css": {
          "body": "font-family: 'Figtree', ui-sans-serif, system-ui;",
          "headings": "font-family: 'Space Grotesk', ui-sans-serif, system-ui;"
        }
      },
      "scale": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
        "h2": "text-base md:text-lg font-medium text-muted-foreground",
        "h3": "text-xl sm:text-2xl font-semibold",
        "body": "text-sm sm:text-base leading-relaxed",
        "meta": "text-xs sm:text-sm text-muted-foreground"
      }
    },

    "radius_and_shadows": {
      "radius": {
        "global": "10px",
        "tailwind": "rounded-[var(--radius)]"
      },
      "shadows": {
        "card_default": "shadow-[var(--shadow-sm)]",
        "card_hover": "hover:shadow-[var(--shadow-md)]",
        "modal": "shadow-[var(--shadow-lg)]"
      }
    },

    "breakpoints_mobile_first": {
      "tailwind": {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px"
      },
      "patterns": [
        "Mobile: filters Sheet/Drawer; Desktop: left sidebar.",
        "Mobile: sticky bottom CTA on product detail.",
        "Admin: collapsible sidebar; default closed on mobile."
      ]
    }
  },

  "component_path": {
    "primary_library": "shadcn/ui (already in /app/frontend/src/components/ui)",
    "use_components": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "breadcrumb": "/app/frontend/src/components/ui/breadcrumb.jsx",
      "carousel": "/app/frontend/src/components/ui/carousel.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "checkbox": "/app/frontend/src/components/ui/checkbox.jsx",
      "slider": "/app/frontend/src/components/ui/slider.jsx",
      "pagination": "/app/frontend/src/components/ui/pagination.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "sonner": "/app/frontend/src/components/ui/sonner.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx"
    },
    "icon_library": {
      "preferred": "lucide-react (already typical with shadcn)",
      "rule": "No emoji icons."
    }
  },

  "component_variants_and_states": {
    "buttons": {
      "shape": "rounded-[10px] (not pill)",
      "variants": {
        "primary": {
          "use": "Add to cart, checkout, AI confirm",
          "classes": "bg-primary text-primary-foreground hover:bg-[#22C55E] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "motion": "hover: translateY(-1px) via shadow change; active scale 0.98"
        },
        "secondary": {
          "use": "Continue shopping, view care",
          "classes": "bg-secondary text-secondary-foreground hover:bg-[hsl(var(--accent))] border border-[hsl(var(--border))]",
          "motion": "hover shadow-sm"
        },
        "ghost": {
          "use": "Header links, filter clear",
          "classes": "hover:bg-[hsl(var(--accent))] text-foreground"
        },
        "destructive": {
          "use": "Remove from cart, admin delete",
          "classes": "bg-destructive text-destructive-foreground hover:bg-red-500"
        }
      },
      "sizes": {
        "sm": "h-9 px-3 text-sm",
        "md": "h-10 px-4",
        "lg": "h-11 px-5 text-base"
      },
      "data_testid_examples": [
        "data-testid=\"product-add-to-cart-button\"",
        "data-testid=\"checkout-next-step-button\"",
        "data-testid=\"filters-clear-button\""
      ]
    },

    "cards": {
      "base": "bg-card text-card-foreground rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-[var(--shadow-sm)]",
      "hover": "hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px] transition-shadow",
      "rule": "Never transition: all. Use transition-shadow/transition-colors only."
    },

    "badges_and_taxonomy_chips": {
      "taxonomy_chip": {
        "classes": "bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] border border-[hsl(var(--border))] rounded-[999px] px-2.5 py-1 text-xs font-medium",
        "use": "bakım zorluğu, ışık ihtiyacı, sulama, boyut, pet-safe"
      },
      "status_badge": {
        "classes": "rounded-[999px] px-2.5 py-1 text-xs font-medium",
        "examples": {
          "in_stock": "bg-green-50 text-green-700 border border-green-200",
          "low_stock": "bg-amber-50 text-amber-700 border border-amber-200",
          "out_stock": "bg-zinc-100 text-zinc-700 border border-zinc-200"
        }
      }
    },

    "inputs_and_filters": {
      "input": {
        "classes": "h-10 rounded-[var(--radius)] border-[hsl(var(--input))] focus-visible:ring-2 focus-visible:ring-ring",
        "placeholder": "text-muted-foreground"
      },
      "filter_sidebar": {
        "desktop": "sticky top-20",
        "mobile": "Sheet from bottom/right with Apply button sticky"
      },
      "slider_price": {
        "use": "shadcn slider",
        "classes": "[&_[role=slider]]:bg-primary"
      }
    },

    "navigation": {
      "header": {
        "style": "white header, subtle bottom border, optional blur NOT allowed due to no transparency",
        "classes": "bg-white border-b border-[hsl(var(--border))]"
      },
      "breadcrumb": {
        "use": "shadcn breadcrumb",
        "classes": "text-sm text-muted-foreground"
      },
      "pagination": {
        "use": "shadcn pagination",
        "note": "SEO landing pages should have crawlable pagination links"
      }
    },

    "feedback_states": {
      "skeleton": {
        "use": "shadcn skeleton",
        "pattern": "Product card skeleton: image block + 2 lines + price line + button"
      },
      "empty_state": {
        "copy_tr": "Bu filtrelerle eşleşen ürün bulunamadı.",
        "cta": "Filtreleri Sıfırla",
        "illustration": "Use simple line icon (lucide: Sprout)"
      },
      "toasts": {
        "use": "sonner",
        "examples": {
          "added": "Sepete eklendi",
          "removed": "Ürün sepetten kaldırıldı",
          "ai_done": "AI önerisi hazır"
        }
      }
    }
  },

  "motion_and_microinteractions": {
    "library": "framer-motion",
    "principles": [
      "Motion = feedback: hover elevate, add-to-cart confirmation, filter sheet transitions.",
      "Keep durations short: 160–240ms; easing: [0.22, 1, 0.36, 1] (easeOutCubic feel).",
      "Respect prefers-reduced-motion: disable parallax + reduce transforms."
    ],
    "recommended_presets": {
      "card_hover": {
        "whileHover": "{ y: -2 }",
        "transition": "{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }"
      },
      "page_enter": {
        "initial": "{ opacity: 0, y: 8 }",
        "animate": "{ opacity: 1, y: 0 }",
        "transition": "{ duration: 0.22 }"
      },
      "drawer_sheet": {
        "note": "Use shadcn Sheet/Drawer animations; add subtle content fade-in inside."
      },
      "add_to_cart": {
        "pattern": "Button press scale 0.98 + toast; cart badge count animates (scale 1.1 then back)."
      }
    }
  },

  "layout_and_grid": {
    "container": "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8",
    "home": {
      "hero": "2-column on lg (text left, image right), stacked on mobile",
      "category_grid": "3 columns on mobile? -> mobile 2 cols, md 3 cols, lg 3 cols (9 tiles)",
      "featured_carousel": "full width within container; cards snap",
      "seo_landing_strip": "horizontal scroll chips on mobile; grid of 2x2 cards on md+"
    },
    "category_page": {
      "desktop": "12-col grid: sidebar 3 cols, products 9 cols",
      "mobile": "products full width; filters in Sheet"
    },
    "product_detail": {
      "desktop": "gallery 7/12, info 5/12; Care Bento below info",
      "mobile": "gallery top, info, Care Bento, tabs; sticky bottom bar with price + CTA"
    },
    "admin": {
      "shell": "sidebar + topbar; content max-w-7xl",
      "tables": "use shadcn table with sticky header on desktop"
    }
  },

  "page_by_page_mock": {
    "home_/": {
      "sections": [
        {
          "name": "Header",
          "content": "Logo (Yeşil Dükkan), arama input, hesap, sepet",
          "interaction": "Search expands on focus; cart opens Drawer",
          "testids": [
            "header-search-input",
            "header-account-link",
            "header-cart-button"
          ]
        },
        {
          "name": "Hero",
          "layout": "Text block + hero image",
          "content": "H1: 'Kaktüs ve Salon Bitkilerinde Ferah Seçkiler' + H2 kısa açıklama + CTA",
          "cta": ["Ürünleri Keşfet", "Kolay Bakım Seçkisi"],
          "background": "hero-mist gradient overlay + subtle noise",
          "testids": ["home-hero-primary-cta", "home-hero-secondary-cta"]
        },
        {
          "name": "9'lu Kategori Grid",
          "layout": "Card tiles with icon + count",
          "tiles": [
            "Kaktüsler",
            "Sukulentler",
            "Salon Bitkileri",
            "Mini Bitkiler",
            "Pet-Friendly",
            "Az Sulanan",
            "Düşük Işık",
            "Hızlı Büyüyen",
            "Yeni Gelenler"
          ],
          "interaction": "Hover elevate + subtle border tint to primary",
          "testids": ["home-category-grid"]
        },
        {
          "name": "Öne Çıkan Ürünler Carousel",
          "component": "shadcn carousel",
          "card": "ProductCard (image, name, price, taxonomy chips, quick add)",
          "testids": ["home-featured-carousel"]
        },
        {
          "name": "SEO Landing Strip",
          "layout": "Bento mini-cards (2 rows on md+, horizontal scroll on mobile)",
          "cards": [
            "Kolay Bakım Bitkileri",
            "Az Sulanan Bitkiler",
            "Pet-Friendly",
            "Mini Bitkiler",
            "Parlak Işık Sevenler",
            "Gölgeye Uygun"
          ],
          "testids": ["home-seo-landing-strip"]
        }
      ]
    },

    "category_/k/:slug": {
      "sections": [
        {
          "name": "Breadcrumb + Title",
          "component": "shadcn breadcrumb",
          "testids": ["category-breadcrumb"]
        },
        {
          "name": "Filter Sidebar",
          "desktop": "left Card with Accordion sections",
          "mobile": "Filter button opens Sheet",
          "filters": ["Bakım", "Işık", "Sulama", "Boyut", "Fiyat"],
          "testids": ["category-filters-open-button", "category-filters-apply-button"]
        },
        {
          "name": "Product Grid",
          "layout": "2 cols mobile, 3 cols md, 4 cols xl",
          "testids": ["category-product-grid"]
        },
        {
          "name": "Pagination",
          "component": "shadcn pagination",
          "testids": ["category-pagination"]
        }
      ]
    },

    "product_/u/:slug": {
      "sections": [
        {
          "name": "Gallery",
          "layout": "AspectRatio + thumbnails",
          "interaction": "thumbnail click swaps; image zoom on hover desktop",
          "testids": ["product-gallery"]
        },
        {
          "name": "Product Info",
          "content": "Title, price, stock badge, taxonomy chips, quantity stepper, add-to-cart",
          "testids": ["product-title", "product-price", "product-add-to-cart-button"]
        },
        {
          "name": "Care Bento (5'li)",
          "design": {
            "layout": "grid grid-cols-2 md:grid-cols-5 gap-3",
            "cards": [
              {"key": "ışık", "icon": "Sun"},
              {"key": "sulama", "icon": "Droplets"},
              {"key": "bakım", "icon": "Sparkles"},
              {"key": "boyut", "icon": "Ruler"},
              {"key": "pet-safe", "icon": "PawPrint"}
            ],
            "card_style": "bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-[var(--radius)] p-3",
            "hierarchy": "Top: icon + label; Bottom: value (bold)",
            "testids": ["product-care-bento"]
          }
        },
        {
          "name": "Tabs",
          "component": "shadcn tabs",
          "tabs": ["Açıklama", "Bakım Rehberi", "Kargo & İade"],
          "testids": ["product-detail-tabs"]
        },
        {
          "name": "Benzer Ürünler",
          "component": "carousel or grid",
          "testids": ["product-related-products"]
        },
        {
          "name": "Mobile Sticky CTA",
          "pattern": "fixed bottom bar with price + add-to-cart",
          "testids": ["product-sticky-add-to-cart"]
        }
      ]
    },

    "cart_/sepet": {
      "pattern": "Prefer Drawer cart from anywhere; /sepet page can mirror drawer for SEO.",
      "drawer": {
        "component": "shadcn drawer",
        "content": "line items, qty stepper, remove, subtotal, checkout CTA",
        "testids": ["cart-drawer", "cart-checkout-button"]
      }
    },

    "checkout_/odeme": {
      "pattern": "2-3 step checkout",
      "stepper": "Use Tabs or custom step indicator (no emoji).",
      "steps": ["Adres", "Ödeme", "Onay"],
      "payment": "İyzico sandbox iframe area inside Card",
      "testids": ["checkout-stepper", "checkout-iyzico-iframe"]
    },

    "auth": {
      "pages": ["/giris", "/kayit"],
      "layout": "split layout on lg with plant image; single column on mobile",
      "components": "shadcn form + input + button",
      "testids": ["auth-email-input", "auth-password-input", "auth-submit-button"]
    },

    "account_/hesap": {
      "sections": ["Profil", "Adresler", "Siparişlerim"],
      "components": "tabs + cards",
      "testids": ["account-tabs"]
    },

    "admin": {
      "dashboard_/admin": {
        "cards": ["Toplam Ürün", "Toplam Sipariş", "Bugün Sipariş"],
        "charts": "Optional: Recharts small area chart (green line) for orders",
        "testids": ["admin-kpi-cards"]
      },
      "products_/admin/urunler": {
        "layout": "table + filters",
        "testids": ["admin-products-table"]
      },
      "ai_add_/admin/urun-ekle": {
        "flow": [
          "Upload",
          "Loading",
          "AI JSON Preview",
          "Edit",
          "Confirm & Publish"
        ],
        "components": ["card", "progress", "tabs", "textarea", "dialog"],
        "json_preview": "Monospace block with copy button",
        "testids": [
          "admin-ai-upload-input",
          "admin-ai-loading-state",
          "admin-ai-json-preview",
          "admin-ai-publish-button"
        ]
      },
      "orders_/admin/siparisler": {
        "layout": "table with status badges",
        "testids": ["admin-orders-table"]
      }
    }
  },

  "libraries_and_integrations": {
    "framer_motion": {
      "use": "page transitions, card hover, drawer content fade",
      "install": "npm i framer-motion",
      "note": "Already in stack; ensure reduced motion handling."
    },
    "recharts_optional_admin": {
      "use": "Admin dashboard mini charts",
      "install": "npm i recharts",
      "components": "AreaChart, ResponsiveContainer",
      "empty_state": "If no data, show Skeleton + 'Henüz veri yok'"
    }
  },

  "image_urls": {
    "hero": [
      {
        "url": "https://images.unsplash.com/photo-1591810180805-d7bc7804ebfe?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "description": "Minimal white background plant hero (use as right-side hero image)."
      }
    ],
    "product_photography": [
      {
        "url": "https://images.unsplash.com/photo-1622797316708-131d2d7438c0?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "description": "Close-up leaf texture for category headers / placeholders."
      }
    ],
    "auth_side_image": [
      {
        "url": "https://images.unsplash.com/photo-1517021818302-9b520a06c834?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "description": "Nursery interior vibe for auth split layout (desktop only)."
      }
    ]
  },

  "instructions_to_main_agent": {
    "critical": [
      "Update /app/frontend/src/index.css tokens: set --radius to 10px and replace primary/foreground palette to green system above.",
      "Remove CRA default centered header styles from /app/frontend/src/App.css (do not center app).",
      "All interactive + key info elements MUST include data-testid in kebab-case.",
      "Use shadcn components from /app/frontend/src/components/ui (no raw HTML dropdown/calendar/toast).",
      "No transparent backgrounds anywhere (avoid backdrop-blur)."
    ],
    "recommended_components_to_build": [
      "ProductCard (Card + AspectRatio + Badge chips + Button)",
      "CareBento (5 cards grid with lucide icons)",
      "FilterSidebar (Accordion + Checkbox/Select/Slider)",
      "SEO Landing Strip (bento mini cards)",
      "CartDrawer (Drawer + line items + qty stepper)",
      "CheckoutStepper (Tabs-based)"
    ],
    "testid_convention": {
      "rule": "kebab-case, role-based",
      "examples": [
        "product-card-add-button",
        "category-filters-open-button",
        "admin-ai-publish-button",
        "checkout-iyzico-iframe"
      ]
    }
  }
}

---

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
