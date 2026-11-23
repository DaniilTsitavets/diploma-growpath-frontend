import type { Plugin } from 'vite'
import { buildCsp, securityHeaders, type CspOptions } from './src/shared/security/csp.ts'

/**
 * Applies the security policy to the built application only: the dev server needs inline code for hot reload.
 * - the build gets a meta tag with the policy, so any static host enforces it;
 * - the build also writes `security-headers.json`, the full header set (including what a meta tag cannot carry) for
 *   the host to send, for example as a CloudFront response headers policy;
 * - the preview server sends those headers itself.
 */
export function securityPolicy(options: CspOptions): Plugin {
  return {
    name: 'growpath-security-policy',
    apply: (_config, env) => env.command === 'build' || Boolean(env.isPreview),
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (context.server) return html
        const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(options, 'meta')}" />`
        return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${meta}`)
      },
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'security-headers.json',
        source: `${JSON.stringify(securityHeaders(options), null, 2)}\n`,
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((_request, response, next) => {
        for (const [name, value] of Object.entries(securityHeaders(options))) {
          response.setHeader(name, value)
        }
        next()
      })
    },
  }
}
