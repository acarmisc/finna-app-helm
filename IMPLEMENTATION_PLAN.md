# Finna Console — Implementation Plan

> Generated from: Claude Design handoff bundle `finna-v2` (exported 2026-06-06)  
> Source mockup: `Finna Console.html` (React 18 + Babel standalone prototype)  
> Full spec: design bundle extracted to `/tmp/finna-design/finna-v2/` — key files below  
> Target: React 18 + TypeScript production app in `frontend/` + Helm chart updates

---

## Overview

Replace the HTML prototype with a production React + TypeScript SPA wired to the existing
`finops-api` backend. The app is a FinOps dashboard for IT/finance teams with 9 pages, full
auth, real-time polling, and a pixel-art corporate visual system.

**Design references** (read in full before implementing any section):
- `/tmp/finna-design/finna-v2/project/HANDOFF.md` — master spec (§1–13)
- `/tmp/finna-design/finna-v2/project/handoff/00-getting-started.md`
- `/tmp/finna-design/finna-v2/project/handoff/01-architecture.md`
- `/tmp/finna-design/finna-v2/project/handoff/02-design-system.md`
- `/tmp/finna-design/finna-v2/project/handoff/03-auth.md`
- Source files: `styles.css`, `pixel-art.css`, `enhancements.css`, `components.jsx`,
  `shell.jsx`, `pages-1.jsx`, `pages-2.jsx`, `kit.jsx`, `data.js`, `app.jsx`

---

## Phase 0 — Foundation (sequential, must complete before Phase 1)

**Assigned to: 1 agent**

### 0.1 Scaffold

```bash
cd /Users/andrea/Projects/personal/finna-app-helm
pnpm create vite@latest frontend -- --template react-ts
cd frontend
pnpm add react-router-dom@6 @tanstack/react-query@5 axios zustand
pnpm add recharts lucide-react zod react-hook-form @hookform/resolvers
pnpm add date-fns
pnpm add -D tailwindcss@next @tailwindcss/vite @types/node vitest @testing-library/react
pnpm dlx shadcn@latest init   # new-york style, CSS vars yes
pnpm dlx shadcn@latest add \
  button input select checkbox switch dialog toast \
  table tabs badge separator dropdown-menu \
  popover calendar form label radio-group \
  card progress skeleton
```

### 0.2 Folder structure

Create exactly this layout:

```
frontend/
  src/
    api/
      client.ts             # axios instance + 401 refresh interceptor
      auth.ts
      totals.ts
      costs.ts
      projects.ts
      configs.ts
      runs.ts
      alerts.ts
      settings.ts
    components/
      ui/                   # shadcn primitives (auto-generated)
      StatCard.tsx
      ProviderBadge.tsx
      StatusBadge.tsx
      SeverityBadge.tsx
      BracketButton.tsx
      DateRangePicker.tsx
      EmptyState.tsx
      LineChart.tsx
      StackedAreaChart.tsx
      HBarList.tsx
      MoMBars.tsx
      TopMovers.tsx
      ThresholdBar.tsx
      Sparkline.tsx
    features/
      auth/
        LoginPage.tsx
        AuthCallback.tsx
        ProtectedRoute.tsx
        useAuth.ts
        store.ts            # Zustand auth store
      dashboard/
        DashboardPage.tsx
        KpiGrid.tsx
        RecentRuns.tsx
        TopProjects.tsx
        LlmByModel.tsx
      projects/
        ProjectsListPage.tsx
        ProjectDetailPage.tsx
      costs/
        CostsPage.tsx
        CostsOverview.tsx
        CostsBySku.tsx
        CostsDaily.tsx
      configs/
        ConfigsListPage.tsx
        ConfigCreatePage.tsx
        ConfigCard.tsx
        steps/
          StepProvider.tsx
          StepCredentials.tsx
          StepReview.tsx
      extractors/
        ExtractorsPage.tsx
        TriggerRunCard.tsx
        RunHistoryTable.tsx
      alerts/
        AlertsPage.tsx
        AlertRow.tsx
      settings/
        SettingsPage.tsx
        ProfileSection.tsx
        ApiKeysSection.tsx
        NotificationsSection.tsx
        TagsSection.tsx
    hooks/
      useTheme.ts
      useDateRange.ts
    layouts/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
    schemas/
      project.ts
      config.ts
      run.ts
      alert.ts
    styles/
      tokens.css
      pixel-art.css
      enhancements.css
      index.css
    utils/
      money.ts
      time.ts
    App.tsx
    main.tsx
  .env.example
  vite.config.ts
  tsconfig.json
```

### 0.3 Design tokens (`src/styles/tokens.css`)

