# Kamp Scout

**Live app:** [kampscout.com](https://kampscout.com)

A Recreation.gov campground finder with campsite cancellation and availability email alerts. Search campgrounds on an interactive map, view real-time availability, and get notified when sites open up.

## Features

- **Interactive map** – Search and explore Recreation.gov campgrounds by location
- **Availability matrix** – See campsite availability across dates at a glance (AG Grid)
- **Email alerts** – Get notified when campsites become available due to cancellations
- **Wilderness permits** – UI for wilderness permit availability alerts (beta)
- **Mobile-friendly** – Responsive design for on-the-go planning

## Tech Stack

**Frontend (this repo):**
- React, TypeScript, Vite
- Leaflet (mapping)
- AG Grid (data tables)
- Tailwind CSS

**Backend (separate repo):**
- Express, SQLite
- Recreation.gov / RIDB API polling
- Email alert system
- [mic-havock/ridb-backend](https://github.com/mic-havock/ridb-backend)

## Local Development

```bash
# Install dependencies (uses pnpm)
corepack enable
corepack install
pnpm install

# Start dev server
pnpm run dev
```

The frontend expects the backend API at `http://localhost:3001` (configure via `.env` if needed – see `.env.example`).

## Repository Structure

- `src/components/` – React components (map, grid, modals)
- `src/pages/` – Route-level page components
- `src/styles/` – Global styles and Tailwind configuration
- `public/` – Static assets

---

Built by [Michael Kovach](https://github.com/mic-havock) · Live at [kampscout.com](https://kampscout.com)
