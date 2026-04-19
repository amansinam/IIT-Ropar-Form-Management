# IIT Ropar Form Portal Admin — Next.js

This project has been converted from **Vite + React Router** to **Next.js 15 (App Router)**.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:** `admin@iitrpr.ac.in` / `admin123`

---

## Key Changes from Vite → Next.js

### Routing
| Vite (React Router) | Next.js App Router |
|---|---|
| `createBrowserRouter` in `routes.tsx` | File-based routing in `src/app/` |
| `<RouterProvider>` in `App.tsx` | `layout.tsx` files |
| `<Outlet />` in `MainLayout` | `{children}` prop in layout |

### Navigation
| Vite | Next.js |
|---|---|
| `import { Link } from 'react-router'` | `import Link from 'next/link'` |
| `<Link to="/path">` | `<Link href="/path">` |
| `import { useNavigate }` | `import { useRouter } from 'next/navigation'` |
| `const navigate = useNavigate()` | `const router = useRouter()` |
| `navigate('/path')` | `router.push('/path')` |
| `import { useLocation }` | `import { usePathname } from 'next/navigation'` |

### Images
| Vite | Next.js |
|---|---|
| `import logo from '@/assets/logo.png'` | `import Image from 'next/image'` |
| `<img src={logo} />` | `<Image src="/logo.png" width={x} height={x} alt="..." />` |
| Asset in `src/assets/` | Asset in `public/` |

### Entry Point
| Vite | Next.js |
|---|---|
| `src/main.tsx` + `index.html` | `src/app/layout.tsx` |
| `createRoot(...).render(<App />)` | `export default function RootLayout` |

### CSS
| Vite | Next.js |
|---|---|
| `@import 'tailwindcss'` (Tailwind v4) | `@tailwind base/components/utilities` (v3) |
| `@tailwindcss/vite` plugin | `tailwindcss` + `postcss` |

### Protected Routes
The `(protected)` route group in `src/app/(protected)/` wraps all authenticated pages with `MainLayout`. The `(` `)` parentheses make Next.js treat it as a layout group without adding the segment to the URL.

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (replaces main.tsx)
│   ├── page.tsx                # Redirects to /dashboard
│   ├── login/
│   │   └── page.tsx            # Login page
│   └── (protected)/            # Auth-guarded route group
│       ├── layout.tsx          # Wraps pages with MainLayout
│       ├── dashboard/page.tsx
│       ├── forms/
│       │   ├── create/page.tsx
│       │   ├── available/page.tsx
│       │   ├── pending/page.tsx
│       │   └── all/page.tsx
│       ├── users/page.tsx
│       ├── members/
│       │   ├── add/page.tsx
│       │   └── all/page.tsx
│       ├── activity/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx      # Layout wrapper with auth guard
│   │   ├── Sidebar.tsx
│   │   └── TopNavbar.tsx
│   ├── ui/                     # shadcn/ui components (unchanged)
│   └── figma/
│       └── ImageWithFallback.tsx
├── context/
│   └── AppContext.tsx          # Client context (unchanged logic)
├── data/
│   └── mockData.ts             # Mock data (unchanged)
└── styles/
    ├── globals.css             # Global styles (replaces index.css)
    └── *.module.css            # CSS modules (unchanged)
```
