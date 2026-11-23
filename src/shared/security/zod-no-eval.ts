import { z } from 'zod'

// Zod compiles validators with `new Function` when it may. The security policy forbids that and reports the probe as a
// violation, so validators are built without it. It must run before any schema is created, hence its own module,
// imported first by main.tsx. Forms are small, so the lost speed does not matter.
z.config({ jitless: true })
