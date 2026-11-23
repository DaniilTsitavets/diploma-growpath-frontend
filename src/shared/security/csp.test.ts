import { buildCsp, originOf, parseOrigins, securityHeaders } from './csp'

const options = {
  cognitoEndpoint: 'http://localhost:4566/',
  mediaBaseUrl: 'http://localhost:4566/growpath-media',
  extraOrigins: ['http://127.0.0.1:4566'],
}

const directive = (policy: string, name: string) =>
  policy.split('; ').find((part) => part.startsWith(`${name} `)) ?? ''

describe('buildCsp', () => {
  it('allows scripts and styles only from the page itself, with no inline code', () => {
    const policy = buildCsp(options)
    expect(directive(policy, 'script-src')).toBe("script-src 'self'")
    expect(directive(policy, 'style-src')).toBe("style-src 'self'")
    expect(policy).not.toContain('unsafe-inline')
    expect(policy).not.toContain('unsafe-eval')
    expect(policy).toContain("default-src 'none'")
  })

  it('lists the origins that fetches and pictures really need, once each', () => {
    const policy = buildCsp(options)
    expect(directive(policy, 'connect-src')).toBe(
      "connect-src 'self' http://localhost:4566 http://127.0.0.1:4566",
    )
    expect(directive(policy, 'img-src')).toBe(
      "img-src 'self' data: blob: http://localhost:4566 http://127.0.0.1:4566",
    )
  })

  it('closes plugins, base tag, forms elsewhere and string-based script sinks', () => {
    const policy = buildCsp(options)
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("base-uri 'none'")
    expect(policy).toContain("form-action 'self'")
    expect(policy).toContain("require-trusted-types-for 'script'")
  })

  it('keeps frame-ancestors for the header only, because a meta tag ignores it', () => {
    expect(buildCsp(options, 'header')).toContain("frame-ancestors 'none'")
    expect(buildCsp(options, 'meta')).not.toContain('frame-ancestors')
  })

  it('works with nothing configured', () => {
    expect(directive(buildCsp(), 'connect-src')).toBe("connect-src 'self'")
  })
})

describe('origins', () => {
  it('reduces an address to its origin and ignores what is not a web address', () => {
    expect(originOf('https://bucket.s3.eu-west-1.amazonaws.com/x/y')).toBe(
      'https://bucket.s3.eu-west-1.amazonaws.com',
    )
    expect(originOf('')).toBeNull()
    expect(originOf('javascript:alert(1)')).toBeNull()
    expect(originOf('nonsense')).toBeNull()
  })

  it('reads a comma separated list', () => {
    expect(parseOrigins('http://a.test:1/x, https://b.test ,bad, ')).toEqual([
      'http://a.test:1',
      'https://b.test',
    ])
    expect(parseOrigins(undefined)).toEqual([])
  })
})

describe('securityHeaders', () => {
  it('sends the companion headers next to the policy', () => {
    const headers = securityHeaders(options)
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Permissions-Policy']).toContain('camera=()')
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'")
  })
})
