# Running the frontend alone

The application needs the GrowPath backend (API gateway, services, Cognito, the media bucket). To run and test
the frontend without it, the repository has a stand-in backend in `mock/`: a small Node server that speaks the
same contracts (`contracts/openapi` of the backend repository), keeps its state in memory and plays Cognito and
the presigned photo storage as well. Nothing has to exist in LocalStack or Cognito, and no account has to be created.

## Two ways to start it

- `npm run dev:mock`: the Vite dev server with hot reload at <http://127.0.0.1:5173>. The stand-in backend is
  started by Vite itself on port 3100 and stopped with it. Settings come from `.env.mock`.
- `npm run mock:up`: two containers, as on the real site. nginx serves the built application and answers `/v1`,
  `/cognito`, `/media` and the photo uploads from one address, <http://localhost:8088>; the second container is
  the stand-in backend. The page is built for exactly that address, so another name of the same server, such as
  `127.0.0.1:8088`, is redirected to it. `npm run mock:down` stops it. For another port, change the port mapping
  in `docker-compose.mock.yml` and start with `MOCK_HOST=localhost:9000 npm run mock:up`.

`npm run mock:api` starts only the stand-in backend on port 3100.

## Demo accounts

Any password is accepted for these (an empty one is not). They are created again at every start.

| Account                  | Role   | Plan     | What it sees                                                               |
| ------------------------ | ------ | -------- | -------------------------------------------------------------------------- |
| `customer@growpath.test` | user   | hobbyist | two journals (one planted, with a diagnosed update), 1 expert consultation |
| `starter@growpath.test`  | user   | starter  | an empty account, first purchase discount, no expert                       |
| `premium@growpath.test`  | user   | premium  | an empty account, 4 expert consultations                                   |
| `expert@growpath.test`   | expert |          | the ticket queue with two open tickets                                     |
| `admin@growpath.test`    | admin  |          | the user list in pages of eight, with a disabled account                   |

Users the administrator creates in the mock can sign in with the password they were given.

## What it does

- The shop (17 items), the plant profiles with their FAQ and the knowledge-base sections are real data taken
  from the local backend; the twelve pictures and `credits.json` come from its media bucket.
- Orders create journals; the planting date can be set once (a second try answers 409); the checkpoints follow
  from it.
- A new update needs the whole-plant photo. The photo goes through the three steps (declare, PUT to the address
  the mock gives, confirm) and is kept in memory, so it can be shown back.
- The diagnosis is decided from the questionnaire and is always the same for the same answers: wet soil or
  standing water gives overwatering (and asks for the roots photo when water stands), a dry root ball or a very
  light pot gives underwatering, low light gives an uncertain result with an offer to ask an expert, an unknown
  dryness gives one clarifying question, anything else is on track.
- Asking an expert creates a ticket in the expert queue; answering it as `expert@growpath.test` shows the answer
  to the customer. A starter account is refused (no consultations in the plan).
- The care chat picks the best matching knowledge-base sections as sources and answers with their first
  sentences; a question about something else is declined.
- The administrator lists, creates, changes the role of, disables, enables and sets the password of users.

## Limits

State lives in the process: a restart brings back the seed. There is no AI, no quota reset and no real
authentication (the token is not signed; the mock only reads who it names). The mock is for working on the
interface, not for judging the backend.

## Refreshing the data

The files in `mock/server/data` were dumped from the local backend databases (items with their labels,
`plant_profiles` and the knowledge-base sections) and `mock/media` from the `growpath-media` bucket. Dump them
again when the seed of the backend changes.
