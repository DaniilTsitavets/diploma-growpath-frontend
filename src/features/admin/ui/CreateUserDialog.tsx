import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ChoiceField } from '@/shared/ui/ChoiceField'
import { FormDialog } from '@/shared/ui/FormDialog'
import { TextField } from '@/shared/ui/TextField'
import { useCreateUser } from '../api/queries'
import { describeAdminError } from '../model/errors'
import { createUserSchema, type CreateUserValues } from '../model/schemas'
import { ROLE_LABELS } from '../model/types'

export function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', password: '', role: 'user' },
  })

  return (
    <FormDialog
      title="Create a user"
      submitLabel="Create user"
      pending={create.isPending}
      error={create.error ? describeAdminError(create.error) : null}
      onClose={onClose}
      onSubmit={(event) =>
        void handleSubmit((values) => create.mutate(values, { onSuccess: onClose }))(event)
      }
    >
      <TextField
        id="new-user-email"
        type="email"
        label="Email"
        autoComplete="off"
        spellCheck={false}
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        id="new-user-password"
        type="password"
        label="Temporary password"
        autoComplete="new-password"
        hint="It is permanent until the user or an administrator changes it."
        error={errors.password?.message}
        {...register('password')}
      />
      <ChoiceField
        id="new-user-role"
        label="Role"
        options={ROLE_LABELS}
        error={errors.role?.message}
        {...register('role')}
      />
    </FormDialog>
  )
}
