import { useState } from 'react'

// import { supabase } from '@/lib/supabase'
import { LoginInput } from '../ui/LoginInput'
import { SubmitButton } from '../ui/SubmitButton'

export function InternalLoginForm() {
  const [clave, setClave] = useState('')
  const [password, setPassword] = useState('')

  const submit = async () => {
    /* await supabase.auth.signInWithPassword({
      email: `${clave}@ulsa.mx`,
      password,
    })*/
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
      <SubmitButton />
    </form>
  )
}
