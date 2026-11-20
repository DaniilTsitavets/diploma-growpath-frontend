import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { describeError } from '@/shared/api/messages'
import { getConfig } from '@/shared/config/config'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { TextField } from '@/shared/ui/TextField'
import { signIn } from '../api/cognito'
import { loginSchema, type LoginValues } from '../model/login-schema'
import { safeReturnPath } from '../model/return-path'
import { useSession } from '../model/session-store'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const session = useSession((state) => state.session)
  const setTokens = useSession((state) => state.setTokens)
  const navigate = useNavigate()
  const returnTo = safeReturnPath((useLocation().state as { from?: string } | null)?.from)

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
      void navigate(returnTo, { replace: true })
    },
    meta: { handledInline: true },
  })

  if (session) return <Navigate to={returnTo} replace />

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className={styles.lead}>
          Use your GrowPath account to order packs and keep your journals.
        </p>
        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => void handleSubmit((values) => login.mutate(values))(event)}
        >
          <TextField
            id="email"
            type="email"
            label="Email"
            autoComplete="username"
            spellCheck={false}
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            id="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {login.error && (
            <p role="alert" className={styles.error}>
              {describeError(login.error)}
            </p>
          )}
          <Button type="submit" className={styles.submit} disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className={styles.back}>
          <Link to="/">Back to the home page</Link>
        </p>
      </Card>
    </div>
  )
}
