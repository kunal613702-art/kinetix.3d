# Nexus3D Admin Dashboard

Modern SaaS admin dashboard for a 3D printing platform using:

- Next.js (App Router)
- React
- TailwindCSS
- ShadCN-style UI primitives
- Recharts
- Lucide Icons

## Run

```bash
cd admin-dashboard
npm install
npm run dev
```

Open `http://localhost:3000`.

Backend should run at `http://localhost:5000`.

## Backend APIs required

The dashboard consumes live APIs from:

- `GET /api/admin/summary`
- `PATCH /api/admin/orders/:id`
- `GET/PATCH /api/admin/uploads`
- `GET/POST/PATCH /api/admin/printers`
- `GET/POST/PATCH /api/admin/materials`
- `GET/PUT /api/admin/pricing`
- `GET/POST/PATCH /api/admin/quotes`
- `GET/POST/PATCH /api/admin/tickets`
- `GET /api/admin/reviews`

## Included

- Collapsible sidebar with all admin nav items
- Top navbar with search, notifications, messages, profile, theme toggle
- KPI cards with progress + growth indicators
- Interactive charts for monthly orders + revenue trend
- Recent orders table with search + status filtering
- Right side quick stats panel with pie chart + operational metrics
- 3D printing admin modules:
  - Orders Management
  - Model Upload Management
  - Printer Management
  - Material Management
  - Pricing Control
