import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { throwIfError } from '../api/_helpers'
import { qk } from '../query/keys'
import { supabaseBrowser } from '../supabase/client'

export function useSession() {
  const supabase = supabaseBrowser()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: qk.session(),
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession()
      throwIfError(error)
      return data.session ?? null
    },
    staleTime: Infinity,
  })

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: qk.session() })
      qc.invalidateQueries({ queryKey: qk.meProfile() })
      qc.invalidateQueries({ queryKey: qk.meAccess() })
      qc.invalidateQueries({ queryKey: qk.auth })
    })

    return () => data.subscription.unsubscribe()
  }, [supabase, qc])

  return query
}

export function useMeProfile() {
  const supabase = supabaseBrowser()

  return useQuery({
    queryKey: qk.meProfile(),
    queryFn: async () => {
      const { data: u, error: uErr } = await supabase.auth.getUser()
      throwIfError(uErr)
      const userId = u.user?.id
      if (!userId) return null

      const { data, error } = await supabase
        .from('usuarios_app')
        .select('id,nombre_completo,email,externo,creado_en,actualizado_en')
        .eq('id', userId)
        .single()

      // si aún no existe perfil en usuarios_app, permite null (tu seed/trigger puede crearlo)
      if (error && (error as any).code === 'PGRST116') return null

      throwIfError(error)
      return data ?? null
    },
    staleTime: 60_000,
  })
}

export type MeAccessRole = {
  assignmentId: string
  rolId: string
  clave: string
  nombre: string
  descripcion: string | null
  facultadId: string | null
  carreraId: string | null
}

export type MeAccess = {
  userId: string
  roles: Array<MeAccessRole>
  permissions: Array<string>
}

/**
 * Database-first RBAC: obtiene roles del usuario desde tablas app (NO desde JWT).
 *
 * Nota: el esquema actual modela roles con `usuarios_roles` -> `roles`.
 */
export function useMeAccess() {
  const supabase = supabaseBrowser()

  return useQuery({
    queryKey: qk.meAccess(),
    queryFn: async (): Promise<MeAccess | null> => {
      const { data: u, error: uErr } = await supabase.auth.getUser()
      throwIfError(uErr)
      const userId = u.user?.id
      if (!userId) return null

      const { data, error } = await supabase
        .from('usuarios_roles')
        .select(
          'id,rol_id,facultad_id,carrera_id,roles(id,clave,nombre,descripcion)',
        )
        .eq('usuario_id', userId)

      throwIfError(error)

      const roles: Array<MeAccessRole> = (data ?? [])
        .map((row: any) => {
          const rol = row.roles
          if (!rol) return null
          return {
            assignmentId: row.id,
            rolId: rol.id,
            clave: rol.clave,
            nombre: rol.nombre,
            descripcion: rol.descripcion ?? null,
            facultadId: row.facultad_id ?? null,
            carreraId: row.carrera_id ?? null,
          } satisfies MeAccessRole
        })
        .filter(Boolean) as Array<MeAccessRole>

      // Por ahora, los permisos granulares se derivan de claves de rol.
      // Si luego existe una tabla `roles_permisos`, aquí se expande a permisos reales.
      const permissions = Array.from(new Set(roles.map((r) => r.clave)))

      return {
        userId,
        roles,
        permissions,
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useAuth() {
  const session = useSession()
  const meProfile = useMeProfile()
  const meAccess = useMeAccess()

  return {
    session,
    meProfile,
    meAccess,
  }
}
