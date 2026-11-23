# User flows and navigation

## Navigation map

The header has the same tabs on every page (Home, Shop, AI chat, Journals, and Expert tickets for experts), a
search box, the theme toggle and Sign in or Sign out. The sign-in page is a separate window with no header
and no footer.

```mermaid
flowchart LR
  home["Home /"]
  shop["Shop /shop"]
  chat["AI chat /chat"]
  login["Sign-in window /login"]
  journals["Journals /journals"]
  journal["Journal /journals/:id"]
  jchat["Care chat /journals/:id/chat"]
  newUpdate["New update .../updates/new"]
  update["Update .../updates/:uid"]
  tickets["Expert tickets /expert/tickets"]
  ticket["Ticket /expert/tickets/:id"]

  home -->|Browse the shop, See everything| shop
  home -->|Open the chat| chat
  shop -->|Sign in to order| login
  login -->|back to where the user came from| shop
  login -->|default| home
  chat -->|pick a journal| jchat
  chat -->|guard: visitor| login
  journals -->|guard: visitor| login
  journals --> journal
  journal --> jchat
  journal -->|Add an update| newUpdate
  newUpdate -->|Submit update| update
  journal --> update
  tickets --> ticket
```

Guards: `/chat` and `/journals/*` need a signed-in user and redirect a visitor straight to the sign-in window, remembering the page.
`/expert/tickets/*` need the `experts` group; a signed-in user outside it sees a "no access" message.

## Flow 1: from a visitor to an order

```mermaid
flowchart TD
  A([Visitor opens Home or Shop]) --> B[Reads the shop: search, filter chips, sort]
  B --> C{Presses Order}
  C -->|signed in| D[Confirmation dialog with price and first-purchase discount]
  C -->|visitor| E[Sign-in window, the page is remembered]
  E --> F{Credentials valid?}
  F -->|no| G[Message under the form, stay in the window]
  F -->|yes| H[Back to the shop]
  H --> D
  D --> I[Confirm order: request with an Idempotency-Key]
  I --> J{Result}
  J -->|201 or 200| K[Receipt: price, discount, total paid]
  J -->|error| L[Message in the dialog, the key is kept for a retry]
  K --> M[Journal draft appears a few seconds later]
```

The backend creates the journal draft asynchronously after an order, so the journals page polls for up to a
minute and says that the journal is on its way.

## Flow 2: update, diagnosis and expert help

```mermaid
flowchart TD
  A([Journal page]) --> B[Record the planting date]
  B --> C[Checkpoints are computed and shown]
  C --> D[Add an update: only the lighting is required, photos are optional]
  D --> E[Submit update: shows the AI checks left]
  E --> F{AI quota left?}
  F -->|no| G[Not created. The next plan is named]
  F -->|yes| H[Save answers, upload and confirm the photos, run the diagnosis when both main photos are there]
  H --> I{Diagnosis status}
  I -->|completed| J[Ranked causes, recommendation, clear or ambiguous cause]
  I -->|awaiting clarification| K[Answer one question, free]
  K --> J
  I -->|degraded| L[Nothing charged. Retry diagnosis]
  L --> H
  J --> M{Expert offered?}
  M -->|no| N([Done])
  M -->|yes| O{Expert quota left?}
  O -->|no, Starter| P[Button disabled: available from the Hobbyist plan, 0 of 0]
  O -->|yes| Q[Ask an expert or Don't ask an expert, free]
  Q -->|ask| R[Confirmation: uses 1 consultation, cannot be cancelled]
  R --> S[Ticket is open: written answer appears here, expires after 72 hours]
```

A diagnosis that asks for a photo of the roots adds that photo slot on the update page.

## Flow 3: care chat

```mermaid
flowchart TD
  A([Journal or AI chat tab]) --> B[Conversation panel with the history]
  B --> C[Type a question, Enter sends]
  C --> D{Outcome}
  D -->|answered| E[Answer with source chips]
  D -->|not in the knowledge base| F[Notice, no answer]
  D -->|out of scope| G[Notice: not about plant care]
  D -->|sources only| H[Matching sections, nothing charged, the same question can be sent again]
  D -->|quota used up| I[Question not sent, the next plan is named]
```

## Flow 4: expert

```mermaid
flowchart TD
  A([Expert signs in]) --> B[Expert tickets tab appears]
  B --> C[Queue: soonest deadline first, time left]
  C --> D[Open a ticket]
  D --> E[The question, what the AI found, the user's answers, earlier updates; photos beside]
  E --> F[Write one answer, up to 5000 characters]
  F --> G{Result}
  G -->|sent| H[Answer is stored and shown to the user]
  G -->|already answered| I[Message: another expert answered]
  G -->|expired| J[Message: the ticket expired]
```

## Flow 5: session

```mermaid
flowchart TD
  A[Signed-in request] --> B{ID token near expiry?}
  B -->|yes| C[One shared refresh with the refresh token]
  C --> D{Refresh worked?}
  D -->|no| E[Session cleared, toast: sign in again]
  D -->|yes| F[Request goes on]
  B -->|no| F
  F --> G{Gateway answers 401?}
  G -->|yes| E
  G -->|no| H[Normal result]
```
