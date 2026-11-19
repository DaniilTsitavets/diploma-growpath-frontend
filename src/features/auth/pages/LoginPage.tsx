import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { getConfig } from '@/shared/config/config'
import { signIn } from '../api/cognito'
import { loginSchema, type LoginValues } from '../model/login-schema'
import { useSession } from '../model/session-store'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const session = useSession((state) => state.session)
  const setTokens = useSession((state) => state.setTokens)
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/catalog'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const login = useMutation({
    mutationFn: ({ email, password }: LoginValues) => {
      const { cognitoEndpoint, cognitoClientId } = getConfig()
      return signIn({ endpoint: cognitoEndpoint, clientId: cognitoClientId }, email, password)
    },
    onSuccess: (tokens) => {
      setTokens(tokens)
      void navigate(from, { replace: true })
    },
    meta: { handledInline: true },
  })

  if (session) return <Navigate to={from} replace />

  return (
    <>
      <h1>Sign in</h1>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => void handleSubmit((v) => login.mutate(v))(event)}
      >
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            className={styles.input}
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className={styles.error}>
              {errors.email.message}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={styles.input}
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className={styles.error}>
              {errors.password.message}
            </p>
          )}
        </div>
        {login.error && (
          <p role="alert" className={styles.error}>
            {describeError(login.error)}
          </p>
        )}
        <button type="submit" className={styles.button} disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </>
  )
}
