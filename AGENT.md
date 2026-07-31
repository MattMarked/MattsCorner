# 🤖 Agent Context & Architecture Guide: Matt's Corner

Welcome to **Matt's Corner**! This document is designed for AI agents and developer sessions to quickly understand the project's background, system architecture, data flow, design decisions, and operational workflows.

---

## 📌 Project Overview

**Matt's Corner** is a Dublin food discovery and tracking web application. It parses restaurant lists from Markdown (`src/data/dublin-food.md`), geocodes their locations from Google Maps URLs, applies custom spatial transformations, stores them in a database, and presents them on an interactive map UI.

Key Functionality:
- 🗺️ **Interactive Leaflet Map**: Zero-cost map rendering using OpenStreetMap tiles.
- 🍱 **Categorization & Emojis**: Dynamic pin icons based on food category (Asian, Italian, Pizza, Bakery, etc.).
- ✅ **Progress Tracking**: Differentiates between visited vs. "to try" places.
- 📐 **Coordinate Shifting**: Custom spatial offset applied to coordinates prior to storage and display.
- 🗄️ **Dual Database Architecture**: SQLite for local desktop development; Turso (`libsql`) for Vercel serverless deployment.

---

## 🏗️ Architecture & Component Design

```mermaid
graph TD
    MD[src/data/dublin-food.md] --> Parser[src/lib/parser.ts]
    Parser --> Resolver[src/lib/url-resolver.ts]
    Resolver --> GeocodeAPI[/api/geocode]
    GeocodeAPI --> CoordShift[src/lib/coordinates.ts]
    CoordShift --> DB[(Database: SQLite / Turso)]
    
    DB --> REST_API[/api/restaurants & /api/stats]
    REST_API --> Page[src/app/page.tsx]
    Page --> DynamicMap[src/components/RestaurantMap.tsx]
    DynamicMap --> LeafletMap[src/components/MapInner.tsx]
```

### 1. Data Parsing & Geocoding Pipeline
- **Markdown Data Source**: `src/data/dublin-food.md` serves as the primary ground truth. It contains markdown checkboxes, headings (categories), Google Maps links, and optional Instagram handles.
- **Parser (`src/lib/parser.ts`)**: Reads markdown structures, extracts metadata (name, description, status `completed`/`pending`, category, URLs).
- **URL Resolver (`src/lib/url-resolver.ts`) & Geocode API (`/api/geocode`)**: Resolves Google Maps links or search queries into raw latitude/longitude coordinates.
- **Coordinate Shifter (`src/lib/coordinates.ts`)**: Shifts all coordinates **171 meters eastward** (~+0.002467° longitude at Dublin's latitude ~53.35°N).
  - Configurable via `.env.local`: `COORDINATE_SHIFT_ENABLED` and `COORDINATE_EAST_SHIFT_METERS`.
  - See [`COORDINATE_SHIFTING.md`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/COORDINATE_SHIFTING.md) for detailed mathematical rationale.

### 2. Dual Database Layer
- **Local Dev (`src/lib/database.ts`)**: Uses `better-sqlite3` targeting a local file (`database/restaurants.db`). Synchronous, fast, ideal for local testing. *Note: `better-sqlite3` relies on native C bindings and fails in Vercel edge/serverless environments.*
- **Production / Vercel (`src/lib/database-turso.ts`)**: Uses `@libsql/client` to connect to a Turso database over HTTPS/WebSocket (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`). Async API.
- **API Routes**: Prepared to switch between database implementations depending on environment configuration.

### 3. Frontend & Mapping Strategy
- **Framework**: Next.js 14 (App Router).
- **Leaflet Integration (`src/components/RestaurantMap.tsx` & `MapInner.tsx`)**:
  - Leaflet depends heavily on browser `window` APIs.
  - `RestaurantMap.tsx` wraps `MapInner.tsx` using `next/dynamic` with `{ ssr: false }`.
  - Custom HTML markers created via `L.divIcon` incorporating category emojis and status colors (defined in `src/lib/icon-strategy.ts`).

---

## 📁 Key File Map

| Path | Description |
| :--- | :--- |
| [`src/app/page.tsx`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/app/page.tsx) | Main page layout, search filtering state, header controls, full-screen map layout. |
| [`src/app/api/restaurants/route.ts`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/app/api/restaurants/route.ts) | GET (list/filter) and POST (refresh dataset from markdown). |
| [`src/components/MapInner.tsx`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/components/MapInner.tsx) | Leaflet map instance, custom markers, popups, bounds calculations. |
| [`src/components/RestaurantMap.tsx`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/components/RestaurantMap.tsx) | Client component dynamic import wrapper with SSR disabled. |
| [`src/lib/coordinates.ts`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/lib/coordinates.ts) | Eastward coordinate shifting logic. |
| [`src/lib/database.ts`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/lib/database.ts) | Local `better-sqlite3` database driver & repository. |
| [`src/lib/database-turso.ts`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/lib/database-turso.ts) | Turso `libsql` database driver & repository for serverless. |
| [`src/lib/icon-strategy.ts`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/lib/icon-strategy.ts) | Category emoji mapping, marker styling, status badges. |
| [`src/lib/parser.ts`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/lib/parser.ts) | Markdown file parser for `src/data/dublin-food.md`. |
| [`src/lib/url-resolver.ts`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/lib/url-resolver.ts) | Google Maps shortlink/coordinate string extractor. |
| [`src/data/dublin-food.md`](file:///Users/metchio/Dropbox/ObsydianVault/Food/MattsCorner/src/data/dublin-food.md) | Ground-truth markdown list of Dublin food spots. |

---

## 💡 Important Considerations for Future Agent Sessions

1. **Leaflet & SSR**:
   - **Never** render Leaflet components directly during SSR. Always access `L` or Leaflet modules inside browser-only hooks or via dynamically imported components with `{ ssr: false }`.

2. **Database Imports**:
   - If writing or updating API routes intended for production on Vercel, ensure you rely on `database-turso.ts` (`@libsql/client`) or maintain compatible abstraction wrappers, as `better-sqlite3` cannot run in Vercel serverless functions.

3. **Coordinate Shifting**:
   - Coordinates are intentionally shifted 171m East. If debugging map pin offsets or geocoding accuracy, check `COORDINATE_SHIFT_ENABLED` in `.env.local` before assuming a bug in geocoding.

4. **Data Sync**:
   - Triggering the "Refresh" button in the UI makes a POST call to `/api/restaurants`, which re-parses `src/data/dublin-food.md` and updates database entries.

5. **Commands Reference**:
   - Dev Server: `npm run dev`
   - Turso Migration: `npm run migrate:turso`
   - Test Coordinate Shift: `node scripts/test-coordinate-shift.js`
