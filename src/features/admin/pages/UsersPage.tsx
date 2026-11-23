import { useMemo, useState } from 'react'
import { useRole } from '@/features/auth/api/use-role'
import { describeError } from '@/shared/api/messages'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Tag } from '@/shared/ui/Chip'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useSetEnabled, useUsers } from '../api/queries'
import { describeAdminError } from '../model/errors'
import { ROLE_LABELS, type AdminUser } from '../model/types'
import { ChangeRoleDialog } from '../ui/ChangeRoleDialog'
import { CreateUserDialog } from '../ui/CreateUserDialog'
import { PasswordDialog } from '../ui/PasswordDialog'
import styles from './UsersPage.module.css'

type Dialog =
  | { kind: 'create' }
  | { kind: 'role'; user: AdminUser }
  | { kind: 'password'; user: AdminUser }
  | { kind: 'enabled'; user: AdminUser }

const label = (user: AdminUser) => user.email ?? user.username
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso))

export function UsersPage() {
  const users = useUsers()
  const { userId } = useRole()
  const setEnabled = useSetEnabled()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [search, setSearch] = useState('')

  const all = useMemo(() => users.data?.pages.flatMap((page) => page.items) ?? [], [users.data])
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return needle ? all.filter((user) => label(user).toLowerCase().includes(needle)) : all
  }, [all, search])

  function close() {
    setDialog(null)
    setEnabled.reset()
  }

  return (
    <>
      <div className={styles.head}>
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Users</h1>
        </div>
        <Button onClick={() => setDialog({ kind: 'create' })}>Create user</Button>
      </div>

      {users.isPending && (
        <div aria-busy="true">
          <p className="visually-hidden" role="status">
            Loading the users
          </p>
          <Skeleton height="block" />
        </div>
      )}
      {users.error && (
        <div role="alert">
          <p className={styles.error}>{describeError(users.error)}</p>
          <Button onClick={() => void users.refetch()}>Try again</Button>
        </div>
      )}

      {users.data && (
        <>
          <div className={styles.tools}>
            <div>
              <label htmlFor="user-search">Search by email</label>
              <input
                id="user-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <p role="status">{visible.length === 1 ? '1 user' : `${visible.length} users`}</p>
          <div className={styles.scroll} tabIndex={0} role="region" aria-label="Users table">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user) => {
                  const self = user.user_id === userId
                  return (
                    <tr key={user.user_id}>
                      <td>
                        <span className={styles.email}>{label(user)}</span>
                        {self && <span className={styles.you}>(you)</span>}
                      </td>
                      <td>
                        <Tag>{ROLE_LABELS[user.role ?? 'user']}</Tag>
                      </td>
                      <td className={user.enabled ? undefined : styles.disabled}>
                        {user.enabled ? 'Active' : 'Disabled'}
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button
                            variant="secondary"
                            disabled={self}
                            aria-label={`Change role of ${label(user)}`}
                            onClick={() => setDialog({ kind: 'role', user })}
                          >
                            Role
                          </Button>
                          <Button
                            variant="secondary"
                            aria-label={`Reset password of ${label(user)}`}
                            onClick={() => setDialog({ kind: 'password', user })}
                          >
                            Password
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={self}
                            aria-label={`${user.enabled ? 'Disable' : 'Enable'} ${label(user)}`}
                            onClick={() => setDialog({ kind: 'enabled', user })}
                          >
                            {user.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {users.hasNextPage && (
            <div className={styles.more}>
              <Button
                variant="secondary"
                disabled={users.isFetchingNextPage}
                onClick={() => void users.fetchNextPage()}
              >
                {users.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      {dialog?.kind === 'create' && <CreateUserDialog onClose={close} />}
      {dialog?.kind === 'role' && <ChangeRoleDialog user={dialog.user} onClose={close} />}
      {dialog?.kind === 'password' && <PasswordDialog user={dialog.user} onClose={close} />}
      {dialog?.kind === 'enabled' && (
        <ConfirmDialog
          title={`${dialog.user.enabled ? 'Disable' : 'Enable'} ${label(dialog.user)}?`}
          confirmLabel={dialog.user.enabled ? 'Disable user' : 'Enable user'}
          pending={setEnabled.isPending}
          onClose={close}
          onConfirm={() =>
            setEnabled.mutate(
              { userId: dialog.user.user_id, enabled: !dialog.user.enabled },
              { onSuccess: close },
            )
          }
        >
          <p>
            {dialog.user.enabled
              ? 'The user can no longer sign in until the account is enabled again.'
              : 'The user can sign in again.'}
          </p>
          {setEnabled.error && (
            <p role="alert" className={styles.error}>
              {describeAdminError(setEnabled.error)}
            </p>
          )}
        </ConfirmDialog>
      )}
    </>
  )
}
