# diploma-growpath-frontend

Web client of **GrowPath**, a guided hobby plant-growing platform: a physical starter pack, a multimodal
AI assistant that diagnoses plant problems, and a quota-based escalation path to a live botanist.
Bachelor diploma project (European Humanities University, Computer Science). This repository is
assessed against the **Front-end** criterion: a single-page application built with React and TypeScript.

The backend is a separate repository, `diploma-growpath-backend`: four independent services behind one
API Gateway. This client talks to the backend only through that gateway.

## Status

In development. The application skeleton, run instructions and test commands will be added here as they
are implemented.

## Planned scope

| Area | What the user does |
|---|---|
| Catalog | Browses grow packs and sensors, places an order (payment is mocked) |
| PlantJournal | Keeps a journal of a purchased plant and adds updates with photos and a short questionnaire |
| Diagnosis | Sees ranked possible causes, answers at most one clarifying question |
| Escalation | Sees the remaining expert quota and decides whether to open an expert ticket |
| Care chat | Asks care questions answered from a knowledge base |
| Expert view | Users in the `experts` group read open tickets and write one answer |

## Stack

- React with TypeScript (single-page application)
- Authentication through Amazon Cognito (ID token sent to the API Gateway)

Further tooling choices (bundler, state management, UI kit, test tools) will be documented here with
their justification when they are made.

## Related

- Backend: `diploma-growpath-backend` (architecture, API and event contracts, demo script)
