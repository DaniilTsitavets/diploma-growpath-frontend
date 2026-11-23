# Security

The session (ID and refresh token) lives in `sessionStorage`, so a script running on the page could read it. The
defence is to keep foreign and string-built code off the page: no `dangerouslySetInnerHTML`
rendering in the code, and a strict Content Security Policy on the built application.

## Content Security Policy

The policy is written once, in `src/shared/security/csp.ts` (with tests), and applied three ways by `vite.security.ts`:

| Where                        | How                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Built `index.html`           | A `<meta http-equiv="Content-Security-Policy">` tag, so any static host enforces it                                                       |
| `dist/security-headers.json` | The full header set for the host to send (a meta tag cannot carry `frame-ancestors`), for example as a CloudFront response headers policy |
| `vite preview`               | The same headers on every response                                                                                                        |

The dev server does not apply it, because hot reload needs inline code. The policy is checked in a real browser by
`e2e/security.spec.ts`, which runs the built application and fails on any `securitypolicyviolation`.

What it says, following the _modern-web-guidance_ security guides:

- `default-src 'none'`; scripts and styles only from the page's own origin. The page has no inline script or style and
  no third-party script, so no nonce or hash is needed and the policy stays valid for a static host.
- `require-trusted-types-for 'script'`: strings cannot reach script sinks (`innerHTML`, `eval`, `new Function`). The
  application renders no raw HTML. One library did: zod probes `new Function` to speed up validators, which the policy
  reports as a violation, so `src/shared/security/zod-no-eval.ts` switches that off before any schema is created.
- `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`, `worker-src 'none'`, `frame-ancestors 'none'`.
- `connect-src` and `img-src` list only the origins the application talks to, taken from the build environment:
  Cognito (`VITE_COGNITO_ENDPOINT`), the media bucket (`VITE_MEDIA_BASE_URL`) and the object storage that the presigned
  photo links point to (`VITE_CSP_EXTRA_ORIGINS`, comma separated). The API itself is the page's own origin.

Companion headers sent next to it: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (camera,
microphone, geolocation, payment and USB off), `Cross-Origin-Opener-Policy: same-origin`, `X-Frame-Options: DENY`.

### For the host

Send the headers of `dist/security-headers.json` with every response of the application. The build must be made with
the same `VITE_*` values as the deployment, because the allowed origins come from them. In AWS add the photo bucket's
origin (for example `https://<bucket>.s3.<region>.amazonaws.com`) to `VITE_CSP_EXTRA_ORIGINS`.

## Other measures

- Links that come from the backend (sources, care data) are rendered only when they are `http` or `https` addresses.
- No raw HTML is rendered anywhere, so there is no sanitizer to maintain.
- Tokens are never logged, and the error logger records the correlation id and not the request.
- Sign-up and password reset do not exist in the interface; an administrator creates users.
