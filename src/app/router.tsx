import { createBrowserRouter, type RouteObject } from 'react-router'
import {
  RequireAdmin,
  RequireAuth,
  RequireCustomer,
  RequireExpert,
} from '@/features/auth/ui/RequireAuth'
import { ErrorPage } from './ErrorPage'
import { StartupFallback } from './StartupFallback'
import { AppLayout } from './layouts/AppLayout'
import { FocusLayout } from './layouts/FocusLayout'

export const routes: RouteObject[] = [
  {
    element: <FocusLayout />,
    HydrateFallback: StartupFallback,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'login',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
        }),
      },
    ],
  },
  {
    path: '/',
    element: <AppLayout />,
    HydrateFallback: StartupFallback,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <RequireCustomer />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('@/features/home/pages/HomePage')).HomePage,
            }),
          },
          {
            path: 'shop',
            lazy: async () => ({
              Component: (await import('@/features/catalog/pages/CatalogPage')).CatalogPage,
            }),
          },
          {
            path: 'shop/:slug',
            lazy: async () => ({
              Component: (await import('@/features/catalog/pages/ItemPage')).ItemPage,
            }),
          },
          {
            element: <RequireAuth />,
            children: [
              {
                path: 'chat',
                lazy: async () => ({
                  Component: (await import('@/features/chat/pages/ChatPage')).ChatPage,
                }),
              },
              {
                path: 'journals',
                lazy: async () => ({
                  Component: (await import('@/features/journal/pages/JournalsPage')).JournalsPage,
                }),
              },
              {
                path: 'journals/:journalId',
                lazy: async () => ({
                  Component: (await import('@/features/journal/pages/JournalPage')).JournalPage,
                }),
              },
              {
                path: 'journals/:journalId/chat',
                lazy: async () => ({
                  Component: (await import('@/features/chat/pages/JournalChatPage'))
                    .JournalChatPage,
                }),
              },
              {
                path: 'journals/:journalId/updates/new',
                lazy: async () => ({
                  Component: (await import('@/features/journal/pages/NewUpdatePage')).NewUpdatePage,
                }),
              },
              {
                path: 'journals/:journalId/updates/:updateId',
                lazy: async () => ({
                  Component: (await import('@/features/journal/pages/UpdatePage')).UpdatePage,
                }),
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireExpert />,
            children: [
              {
                path: 'expert/tickets',
                lazy: async () => ({
                  Component: (await import('@/features/expert/pages/TicketsPage')).TicketsPage,
                }),
              },
              {
                path: 'expert/tickets/:ticketId',
                lazy: async () => ({
                  Component: (await import('@/features/expert/pages/TicketPage')).TicketPage,
                }),
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireAdmin />,
            children: [
              {
                path: 'admin/users',
                lazy: async () => ({
                  Component: (await import('@/features/admin/pages/UsersPage')).UsersPage,
                }),
              },
            ],
          },
        ],
      },
      {
        path: 'credits',
        lazy: async () => ({
          Component: (await import('@/features/media/pages/CreditsPage')).CreditsPage,
        }),
      },
      {
        path: '*',
        lazy: async () => ({
          Component: (await import('@/features/not-found/pages/NotFoundPage')).NotFoundPage,
        }),
      },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(routes)
