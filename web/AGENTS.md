# WEB KNOWLEDGE BASE

## OVERVIEW
`web/` is a React 19 + Vite SPA. Components render; hooks and `lib/` own most product logic.

## STRUCTURE
```text
web/
├── src/main.tsx           # App bootstrap
├── src/App.tsx            # Top-level mode orchestration
├── src/components/        # Stage UI, cards, filters, shell
├── src/hooks/             # Auth, practice session, recording flows
├── src/lib/               # API client, progress engine, audio helpers, types
├── src/styles/            # Tokens + component/screen CSS layers
├── src/test/setup.ts      # Vitest setup
└── public/                # Static assets / manifest / favicons
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App mode wiring | `src/App.tsx` | Header, filters, stage switching, cloud-import prompt |
| Global session state | `src/hooks/usePracticeSession.ts` | Main frontend brain |
| Pronunciation attempt flow | `src/hooks/usePracticeAttempt.ts` | Timers, countdown, transcript outcome |
| Mic capture | `src/hooks/useAudioRecorder.ts` | Low-level media capture |
| Auth state | `src/hooks/useAuth.ts` | Login/logout/current-user refresh |
| Backend calls | `src/lib/api.ts`, `src/lib/authApi.ts` | Product API vs auth/cloud-sync API |
| Local persistence | `src/lib/progressStorage.ts` | localStorage fallback behavior matters |
| Derived profile/category stats | `src/lib/progressMetrics.ts` | Weak pairs/categories summaries |
| Adaptive batch logic | `src/lib/pairSelection.ts` | Practice scoring and batch quotas |
| Shared domain types | `src/lib/types.ts` | Central type source for the SPA |
| Audio UX | `src/lib/audioPlayback.ts`, `src/lib/wordSizing.ts` | Playback sequencing and sizing helpers |
| Styling system | `src/index.css`, `src/styles/*.css` | Tailwind import root + custom tokens/components/screens |
| Test examples | `src/**/*.test.ts*` | Tests live next to code |

## CONVENTIONS
- `App.tsx` composes stages; avoid bloating leaf components with fetch/persistence logic.
- Hooks carry behavior, components carry rendering and callbacks.
- `src/lib/types.ts` is the canonical frontend schema; update it before threading new fields through UI.
- Progress stays local-first; cloud sync helpers layer on top of the same store shape.
- API calls use `API_BASE` from `src/lib/api.ts`; do not hand-build `/api` URLs in components.
- CSS is layered: token definitions, reusable component classes, then screen/layout rules.

## ANTI-PATTERNS
- Do not fetch directly inside many components when the logic belongs in hooks/lib.
- Do not mutate progress ad hoc; use `updateProgressForAttempt`, `resetProgressStore`, and session helpers.
- Do not bypass `usePracticeAttempt` for speech flow changes; timer/status behavior is centralized there.
- Do not assume browser storage always exists; `progressStorage.ts` intentionally supports fallback mode.
- Do not hardcode production API URLs; rely on `VITE_API_URL` or local proxy.

## NOTES
- Tests use Vitest + Testing Library + `happy-dom`; setup is minimal in `src/test/setup.ts`.
- `window.confirm` cloud-import prompt currently lives in `App.tsx` after auth succeeds.
- UI theme is the custom dark Glacier palette, not stock Tailwind defaults.
