# WeduPay — Frontend Architecture

## Responsibility

The frontend is a **presentation and interaction layer only**. It collects student input,
submits it to the backend API, and renders the results. It owns no financial logic,
makes no permission decisions, and holds no sensitive credentials.

---

## Tech Stack

| Concern | Technology | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | File-based routing, server components, SSR for auth-gated pages |
| Language | TypeScript (strict) | Type safety across the entire frontend surface |
| Styling | Tailwind CSS | Utility-first, consistent design system, no runtime overhead |
| Form management | React Hook Form | Performant forms, native integration with Zod validation |
| Schema validation | Zod | Client-side validation schemas shared with API types |
| Server state | TanStack Query (React Query) | Caching, background refetch, loading/error states for API data |
| Client state | Zustand | Lightweight global state for UI-only concerns (e.g. modals, theme) |
| HTTP client | Axios (instance with interceptors) | Centralised auth header injection, response error normalisation |
| Notifications | React Hot Toast | Non-blocking feedback for payment status, errors, success |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| Testing | Jest + React Testing Library | Component and hook unit tests |

---

## Architectural Pattern: Feature-File Structure

Each feature is a self-contained folder that owns its components, hooks, API calls,
types, and constants. Shared infrastructure (UI primitives, auth client, API client)
lives in `shared/`. The `app/` directory is routing-only — it imports from features,
it does not contain logic.

### Rule
> A feature module may import from `shared/`. It must not import from another feature.
> The `app/` layer imports from features. It does not contain logic or UI components.

---

## File Structure

```
src/
│
├── app/                              # Next.js App Router (routing only)
│   ├── layout.tsx                    # Root layout, providers
│   ├── page.tsx                      # Landing / redirect
│   │
│   ├── (auth)/                       # Auth route group (unauthenticated)
│   │   ├── layout.tsx                # Auth layout (centered card)
│   │   ├── login/
│   │   │   └── page.tsx              # Renders auth/LoginPage
│   │   ├── register/
│   │   │   └── page.tsx              # Renders auth/RegisterPage
│   │   ├── complete-profile/
│   │   │   └── page.tsx              # Renders auth/CompleteProfilePage
│   │   └── reset-password/
│   │       └── page.tsx              # Renders auth/ResetPasswordPage
│   │
│   ├── (dashboard)/                  # Authenticated student area
│   │   ├── layout.tsx                # Dashboard shell (sidebar, header)
│   │   ├── page.tsx                  # Redirects to /payment
│   │   ├── payment/
│   │   │   ├── page.tsx              # Renders payment/PaymentPage
│   │   │   └── [orderId]/
│   │   │       └── page.tsx          # Renders payment/PaymentStatusPage
│   │   ├── history/
│   │   │   └── page.tsx              # Renders payment-history/HistoryPage
│   │   └── settings/
│   │       └── page.tsx              # Renders profile/SettingsPage
│   │
│   ├── (admin)/                      # Authenticated operator area
│   │   ├── layout.tsx                # Admin shell
│   │   ├── page.tsx                  # Renders admin/DashboardPage
│   │   ├── payments/
│   │   │   └── page.tsx              # Renders admin/PaymentsPage
│   │   └── settlements/
│   │       └── page.tsx              # Renders admin/SettlementsPage
│   │
│   └── api/                          # Next.js API routes (thin proxies only)
│       └── auth/
│           └── callback/
│               └── route.ts          # Supabase OAuth callback handler
│
├── features/                         # Feature modules (the application)
│   │
│   ├── auth/                         # Authentication feature
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── CompleteProfileForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts           # Mutation: submit credentials, get JWT
│   │   │   ├── useRegister.ts        # Mutation: create Supabase account
│   │   │   └── useSession.ts         # Query: current session state
│   │   ├── api/
│   │   │   └── auth.api.ts           # Backend auth API calls
│   │   ├── types/
│   │   │   └── auth.types.ts         # Session, UserProfile, LoginPayload types
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── CompleteProfilePage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   └── index.ts                  # Public exports for this feature
│   │
│   ├── payment/                      # Core payment flow feature
│   │   ├── components/
│   │   │   ├── PaymentAmountForm.tsx  # Step 1: enter USD amount
│   │   │   ├── FxRateCard.tsx         # Displays locked rate + local equivalent
│   │   │   ├── PaymentConfirmation.tsx# Step 2: review and confirm
│   │   │   ├── PaymentProcessing.tsx  # Waiting state during STK push
│   │   │   ├── PaymentSuccess.tsx     # Step 4: success confirmation
│   │   │   ├── PaymentFailed.tsx      # Failure state with retry option
│   │   │   └── ProviderSelector.tsx   # Select Ecocash / Mpesa / etc.
│   │   ├── hooks/
│   │   │   ├── useFxQuote.ts         # Query: fetch and auto-refresh FX quote
│   │   │   ├── useCreateOrder.ts     # Mutation: submit confirmed payment order
│   │   │   └── usePaymentStatus.ts   # Query: poll payment order status
│   │   ├── api/
│   │   │   └── payment.api.ts        # Backend payment API calls
│   │   ├── types/
│   │   │   └── payment.types.ts      # PaymentOrder, FxQuote, PaymentStatus types
│   │   ├── constants/
│   │   │   └── payment.constants.ts  # Quote expiry duration, polling interval, etc.
│   │   ├── pages/
│   │   │   ├── PaymentPage.tsx       # Multi-step payment flow container
│   │   │   └── PaymentStatusPage.tsx # Order detail / live status page
│   │   └── index.ts
│   │
│   ├── payment-history/              # Payment history feature
│   │   ├── components/
│   │   │   ├── PaymentHistoryTable.tsx
│   │   │   ├── PaymentHistoryRow.tsx
│   │   │   ├── PaymentStatusBadge.tsx
│   │   │   └── PaymentHistoryFilters.tsx
│   │   ├── hooks/
│   │   │   └── usePaymentHistory.ts  # Query: paginated payment history
│   │   ├── api/
│   │   │   └── history.api.ts
│   │   ├── types/
│   │   │   └── history.types.ts
│   │   ├── pages/
│   │   │   └── HistoryPage.tsx
│   │   └── index.ts
│   │
│   ├── profile/                      # Student profile + settings feature
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ChangePasswordForm.tsx
│   │   │   └── NotificationPreferences.tsx
│   │   ├── hooks/
│   │   │   ├── useProfile.ts         # Query: current user profile
│   │   │   └── useUpdateProfile.ts   # Mutation: update profile fields
│   │   ├── api/
│   │   │   └── profile.api.ts
│   │   ├── types/
│   │   │   └── profile.types.ts
│   │   ├── pages/
│   │   │   └── SettingsPage.tsx
│   │   └── index.ts
│   │
│   └── admin/                        # Operator dashboard feature
│       ├── components/
│       │   ├── PaymentOrdersTable.tsx
│       │   ├── SettlementSummary.tsx
│       │   ├── ManualSettlementButton.tsx
│       │   └── PaymentOrderDetail.tsx
│       ├── hooks/
│       │   ├── useAdminPayments.ts
│       │   └── useSettlements.ts
│       ├── api/
│       │   └── admin.api.ts
│       ├── types/
│       │   └── admin.types.ts
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── PaymentsPage.tsx
│       │   └── SettlementsPage.tsx
│       └── index.ts
│
├── shared/                           # Cross-feature infrastructure
│   │
│   ├── api/
│   │   ├── client.ts                 # Axios instance: base URL, auth header, error normalisation
│   │   └── types.ts                  # ApiResponse<T>, ApiError, PaginatedResponse<T>
│   │
│   ├── auth/
│   │   ├── AuthContext.tsx           # Session state provider (wraps app)
│   │   ├── useAuth.ts                # Hook: access session state anywhere
│   │   ├── ProtectedRoute.tsx        # HOC: redirect unauthenticated users
│   │   └── supabase.client.ts        # Supabase browser client (auth events only)
│   │
│   ├── components/
│   │   ├── ui/                       # Primitive UI components (no business logic)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── Card.tsx
│   │   └── layout/
│   │       ├── DashboardLayout.tsx
│   │       ├── AdminLayout.tsx
│   │       ├── AuthLayout.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── MobileNav.tsx
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── utils/
│   │   ├── currency.ts               # Format ZWL, ZAR, USD amounts for display
│   │   ├── date.ts                   # Format transaction dates
│   │   └── error.ts                  # Normalise API error messages
│   │
│   ├── types/
│   │   ├── common.types.ts           # Shared: Currency, Country, PaymentStatus enums
│   │   └── env.d.ts                  # Type-safe process.env
│   │
│   └── constants/
│       ├── countries.ts              # ZW, ZA country metadata
│       └── currencies.ts             # Supported currency codes + display labels
│
└── styles/
    └── globals.css                   # Tailwind base imports
```

