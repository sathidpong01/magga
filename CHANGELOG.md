# Changelog

All notable changes to this project will be documented in this file.

## [1.9.4] - 2026-03-07

### Fixed

- **Display & Links**: Fixed multiple UI issues across the application
  - Moved manga tags from standalone box to top row next to category badge
  - Fixed header profile link navigation to correct user profile URL
  - Resolved scroll-behavior smooth warning by adding data-scroll-behavior attribute
  - Redesigned star rating display: 5-star visual with partial fills in stats row
  - Reduced social URL chips spacing for cleaner layout

- **Profile Management**: Enhanced user profile functionality
  - Added "ชื่อแสดง" (display name) field in account settings
  - Fixed username/profile update API error (updatedAt Date object issue)
  - Profile pages now support lookup by both username and user ID

- **Comment System**: Improved comment display preferences
  - Changed from radio selection to independent toggles for comment placement
  - Users can now show/hide "ข้างรูป (ทีละหน้า)" and "ท้ายเรื่อง" independently
  - Added support for 'both' and 'none' comment preference states

- **Account Settings**: Simplified password requirements
  - Reduced password requirements to: 8+ chars, uppercase, lowercase, numbers
  - Removed special character requirement
  - Added real-time password requirements badge showing validation status

### Added

- **User Profile Pages**: Complete user profile system
  - `/profile/[username]` pages with user info, stats, and action links
  - Avatar upload functionality with preview and Cloudflare R2 storage
  - "My Comments" page to view all user's comments
  - Profile breadcrumb navigation with fallback to user ID

- **Blocking System**: Enhanced moderation features
  - Block/unblock users and tags from account settings
  - Filter manga list to exclude items with blocked tags
  - Real-time count updates for blocked items

- **Comment Moderation**: Block user dropdown in comments
  - Quick block/unblock options next to usernames in comments
  - Profile view links for blocked users

### Changed

- Updated MangaViewRating component with flexible hideInteractive/hideAverage props
- Improved error handling for setState-in-render issues
- Enhanced UI consistency across settings panels

---

## [1.9.3] - 2026-03-04

### Changed

- Complete migration from **Prisma ORM** to **Drizzle ORM** for better performance, faster type checking, and edge-compatibility.
- Migrated authentication from **NextAuth.js** to **Better Auth**.
- Updated `package.json` scripts to use Drizzle Kit (`db:generate`, `db:push`, `db:migrate`, `db:studio`).

### Removed

- Completely removed `prisma`, `@prisma/client` and all related adapter dependencies.
- Completely removed `next-auth`.

---

## [1.8.0] - 2026-02-13

### Changed

- Upgraded **Tailwind CSS** to v4 (Improved build performance, smaller bundle)
- Upgraded **MUI (Material UI)** to v7 (Migrated to Grid v2 API)
- Replaced legacy `md5` library with native Web Crypto API
- Updated TypeScript configuration to `es2017` target and `bundler` resolution
- Increased Vercel function timeouts to 30s for complex queries

### Fixed

- Resolved MUI Grid v2 type compatibility issues
- Fixed ESLint configuration for Next.js 16 (Flat Config)
- Cleaned up unused dependencies and scripts

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
