## $(date +%Y-%m-%d) - Mobile Floating UI Overlap Overhaul
**Learning:** Fixed bottom-positioned elements (like mobile bottom navigation, sticky CTA bars, and floating chat buttons) frequently overlap on small viewports if they all use `bottom-0` or small `bottom-*` offsets.
**Action:** When implementing sticky elements on mobile, always check for collision with global `BottomNav`. Apply an increased `bottom` inset (e.g., `bottom-14` or larger) to clear standard navigation heights.
