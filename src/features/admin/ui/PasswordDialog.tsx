import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormDialog } from '@/shared/ui/FormDialog'
import { TextField } from '@/shared/ui/TextField'
import { useResetPassword } from '../api/queries'
import { describeAdminError } from '../model/errors'
import { passwordSchema, type PasswordValues } from '../model/schemas'
import type { AdminUser } from '../model/types'

export function PasswordDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const reset = useResetPassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  })

  return (
    <FormDialog
      title={`Reset the password of ${user.email ?? user.username}`}
      submitLabel="Set password"
      pending={reset.isPending}
      error={reset.error ? describeAdminError(reset.error) : null}
      onClose={onClose}
      onSubmit={(event) =>
        void handleSubmit((values) =>
          reset.mutate({ userId: user.user_id, password: values.password }, { onSuccess: onClose }),
        )(event)
      }
    >
      <TextField
        id="reset-password"
        type="password"
        label="New password"
        autoComplete="new-password"
        hint="It replaces the current password at once."
        error={errors.password?.message}
        {...register('password')}
      />
    </FormDialog>
  )
}
