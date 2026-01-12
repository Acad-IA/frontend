import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Check, X, RefreshCw, Lightbulb, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { IAMessage, IASugerencia, CampoEstructura } from '@/types/materia';
import { cn } from '@/lib/utils';
//import { toast } from 'sonner';

interface IAMateriaTabProps {
  campos: CampoEstructura[];
  datosGenerales: Record<string, any>;
  messages: IAMessage[];
  onSendMessage: (message: string, campoId?: string) => void;
  onAcceptSuggestion: (sugerencia: IASugerencia) => void;
  onRejectSuggestion: (messageId: string) => void;
}

const quickActions = [
  { id: 'mejorar-objetivos', label: 'Mejorar objetivos', icon: Wand2, prompt: 'Mejora el :objetivo_general para que sea más específico y medible' },
  { id: 'generar-contenido', label: 'Generar contenido temático', icon: Lightbulb, prompt: 'Sugiere un contenido temático completo basado en los objetivos y competencias' },
  { id: 'alinear-perfil', label: 'Alinear con perfil de egreso', icon: RefreshCw, prompt: 'Revisa las :competencias y alinéalas con el perfil de egreso del plan' },
  { id: 'ajustar-biblio', label: 'Recomendar bibliografía', icon: Sparkles, prompt: 'Recomienda bibliografía actualizada basándote en el contenido temático' },
];

export function IAMateriaTab({ campos, datosGenerales, messages, onSendMessage, onAcceptSuggestion, onRejectSuggestion }: IAMateriaTabProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [fieldSelectorPosition, setFieldSelectorPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setInput(value);
    setCursorPosition(pos);

    // Check for : character to trigger field selector
    const lastChar = value.charAt(pos - 1);
    if (lastChar === ':') {
      const rect = textareaRef.current?.getBoundingClientRect();
      if (rect) {
        setFieldSelectorPosition({ top: rect.bottom + 8, left: rect.left });
        setShowFieldSelector(true);
      }
    } else if (showFieldSelector && (lastChar === ' ' || !value.includes(':'))) {
      setShowFieldSelector(false);
    }
  };

  const insertFieldMention = (campoId: string) => {
    const beforeCursor = input.slice(0, cursorPosition);
    const afterCursor = input.slice(cursorPosition);
    const lastColonIndex = beforeCursor.lastIndexOf(':');
    const newInput = beforeCursor.slice(0, lastColonIndex) + `:${campoId}` + afterCursor;
    setInput(newInput);
    setShowFieldSelector(false);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Extract field mention if any
    const fieldMatch = input.match(/:(\w+)/);
    const campoId = fieldMatch ? fieldMatch[1] : undefined;

    setIsLoading(true);
    onSendMessage(input, campoId);
    setInput('');

    // Simulate AI response delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const renderMessageContent = (content: string) => {
    // Render field mentions as styled badges
    return content.split(/(:[\w_]+)/g).map((part, i) => {
      if (part.startsWith(':')) {
        const campo = campos.find(c => c.id === part.slice(1));
        return (
          <span key={i} className="field-mention mx-0.5">
            {campo?.nombre || part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            IA de la materia
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Usa <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">:</kbd> para mencionar campos específicos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <Card className="lg:col-span-2 card-elevated flex flex-col h-[600px]">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversación
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Inicia una conversación para mejorar tu materia con IA
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}>
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-accent" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] rounded-lg px-4 py-3",
                        message.role === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">
                          {renderMessageContent(message.content)}
                        </p>
                        {message.sugerencia && !message.sugerencia.aceptada && (
                          <div className="mt-3 p-3 bg-background/80 rounded-md border">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Sugerencia para: {message.sugerencia.campoNombre}
                            </p>
                            <div className="text-sm text-foreground bg-accent/10 p-2 rounded mb-3 max-h-32 overflow-y-auto">
                              {message.sugerencia.valorSugerido}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => onAcceptSuggestion(message.sugerencia!)}
                                className="bg-success hover:bg-success/90 text-success-foreground"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Aplicar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onRejectSuggestion(message.id)}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        )}
                        {message.sugerencia?.aceptada && (
                          <Badge className="mt-2 badge-library">
                            <Check className="w-3 h-3 mr-1" />
                            Sugerencia aplicada
                          </Badge>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-accent animate-pulse" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-4 border-t">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Escribe tu mensaje... Usa : para mencionar campos"
                  className="min-h-[80px] pr-12 resize-none"
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute bottom-3 right-3 h-8 w-8 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Field selector popover */}
              {showFieldSelector && (
                <div className="absolute z-50 mt-1 w-64 bg-popover border rounded-lg shadow-lg">
                  <Command>
                    <CommandInput placeholder="Buscar campo..." />
                    <CommandList>
                      <CommandEmpty>No se encontró el campo</CommandEmpty>
                      <CommandGroup heading="Campos disponibles">
                        {campos.map((campo) => (
                          <CommandItem
                            key={campo.id}
                            value={campo.id}
                            onSelect={() => insertFieldMention(campo.id)}
                            className="cursor-pointer"
                          >
                            <span className="font-mono text-xs text-accent mr-2">
                              :{campo.id}
                            </span>
                            <span>{campo.nombre}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar with quick actions and fields */}
        <div className="space-y-4">
          {/* Quick actions */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <Icon className="w-4 h-4 mr-2 text-accent flex-shrink-0" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Available fields */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Campos de la materia</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {campos.map((campo) => {
                    const hasValue = !!datosGenerales[campo.id];
                    return (
                      <div 
                        key={campo.id}
                        className={cn(
                          "p-2 rounded-md border cursor-pointer transition-colors hover:bg-muted/50",
                          hasValue ? "border-success/30" : "border-warning/30"
                        )}
                        onClick={() => {
                          setInput(prev => prev + `:${campo.id} `);
                          textareaRef.current?.focus();
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-accent">:{campo.id}</span>
                          {hasValue ? (
                            <Badge variant="outline" className="text-xs text-success border-success/30">
                              Completo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-warning border-warning/30">
                              Vacío
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground mt-1">{campo.nombre}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
