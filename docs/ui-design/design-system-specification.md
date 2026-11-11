# CampusFind – Design System Specification & Visual Planning Guide

> **Project:** CampusFind – University Lost and Found Management System  
> **Tagline:** *Find. Report. Reclaim.*  
> **Stage:** Project Foundation, Design System & Team Task Planning  
> **Version:** 1.0.0  
> **Target Audience:** Frontend Developers, UI/UX Designers, Backend Integrators  

---

## 1. Design Philosophy & Visual Identity

CampusFind is an academic lost-and-found management platform built for university students, faculty, and administrative staff. The design language must convey **trust, security, professionalism, and effortless clarity**.

### Core Brand Principles:
1. **Mobile-First Engineering**: Every interface, layout, and component is designed and styled starting from mobile viewports (smartphones, 320px–480px) as the base foundation, progressively enhancing for tablet (768px) and desktop (1024px+).
2. **Academic Credibility & Trust**: Deep university navy (`#0C2340` / `#0A192F`) serves as the anchor color for sidebars, headers, and hero banners.
3. **Actionable Blue Accents**: High-contrast royal blue (`#2563EB` / `#1D4ED8`) directs the user’s eye toward primary actions (*Submit Report*, *Claim Item*, *Filter*).
4. **Soft, Calming Surfaces**: Neutral slate backgrounds (`#F8FAFC` and `#FFFFFF`) reduce visual fatigue and prevent cognitive overload.
5. **Thumb-Friendly Touch Targets**: Minimum 44×44px hit areas on mobile controls, dedicated bottom-bar navigation, and responsive 2×2 stat grids.
6. **Privacy by Default**: Public views never display sensitive student identification (student IDs, personal phone numbers, or private emails).

### 1.1 Styling Architecture & Implementation Status
- **Current Foundation**: The visual design system is currently implemented via standard CSS custom properties (tokens) and utility rules in `frontend/css/design-system.css`. This enables instant in-browser preview without build-step dependencies during the preparation and foundation stage.
- **Tailwind CSS Roadmap**: Tailwind CSS is planned for future automated compilation workflows. The utility naming conventions and arbitrary-value classes shown throughout this specification (e.g., `bg-[#0A192F]`, `w-[260px]`) are mapped directly to corresponding custom CSS variables and utility classes in `design-system.css` until the Tailwind build pipeline is integrated.

---

## 2. Colour Palette & Design Tokens

### 2.1 Brand Navy Palette (Primary Brand Anchor)
Used for desktop sidebars, navigation bars, hero overlays, and deep contrast text.

| Token Name | Hex Code | Role / Usage |
|---|---|---|
| `--cf-navy-950` | `#06121E` | Deepest contrast background, text dark headings |
| `--cf-navy-900` | `#0A192F` | Desktop sidebar background, primary brand surface |
| `--cf-navy-850` | `#0C2340` | Active sidebar item background, hero card gradients |
| `--cf-navy-800` | `#102A4C` | Borders within dark navigation, hover states on navy |
| `--cf-navy-700` | `#1E3A8A` | Sub-headers on dark backgrounds, secondary brand marks |

### 2.2 Primary Action Blue (Interactive Accent)
Used for call-to-action buttons, active navigation pills, link states, and focus rings.

| Token Name | Hex Code | Role / Usage |
|---|---|---|
| `--cf-blue-700` | `#1D4ED8` | Hover / active state on primary action buttons |
| `--cf-blue-600` | `#2563EB` | Primary CTA buttons, active sidebar pill, active tabs |
| `--cf-blue-500` | `#3B82F6` | Accent borders, link highlights, focus ring outlines |
| `--cf-blue-100` | `#DBEAFE` | Soft badge backgrounds, icon container fills |
| `--cf-blue-50`  | `#EFF6FF` | Table row hover highlight, selected card background |

### 2.3 Neutral Surfaces & Structural Tokens
Used for card surfaces, page canvases, input borders, and typography.

| Token Name | Hex Code | Role / Usage |
|---|---|---|
| `--cf-bg-page`   | `#F8FAFC` | Global page background (soft off-white) |
| `--cf-bg-card`   | `#FFFFFF` | Card surfaces, modals, popovers, dropdowns |
| `--cf-bg-subtle` | `#F1F5F9` | Input field background, table headers, segmented pills |
| `--cf-border`    | `#E2E8F0` | Default 1px card borders, table dividers |
| `--cf-border-dark`| `#CBD5E1`| Hover borders, input idle borders |
| `--cf-text-main` | `#0F172A` | Primary heading and body copy (high readability) |
| `--cf-text-muted`| `#64748B` | Secondary copy, timestamps, form helper text |
| `--cf-text-light`| `#94A3B8` | Input placeholder text, disabled states |