---

## Data Flow Pattern

Every feature that needs server data follows this pattern:

```
Page (app/)
  └── renders Feature Page (features/xxx/pages/)
        └── calls Feature Hook (features/xxx/hooks/)
              └── calls Feature API function (features/xxx/api/)
                    └── calls shared API client (shared/api/client.ts)
                          └── calls Backend API
```

No component calls the API directly. No hook contains the API URL string. The API
module for each feature owns all the fetch logic for that feature.

---

## State Management

| State type | Managed by | Example |
|---|---|---|
| Server data (payments, history, profile) | TanStack Query | `usePaymentHistory`, `useFxQuote` |
| Form state | React Hook Form | `PaymentAmountForm`, `ProfileForm` |
| Auth session | AuthContext (Zustand-backed) | `useAuth` |
| UI-only state (modals, step in flow) | Local component state | `useState` in `PaymentPage` |
| Global UI preferences (theme) | Zustand | ThemeStore |

---

## Authentication Flow

```
1. Student visits app
2. AuthContext initialises: reads Supabase session from browser storage
3. If valid session: fetch profile from backend, populate context
4. If no session: redirect to /login
5. On login: Supabase issues JWT → persisted to httpOnly cookie via backend → AuthContext updated
6. Every API call: Axios interceptor reads token from AuthContext, sets Authorization header
7. On 401 response: Axios interceptor triggers session refresh, retries request once
8. On logout: clear Supabase session, clear AuthContext, redirect to /login
```

The frontend never validates the JWT. It only holds it and passes it to the backend.

---

## Environment Variables

```bash
# Public (safe to expose to browser)
NEXT_PUBLIC_API_URL=            # Backend API base URL
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL (auth client only)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key (auth client only)
```

No payment provider keys. No service role keys. No secrets.

---

## Phase 1 Scope

Features to implement in Phase 1:

- `auth` — full feature (login, register, complete profile, reset password)
- `payment` — full feature (amount entry, FX quote, confirmation, status polling)
- `payment-history` — full feature (list, filter by status)
- `profile` — basic settings (name, phone, country, password change)
- `admin` — payment list, settlement trigger, order detail view

Features deferred to Phase 2+:
- Multi-institution selector
- P2P transfers
- Virtual card management
- Multi-country onboarding UI
