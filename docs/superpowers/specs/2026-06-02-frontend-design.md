# GEO Compass — Frontend Design Spec

**Date:** 2026-06-02  
**Stack:** Next.js (App Router) + ShadCN/ui + Tailwind CSS  
**Target:** claude.ai artifacts or Claude Code implementation

---

## Overview

Single-page application (SPA feel) for managing and visualizing GEO brand rankings. Connects to the existing NestJS API (`/auth`, `/prompt`, `/llm`, `/ranking`, `/geo`).

Three pages behind authentication:
1. **Dashboard** — view brand rankings (global + per model + period)
2. **Prompts** — CRUD management of active/inactive prompts
3. **Run** — trigger LLM queries and ranking computation

---

## Architecture

### Tech stack
- **Next.js 15** — App Router, Server Components for read routes, Client Components for mutations
- **ShadCN/ui** — component library (dark theme)
- **Tailwind CSS** — styling
- **`fetch`** — no extra data-fetching library; native fetch with `cache: 'no-store'` for dynamic data

### Project structure
```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (app)/
    layout.tsx          ← sidebar layout, auth guard
    dashboard/page.tsx
    prompts/page.tsx
    run/page.tsx
  layout.tsx            ← root layout
lib/
  api.ts               ← typed fetch wrappers for the NestJS API
  auth.ts              ← token storage (localStorage) + helpers
components/
  sidebar.tsx
  ranking-card.tsx
  prompt-item.tsx
```

### Auth
- JWT stored in `localStorage`
- `Authorization: Bearer <token>` header on every API call
- Client-side auth guard in `(app)/layout.tsx`: reads token from localStorage on mount, redirects to `/login` if absent

---

## Pages

### Login / Register (`/login`, `/register`)
- Minimal centered form (email + password)
- ShadCN `Card`, `Input`, `Button`
- On success: store JWT, redirect to `/dashboard`
- Toggle link between login ↔ register

### Dashboard (`/dashboard`)

**Layout:**
- Sidebar (fixed left, 200px) + main content area

**Sidebar items:**
- Logo "⬡ GEO Compass"
- 📊 Dashboard (active state)
- 💬 Prompts
- ▶ Run
- User email (bottom, muted)

**Main content:**
- Header row: title "Rankings" + date picker (`<input type="date">` styled) + "▶ Run now" button (shortcut to Run page)
- Model tabs: `Global | GPT-4o | Gemini Pro | Claude 3 | ...` — driven by available models in data
- Ranking list (cards + badges style):
  - Each brand = one card (`bg-zinc-900 border-zinc-800`)
  - Left: rank badge (gold for #1) + brand name
  - Right: green/red/neutral badge for variation vs previous day + mention count (bold)
- Period section (below ranking):
  - Two date pickers: start → end
  - Calls `GET /geo/period?startDate=&endDate=`
  - Renders one section per day, scrollable, each with its ranked card list

**API calls:**
- `GET /geo/global?date=YYYY-MM-DD` → global ranking
- `GET /geo/model/:model?date=YYYY-MM-DD` → per-model ranking
- `GET /geo/period?startDate=&endDate=` → period ranking

### Prompts (`/prompts`)

**Layout:** same sidebar

**Main content:**
- Header: "Prompts" title + "**+ Ajouter**" button
- List of prompts as cards:
  - Prompt text
  - Badge: `actif` (green) or `inactif` (muted)
  - `…` menu (ShadCN `DropdownMenu`): Edit / Toggle active / Delete
- Inline add form at bottom: text input + Enter to submit (dashed border card style)

**API calls:**
- `GET /prompt` → list
- `POST /prompt` `{ text }` → add
- `PUT /prompt/:id` `{ isActive }` → toggle
- `PUT /prompt/:id` `{ text }` → edit
- `POST /prompt/delete` `{ id }` → delete

### Run (`/run`)

**Layout:** same sidebar

**Main content:**
- Step 1 — **Modèles**: toggle chips for model selection. Selected = indigo border + indigo text. Hardcoded list: `openai/gpt-4o`, `google/gemini-pro-1.5`, `anthropic/claude-3-opus`, `mistralai/mistral-large`.
- Step 2 — **Date**: date picker, defaults to today
- Summary box: "N prompts actifs × M modèles → X requêtes LLM → Compute ranking YYYY-MM-DD"
- "▶ Lancer l'analyse" button — calls `/llm` then `/ranking/compute` sequentially, shows loading state
- Result: success toast or error message

**API calls (sequential):**
1. `POST /llm` `{ models: string[] }` — query LLMs for all active prompts
2. `POST /ranking/compute?date=YYYY-MM-DD` — compute and store snapshot

---

## Components

| Component | ShadCN primitives | Notes |
|-----------|-------------------|-------|
| `Sidebar` | — | Fixed left nav, active link highlight |
| `RankingCard` | `Card`, `Badge` | Brand rank + mentions + variation |
| `PromptItem` | `Card`, `Badge`, `DropdownMenu` | Prompt text + active toggle + actions |
| `ModelChip` | `Button` (toggle variant) | Selectable model tag |
| `RunSummary` | `Card` | Recap before launch |
| `DatePicker` | `Input[type=date]` | Native date input, ShadCN styled |

---

## Error handling

- API errors → ShadCN `Toast` (destructive variant)
- Loading states → ShadCN `Button` with spinner or disabled state
- Empty states → muted text ("Aucun ranking pour cette date — lancez une analyse")

---

## Design tokens (ShadCN dark theme)

- Background: `zinc-950` / `zinc-900`
- Border: `zinc-800`
- Text primary: `zinc-50`
- Text muted: `zinc-500`
- Accent active: `indigo-500` / `indigo-400`
- Badge positive: `green-500` on `green-950`
- Badge negative: `red-500` on `red-950`
- Badge neutral: `zinc-500` on `zinc-800`
