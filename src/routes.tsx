import { Navigate, type RouteObject } from 'react-router';
import { notFound, pageElement, pages } from '@/pageRegistry';
import { AppShell } from '@/shell/AppShell';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      // BitChord's old addresses.
      { path: '/settings/listen-together', element: <Navigate to="/together" replace /> },
      // Where people guess the info pages live.
      { path: '/privacy', element: <Navigate to="/terms#privacy" replace /> },
      { path: '/disclaimer', element: <Navigate to="/terms#disclaimer" replace /> },
      { path: '/donate', element: <Navigate to="/support" replace /> },
      { path: '/help', element: <Navigate to="/support#help" replace /> },
      ...pages.map((page) => ({ path: page.path, element: pageElement(page) })),
      { path: notFound.path, element: pageElement(notFound) },
    ],
  },
];
