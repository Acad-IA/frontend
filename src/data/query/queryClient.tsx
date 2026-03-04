import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import { qk } from './keys'

import type React from 'react'

function isRlsViolationError(error: unknown): boolean {
  const anyErr = error as any
  const code = anyErr?.code
  const status = anyErr?.status ?? anyErr?.response?.status
  console.log('Checking RLS violation error:', { code, status })
  // Supabase/PostgREST suele devolver 403 (Forbidden) o código PG 42501 (insufficient_privilege)
  return status === 403 || code === '42501'
}

export function getContext() {
  const queryClientRef: { current: QueryClient | null } = { current: null }

  const handleAuthzDesync = (error: unknown) => {
    if (!isRlsViolationError(error)) return
    // Forzar resincronización “database-first” del rol/permisos
    console.log('RLS violation detected, invalidating queries...')
    queryClientRef.current?.invalidateQueries({ queryKey: qk.meAccess() })
  }

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        handleAuthzDesync(error)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleAuthzDesync(error)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount) => failureCount < 2,
      },
      mutations: {
        retry: 0,
      },
    },
  })

  queryClientRef.current = queryClient
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