Port `:root { … }` and `[data-theme="light"] { … }` blocks verbatim from
`/tmp/finna-design/finna-v2/project/styles.css`. Keep all `--bg`, `--surface*`,
`--border*`, `--fg*`, `--primary`, `--accent`, `--warning`, `--danger`, `--info`,
`--azure`, `--gcp`, `--llm`, `--aws`, `--pxshadow-*` tokens.

Also port `/tmp/finna-design/finna-v2/project/pixel-art.css` and
`/tmp/finna-design/finna-v2/project/enhancements.css` as-is into `src/styles/`.

### 0.4 CSS entry (`src/styles/index.css`)

```css
@import 'tailwindcss';
@import './tokens.css';
@import './pixel-art.css';
@import './enhancements.css';

@theme {
  --color-bg:        var(--bg);
  --color-surface:   var(--surface);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-border:    var(--border);
  --color-fg:        var(--fg);
  --color-fg-muted:  var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-primary:   var(--primary);
  --color-accent:    var(--accent);
  --color-warning:   var(--warning);
  --color-danger:    var(--danger);
  --color-azure:     var(--azure);
  --color-gcp:       var(--gcp);
  --color-llm:       var(--llm);

  --font-sans:  'Inter', system-ui, sans-serif;
  --font-mono:  'JetBrains Mono', ui-monospace, monospace;
  --font-pixel: 'Press Start 2P', monospace;
  --radius: 0;
}

html { font-family: var(--font-sans); }
```

### 0.5 `index.html` font imports

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Press+Start+2P&display=swap" />
```

### 0.6 API client (`src/api/client.ts`)

```ts
import axios from 'axios';
import { useAuthStore } from '@/features/auth/store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,    // sends httpOnly refresh cookie
});

api.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().accessToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      if (!refreshing) {
        refreshing = api.post('/auth/refresh')
          .then(r => { useAuthStore.getState().setAccessToken(r.data.access_token); return r.data.access_token; })
          .catch(() => { useAuthStore.getState().clear(); window.location.href = '/login?expired=1'; return null; })
          .finally(() => { refreshing = null; });
      }
      const newToken = await refreshing;
      if (newToken) {
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return api(err.config);
      }
    }
    return Promise.reject(err);
  }
);
```

### 0.7 Auth store (`src/features/auth/store.ts`)

```ts
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAccessToken: (t: string) => void;
  setUser: (u: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  accessToken: sessionStorage.getItem('finna_access_token'),
  user: JSON.parse(localStorage.getItem('finna_user') || 'null'),
  setAccessToken: t => { sessionStorage.setItem('finna_access_token', t); set({ accessToken: t }); },
  setUser: u => { localStorage.setItem('finna_user', JSON.stringify(u)); set({ user: u }); },
  clear: () => { sessionStorage.removeItem('finna_access_token'); localStorage.removeItem('finna_user'); set({ accessToken: null, user: null }); },
}));
```

### 0.8 `src/utils/money.ts`

```ts
export function money(n: number, decimals = 2) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function moneyShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return money(n, 0);
}
```

### 0.9 `src/utils/time.ts`

```ts
import { formatDistanceToNow, format } from 'date-fns';

export function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function absDate(iso: string) {
  return format(new Date(iso), "MMM d, yyyy HH:mm 'UTC'");
}

export function emDash() { return '—'; }
```

### 0.10 App skeleton (`src/App.tsx`)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { AuthCallback } from '@/features/auth/AuthCallback';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProjectsListPage } from '@/features/projects/ProjectsListPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { CostsPage } from '@/features/costs/CostsPage';
import { ConfigsListPage } from '@/features/configs/ConfigsListPage';
import { ConfigCreatePage } from '@/features/configs/ConfigCreatePage';
import { ExtractorsPage } from '@/features/extractors/ExtractorsPage';
import { AlertsPage } from '@/features/alerts/AlertsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/projects"         element={<ProjectsListPage />} />
            <Route path="/projects/:slug"   element={<ProjectDetailPage />} />
            <Route path="/costs"            element={<CostsPage />} />
            <Route path="/configs"          element={<ConfigsListPage />} />
            <Route path="/configs/new"      element={<ConfigCreatePage />} />
            <Route path="/configs/:id"      element={<ConfigCreatePage />} />
            <Route path="/extractors"       element={<ExtractorsPage />} />
            <Route path="/alerts"           element={<AlertsPage />} />
            <Route path="/settings"         element={<SettingsPage />} />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
```

### 0.11 `.env.example`

```env
VITE_API_URL=https://api.finna.example.com
VITE_SENTRY_DSN=
VITE_FEATURE_NOTIFICATIONS_DROPDOWN=false
VITE_FEATURE_WEBSOCKETS=false
```

**Phase 0 done when**: `pnpm dev` boots, fonts load, tokens resolve, axios client exists.

---

## Phase 1 — Parallel tracks

