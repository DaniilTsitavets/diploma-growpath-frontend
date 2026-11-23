# Performance

Measured with Lighthouse 13 on the production build served by `vite preview`, with the default throttling of both
presets (mobile: slow 4G and a 4x slower CPU; desktop: no throttling). Run it with `npm run lighthouse`
(`-- --min 90` makes it fail below a score); reports go to the git-ignored `.lighthouse/` folder.

| Page             | Form factor | Performance | Accessibility | Best practices | SEO |    LCP |  CLS |
| ---------------- | ----------- | ----------: | ------------: | -------------: | --: | -----: | ---: |
| `/`              | mobile      |         100 |           100 |            100 | 100 | 0.96 s |    0 |
| `/shop`          | mobile      |          93 |           100 |            100 | 100 |  3.1 s |    0 |
| `/shop/lavender` | mobile      |          91 |           100 |            100 | 100 |  3.5 s |    0 |
| `/login`         | mobile      |          99 |           100 |            100 | 100 | 0.92 s |    0 |
| `/`              | desktop     |          97 |           100 |            100 | 100 | 0.25 s | 0.10 |
| `/shop`          | desktop     |         100 |           100 |            100 | 100 | 0.73 s |    0 |
| `/shop/lavender` | desktop     |         100 |           100 |            100 | 100 | 0.79 s |    0 |
| `/login`         | desktop     |         100 |           100 |            100 | 100 | 0.25 s |    0 |

Signed-in pages are not measured: they need a session, and their content is the user's own.

## What was done

- **Code splitting.** Every page is a lazy route; the first load carries the shell and the page asked for. Forms
  validation (zod) is its own chunk. The main chunk (React, router, query client) is 137 kB gzipped.
- **Pictures.** Placeholders are bundled WebP at one 4:5 ratio, only the active theme's image is loaded, sizes are
  reserved with `width`, `height` and `aspect-ratio`, the first card's picture gets `fetchpriority="high"`, the next
  three load normally and the rest are lazy (see the _optimize-image-priority_ guide).
- **No layout shifts.** The page's main area is at least as tall as the viewport, so the footer sits below the fold
  and a list that fills in above it cannot push it into view. Skeletons keep the height of what replaces them.
- **Early requests.** The list of picture credits is requested when the application starts, together with the first
  page's own data, instead of after the cards appear. The credits list is fetched once per session.
- **Fonts.** Latin subsets of two variable fonts (WOFF2) are bundled and served from the application's origin: no
  third-party request and no extra connection.
- **Security and SEO basics.** A page description and a valid `robots.txt`.

## What limits it

On mobile the largest paint of the shop and item pages is the first picture. It can only be requested after the
application has loaded and the list or item has arrived, so it waits for the network round trips of a client-rendered
page. Server rendering would remove that wait but is outside this project (see the stack notes).
