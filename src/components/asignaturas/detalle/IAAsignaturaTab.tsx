import { useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import {
  Sparkles,
  Send,
  Target,
  UserCheck,
  Lightbulb,
  FileText,
  GraduationCap,
  BookOpen,
  Check,
  X,
  MessageSquarePlus,
  Archive,
  History, // Agregado
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'

import type { IASugerencia } from '@/types/asignatura'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  useAISubjectChat,
  useConversationBySubject,
  useMessagesBySubjectChat,
  useSubject,
  useUpdateSubjectConversationStatus,
} from '@/data'
import { cn } from '@/lib/utils'

interface SelectedField {
  key: string
  label: string
  value: string
}

interface IAAsignaturaTabProps {
  asignatura?: Record<string, any>
  onAcceptSuggestion: (sugerencia: IASugerencia) => void
  onRejectSuggestion: (messageId: string) => void
}

export function IAAsignaturaTab({
  onAcceptSuggestion,
  onRejectSuggestion,
}: IAAsignaturaTabProps) {
  const queryClient = useQueryClient()
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })

  // --- ESTADOS ---
  const [activeChatId, setActiveChatId] = useState<string | undefined>(
    undefined,
  )
  const [showArchived, setShowArchived] = useState(false)
  const [input, setInput] = useState('')
  const [selectedFields, setSelectedFields] = useState<Array<SelectedField>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // --- DATA QUERIES ---
  const { data: datosGenerales } = useSubject(asignaturaId)
  const { data: todasConversaciones, isLoading: loadingConv } =
    useConversationBySubject(asignaturaId)
  const { data: rawMessages } = useMessagesBySubjectChat(activeChatId, {
    enabled: !!activeChatId,
  })
  const { mutateAsync: sendMessage } = useAISubjectChat()
  const { mutate: updateStatus } = useUpdateSubjectConversationStatus()
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)
  const hasInitialSelected = useRef(false)

  const isAiThinking = useMemo(() => {
    if (isSending) return true
    if (!rawMessages || rawMessages.length === 0) return false

    // Verificamos si el último mensaje está en estado de procesamiento
    const lastMessage = rawMessages[rawMessages.length - 1]
    return (
      lastMessage.estado === 'PROCESANDO' || lastMessage.estado === 'PENDIENTE'
    )
  }, [isSending, rawMessages])

  // --- AUTO-SCROLL ---
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]',
    )
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [rawMessages, isSending])

  // --- FILTRADO DE CHATS ---
  const { activeChats, archivedChats } = useMemo(() => {
    const chats = todasConversaciones || []
    return {
      activeChats: chats.filter((c: any) => c.estado === 'ACTIVA'),
      archivedChats: chats.filter((c: any) => c.estado === 'ARCHIVADA'),
    }
  }, [todasConversaciones])

  // --- PROCESAMIENTO DE MENSAJES ---
  const messages = useMemo(() => {
    if (!rawMessages) return []
    return rawMessages.flatMap((m) => {
      const msgs = []
      msgs.push({ id: `${m.id}-user`, role: 'user', content: m.mensaje })
      if (m.respuesta) {
        msgs.push({
          id: `${m.id}-ai`,
          role: 'assistant',
          content: m.respuesta,
          sugerencia: m.propuesta?.recommendations?.[0]
            ? {
                id: m.id,
                campoKey: m.propuesta.recommendations[0].campo_afectado,
                campoNombre:
                  m.propuesta.recommendations[0].campo_afectado.replace(
                    /_/g,
                    ' ',
                  ),
                valorSugerido: m.propuesta.recommendations[0].texto_mejora,
                aceptada: m.propuesta.recommendations[0].aplicada,
              }
            : null,
        })
      }
      return msgs
    })
  }, [rawMessages])

  // Auto-selección inicial
  useEffect(() => {
    // Si ya hay un chat, o si el usuario ya interactuó (hasInitialSelected), abortamos.
    if (activeChatId || hasInitialSelected.current) return

    if (activeChats.length > 0 && !loadingConv) {
      setActiveChatId(activeChats[0].id)
      hasInitialSelected.current = true
    }
  }, [activeChats, loadingConv])

  const handleSend = async (promptOverride?: string) => {
    const text = promptOverride || input
    if (!text.trim() && selectedFields.length === 0) return

    setIsSending(true)
    try {
      const response = await sendMessage({
        subjectId: asignaturaId as any, // Importante: se usa para crear la conv si activeChatId es undefined
        content: text,
        campos: selectedFields.map((f) => f.key),
        conversacionId: activeChatId, // Si es undefined, la mutación crea el chat automáticamente
      })

      // IMPORTANTE: Después de la respuesta, actualizamos el ID activo con el que creó el backend
      if (response.conversacionId) {
        setActiveChatId(response.conversacionId)
      }

      setInput('')
      setSelectedFields([])

      // Invalidamos la lista de conversaciones para que el nuevo chat aparezca en el historial (panel izquierdo)
      queryClient.invalidateQueries({
        queryKey: ['conversation-by-subject', asignaturaId],
      })
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
    } finally {
      setIsSending(false)
    }
  }

  const toggleField = (field: SelectedField) => {
    setSelectedFields((prev) =>
      prev.find((f) => f.key === field.key)
        ? prev.filter((f) => f.key !== field.key)
        : [...prev, field],
    )
  }

  const availableFields = useMemo(() => {
    if (!datosGenerales?.datos) return []
    const estructuraProps =
      datosGenerales?.estructuras_asignatura?.definicion?.properties || {}
    return Object.keys(datosGenerales.datos).map((key) => ({
      key,
      label:
        estructuraProps[key]?.title || key.replace(/_/g, ' ').toUpperCase(),
      value: String(datosGenerales.datos[key] || ''),
    }))
  }, [datosGenerales])

  const createNewChat = () => {
    setActiveChatId(undefined) // Al ser undefined, el próximo mensaje creará la charla en el backend
    setInput('')
    setSelectedFields([])
    // Opcional: podrías forzar el foco al textarea aquí con una ref
  }

  const PRESETS = [
    {
      id: 'mejorar-obj',
      label: 'Mejorar objetivo',
      icon: Target,
      prompt: 'Mejora la redacción del objetivo...',
    },
    {
      id: 'sugerir-cont',
      label: 'Sugerir contenido',
      icon: BookOpen,
      prompt: 'Genera un desglose de temas...',
    },
    {
      id: 'actividades',
      label: 'Actividades',
      icon: GraduationCap,
      prompt: 'Sugiere actividades prácticas...',
    },
  ]

  return (
    <div className="flex h-[calc(100vh-160px)] w-full gap-6 overflow-hidden p-4">
      {/* PANEL IZQUIERDO */}
      <div className="flex w-64 flex-col border-r pr-4">
        <div className="mb-4 flex items-center justify-between px-2">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <History size={14} /> Historial
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              showArchived && 'bg-teal-50 text-teal-600',
            )}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive size={16} />
          </Button>
        </div>

        <Button
          onClick={() => {
            // 1. Limpiamos el ID
            setActiveChatId(undefined)
            // 2. Marcamos que ya hubo una "interacción inicial" para que el useEffect no actúe
            hasInitialSelected.current = true
            // 3. Limpiamos estados visuales
            setIsCreatingNewChat(true)
            setInput('')
            setSelectedFields([])

            // 4. Opcional: Limpiar el caché de mensajes actual para que la pantalla se vea vacía al instante
            queryClient.setQueryData(['subject-messages', undefined], [])
          }}
          variant="outline"
          className="mb-4 w-full justify-start gap-2 border-dashed border-slate-300 hover:border-teal-500"
        >
          <MessageSquarePlus size={18} /> Nuevo Chat
        </Button>

        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-3">
            {(showArchived ? archivedChats : activeChats).map((chat: any) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id)
                  setIsCreatingNewChat(false) // <--- Volvemos al modo normal
                }}
                className={cn(
                  'group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                  activeChatId === chat.id
                    ? 'bg-teal-50 font-medium text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <FileText size={14} className="shrink-0 opacity-50" />
                <span className="flex-1 truncate">
                  {chat.titulo || 'Conversación'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateStatus(
                      {
                        id: chat.id,
                        estado: showArchived ? 'ACTIVA' : 'ARCHIVADA',
                      },
                      {
                        onSuccess: () =>
                          queryClient.invalidateQueries({
                            queryKey: ['conversation-by-subject'],
                          }),
                      },
                    )
                  }}
                  className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200"
                >
                  <Archive size={12} />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* PANEL CENTRAL */}
      <div className="relative flex min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="shrink-0 border-b bg-white p-3">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Asistente IA
          </span>
        </div>

        <div className="relative min-h-0 flex-1">
          <ScrollArea ref={scrollRef} className="h-full w-full">
            <div className="mx-auto max-w-3xl space-y-6 p-6">
              {messages.length === 0 && !isSending && (
                <div className="flex h-full flex-col items-center justify-center space-y-4 text-center opacity-60">
                  <div className="rounded-full bg-teal-100 p-4">
                    <Sparkles size={32} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700">
                      Nueva Consultoría IA
                    </h3>
                    <p className="max-w-[250px] text-xs text-slate-500">
                      Selecciona campos con ":" o usa una acción rápida para
                      comenzar.
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}
                >
                  <Avatar
                    className={`h-8 w-8 shrink-0 border ${msg.role === 'assistant' ? 'bg-teal-50' : 'bg-slate-200'}`}
                  >
                    <AvatarFallback className="text-[10px]">
                      {msg.role === 'assistant' ? (
                        <Sparkles size={14} className="text-teal-600" />
                      ) : (
                        <UserCheck size={14} />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex max-w-[85%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={cn(
                        'rounded-2xl p-3 text-sm whitespace-pre-wrap shadow-sm',
                        msg.role === 'user'
                          ? 'rounded-tr-none bg-teal-600 text-white'
                          : 'rounded-tl-none border bg-white text-slate-700',
                      )}
                    >
                      {msg.content}
                    </div>

                    {msg.sugerencia && !msg.sugerencia.aceptada && (
                      <div className="animate-in fade-in slide-in-from-top-1 mt-3 w-full">
                        <div className="rounded-xl border border-teal-100 bg-white p-4 shadow-md">
                          <p className="mb-2 text-[10px] font-bold text-slate-400 uppercase">
                            Propuesta: {msg.sugerencia.campoNombre}
                          </p>
                          <div className="mb-4 max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600 italic">
                            {msg.sugerencia.valorSugerido}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => onAcceptSuggestion(msg.sugerencia)}
                              className="h-8 bg-teal-600 hover:bg-teal-700"
                            >
                              <Check size={14} className="mr-1" /> Aplicar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRejectSuggestion(msg.id)}
                              className="h-8"
                            >
                              <X size={14} className="mr-1" /> Descartar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="animate-in fade-in flex flex-row items-start gap-3 duration-300">
                  <Avatar className="h-8 w-8 shrink-0 border bg-teal-50">
                    <AvatarFallback>
                      <Sparkles
                        size={14}
                        className="animate-pulse text-teal-600"
                      />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-tl-none border bg-white p-4 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* INPUT */}
        <div className="shrink-0 border-t bg-white p-4">
          <div className="relative mx-auto max-w-4xl">
            {showSuggestions && (
              <div className="animate-in slide-in-from-bottom-2 absolute bottom-full z-50 mb-2 w-72 overflow-hidden rounded-xl border bg-white shadow-2xl">
                <div className="border-b bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">
                  Campos de Asignatura
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {availableFields.map((field) => (
                    <button
                      key={field.key}
                      onClick={() => toggleField(field)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-teal-50"
                    >
                      <span className="text-slate-700">{field.label}</span>
                      {selectedFields.find((f) => f.key === field.key) && (
                        <Check size={14} className="text-teal-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 rounded-xl border bg-slate-50 p-2 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-teal-500">
              {selectedFields.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 pt-1">
                  {selectedFields.map((field) => (
                    <div
                      key={field.key}
                      className="animate-in zoom-in-95 flex items-center gap-1 rounded-md border border-teal-200 bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800"
                    >
                      {field.label}
                      <button
                        onClick={() => toggleField(field)}
                        className="ml-1 rounded-full p-0.5 hover:bg-teal-200"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    if (e.target.value.endsWith(':')) setShowSuggestions(true)
                    else if (showSuggestions && !e.target.value.includes(':'))
                      setShowSuggestions(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder='Escribe ":" para referenciar un campo...'
                  className="max-h-[120px] min-h-[40px] flex-1 resize-none border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={
                    (!input.trim() && selectedFields.length === 0) || isSending
                  }
                  size="icon"
                  className="h-9 w-9 bg-teal-600 hover:bg-teal-700"
                >
                  <Send size={16} className="text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO ACCIONES */}
      <div className="flex flex-[1] flex-col gap-4 overflow-y-auto pr-2">
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Lightbulb size={18} className="text-orange-500" /> Atajos
        </h4>
        <div className="space-y-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSend(preset.prompt)}
              className="group flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left text-sm transition-all hover:border-teal-500 hover:bg-teal-50"
            >
              <div className="rounded-lg bg-slate-100 p-2 group-hover:bg-teal-100 group-hover:text-teal-600">
                <preset.icon size={16} />
              </div>
              <span className="font-medium text-slate-700">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