### 2.4 Semantic Status Tokens
Used for item report categories, claim statuses, and administrative decisions.

| Status | Background | Text Color | Border Color | Pill Dot Color | Usage |
|---|---|---|---|---|---|
| **Found** | `#ECFDF5` | `#065F46` | `#A7F3D0` | `#10B981` | Found items, Approved claims |
| **Lost** | `#FEF2F2` | `#991B1B` | `#FECACA` | `#EF4444` | Lost items, Rejected claims |
| **Pending** | `#FFFBEB` | `#92400E` | `#FDE68A` | `#F59E0B` | Claims awaiting admin review |
| **Resolved** | `#EFF6FF` | `#1E40AF` | `#BFDBFE` | `#3B82F6` | Claimed & reclaimed items |

---

## 3. Typography Scale & Hierarchy

- **Primary Font Family**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `Helvetica`, `Arial`, `sans-serif`
- **Fallback**: System sans-serif stack ensuring zero layout shift before web fonts load.

| Level | Size | Weight | Line Height | Tracking | Purpose |
|---|---|---|---|---|---|
| **Display / Hero** | `32px` (`2.0rem`) | 800 (ExtraBold) | `1.2` | `-0.025em` | Landing page hero titles |
| **Page Title (H1)** | `24px` (`1.5rem`) | 700 (Bold) | `1.25` | `-0.02em` | Screen titles ("Dashboard", "Browse Items") |
| **Section Header (H2)**| `18px` (`1.125rem`)| 600 (SemiBold)| `1.35` | `-0.01em` | Section headers ("Recent Activity", "Filter By")|
| **Card Title (H3)** | `15px` (`0.9375rem`)| 600 (SemiBold)| `1.4` | `0` | Item card names ("Black Backpack", "AirPods") |
| **Body (Base)** | `14px` (`0.875rem`)| 400 (Regular) | `1.5` | `0` | Form labels, descriptions, table cells |
| **Subtext / Meta** | `13px` (`0.8125rem`)| 500 (Medium) | `1.4` | `0` | Dates, campus locations, category tags |
| **Badge / Caption** | `11px` (`0.6875rem`)| 700 (Bold) | `1.2` | `+0.03em` | Status pills ("FOUND", "LOST", "PENDING") |

---

## 4. Spacing, Elevation & Corner Radii

### 4.1 Spacing Grid
The design system operates on an **8-point grid** (with a 4px half-step for micro-adjustments):
- `4px` (`0.25rem`): Micro gaps, badge inner padding
- `8px` (`0.5rem`): Button inner padding, icon gaps
- `12px` (`0.75rem`): Input inner padding, small component margins
- `16px` (`1.0rem`): Card internal padding, form row spacing
- `24px` (`1.5rem`): Section gaps, grid column gaps
- `32px` (`2.0rem`): Large container padding, hero section spacing

### 4.2 Corner Radii Scale
- **Small (`8px` / `0.5rem`)**: Buttons, input fields, dropdown menus
- **Medium (`12px` / `0.75rem`)**: Item cards, stat containers, notification boxes
- **Large (`16px` / `1.0rem`)**: Major cards, dashboard widgets
- **Extra Large (`20px` / `1.25rem`)**: Modal dialog sheets, hero banners
- **Full (`9999px`)**: Status pill badges, user avatar circles

### 4.3 Shadow & Elevation Tokens
- **Subtle (`--cf-shadow-sm`)**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (form inputs, buttons)
- **Card (`--cf-shadow-card`)**: `0 2px 8px -2px rgba(12, 35, 64, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)` (standard surface cards)
- **Hover (`--cf-shadow-hover`)**: `0 10px 20px -3px rgba(12, 35, 64, 0.10), 0 4px 6px -2px rgba(12, 35, 64, 0.05)` (cards on mouseover)
- **Modal (`--cf-shadow-modal`)**: `0 20px 25px -5px rgba(12, 35, 64, 0.25), 0 8px 10px -6px rgba(12, 35, 64, 0.2)` (dialogs & popovers)

---

## 5. Layout Architecture & Responsive Breakpoints