> All tracks can start simultaneously after Phase 0 completes.  
> Each track is self-contained; agents must not modify files owned by another track.

---

### Track A — Design system components

**Agent owns**: `src/components/` (excluding `ui/`)  
**Reads from mockup**: `components.jsx`, `kit.jsx`, `styles.css`, `enhancements.css`

#### A.1 `BracketButton.tsx`

Extend shadcn `<Button>` with `cva`. Variants: `default`, `primary`, `danger`, `ghost`.
Sizes: `sm`, `md`, `lg`. Add `bracket` boolean variant:
- `bracket=true`: prepend `[ ` + append ` ]`, force uppercase + `font-mono` + `tracking-wide`
- Pixel-step shadow on `default` + `primary` + `danger`
- Hover: `translate(-1px,-1px)` + shadow grows; press: `translate(2px,2px)` + shadow drops
- 60ms `steps(2)` transition

Full `cva` definition in HANDOFF.md §11.5.

#### A.2 `StatCard.tsx`

Props: `{ label, value, unit?, delta?, deltaDir?, meta?, accent?, loading? }`  
`accent`: `primary | azure | gcp | llm | danger | accent`  
Layout: left-rail color stripe (4px wide, full height) + right content block.  
`loading=true`: render `<Skeleton>` matching final shape (label row + value row + meta row).  
Font: `stat-val` → JetBrains Mono 26px 600; `stat-lbl` → JetBrains Mono 11px 500 uppercase.

#### A.3 `ProviderBadge.tsx`

Props: `{ p: 'azure'|'gcp'|'llm'|'aws'|'ecb', size?: 'sm'|'md' }`  
Solid block using provider color (background), white text, JetBrains Mono 10px 600 uppercase.  
Labels: `AZ` / `GCP` / `LLM` / `AWS` / `FX`. Radius 0. `--pxshadow-1`.

#### A.4 `StatusBadge.tsx` + `SeverityBadge.tsx`

`StatusBadge` handles all: run statuses (`running`, `started`, `completed`, `failed`, `cancelled`)
+ alert statuses (`firing`, `acked`, `silenced`, `dismissed`) + test results (`ok`, `err`, `warn`, `pending`).  
`running` and `firing` get a pulsing green dot prefix.  
`SeverityBadge({ severity: 'critical'|'warning'|'info' })` is a thin alias.  
All use JetBrains Mono 10px 600 uppercase, radius 0.

#### A.5 `ProgressBar.tsx`

Props: `{ value, max?, size?, stepped?, segments? }`  
Tone auto-derived: ≥90% → `--danger`, ≥70% → `--warning`, else `--accent`.  
`stepped=true`: pixel-stitched gaps between fill segments.

#### A.6 `CostDelta.tsx`

Props: `{ value: number, showArrow?: boolean }`  
`value > 0` → `▲` + red (cost rising = bad)  
`value < 0` → `▼` + green (cost falling = good)  
`value === 0` → `—` gray

#### A.7 `EmptyState.tsx`

Props: `{ icon?, title, message, action? }`  
Layout: icon (lucide, 32px) + `<h3>` (Press Start 2P 11px) + mono `// message` hint + optional action button.

#### A.8 `Dialog.tsx`

Wrap shadcn `<Dialog>`. Style `.dialog-hd` header: primary fill stripe, Press Start 2P 10px white title.
Square close `×` button top-right. `--pxshadow-3` on the panel. Full-width footer row for `actions`.

#### A.9 `LineChart.tsx`

Recharts replacement. Full implementation in HANDOFF.md §11.4.  
Props: `{ series: Array<{name: string, color: string, data: Array<{label: string, value: number}>}>, height?: number }`  
Config: no animation, `strokeDasharray="2 3"` grid, mono tick fonts, JetBrains Mono tooltips.

#### A.10 `StackedAreaChart.tsx`

Same Recharts setup as `LineChart` but `<AreaChart>` with `stackId="a"`, `fillOpacity=0.4`.  
Props: `{ series, height?: number }` — same shape.

#### A.11 `HBarList.tsx`

Hand-rolled horizontal bar list. Props: `{ items: Array<{label, value, badge?}>, max?: number, colorFor?: (item) => string }`  
Each row: label (left) + optional badge + bar (flex-grow) + value (right, mono).

#### A.12 `MoMBars.tsx` (kit.jsx)

Month-over-month bar chart. Props: `{ data: Array<{label, value, prev?}>, format?, showPrev? }`  
Recharts `<BarChart>`. Current month highlighted (primary fill), others muted.  
Delta callout above current bar. `data` ordered oldest → newest.

#### A.13 `TopMovers.tsx` (kit.jsx)

Props: `{ items: Array<{name, sub, provider, current, previous}>, limit?, onClick? }`  
Sorted by absolute USD cost change, rising first. Hand-rolled list: icon + name + sub + `ProviderBadge` + delta amount + `CostDelta`.

