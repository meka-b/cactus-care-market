import ProductCardDefault from './ProductCard/variants/Default';
import ProductCardMinimal from './ProductCard/variants/Minimal';
import ProductCardMetro from './ProductCard/variants/Metro';
import ProductCardPremium from './ProductCard/variants/Premium';

import ProductDetailDefault from './ProductDetail/variants/Default';
import ProductDetailPremium from './ProductDetail/variants/Premium';

import HeroBannerDefault from './HeroBanner/variants/Default';
import HeroBannerBentoGrid from './HeroBanner/variants/BentoGrid';
import HeroBannerCategoryBentoGrid from './HeroBanner/variants/CategoryBentoGrid';
import HeroBannerInfiniteMarquee from './HeroBanner/variants/InfiniteMarquee';

import HeaderNavbarDefault from './HeaderNavbar/variants/Default';
import HeaderNavbarEvon from './HeaderNavbar/variants/Evon';

import CategoryListDefault from './CategoryList/variants/Default';
import CategoryListModernCarousel from './CategoryList/variants/ModernCarousel';

import SiteBreadcrumbDefault from './SiteBreadcrumb/variants/Default';
import SiteBreadcrumbMinimalSlash from './SiteBreadcrumb/variants/MinimalSlash';

import ShopHeaderDefault from './ShopHeader/variants/Default';
import ShopHeaderMinimalSubnav from './ShopHeader/variants/MinimalSubnav';

import BundleModuleDefault from './BundleModule/variants/Default';
import BundleModuleMinimal from './BundleModule/variants/Minimal';

export const REGISTRY = {
  CategoryList: {
    description: "Ana sayfa kategori listesi tasarımı",
    default: "Default",
    variants: {
      Default: CategoryListDefault,
      ModernCarousel: CategoryListModernCarousel
    }
  },
  SiteBreadcrumb: {
    description: "Sitenin genel ekmek kırıntısı (Breadcrumb) tasarımı",
    default: "Default",
    variants: {
      Default: SiteBreadcrumbDefault,
      MinimalSlash: SiteBreadcrumbMinimalSlash
    }
  },
  ShopHeader: {
    description: "Kategori sayfasının üst başlık ve alt kategori gezinme alanı",
    default: "Default",
    variants: {
      Default: ShopHeaderDefault,
      MinimalSubnav: ShopHeaderMinimalSubnav
    }
  },
  HeaderNavbar: {
    description: "Sitenin üst navigasyon menüsü (Header)",
    default: "Default",
    variants: {
      Default: HeaderNavbarDefault,
      Evon: HeaderNavbarEvon
    }
  },
  HeroBanner: {
    description: "Ana sayfa hero (karşılama) alanı tasarımı",
    default: "Default",
    variants: {
      Default: HeroBannerDefault,
      BentoGrid: HeroBannerBentoGrid,
      CategoryBentoGrid: HeroBannerCategoryBentoGrid,
      InfiniteMarquee: HeroBannerInfiniteMarquee
    }
  },
  ProductCard: {
    description: "Ana sayfa ve listelemelerdeki ürün kartı",
    default: "Default",
    variants: {
      Default: ProductCardDefault,
      Minimal: ProductCardMinimal,
      Metro: ProductCardMetro,
      Premium: ProductCardPremium
    }
  },
  ProductDetail: {
    description: "Ürün detay sayfası tasarımı",
    default: "Default",
    variants: {
      Default: ProductDetailDefault,
      Premium: ProductDetailPremium
    }
  },
  BundleModule: {
    description: "Birlikte Al (Bundle) modülü tasarımı",
    default: "Default",
    variants: {
      Default: BundleModuleDefault,
      Minimal: BundleModuleMinimal
    }
  }
};