```
[DESKTOP LAYOUT (>= 769px)]
┌──────────────────┬────────────────────────────────────────────────────────┐
│  CF SIDEBAR      │  CF TOPBAR / HEADER (64px)                             │
│  (Width: 260px)  ├────────────────────────────────────────────────────────┤
│                  │                                                        │
│  • Brand Logo    │  CF MAIN CONTENT WORKSPACE                             │
│  • Nav Links     │  (Padding: 24px - 32px)                                │
│    - Dashboard   │  • Page Title & Actions                                │
│    - Report Item │  • Responsive Stat Cards Grid                          │
│    - Browse      │  • Content Tables / Item Grids                         │
│    - My Reports  │                                                        │
│    - My Claims   │                                                        │
│    - Profile     │                                                        │
│  • Logout        │                                                        │
└──────────────────┴────────────────────────────────────────────────────────┘

[MOBILE LAYOUT (< 769px)]
┌────────────────────────────────────────────────────────┐
│  CF MOBILE HEADER (56px) - Logo + Notification + Menu  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  CF MAIN CONTENT WORKSPACE                             │
│  (Padding: 16px, Bottom Padding: 74px)                 │
│  • 2x2 Stat Cards                                      │
│  • Vertical Card Stack                                 │
│                                                        │
├────────────────────────────────────────────────────────┤
│  CF BOTTOM NAVIGATION BAR (64px)                       │
│  [ Home ]    [ Browse ]    [ Report ]    [ Profile ]   │
└────────────────────────────────────────────────────────┘
```

### Breakpoint & Mobile-First Strategy:
- **Base Layer (Mobile First — `< 768px`)**:
  - The default CSS rules without media queries target mobile screens.
  - Sticky bottom app navigation (`Home`, `Browse`, `Report`, `Profile`) active by default.
  - Off-canvas sidebar hidden by default.
  - Single-column flowing form fields with full-width action buttons (min height 44px for thumb targets).
  - Stat cards display in a responsive 2×2 mobile grid.
  - Item lists render as clean vertical card feeds.
- **Tablet Enhancement (`@media (min-width: 768px)`)**:
  - Item card feeds expand into a 2-column grid.
  - Form dialogs adopt side-by-side secondary fields where appropriate.
  - Desktop-style compact header becomes available.
- **Desktop Enhancement (`@media (min-width: 1025px)`)**:
  - Fixed 260px persistent Navy sidebar active.
  - Mobile bottom navigation bar hidden (`display: none`).
  - Workspace margin offsets for the sidebar (`margin-left: 260px`).
  - Item grids expand to 3 columns with spacious card layouts and left filter drawers.

---

## 6. Reusable Component Specifications

### 6.1 Desktop Navy Sidebar Component (`sidebar.js`)
- **Container**: `fixed top-0 left-0 bottom-0 w-[260px] bg-[#0A192F]`
- **Variants**:
  - `student`: Links to Dashboard, Report Item, Browse Items, My Reports, My Claims, Profile.
  - `admin`: Links to Dashboard, Manage Reports, Review Claims, Manage Users, Settings.
- **Active State**: Solid Blue Pill (`bg-[#2563EB] text-white shadow-md font-semibold`).
- **Inactive State**: Ghost item with text `#94A3B8`, hover to `#FFFFFF` with `bg-white/10`.

### 6.2 Top App Navbar (`navbar.js`)
- **Height**: `64px`, `border-b border-slate-200 bg-white sticky top-0 z-30`.
- **Right Area**:
  - Notification Bell with red counter badge (`bg-red-500 text-white rounded-full text-xs`).
  - User Avatar Pill: Circle with user initials (`FS` or `AM`), name display, and role badge.
  - Mobile Hamburger Button (visible only on screens `< 768px`).

### 6.3 Mobile Bottom Navigation Bar (`bottom-nav.js`)
- **Height**: `64px`, `fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50`.
- **Items (4 equal touch targets)**:
  1. `Home` (Dashboard)
  2. `Browse` (Items list & search)
  3. `Report` (Add report action)
  4. `Profile` (Settings & account info)
- **Active Indicator**: Blue tint on SVG icon + text (`text-[#2563EB]`).

### 6.4 Lost & Found Item Card (`item-card.js`)
- **Container**: `bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden`.
- **Image Thumbnail**: Aspect ratio 4:3 or 16:9, rounded top corners, object-cover.
- **Header**: Item Name (H3, 15px, font-semibold), Status Badge (Found in emerald, Lost in rose).
- **Meta Row**: Location icon + location name; Calendar icon + date reported.
- **Action**: Click card to open Item Details modal / view.

### 6.5 Stat / Metric Card (`stat-card.js`)
- **Structure**:
  - Round icon badge with pastel background (e.g. blue for Reports, green for Claims, purple for Total Items, amber for Activity).
  - Prominent metric value (28px font-bold).
  - Clear descriptive label ("My Reports", "Pending Claims", "Total Items").
- **Hover Effect**: Subtle vertical translation (`translate-y-[-2px]`) and card shadow elevation.

### 6.6 Status Badge Component (`badge.js`)
- **Found**: `bg-emerald-50 text-emerald-800 border-emerald-200`
- **Lost**: `bg-rose-50 text-rose-800 border-rose-200`
- **Pending**: `bg-amber-50 text-amber-800 border-amber-200`
- **Approved**: `bg-emerald-100 text-emerald-900 border-emerald-300`
- **Rejected**: `bg-rose-100 text-rose-900 border-rose-300`

