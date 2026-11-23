import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ChoiceField } from '@/shared/ui/ChoiceField'
import { FormDialog } from '@/shared/ui/FormDialog'
import { useChangeRole } from '../api/queries'
import { describeAdminError } from '../model/errors'
import { roleSchema, type RoleValues } from '../model/schemas'
import { ROLE_LABELS, type AdminUser } from '../model/types'

export function ChangeRoleDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const change = useChangeRole()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { role: user.role ?? 'user' },
  })

  return (
    <FormDialog
      title={`Change the role of ${user.email ?? user.username}`}
      submitLabel="Save role"
      pending={change.isPending}
      error={change.error ? describeAdminError(change.error) : null}
      onClose={onClose}
      onSubmit={(event) =>
        void handleSubmit((values) =>
          change.mutate({ userId: user.user_id, role: values.role }, { onSuccess: onClose }),
        )(event)
      }
    >
      <ChoiceField
        id="change-role"
        label="Role"
        options={ROLE_LABELS}
        error={errors.role?.message}
        {...register('role')}
      />
    </FormDialog>
  )
}
