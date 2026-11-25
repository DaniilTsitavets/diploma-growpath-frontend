# User flows and navigation

## Navigation map

The header shows tabs that depend on the role. A visitor or a customer sees Home, Shop, AI chat and Journals; an expert
sees only Expert tickets; an administrator sees only Users. Every page also has a search box (customers only), the theme
toggle and Sign in or Sign out. The sign-in page is a separate window with no header and no footer.

```mermaid
flowchart LR
  home["Home /"]
  shop["Shop /shop"]
  item["Item and care /shop/:slug"]
  credits["Credits /credits"]
  chat["AI chat /chat"]
  login["Sign-in window /login"]
  journals["Journals /journals"]
  journal["Journal /journals/:id"]
  jchat["Care chat /journals/:id/chat"]
  newUpdate["New update .../updates/new"]
  update["Update .../updates/:uid"]
  tickets["Expert tickets /expert/tickets"]
  ticket["Ticket /expert/tickets/:id"]
  users["Users /admin/users"]

  home -->|Browse the shop, See everything| shop
  home -->|View details| item
  home -->|Open the chat| chat
  shop -->|a card| item
  item -->|Sign in to order| login
  shop -->|Sign in to order| login
  login -->|back to where the user came from| shop
  login -->|default: customer| home
  login -->|expert| tickets
  login -->|administrator| users
  chat -->|pick a plant| jchat
  chat -->|guard: visitor| login
  journals -->|guard: visitor| login
  journals --> journal
  journal --> jchat
  journal -->|Add an update, open checkpoint| newUpdate
  newUpdate -->|Submit update| update
  journal --> update
  tickets --> ticket
  home -.->|footer| credits
```

Guards (the role comes from `GET /v1/me`):

- `/chat` and `/journals/*` need a signed-in customer; a visitor goes straight to the sign-in window, remembering the page.
- `/expert/tickets/*` are for experts only and `/admin/users` for administrators only; anyone else sees a "no access" page.
- Experts and administrators have no shop, chat or journals: those pages answer "no access" and the home page sends them to
  their own start page.

## Plant page

```mermaid
flowchart TD
  A([Card in the shop or on Home]) --> B[Item page: picture, price, order button]
  B --> C[Care information is requested at the same time]
  C --> D{Care answer}
  D -->|ok| E[Quick answer, quick facts, key takeaways, care blocks or questions, source credit]
  D -->|unavailable| F[Item stays usable, care area says it is unavailable with Try again]
  D -->|no such plant| G[Note: no care information yet]
  B --> H{Presses Order}
  H -->|visitor| I[Sign-in window, back to this page]
  H -->|customer| J[Confirmation dialog]
```

## Flow 1: from a visitor to an order

```mermaid
flowchart TD
  A([Visitor opens Home or Shop]) --> B[Reads the shop: search, filter panel (type and need checkboxes), sort]
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
  F -->|yes| H[Save answers, upload and confirm the photos, run the diagnosis]
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

## Flow 6: administrator

```mermaid
flowchart TD
  A([Administrator signs in]) --> B[Users page: email, role, status, created]
  B --> C[Search the loaded users, Load more]
  B --> D[Create user: email, temporary password, role]
  B --> E[Change role]
  B --> F[Disable or enable, with a confirmation]
  B --> G[Set a new password]
  D --> H{Result}
  G --> H
  H -->|ok| B
  H -->|user exists, password refused, user gone| I[Explained inside the dialog]
  E -.->|own account| J[Buttons are off: the backend refuses changing oneself]
```
