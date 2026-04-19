# IIT Ropar — Form Management System

> A centralized, role-based form submission and verification platform for Indian Institute of Technology Ropar.

---

## Project Overview

The system is composed of **five services** that work together:

| Service | Port | Purpose |
|---|---|---|
| `backend` | **3001** | NextAuth (Google OAuth) + all API routes + Prisma/PostgreSQL |
| `user_portal` | **3000** | Students & faculty submit and track forms |
| `admin_portal` | **3002** | Admins build forms, manage verifiers, monitor submissions |
| `verifier portal` | **3003** | HOD / Dean / Caretaker / Faculty approve submissions |
| `landing_page` | **3004** | Single unified entry point — choose your portal here |

**Entry point for all users → `http://localhost:3004`**

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            Landing Page  (localhost:3004)            │
│   ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│   │ Student/User │ │   Verifier   │ │   Admin    │  │
│   │    Portal    │ │    Portal    │ │   Portal   │  │
│   └──────┬───────┘ └──────┬───────┘ └─────┬──────┘  │
│          │  3000           │  3003         │  3002   │
└──────────┼─────────────────┼───────────────┼─────────┘
           │                 │               │
           └─────────────────┴───────────────┘
                             │
                      All /api/* calls
                      proxied to ▼
              ┌──────────────────────────┐
              │    Backend  (port 3001)  │
              │  NextAuth · Prisma ORM   │
              │  PostgreSQL (Neon DB)    │
              └──────────────────────────┘
```

### Authentication Flow

1. User visits **`http://localhost:3004`** (landing page)
2. Clicks the card matching their role (Student / Verifier / Admin)
3. Redirected to that portal's `/login` page
4. Clicks **"Login with Google"** → Google OAuth via the portal's own NextAuth
5. Portal's `/api/auth/*` is **proxied to the backend** (port 3001)
6. Backend JWT callback assigns `role` and `portal` from the database
7. User is redirected to their dashboard

---

## Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- A **PostgreSQL database** (project uses [Neon](https://neon.tech) — free tier works)
- A **Google Cloud OAuth 2.0** client ID and secret

---

## One-Time Setup

### Step 1 — Clone / extract the project

```bash
# If using git:
git clone <repository-url>
cd IIT_Ropar_Form_Management_Website

# Or extract the zip and open the folder
```

### Step 2 — Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add these **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3001/api/auth/callback/google
   http://localhost:3002/api/auth/callback/google
   http://localhost:3003/api/auth/callback/google
   ```
7. Copy the **Client ID** and **Client Secret**

### Step 3 — Configure environment variables

Edit the `.env` file in each folder with your credentials:

#### `backend/.env`
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
DATABASE_URL=your_postgresql_connection_string_here
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-super-secret-key-change-in-production-2024
```

#### `user_portal/.env`
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=same_random_string_as_backend
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### `admin_portal/.env`
```env
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=same_random_string_as_backend
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

#### `verifier portal/.env`
```env
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=same_random_string_as_backend
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3003
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### `landing_page/.env`
```env
NEXT_PUBLIC_USER_PORTAL_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_PORTAL_URL=http://localhost:3002
NEXT_PUBLIC_VERIFIER_PORTAL_URL=http://localhost:3003
```

> ⚠️ **Important:** The `NEXTAUTH_SECRET` must be **identical** across backend and all portals.
> Generate a strong secret with: `openssl rand -base64 32`

### Step 4 — Set up the database

```bash
cd backend

# Install dependencies
npm install

# Push the Prisma schema to your database (creates all tables)
npx prisma db push

# (Optional) View your database in Prisma Studio
npx prisma studio
```

### Step 5 — Register your first Admin

The first admin must be added directly to the database. In **Prisma Studio** (`npx prisma studio`):

1. Open the `Verifier` table
2. Click **Add record**
3. Fill in:
   - `email`: your Google account email
   - `role`: `Admin`
   - `name`: your name
4. Save

After this, all other verifiers and admins can be added through the Admin Portal UI.

---

## Running the Project

### Option A — Run all services manually (5 terminals)

Open **5 separate terminal windows**, one for each service:

**Terminal 1 — Backend**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 — User Portal**
```bash
cd user_portal
npm install
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3 — Admin Portal**
```bash
cd admin_portal
npm install
npm run dev
# Runs on http://localhost:3002
```

**Terminal 4 — Verifier Portal**
```bash
cd "verifier portal"
npm install
npm run dev
# Runs on http://localhost:3003
```

**Terminal 5 — Landing Page**
```bash
cd landing_page
npm install
npm run dev
# Runs on http://localhost:3004
```

Then open **http://localhost:3004** in your browser.

---

### Option B — Run all services with one script (Linux / macOS)

Create a file `start-all.sh` in the project root:

```bash
#!/bin/bash
echo "Starting all IIT Ropar portal services..."

cd backend         && npm install --silent && npm run dev &
cd ../user_portal  && npm install --silent && npm run dev &
cd ../admin_portal && npm install --silent && npm run dev &
cd "../verifier portal" && npm install --silent && npm run dev &
cd ../landing_page && npm install --silent && npm run dev &

echo ""
echo "All services starting..."
echo "  Landing Page  → http://localhost:3004  (start here)"
echo "  User Portal   → http://localhost:3000"
echo "  Admin Portal  → http://localhost:3002"
echo "  Verifier      → http://localhost:3003"
echo "  Backend API   → http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
wait
```

```bash
chmod +x start-all.sh
./start-all.sh
```

---

### Option C — Run with npm workspaces or concurrently

Install `concurrently` once in the project root:

```bash
npm init -y
npm install concurrently --save-dev
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently -n \"backend,user,admin,verifier,landing\" -c \"blue,cyan,green,magenta,yellow\" \"cd backend && npm run dev\" \"cd user_portal && npm run dev\" \"cd admin_portal && npm run dev\" \"cd 'verifier portal' && npm run dev\" \"cd landing_page && npm run dev\""
  }
}
```

Then run:
```bash
npm run dev
```

---

## User Roles & Access

| Role | Portal | How to get access |
|---|---|---|
| **Student / User** | User Portal (3000) | Any Google sign-in — auto-registered |
| **Verifier** (HOD, Dean, Caretaker, Faculty, Assistant_Registrar, Mess_Manager) | Verifier Portal (3003) | Must be added to `Verifier` table by Admin |
| **Admin** | Admin Portal (3002) | Must be added to `Verifier` table with `role = Admin` |

---

## Project Structure

```
IIT_Ropar_Form_Management_Website/
│
├── README.md                    ← You are here (global docs)
│
├── landing_page/                ← NEW: Unified entry point (port 3004)
│   ├── src/app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← Portal selection screen
│   │   └── globals.css
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.mjs
│
├── backend/                     ← NextAuth + all API routes (port 3001)
│   ├── src/app/api/
│   │   ├── auth/[...nextauth]/  ← Google OAuth handler
│   │   ├── form/                ← Form CRUD
│   │   ├── admin/               ← Admin endpoints
│   │   ├── verifier/            ← Verifier endpoints
│   │   ├── submissions/         ← Submission management
│   │   └── users/               ← User management
│   ├── prisma/
│   │   └── schema.prisma        ← Database schema
│   └── .env
│
├── user_portal/                 ← Student-facing portal (port 3000)
│   ├── src/app/
│   │   ├── (dashboard)/         ← Protected pages
│   │   │   ├── dashboard/
│   │   │   ├── forms/
│   │   │   ├── history/
│   │   │   ├── profile/
│   │   │   └── submission/
│   │   └── login/
│   └── .env
│
├── admin_portal/                ← Admin-facing portal (port 3002)
│   ├── src/app/
│   │   ├── (protected)/         ← Protected pages
│   │   │   ├── dashboard/
│   │   │   ├── forms/
│   │   │   ├── members/
│   │   │   ├── users/
│   │   │   ├── activity/
│   │   │   └── settings/
│   │   └── login/
│   └── .env
│
└── verifier portal/             ← Verifier-facing portal (port 3003)
    ├── app/
    │   ├── dashboard/
    │   ├── assigned-forms/
    │   ├── pending-approvals/
    │   ├── all-submissions/
    │   ├── activity/
    │   └── login/
    └── .env
```

---

## API Reference (Backend — port 3001)

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth Google OAuth handler |

### Forms
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/form/createForm` | Create a new form (Admin) |
| GET | `/api/form/getAllForms` | Get all forms |
| GET | `/api/form/getForm/[formId]` | Get specific form |
| PUT | `/api/form/updateForm/[formId]` | Update a form (Admin) |
| GET | `/api/form/getPublicForms` | Get all published forms |
| POST | `/api/form/submitForm` | Submit a form response (User) |

### Submissions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/submissions/getMySubmissions` | Get current user's submissions |
| GET | `/api/submissions/[id]` | Get submission details |
| POST | `/api/submissions/resubmit` | Resubmit a rejected form |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/registerVerifier` | Register a new verifier/admin |
| GET | `/api/admin/getAllMembers` | Get all verifier members |
| GET | `/api/admin/getVerifierMemberDetails/[verifierId]` | Get verifier details |
| PUT | `/api/admin/updateMember/[memberId]` | Update member info |
| DELETE | `/api/admin/deleteMember/[memberId]` | Remove a member |
| GET | `/api/admin/dashboard` | Admin dashboard stats |

### Verifier
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/verifier/dashboard` | Verifier dashboard stats |
| GET | `/api/verifier/getAssignedForms` | Forms assigned to this verifier |
| GET | `/api/verifier/pending-approvals` | Submissions awaiting approval |
| GET | `/api/verifier/all-submissions` | All submissions this verifier handled |
| GET | `/api/verifier/activity` | Verifier activity log |
| GET | `/api/verifier/getFormDetails/[id]` | Form submission details |

### Valid Verifier Roles
When registering a verifier via `/api/admin/registerVerifier`, the `role` field must be one of:
```
Admin | Caretaker | HOD | Dean | Faculty | Assistant_Registrar | Mess_Manager
```

---

## Troubleshooting

### "Access Denied" after Google login
- Your Google account is not registered in the database for that portal's role
- For Admin/Verifier: contact your system admin to be added to the Verifier table
- For Users: any Google account should work — try signing in again

### Port already in use
```bash
# Find what's using the port (example: 3001)
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Database connection error
- Check your `DATABASE_URL` in `backend/.env`
- Make sure your Neon/PostgreSQL database is active
- Run `npx prisma db push` from the `backend/` folder again

### NextAuth session not working
- Ensure `NEXTAUTH_SECRET` is **identical** across all portals and backend
- Ensure `NEXTAUTH_URL` in each portal matches the port it runs on
- Clear browser cookies and try again

### Google OAuth redirect URI mismatch
- Go to Google Cloud Console → your OAuth client
- Make sure ALL four redirect URIs are added (ports 3000, 3001, 3002, 3003)

---

## Development Notes

- All portals are **Next.js 15** (App Router)
- Styles: **Tailwind CSS v3** + shadcn/ui components (admin & verifier portals)
- Database ORM: **Prisma** with PostgreSQL
- Auth: **NextAuth v4** with Google provider
- Each portal proxies `/api/*` to the backend so they share the same auth session

---

## License

© 2026 Indian Institute of Technology Ropar. All rights reserved.
