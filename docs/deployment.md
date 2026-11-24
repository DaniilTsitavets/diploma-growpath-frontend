# Deployment

The single-page application is built by GitHub Actions and published to a private S3 bucket behind CloudFront
at <https://growpath.social>. The workflow is `.github/workflows/deploy.yml`.

## Pipeline

| Job      | Runs on                                  | What it does                                                                                          |
| -------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `build`  | every pull request, every push to `main` | `npm ci`, lint, typecheck, unit tests, build; `dist` is handed on as an artifact. No AWS, no secrets. |
| `deploy` | push to `main` and manual runs on `main` | Downloads the artifact of the same run and publishes it. Runs in the GitHub environment `prod`.       |

Publishing is done in an order that never serves a page whose assets are already gone:

1. `assets/` (file names carry a content hash) to S3 with `Cache-Control: public,max-age=31536000,immutable`;
2. the other root files (`favicon.svg`, `robots.txt`, `theme-init.js`) with `no-cache`, because their names do not change;
3. `index.html` last, with `no-cache`;
4. a CloudFront invalidation of the files that keep their names.

`media/` in the bucket is never touched by the sync, and `security-headers.json` (only used by `vite preview`)
is not published.

## Access to AWS

There are no AWS keys anywhere. The `deploy` job gets short-lived credentials from AWS through OpenID Connect
(`aws-actions/configure-aws-credentials`, pinned to a commit) and assumes the role
`GitHubActionsFrontendDeploy`. The role trusts only jobs that run in the GitHub environment named exactly
`prod`, and it may only list, read, write and delete objects in the site bucket and create invalidations for the
one distribution. Branches and pull requests alone cannot assume it.

The job has `permissions: id-token: write, contents: read` and nothing more; the build job has `contents: read`.
The role ARN, bucket name and distribution id are not secret and are written in the workflow.

## One-time setup

1. Environment: Settings, Environments, `prod`; deployment branches only `main`; no reviewers.
2. Repository variables (Settings, Secrets and variables, Actions, Variables). They are public values, not
   secrets, and are repository-level because the `build` job runs without an environment:

   | Variable                 | Value                                                                                |
   | ------------------------ | ------------------------------------------------------------------------------------ |
   | `VITE_COGNITO_ENDPOINT`  | `https://cognito-idp.eu-north-1.amazonaws.com/`                                      |
   | `VITE_COGNITO_CLIENT_ID` | the app client id of the production user pool                                        |
   | `VITE_MEDIA_BASE_URL`    | `https://growpath.social/media`                                                      |
   | `VITE_CSP_EXTRA_ORIGINS` | the origin of the photo bucket, `https://<photo bucket>.s3.eu-north-1.amazonaws.com` |

   `VITE_COGNITO_ENDPOINT` is the address the client posts `InitiateAuth` to (see [API client](api.md)); locally
   it is LocalStack, on AWS it is the public Cognito endpoint. The pool id is not used by the code.
   `VITE_GATEWAY_PROXY_TARGET` is only for the dev server: in production the API is on the same domain under `/v1`.

On a push to `main` the build fails early, with the name of the missing variable, if one of them is not set.

## Content security policy

The policy is built into `index.html` (and into `dist/security-headers.json`, which `vite preview` uses). The
CloudFront response headers repeat it, so when `src/shared/security/csp.ts` or one of the variables above changes,
the CloudFront headers must be updated too. For the production values the built policy is:

```
default-src 'none'; script-src 'self'; style-src 'self';
img-src 'self' data: blob: <cognito> <site> <photo bucket>; font-src 'self';
connect-src 'self' <cognito> <site> <photo bucket>; manifest-src 'self'; object-src 'none';
base-uri 'none'; form-action 'self'; worker-src 'none'; require-trusted-types-for 'script'
```

with `frame-ancestors 'none'` as a header only. `<cognito>` is `https://cognito-idp.eu-north-1.amazonaws.com`,
`<site>` is `https://growpath.social`. The routes use the browser history API, so CloudFront answers 403 and 404
with `index.html`.

## Rollback

Revert the commit on `main`: the push runs the same pipeline and publishes the previous version. A failed
`deploy` can be started again from the Actions tab (Run workflow, branch `main`).
