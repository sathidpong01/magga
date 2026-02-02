# Changelog

All notable changes to this project will be documented in this file.

## [1.8.0] - 2026-02-03

### Changed

- **Major Framework Upgrade**: Modernized codebase for Next.js 16 & React 19 compliance
- **Tailwind CSS v4 Migration**:
  - Upgraded to v4 engine (Rust-based)
  - Removed `tailwind.config.ts` in favor of CSS variables
  - Updated `globals.css` with new syntax
- **Material UI v7 Migration**:
  - Upgraded all MUI packages to v7
  - Refactored `Grid` components to use new `size` prop syntax (replacing legacy `xs`, `md`, `item`)
- **Performance Optimization**:
  - Refactored `MangaForm` to use Server Component Data Injection (removed client-side waterfalls)
  - Improved initial page load for Admin Dashboard and Submit pages

### Fixed

- Fixed all deprecated `Grid` prop warnings
- Resolved potential "sync-dynamic-apis" errors by adopting `await params` pattern

---

## [1.7.0] - 2026-01-10

### Added

- **Author Management System**: Dedicated `Author` model with `socialLinks` field
- Multiple social links per author (Twitter, Pixiv, Facebook, etc.)
- Auto-fetch metadata from URLs (label + icon extraction)
- Author selector in MangaForm with create-on-fly capability

### Changed

- Manga pages now display author social links from `Author.socialLinks`
- Removed deprecated `authorCredits` field from `Manga` and `MangaSubmission` models
- Updated admin AuthorManager with modern UI (rounded buttons, better spacing)
- Standardized `borderRadius: 1` across all MUI components

### Removed

- `authorCredits` field from Prisma schema
- `iconUrl` field from Author model
- Old migration files (`author_migration.sql`, `migration-view-rating.txt`)
- `normalize-uploads.ts` utility script

---

## [1.6.1] - 2026-01-04

### Fixed

- Improved manga page load performance
- Reduced layout shifting during page load
- General rendering performance improvements

---

## [1.6.0] - 2026-01-01

### Added

- Image lightbox for comment images (fullscreen preview)
- Streaming SSR with React Suspense
- Server-first comments rendering

### Changed

- Comments system rewritten for better performance
- Homepage and manga pages load faster with optimized queries

---

## [1.5.0] - 2025-12-26

### Added

- Empty state UI when no manga matches filters
- Infinite scroll for manga listing
- Toast notifications for success/error states
- Reading progress indicator
- Cookie consent modal

### Changed

- Mobile grid layout: 2 cards per row
- Improved hover animations

### Fixed

- Layout shifting issues during page load

---

## [1.4.1] - 2025-12-08

### Fixed

- Security vulnerability patches
- Author icon display issues

---

## [1.4.0] - 2025-12-05

### Added

- Privacy Policy page (Thai)
- Terms of Service page (Thai)
- DMCA Report page
- Redesigned Footer

---

## [1.3.1] - 2025-12-04

### Added

- Real-time upload progress indicator (floating status)
- Retry button for failed uploads

### Changed

- Improved error messages for better UX

### Security

- Updated security measures

---

## [1.3.0] - 2025-12-02

### Added

- "Submit Manga" button in header
- Sticky transparent header with scroll effect

### Changed

- Redesigned manga cards with modern styling
- Simplified Footer design

---

## [1.2.0] - 2025-11-28

### Changed

- Improved overall responsiveness
- Enhanced image loading stability

### Fixed

- Minor bug fixes

---

## [1.1.0] - 2025-11-25

### Changed

- Modern UI redesign with Neutral Dark theme
- Reorganized layout structure
- Improved page load performance

---

## [1.0.5] - 2025-11-24

### Added

- Blur effect behind age verification modal

### Fixed

- Mobile display issues on some devices
- General performance improvements

---

## [1.0.0] - 2025-11-20

### Added

- Initial public release
- Manga reading with vertical scroll
- Search and filter functionality
- Responsive design (mobile, tablet, desktop)
- Admin panel for manga management
- User authentication system
- Cloudflare R2 image storage
- Turso (LibSQL) database
