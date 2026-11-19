import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
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
        path: 'login',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
        }),
      },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <Navigate to="/catalog" replace /> },
          {
            path: 'catalog',
            lazy: async () => ({
              Component: (await import('@/features/catalog/pages/CatalogPage')).CatalogPage,
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
