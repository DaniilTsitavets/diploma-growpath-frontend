import { parseEnv } from './env'

const valid = {
  VITE_API_BASE_URL: 'http://localhost:4566/restapis/abc/v1/_user_request_/',
  VITE_COGNITO_ENDPOINT: 'http://localhost:4566',
  VITE_COGNITO_CLIENT_ID: 'client',
}

describe('parseEnv', () => {
  it('trims trailing slashes from the base URLs', () => {
    expect(parseEnv(valid).apiBaseUrl).toBe('http://localhost:4566/restapis/abc/v1/_user_request_')
  })

  it('names the missing variables', () => {
    expect(() => parseEnv({ ...valid, VITE_COGNITO_CLIENT_ID: '' })).toThrow(
      /VITE_COGNITO_CLIENT_ID/,
    )
  })
})
