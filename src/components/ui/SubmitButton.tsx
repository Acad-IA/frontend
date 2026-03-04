interface Props {
  text?: string
  disabled?: boolean
}

export function SubmitButton({ text = 'Iniciar sesión', disabled }: Props) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-lg bg-[#7b0f1d] py-2 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {text}
    </button>
  )
}
