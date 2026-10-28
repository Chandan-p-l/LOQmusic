// First: every later request to YouTube and the lyric hosts goes through LOQmusic's proxy.
import '@/net/proxy';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { extensionQueryKey } from '@/extension/useExtension';
import { queryClient } from '@/lib/queryClient';
import { localExtension } from '@/net/localBridge';
import { routes } from '@/routes';
import '@/styles/global.css';

// Code that asks the query cache for the extension finds LOQmusic's own bridge.
queryClient.setQueryData(extensionQueryKey, localExtension);

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
