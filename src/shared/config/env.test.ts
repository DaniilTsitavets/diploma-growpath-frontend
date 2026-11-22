import { parseEnv } from './env'

const valid = {
  VITE_COGNITO_ENDPOINT: 'http://localhost:4566',
  VITE_COGNITO_CLIENT_ID: 'client',
}

describe('parseEnv', () => {
  it('trims trailing slashes from the Cognito endpoint', () => {
    expect(parseEnv({ ...valid, VITE_COGNITO_ENDPOINT: 'http://localhost:4566/' })).toMatchObject({
      cognitoEndpoint: 'http://localhost:4566',
    })
  })

  it('names the missing variables', () => {
    expect(() => parseEnv({ ...valid, VITE_COGNITO_CLIENT_ID: '' })).toThrow(
      /VITE_COGNITO_CLIENT_ID/,
    )
  })

  it('reads the media base URL without a trailing slash, and allows it to be absent', () => {
    expect(
      parseEnv({ ...valid, VITE_MEDIA_BASE_URL: 'http://localhost:4566/growpath-media/' }),
    ).toMatchObject({ mediaBaseUrl: 'http://localhost:4566/growpath-media' })
    expect(parseEnv(valid).mediaBaseUrl).toBeNull()
  })
})
