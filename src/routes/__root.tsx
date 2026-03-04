import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  Outlet,
  createRootRouteWithContext,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'

import Header from '../components/Header'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { QueryClient } from '@tanstack/react-query'

import { NotFoundPage } from '@/components/ui/NotFoundPage'
import { throwIfError } from '@/data/api/_helpers'
import { useSession } from '@/data/hooks/useAuth'
import { qk } from '@/data/query/keys'

interface MyRouterContext {
  queryClient: QueryClient
  supabase: SupabaseClient<Database>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context, location }) => {
    const pathname = location.pathname
    const isLogin = pathname === '/login'
    const isIndex = pathname === '/'

    const session = await context.queryClient.ensureQueryData({
      queryKey: qk.session(),
      queryFn: async () => {
        const { data, error } = await context.supabase.auth.getSession()
        throwIfError(error)
        return data.session ?? null
      },
      staleTime: Infinity,
    })

    if (!session && !isLogin) {
      throw redirect({ to: '/login' })
    }
    if (session && (isLogin || isIndex)) {
      throw redirect({ to: '/dashboard' })
    }
  },

  component: () => (
    <>
      <AuthSync />
      <MaybeHeader />
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  ),

  notFoundComponent: () => <NotFoundPage />,

  errorComponent: ({ error, reset }) => {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">
          ¡Ups! Algo salió mal
        </h2>
        <p className="max-w-md text-gray-600">
          Ocurrió un error inesperado al cargar esta sección.
        </p>

        {/* Opcional: Mostrar el detalle técnico en desarrollo */}
        <pre className="max-w-full overflow-auto rounded border border-gray-300 bg-gray-100 p-4 text-left text-xs">
          {error.message}
        </pre>

        <button
          onClick={reset}
          className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  },
})

function MaybeHeader() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  if (pathname === '/login') return null
  return <Header />
}

function AuthSync() {
  const { data: session, isLoading } = useSession()
  // Mantiene roles/permisos sincronizados con la BD (database-first)
  // useMeAccess()

  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  // Reaccionar a cambios de sesión (login/logout) sin depender solo de beforeLoad.
  // Nota: beforeLoad sigue siendo la línea de defensa en navegación/refresh.
  useEffect(() => {
    if (isLoading) return

    if (!session && pathname !== '/login') {
      void navigate({ to: '/login', replace: true })
      return
    }

    if (session && pathname === '/login') {
      void navigate({ to: '/dashboard', replace: true })
    }
  }, [isLoading, session, pathname, navigate])

  return null
}
