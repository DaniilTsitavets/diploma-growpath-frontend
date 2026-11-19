import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AppLayout } from './layouts/AppLayout'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/catalog" replace /> },
      {
        path: 'login',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
        }),
      },
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
        path: 'expert/tickets',
        lazy: async () => ({
          Component: (await import('@/features/expert/pages/TicketsPage')).TicketsPage,
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