#### A.14 `ThresholdBar.tsx` (kit.jsx)

Props: `{ value, max, warnPct?, critPct? }`  
Progress bar with tick markers at `warnPct` (yellow) and `critPct` (red) positions.

#### A.15 `Sparkline.tsx`

Small inline Recharts `<LineChart>` (no axes, no tooltip). Props: `{ seed?: number, up?: boolean }`.  
Used on project cards.

---

### Track B — App shell (Sidebar + Topbar)

**Agent owns**: `src/layouts/`, `src/hooks/useTheme.ts`, `src/hooks/useDateRange.ts`  
**Reads from mockup**: `shell.jsx`, `enhancements.css`, `app.jsx`

#### B.1 `useTheme.ts`

```ts
export function useTheme() {
  const [theme, setTheme] = useState<'dark'|'light'>(() => {
    return (localStorage.getItem('finna_theme') as any)
      ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('finna_theme', theme);
  }, [theme]);
  return [theme, setTheme] as const;
}
```

#### B.2 `useDateRange.ts`

Source of truth: URL search params. Hook:

```ts
export function useDateRange() {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = (searchParams.get('window') as RangeKey) || 'mtd';
  const customStart = searchParams.get('start') ?? undefined;
  const customEnd   = searchParams.get('end')   ?? undefined;

  const apiWindow = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) return { start: customStart, end: customEnd };
    return resolvePreset(range);
  }, [range, customStart, customEnd]);

  const setRange = (r: RangeKey) => setSearchParams({ window: r });
  const setCustom = (start: string, end: string) => setSearchParams({ window: 'custom', start, end });

  return { range, apiWindow, setRange, setCustom };
}
```

`resolvePreset`: `mtd` → start of current month to today, `7d` → -7 days, `30d` → -30 days, `90d` → -90 days.

#### B.3 `Sidebar.tsx`

NAV config (from `shell.jsx::NAV`):

```ts
const NAV = [
  { sec: 'Overview' },
  { id: 'dashboard',  label: 'Dashboard',     icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'costs',      label: 'Cost explorer', icon: 'LineChart',       path: '/costs' },
  { sec: 'Resources' },
  { id: 'projects',   label: 'Projects',      icon: 'Folders',         path: '/projects' },
  { id: 'configs',    label: 'Cloud configs', icon: 'Plug',            path: '/configs' },
  { id: 'extractors', label: 'Extractors',    icon: 'Workflow',        path: '/extractors' },
  { sec: 'Monitoring' },
  { id: 'alerts',     label: 'Alerts',        icon: 'Bell',            path: '/alerts',   badge: 'count' },
  { id: 'settings',   label: 'Settings',      icon: 'Settings',        path: '/settings' },
];
```

- Logo: `> finna` in Press Start 2P, sidebar top
- Section headers: uppercase muted label, not clickable
- Active item: primary background, primary-fg text
- `alerts` badge: reads from `useQuery(['alerts','stats'])` → `firing_count`
- Collapsible: `localStorage["finna_sidebar_collapsed"]` persists collapsed state
- Collapsed mode: show icon-only, tooltip on hover
- Footer: user avatar + name + sign-out button

#### B.4 `Topbar.tsx`

- Breadcrumb: `finna / <pageLabel>` driven by current route
- Date range chips `MTD | 7D | 30D | 90D` — segmented control; visible on Dashboard + Costs only
  (use `location.pathname` to conditionally render)
- `DateRangePicker` popover: calendar for custom range, two months side-by-side
  (use shadcn `<Calendar>` inside `<Popover>`)
- Density toggle `.seg`: comfortable / compact → writes `<html data-density="comfortable|compact">`
  + `localStorage["finna_density"]`
- Theme toggle: sun/moon `lucide-react` icons → calls `useTheme` setter
- Notifications bell: routes to `/alerts` (dropdown deferred — see gaps)
- Avatar: decorative (user initials from auth store)

#### B.5 `AppShell.tsx`

