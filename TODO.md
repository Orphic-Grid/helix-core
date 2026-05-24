# Helix Core Stabilization TODO

## Phase 1 — Frontend auth/session unification + flicker/rerender fixes
- [x] Inspect remaining dashboard/components for duplicated session usage and timer-driven jitter
- [ ] Fix build/runtime errors in apps/web (layout/page/components)
- [ ] Run `npm install` + `npm run build` for apps/web
- [ ] Implement a single `AuthProvider` (apps/web/app/components/SessionProvider.tsx)
- [ ] Implement a `RouteGate` to handle role-based redirects deterministically
- [ ] Refactor route pages/components to use the provider
- [ ] Remove/disable simulated live-sync jitter
- [ ] Add consistent loading skeletons for all auth/route transitions

## Phase 2 — Data fetching stability + interaction correctness
- [ ] Introduce TanStack Query for patient flows
- [ ] Remove race conditions caused by out-of-order promises
- [ ] Audit visible interactions in dashboard subcomponents
- [ ] Ensure every interaction provides feedback

## Phase 3 — Backend operational checks
- [ ] Verify refresh/logout cookie path + frontend credentials flow
- [ ] Confirm guard role/permission claims align with frontend roles
- [ ] Run integration smoke checks

## Phase 4 — Performance + UI consistency
- [ ] Remove unnecessary rerenders (memoize derived data, stable callbacks)
- [ ] Lazy-load heavy panels
- [ ] Validate animations don’t cause continuous state updates

## Phase 5 — Release polish
- [ ] Lint/typecheck
- [ ] Docker compose smoke test
- [ ] Document operational behavior and dev runbooks

