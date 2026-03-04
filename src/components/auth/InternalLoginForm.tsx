import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { LoginInput } from '../ui/LoginInput'
import { SubmitButton } from '../ui/SubmitButton'

import { throwIfError } from '@/data/api/_helpers'
import { qk } from '@/data/query/keys'
import { supabaseBrowser } from '@/data/supabase/client'

export function InternalLoginForm() {
  const [clave, setClave] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const qc = useQueryClient()
  const navigate = useNavigate({ from: '/login' })
  const supabase = supabaseBrowser()

  const submit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const email = clave.includes('@') ? clave : `${clave}@ulsa.mx`
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      throwIfError(error)

      qc.invalidateQueries({ queryKey: qk.session() })
      qc.invalidateQueries({ queryKey: qk.auth })
      await navigate({ to: '/dashboard', replace: true })
    } catch (e: unknown) {
      const anyErr = e as any
      setError(anyErr?.message ?? 'No se pudo iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <LoginInput label="Clave ULSA" value={clave} onChange={setClave} />
      <LoginInput
        label="Contraseña"
        type="password"
        value={password}
        onChange={setPassword}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <SubmitButton
        text={isLoading ? 'Iniciando…' : 'Iniciar sesión'}
        disabled={isLoading}
      />
    </form>
  )
}
