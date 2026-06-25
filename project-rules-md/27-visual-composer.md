# Visual Component System

All storefront UI components must support variants.

Components:

- Product Cards
- Category Cards
- Collection Cards
- Blog Cards
- Hero Sections
- Header
- Footer
- Navigation
- Product Detail Layouts

Rules:

All variants must consume the exact same data contract.

A variant may change:

- Layout
- Typography
- Spacing
- Visual hierarchy
- Animations

A variant must not require additional backend fields.

Switching variants must never require code changes.

Variants must be selectable from Admin Panel.

Changes must be applied globally.

The storefront must support future visual themes without changing business logic.