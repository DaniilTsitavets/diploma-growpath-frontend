# Testing

Three levels, each with a different job.

| Level                     | Tool                         | What it proves                                                                                                                                                                                          | Where                                               |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Unit                      | Vitest                       | Pure rules behave: filtering and sorting, price and quota wording, validation schemas, the ticket context parser, session and theme stores                                                              | `src/**/model/*.test.ts`, `src/shared/**/*.test.ts` |
| Component and integration | Vitest, Testing Library, MSW | A screen works as a user sees it, with the network faked at the HTTP level: loading, empty and error states, forms and their messages, spending actions and their confirmations                         | `src/**/*.test.tsx`                                 |
| End to end                | Playwright with axe-core     | The real application in a real browser against the real backend stack: sign-in, ordering, a journal with photo upload, the diagnosis, the chat, the expert view, accessibility and a phone-sized screen | `e2e/`                                              |

## Unit and integration tests

```bash
npm test          # one run
npx vitest        # watch mode
```

There are over 130 tests. Examples of what they cover:

- **Fetch client** (`shared/api/http.test.ts`): the ID token is sent, problem+json and the gateway's own error
  format become one `ApiError`, `Retry-After` is read, a network failure is reported, a `401` signals the session.
- **Rules without React** (`catalog-view`, `price`, `tiers`, `availability`, `ticket-context`, `photo`,
  `return-path`, `dominance`): small pure functions with direct tests, including the awkward inputs (an unknown
  enum value, a newer context version, a return address that leaves the application).
- **Forms** (login, planting date, update questionnaire, clarification, chat, expert question and answer): the
  message appears under the field, `aria-invalid` is set, nothing is sent while the form is invalid, and the
  request body is exactly what the contract expects.
- **Screens with MSW**: the shop (loading skeleton, filtering, sorting, label chips, visitor and signed-in
  buttons, order with an idempotency key and the receipt), journals (the draft that arrives late), the update
  page (presigned upload, wrong file type), diagnosis (every status, retry, exhausted quota), expert help
  (Starter blocked with the next plan named, confirmation before spending), chat (every outcome, retry with the
  same id), the expert queue and ticket (paging, the order of the blocks, the two `409` answers).
- **Routing**: the sign-in page has no header or footer, the other pages do.

Network calls are intercepted by MSW and any request without a handler fails the test, so a screen cannot
quietly call something the test did not expect.

## End-to-end tests

They need the backend stack running (`make up` in the backend repository), `.env.local` filled in from
`make client-env`, and two accounts that exist on LocalStack (a regular user and one in the `experts` group)
named in `.env.local` (`E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_EXPERT_EMAIL`, `E2E_EXPERT_PASSWORD`; names
only in `.env.example`, values never in the repository).

```bash
npx playwright install chromium    # once
npm run test:e2e
```

The Playwright config starts `npm run dev` itself (or reuses a running one) and drives Chromium.

| File                    | Scenarios                                                                                                                                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visitor.spec.ts`       | A visitor reads the shop and is asked to sign in to order; the sign-in page is only the sign-in window and returns to the shop; wrong credentials show a clear message; a protected page sends a visitor to sign in and back                                         |
| `journey.spec.ts`       | A signed-in user orders a pack, waits for the journal draft, records the planting date, submits an update with two photos (uploaded to the presigned URLs), reads the diagnosis, then asks the care chat. Accessibility is checked on the update page in both themes |
| `expert.spec.ts`        | A regular user is told the expert area is for experts; an expert sees the queue and can open a ticket                                                                                                                                                                |
| `accessibility.spec.ts` | axe-core (WCAG 2.1 A and AA) on the home page, shop and sign-in for a visitor and on journals and the AI chat for a signed-in user, in the light and dark themes; keyboard use of the header search (Ctrl K)                                                         |
| `responsive.spec.ts`    | On a 375 px wide screen the home page, shop and sign-in have no sideways scrolling and no accessibility violations; the shop's controls keep a touch-friendly size                                                                                                   |

The journey test creates real data on LocalStack (an order, a journal, an update, a chat question) and spends
one AI check and one chat check of the test account, so run it on a throwaway stack.

## Quality checks

```bash
npm run lint           # ESLint, type-aware: no `any`, no unhandled promises, hook rules
npm run typecheck      # TypeScript in strict mode
npm run format:check   # Prettier
npm run build          # type-check and production build
```
