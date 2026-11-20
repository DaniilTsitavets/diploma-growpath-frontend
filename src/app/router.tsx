import { createBrowserRouter, type RouteObject } from 'react-router'
import { RequireAuth, RequireExpert } from '@/features/auth/ui/RequireAuth'
import { ErrorPage } from './ErrorPage'
import { AppLayout } from './layouts/AppLayout'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('@/features/home/pages/HomePage')).HomePage,
        }),
      },
      {
        path: 'login',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
        }),
      },
      {
        path: 'shop',
        lazy: async () => ({
          Component: (await import('@/features/catalog/pages/CatalogPage')).CatalogPage,
        }),
      },
      {
        path: 'chat',
        lazy: async () => ({
          Component: (await import('@/features/chat/pages/ChatPage')).ChatPage,
        }),
      },
      {
        element: <RequireAuth />,
        children: [
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
              Component: (await import('@/features/chat/pages/JournalChatPage')).JournalChatPage,
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
          {
            element: <RequireExpert />,
            children: [
              {
                path: 'expert/tickets',
                lazy: async () => ({
                  Component: (await import('@/features/expert/pages/TicketsPage')).TicketsPage,
                }),
              },
            ],
          },
        ],
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