### 6.7 Form Controls & Segmented Toggle Pill
- **Segmented Toggle**:
  - Outer container: `bg-slate-100 p-1 rounded-lg border border-slate-200 flex`
  - Two buttons: `Lost Item` vs `Found Item`
  - Active button: `bg-[#2563EB] text-white shadow-sm font-semibold rounded-md`
- **Inputs**: Height `44px`, `rounded-md`, border `#E2E8F0`, focus border `#2563EB` with focus ring `0 0 0 3px rgba(37,99,235,0.15)`.
- **Image Dropzone**: Dashed border (`border-2 border-dashed border-slate-300`), cloud upload icon, click/drag-and-drop target, instant preview container.

### 6.8 Modal Dialog Component (`modal.js`)
- **Backdrop**: Semi-transparent dark navy overlay (`rgba(10, 25, 47, 0.6)`) with `backdrop-filter: blur(4px)`.
- **Card**: Centered, max-width `520px`, `rounded-2xl`, internal padding `28px`.
- **Keyboard & Focus Handling**: Closes on `Escape` key, click outside backdrop closes modal, focus trapped inside dialogue.

### 6.9 Toast Notification System (`toast.js`)
- **Position**: Fixed bottom-right on desktop (`bottom-6 right-6`), top-center on mobile (`top-4 inset-x-4`).
- **Variants**:
  - `success` (Green border + checkmark icon)
  - `error` (Red border + warning circle icon)
  - `info` (Blue border + info icon)
- **Auto-Dismiss**: Automatically fades out after 4 seconds; dismissible via close button.

### 6.10 Empty State Component (`empty-state.js`)
- **Anatomy**: Soft gray illustrated icon, clear title (e.g., *"No items found"*), explanatory sentence, and CTA button (*"Clear filters"* or *"Report a Lost Item"*).

### 6.11 Authentication & Onboarding Interface Policy
In accordance with team architectural decisions (DEC-004 through DEC-006):
- **Local Credential Forms (MVP Focus)**: Sign-up and login interfaces strictly feature email and password form inputs. Google SSO buttons previously shown on mockups are **deferred to Phase 2 (post-MVP)** and must be hidden or omitted from initial MVP template markup.
- **Email Validation & Domain Policy**: The registration form validates standard RFC 5322 email syntax in MVP (`VALIDATION.ENFORCE_INSTITUTION_DOMAIN: false`), with configurable support for institutional domain enforcement (`@*.edu` / `@university.ac.uk`) pending final administration sign-off.
- **Two-Tier Verification UI**:
  1. *Email Ownership Verification Banner*: A dismissible, high-visibility banner prompts unverified users to click their confirmation email before submitting lost/found reports or claims.
  2. *Institutional Student Verification*: Badge display on user profiles remains inactive or marked as pending until institutional registry verification mechanisms are selected in a subsequent phase.

---

## 7. Team Task Allocation & Development Roadmap

This design system is ready to be divided among team members for implementation across sprints:

| Workstream | Proposed Sub-Tasks | Primary Deliverables |
|---|---|---|
| **Stream A: Core Shell & Navigation** | • Implement Desktop Sidebar (`sidebar.js`)<br>• Implement Top Navbar (`navbar.js`)<br>• Implement Mobile Bottom Nav (`bottom-nav.js`) | Reusable navigation shell responsive across desktop, tablet, and mobile. |
| **Stream B: Shared UI Components** | • Build Item Card (`item-card.js`)<br>• Build Stat Card (`stat-card.js`)<br>• Build Modal Dialog (`modal.js`)<br>• Build Toast Alert System (`toast.js`) | Interactive component library testable in isolation. |
| **Stream C: Form Systems & Validation** | • Form input controls & focus states<br>• Segmented toggle pills (Lost / Found)<br>• Image upload dropzone with instant client preview | Reusable form components with validation feedback and privacy masking. |
| **Stream D: Service & State Foundation** | • Centralized `config.js` and `state.js`<br>• Agnostic email validation<br>• Decoupled service layer ready for REST API integration | State management and mock data layer. |

---

## Summary of Phase 2 Planning Deliverables

1. **Design System Specification Document**: Complete reference (`docs/ui-design/design-system-specification.md`) detailing typography, 8pt spacing grid, color tokens, and responsive blueprints.
2. **Component Blueprints**: Specifications for core reusable components and onboarding interfaces.
3. **Styling Foundation Clarification**: Custom CSS design tokens (`design-system.css`) established as the current styling engine, with future Tailwind compilation support planned.
4. **Task Allocation Guide**: Clear breakdown ready for assignment across development team members.
5. **Architectural Synchronization**: Alignment with decisions DEC-001 through DEC-008 (Phase 2 Google OAuth deferral, dual verification tiers, and configurable domain policy).

This concludes the Phase 2 Design System and visual planning documentation.