```tsx
export function AppShell() {
  const [theme, setTheme] = useTheme();
  const [density, setDensity] = useState<'comfortable'|'compact'>(() =>
    (localStorage.getItem('finna_density') as any) || 'comfortable');

  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem('finna_density', density);
  }, [density]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar theme={theme} setTheme={setTheme} density={density} setDensity={setDensity} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

### Track C — Auth feature

**Agent owns**: `src/features/auth/`, `src/schemas/` (auth schemas only)  
**Reads from mockup**: `pages-1.jsx::LoginPage`, `app.jsx`, HANDOFF.md §3

#### C.1 `LoginPage.tsx`

Layout:
- ≥900px: 2-column grid (`grid-template-columns: 1fr 1fr`)
- <900px: single column, left brand panel hidden
- Left panel (`.login-brand`): dithered scanline bg, `> finna` Press Start 2P mark, headline H1, 3 KPI tiles
- Right panel (`.login-form`): max-width 380px, centered
  1. Heading "Sign in to Finna" (Press Start 2P)
  2. SSO buttons list (Google, Microsoft, Okta, GitHub, SAML)
  3. "or" divider
  4. Collapsed email/password section (Details/Summary pattern or Accordion)
  5. Footer: "Need an account? Contact admin · v2.4.1"

SSO flow:
```ts
async function ssoLogin(providerId: string) {
  const { authorization_url } = await api.get(`/auth/sso/${providerId}/init`, {
    params: { return_to: '/dashboard' }
  });
  window.location.href = authorization_url;
}
```

Email/password form (react-hook-form + Zod):
```ts
const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Enter a password to continue'),
});
```
On submit: `POST /api/v1/auth/token` → store tokens → navigate `/dashboard`.  
On 401: inline error "Invalid email or password" (no toast — stays visible).

#### C.2 `AuthCallback.tsx`

Reads `?code=…&state=…&provider=…` from URL.  
POSTs to `POST /api/v1/auth/sso/callback` → receives `{access_token, refresh_token, user}`.  
Stores tokens via auth store, navigates to `return_to` param or `/dashboard`.

#### C.3 `ProtectedRoute.tsx`

```tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore(s => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

#### C.4 `useAuth.ts`

```ts
export function useAuth() {
  const { accessToken, user, setUser, clear } = useAuthStore();
  const { data: me } = useQuery(['auth', 'me'], () => api.get('/users/me').then(r => r.data), {
    enabled: !!accessToken,
    onSuccess: setUser,
  });
  const logout = async () => {
    await api.post('/auth/revoke').catch(() => {});
    clear();
    window.location.href = '/login';
  };
  return { user: me ?? user, logout };
}
```

---

### Track D — Dashboard page

**Agent owns**: `src/features/dashboard/`  
**Reads from mockup**: `pages-1.jsx::DashboardPage`, `kit.jsx`, HANDOFF.md §4.1

#### D.1 Layout

Top-to-bottom:
1. `PageHeader` → title "Dashboard", subtitle `// last refresh · {timeAgo} · window: {rangeLabel}`, actions: `[CUSTOMIZE]` `[REFRESH]` `[EXPORT]`
2. Customize strip (when edit mode): dashed border, restore-pills for hidden tiles
3. KPI grid — drag-reorder, hide per tile
4. Two-column `2fr 1fr`: Daily cost `LineChart` (Azure/GCP/LLM) | Top projects `HBarList`
5. Two-column `1fr 1fr`: LLM spend by model | Recent extractor runs
6. Two-column `1fr 1fr`: Monthly trend `MoMBars` | Top movers `TopMovers`

#### D.2 KPI tiles

IDs: `total`, `azure`, `gcp`, `llm`, `alerts`  
Accents: `primary`, `azure`, `gcp`, `llm`, `danger`  
Order/hidden persisted to `PUT /api/v1/users/me/preferences` `{kpi_order, kpi_hidden}`.

HTML5 drag-and-drop reorder:
- `dragstart`: store `dragRef = tileId`
- `dragover`: `e.preventDefault()`
- `drop`: splice `dragRef` before target tile in `kpiOrder`

#### D.3 Data queries

```ts
useQuery(['totals', range], () => api.get('/totals', { params: { window: range } }).then(r => r.data))
useQuery(['costs', 'daily', range], () => api.get('/costs/daily', { params: { window: range } }).then(r => r.data))
useQuery(['projects', 'list', { sort: 'cost_desc', limit: 5 }], …)
useQuery(['llm', 'usage', range], () => api.get('/llm/usage', { params: { window: range } }).then(r => r.data))
useQuery(['runs', 'list', { limit: 6 }], () => api.get('/runs', { params: { limit: 6 } }).then(r => r.data))
useQuery(['costs', 'monthly'], () => api.get('/costs', { params: { group_by: 'month', window: '6m' } }).then(r => r.data))
```

#### D.4 States

- Loading: `<StatCard loading />` skeletons for KPIs, `<Skeleton>` matching chart dimensions
- Error: inline error card per section, "retry" button re-fetches
- Empty runs: `EmptyState` "no runs yet" `// awaiting first extraction`

---

### Track E — Projects pages

**Agent owns**: `src/features/projects/`  
**Reads from mockup**: `pages-1.jsx::ProjectsListPage`, `pages-1.jsx::ProjectDetailPage`, HANDOFF.md §4.2–4.3

#### E.1 `ProjectsListPage.tsx`

- `PageHeader`: title "Projects", subtitle `// {n} projects · {totalMTD} this period`, right: search input + `[FILTER]` + `[NEW PROJECT]`
- Full-width `SectionCard` containing `<table className="tbl">`
- Columns: Project (name + slug mono), Owner, Cost center, Tags (chips), MTD (right), Cap (right), Usage (`ProgressBar`), Last sync (relative)
- Client-side filter on `q`: match `name`, `slug`, or any tag
- Row click → `navigate('/projects/${slug}')`
- `useQuery(['projects','list', { q }], …)` — pass `q` server-side if API supports it, else filter client-side

#### E.2 `ProjectDetailPage.tsx`

- `PageHeader`: back link `← All projects`, H1 with name + `ProviderBadge`, subtitle
- 3-tile `StatStrip`: MTD / Budget cap / Forecast EOM
- Two-column: Daily cost `StackedAreaChart` (per-SKU breakdown) | Active alerts list (severity badges + ack buttons)
- Tags & metadata card: cost-center, owner, created, last sync, notes
- SKU breakdown table: SKU + MTD cost + units, sorted by MTD desc
- Budget progress: `ThresholdBar` (value=mtd, max=budget_cap, warnPct=70, critPct=90) + editable cap input
- Empty project: `EmptyState` "Project not found" + `[BACK TO PROJECTS]`

---

### Track F — Costs pages

**Agent owns**: `src/features/costs/`  
**Reads from mockup**: `pages-1.jsx::CostsPage`, `CostsOverview`, `CostsBySku`, `CostsDaily`, HANDOFF.md §4.4

#### F.1 `CostsPage.tsx`

- `PageHeader`: "Cost explorer", subtitle, right: `[EXPORT CSV]` `[EXPORT XLSX]`
- shadcn `<Tabs>` with `value` bound to state: `overview | sku | daily`
- `providerFilter` state: Set of providers — passed to all sub-tabs
- `useDateRange()` for window

#### F.2 `CostsOverview.tsx`

- Provider summary cards (3): Azure / GCP / LLM — total + delta
- `MoMBars` for total trend
- Project ranking table: project name + provider badge + MTD cost + bar
- `TopMovers` card

#### F.3 `CostsBySku.tsx`

- Grouped by provider → SKU; expandable rows
- SKU name (mono) + provider badge + units + cost + delta
- Expand row: daily cost sparkline for that SKU
- `FilterBar` with provider checkboxes

#### F.4 `CostsDaily.tsx`

- Large `StackedAreaChart` (full width), height 320
- Provider toggle `FPill` chips below header
- Date range label chip (active window)
- X-axis: dates, Y-axis: `moneyShort`

---

### Track G — Configs pages

**Agent owns**: `src/features/configs/`  
**Reads from mockup**: `pages-2.jsx::ConfigsListPage`, `pages-2.jsx::ConfigCreatePage`, HANDOFF.md §4.5–4.6

#### G.1 `ConfigsListPage.tsx`

- `PageHeader`: "Cloud configs", subtitle `// {n} configured · {failures} test failures in last 24h`, `[+ NEW CONFIG]`
- 3-column `grid-cols-3` of `ConfigCard`

#### G.2 `ConfigCard.tsx`

Card layout:
- Header: `name` (h3) + `ProviderBadge`
- Sub: `credential_type` chip (mono)
- Metadata table: tenant_id/project_id (truncated mono), subscription_id, created, last test (`StatusBadge` + relative time)
- Error band (if `last_test === 'err'`): red bg, `error_message` in mono
- Footer actions: `[EDIT]` → navigate; `[TEST]` → mutation; `delete` ghost → confirm Dialog

`[TEST]` mutation: `POST /api/v1/config/${id}/test` → toast success/fail + optimistic `last_test` update.  
Delete: confirmation Dialog → `DELETE /api/v1/config/${id}` → invalidate `['configs','list']`.

#### G.3 `ConfigCreatePage.tsx`

3-step wizard:
- Step 1 — Provider: radio cards Azure / GCP / LLM / AWS (AWS disabled)
- Step 2 — Credentials: branched form by `prov`
  - Azure: tenant_id, subscription_id, client_id, client_secret, OR `managed_identity` toggle
  - GCP: project_id, service_account_key (JSON paste or file upload)
  - LLM: api_provider (anthropic/openai/azure-openai), api_key, base_url (optional)
- Step 3 — Review: read-only summary + `[TEST CONNECTION]` + `[SAVE CONFIG]`

Zod schemas per provider (full schemas in HANDOFF.md §4.6).  
Edit mode: when `id` param present, `useQuery(['config', id])` to seed form.  
Submit (new): `POST /api/v1/config` → navigate `/configs`.  
Submit (edit): `PATCH /api/v1/config/${id}` → navigate `/configs`.

---

### Track H — Extractors + Alerts + Settings

**Agent owns**: `src/features/extractors/`, `src/features/alerts/`, `src/features/settings/`  
**Reads from mockup**: `pages-2.jsx`, HANDOFF.md §4.7–4.9

#### H.1 `ExtractorsPage.tsx`

2-column layout (`1fr 2fr`):

Left — `TriggerRunCard`:
- Config dropdown (populated from `useQuery(['configs','list'])`)
- Extractor type input (optional, hint: "blank — defaults based on provider")
- `[▷ RUN EXTRACTOR]` primary block button
- On submit: `POST /api/v1/runs` `{config_id, extractor_type?}` → optimistic insert + start polling

Right — `RunHistoryTable`:
- Filter row: status dropdown + provider dropdown
- Sortable table: Status · Run ID (mono) · Extractor · Provider · Started · Finished · Records · Duration
- Row click → expand inline: full timestamps, run_id, error_message, config_id link
- `useQuery(['runs','list', filter], …, { refetchInterval: 10_000 })`
- Polling on new run: `useQuery(['run', newRunId], …, { refetchInterval: data => isTerminal(data?.status) ? false : 2000 })`

#### H.2 `AlertsPage.tsx`

- `PageHeader`: "Alerts", subtitle `// {firing} firing · {acked} acked · {silenced} silenced`, `[NEW RULE]`
- `StatStrip`: 4 tiles — Critical / Warning / Info / Silenced (from `useQuery(['alerts','stats'])`)
- `FilterBar`: severity + status + project dropdowns
- Triage table: `AlertRow` per alert
  - Columns: Status · Severity · Description · Rule (mono, truncated) · Project · Triggered · Owner · Actions
  - Ack: `POST /alerts/${id}/ack` → optimistic status → `acked`
  - Silence: Dialog with duration picker (1h / 4h / 24h / custom) → `POST /alerts/${id}/silence` `{until: ISO}`
  - Dismiss: confirm Dialog → `POST /alerts/${id}/dismiss`
  - All mutations optimistic with rollback
- `refetchInterval: 30_000`

#### H.3 `SettingsPage.tsx`

5 sections (accordion or tabs):

1. **Profile**: name, email (read-only), avatar upload, timezone select, locale select
   — `PATCH /api/v1/users/me`
2. **Organization**: org name, billing email, plan tier badge, seat usage
3. **API keys**: table `prefix | name | scopes | created | last_used` + `[CREATE KEY]` Dialog
   — Dialog: name input + scope checkboxes → `POST /api/v1/api-keys` → one-time display of secret
   — Delete: `DELETE /api/v1/api-keys/${id}`
4. **Notifications**: channel list (email / slack / webhook) + per-event toggles
5. **Tags**: list from `GET /api/v1/tags`, edit/merge/delete actions (static for now)

---

## Phase 2 — Schemas + API layer (parallel with Phase 1 or after)

**Agent owns**: `src/schemas/`, `src/api/` (resource files)  
**Reads from mockup**: HANDOFF.md §6.3

### 2.1 Zod schemas

`src/schemas/project.ts`:
```ts
export const ProjectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  owner: z.string(),
  cost_center: z.string(),
  provider: z.enum(['azure','gcp','llm','aws','ecb']).optional(),
  budget_cap: z.number(),
  mtd: z.number(),
  forecast_eom: z.number().optional(),
  tags: z.array(z.string()),
  note: z.string().optional(),
  created_at: z.string(),
  last_sync_at: z.string().optional(),
});
export type Project = z.infer<typeof ProjectSchema>;
```

Similarly for `config.ts` (CloudConfig), `run.ts` (ExtractorRun), `alert.ts` (Alert).  
Full field definitions in HANDOFF.md §6.3.

### 2.2 API resource clients

Each file in `src/api/` exports typed async functions using the `api` axios instance.  
Example `src/api/projects.ts`:
```ts
export const projectsApi = {
  list: (params?: { q?: string; sort?: string; limit?: number; window?: string }) =>
    api.get('/projects', { params }).then(r => r.data as { data: Project[] }),
  get: (slug: string) =>
    api.get(`/projects/${slug}`).then(r => r.data as Project),
  create: (body: Omit<Project, 'id'|'slug'|'mtd'|'created_at'>) =>
    api.post('/projects', body).then(r => r.data as Project),
  update: (slug: string, body: Partial<Project>) =>
    api.patch(`/projects/${slug}`, body).then(r => r.data as Project),
  remove: (slug: string) =>
    api.delete(`/projects/${slug}`),
};
```

Pattern identical for `totals.ts`, `costs.ts`, `configs.ts`, `runs.ts`, `alerts.ts`, `settings.ts`.

---

## Phase 3 — Helm chart update (parallel with Phase 1–2)

**Agent owns**: `templates/`, `values.yaml`, `Chart.yaml`

### 3.1 New deployment (`templates/deployment-console.yaml`)

Add a second deployment for the built frontend SPA:
- Image: `ghcr.io/acarmisc/finna-app/finna-console:{{ .Values.console.image.tag }}`
- Nginx serving the Vite build output
- Port: 80 (container), mapped to `.Values.console.service.port`
- Env: `VITE_API_URL` injected at build time; at runtime a simple nginx config that proxies
  `/api/` to the API service name within the cluster

### 3.2 New service (`templates/service-console.yaml`)

`ClusterIP` service for the console, port 80.

### 3.3 Ingress (`templates/ingress.yaml`)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finna-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
    - host: "{{ .Values.ingress.host }}"
      http:
        paths:
          - path: /api(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: finops-api
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: finna-console
                port:
                  number: 80
```

### 3.4 `values.yaml` additions

```yaml
console:
  image:
    repository: ghcr.io/acarmisc/finna-app/finna-console
    tag: "latest"
    pullPolicy: Always
  service:
    type: ClusterIP
    port: 80
  replicaCount: 1
  resources:
    limits:
      cpu: 200m
      memory: 128Mi
    requests:
      cpu: 100m
      memory: 64Mi

ingress:
  enabled: false
  host: finna.example.com
  tls: []
```

### 3.5 `Chart.yaml` bump

Update `version` to `1.1.0` (minor — adds console), keep `appVersion`.

---

## Phase 4 — Dockerfile + CI (1 agent after Phase 0 scaffolding exists)

**Agent owns**: `frontend/Dockerfile`, `frontend/nginx.conf`

### 4.1 `frontend/Dockerfile`

Multi-stage build:
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 4.2 `frontend/nginx.conf`

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # SPA fallback — serve index.html for all non-asset routes
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache assets with content-hash filenames
  location ~* \.(js|css|woff2|png|svg|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

---

## Acceptance checklist (from HANDOFF.md §11.6)

Before marking implementation complete, all of the following must pass:

- [ ] Login → SSO redirect → callback → dashboard for all 5 providers
- [ ] Email/password validates inline, clears password on failure
- [ ] 401 triggers refresh → retry; refresh failure → `/login?expired=1`
- [ ] Date range writes to URL params; deep-link `?window=30d` works
- [ ] Custom date range writes `?start=…&end=…`
- [ ] Dashboard KPI drag-reorder persists to `/users/me/preferences`
- [ ] Dashboard hide/restore tile persists
- [ ] Theme toggle writes localStorage + `data-theme`, survives reload
- [ ] Sidebar collapse persists
- [ ] Config wizard validates per-provider, `[TEST]` only enabled when step valid
- [ ] Extractors trigger: optimistic insert, polls 2s, stops on terminal status
- [ ] Run history refetches every 10s
- [ ] Alert mutations optimistic with rollback on error
- [ ] Empty states on all lists when `data: []`
- [ ] Loading: skeletons matching final layout (no spinners)
- [ ] Error states: retry button + `problem.detail`
- [ ] All buttons disabled while mutation pending
- [ ] All forms use react-hook-form + Zod, field-level errors inline
- [ ] Lucide icons via `lucide-react` (no `data-lucide` runtime)
- [ ] Light theme WCAG AA on body text + badges
- [ ] No console warnings on any route

---

## Known gaps (deferred — do not block ship)

| Gap | Owner | Notes |
|---|---|---|
| Notifications dropdown | Track B | Bell routes to `/alerts` for now |
| `/auth/forgot` | Track C | Forgot-password flow not implemented |
| `/configs/:id` edit hydration | Track G | Form starts blank — wire `useQuery(['config', id])` |
| Saved date ranges | Track B | Preferences API extension needed |
| Real OAuth/SAML callbacks | Track C | Mockup uses setTimeout; needs `/auth/callback` page |
| Export buttons | Track F | Decorative — wire to `GET /costs/export?format=csv` |
| Mobile breakpoints | All | Desktop-only except login |
| Run logs viewer | Track H | `GET /runs/{id}/logs` defined, not surfaced |
| WebSocket for live updates | Later | Currently polling |

---

## Design visual reference

Preview images in `/tmp/finna-design/finna-v2/project/previews/`:
- `v2_dash_compact.png` / `v2_dash_customize.png` — Dashboard states
- `v2_costs.png` — Cost explorer
- `v2_projects.png` + `v2_project_detail.png` — Projects
- `v2_configs.png` — Cloud configs
- `v2_extractors.png` — Extractors
- `v2_alerts.png` — Alerts
- `v2_settings.png` — Settings

**Always cross-reference screenshots against the mockup source code when implementing.**  
The source HTML files in `/tmp/finna-design/finna-v2/project/` are the authoritative truth.
