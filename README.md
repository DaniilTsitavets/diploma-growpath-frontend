# diploma-growpath-frontend

Web client of **GrowPath**, a guided hobby plant-growing platform: a physical starter pack, a multimodal
AI assistant that diagnoses plant problems, and a quota-based escalation path to a live botanist.
Bachelor diploma project (European Humanities University, Computer Science). This repository is assessed
against the **Front-end** criterion: a single-page application built with React and TypeScript.

The backend is a separate repository, `diploma-growpath-backend`: four independent services behind one API
Gateway. This client talks to the backend only through that gateway.

## What the application does

| Area        | What the user does                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Home        | Reads what GrowPath is and sees a few items from the shop                                                                         |
| Shop        | Browses grow packs and sensors without an account, filters by label, searches and sorts; signs in to order (payment is simulated) |
| Journals    | Keeps a journal of a purchased plant: planting date, checkpoints, updates with a questionnaire and photos                         |
| Diagnosis   | Sees ranked possible causes after an update, answers at most one clarifying question                                              |
| Expert help | Sees the remaining expert quota and decides whether to open a ticket; reads the written answer                                    |
| AI chat     | Asks care questions inside a journal and gets answers with the knowledge-base sections they came from                             |
| Expert view | Users in the `experts` group read open tickets and write one answer                                                               |

## Documentation

1. [Architecture and approach](docs/architecture.md): modules, layers, routes, state, error handling.
2. [API client](docs/api.md): how the client talks to the gateway, endpoints, schemas and examples.
3. [User flows and navigation](docs/user-flows.md): diagrams of the main journeys.
4. [Stack justification](docs/stack.md): why each tool was chosen and what was rejected.
5. [Testing](docs/testing.md): unit, integration and end-to-end tests and how to run them.

Also: [credits](docs/credits.md) (fonts and images) and [to be done](docs/to-be-done.md).

## Run it

Prerequisites: Node.js 22 or newer, and the backend stack running (`make up` in the backend repository).

```bash
npm ci
cp .env.example .env.local       # then fill it in from `make client-env` in the backend repository
npm run dev                      # http://127.0.0.1:5173
```

The LocalStack ids in `.env.local` change every time LocalStack is recreated; run `make client-env` in the
backend repository again and copy the printed values. Test users exist only on LocalStack
(see the backend `infra/localstack/init/ready.d/01-provision.sh`); no password is stored in this repository.

| Variable                    | Purpose                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `VITE_GATEWAY_PROXY_TARGET` | Where the dev and preview servers proxy `/v1` (the API Gateway stage on LocalStack) |
| `VITE_COGNITO_ENDPOINT`     | Cognito endpoint (LocalStack)                                                       |
| `VITE_COGNITO_CLIENT_ID`    | App client id of the `growpath` user pool                                           |
| `VITE_MEDIA_BASE_URL`       | Media bucket with the item pictures (optional; without it placeholders are shown)   |

## Scripts

| Command                | What it does                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Dev server on `127.0.0.1:5173` with the `/v1` proxy                                                       |
| `npm run build`        | Type-check and production build into `dist/`                                                              |
| `npm run preview`      | Serves the build on `127.0.0.1:4173`                                                                      |
| `npm run lint`         | ESLint (type-aware)                                                                                       |
| `npm run format:check` | Prettier check (`npm run format` fixes)                                                                   |
| `npm run typecheck`    | TypeScript without emit                                                                                   |
| `npm test`             | Unit and integration tests (Vitest)                                                                       |
| `npm run test:e2e`     | End-to-end tests (Playwright) against the running stack; run `npx playwright install chromium` once first |
| `npm run gen:api`      | Regenerates API types from the backend OpenAPI contracts                                                  |

## Folder structure

```
src/
  app/            router, providers, layouts, error page, bootstrap
  features/       one folder per product area: auth, catalog, home, journal, diagnosis,
                  escalation, chat, expert, entitlement, plants, media, not-found
    <feature>/
      api/        requests and TanStack Query hooks
      model/      types, validation schemas, pure rules
      ui/         components of the feature
      pages/      route components
  shared/
    api/          fetch client, ApiError, user messages, generated types
    ui/           design kit: Button, Card, Chip, fields, dialog, toasts, skeleton, theme toggle
    theme/        theme store
    config/       environment, currency
    lib/          logger
    styles/       design tokens, global styles, fonts
  assets/         bundled placeholder pictures
docs/             documentation for the assessor
```

## Related

- Backend: `diploma-growpath-backend` (architecture, API and event contracts, demo script).
