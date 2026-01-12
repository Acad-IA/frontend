import { useState } from 'react';
import { Plus, GripVertical, ChevronDown, ChevronRight, Edit3, Trash2, Clock, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
//import { toast } from 'sonner';



export interface Tema {
  id: string;
  nombre: string;
  descripcion?: string;
  horasEstimadas?: number;
}

export interface UnidadTematica {
  id: string;
  nombre: string;
  numero: number;
  temas: Tema[];
}

const initialData: UnidadTematica[] = [
  {
    id: 'u1',
    numero: 1,
    nombre: 'Fundamentos de Inteligencia Artificial',
    temas: [
      { id: 't1', nombre: 'Tipos de IA y aplicaciones', horasEstimadas: 6 },
      { id: 't2', nombre: 'Ética en IA', horasEstimadas: 3 },
    ]
  }
];

export function ContenidoTematico() {
  const [unidades, setUnidades] = useState<UnidadTematica[]>(initialData);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(['u1']));
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'unidad' | 'tema'; id: string; parentId?: string } | null>(null);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editingTema, setEditingTema] = useState<{ unitId: string; temaId: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Lógica de Unidades ---
  const toggleUnit = (id: string) => {
    const newExpanded = new Set(expandedUnits);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedUnits(newExpanded);
  };

  const addUnidad = () => {
    const newId = `u-${Date.now()}`;
    const newUnidad: UnidadTematica = {
      id: newId,
      nombre: 'Nueva Unidad',
      numero: unidades.length + 1,
      temas: [],
    };
    setUnidades([...unidades, newUnidad]);
    setExpandedUnits(new Set([...expandedUnits, newId]));
    setEditingUnit(newId);
  };

  const updateUnidadNombre = (id: string, nombre: string) => {
    setUnidades(unidades.map(u => u.id === id ? { ...u, nombre } : u));
  };

  // --- Lógica de Temas ---
  const addTema = (unidadId: string) => {
    setUnidades(unidades.map(u => {
      if (u.id === unidadId) {
        const newTemaId = `t-${Date.now()}`;
        const newTema: Tema = { id: newTemaId, nombre: 'Nuevo tema', horasEstimadas: 2 };
        setEditingTema({ unitId: unidadId, temaId: newTemaId });
        return { ...u, temas: [...u.temas, newTema] };
      }
      return u;
    }));
  };

  const updateTema = (unidadId: string, temaId: string, updates: Partial<Tema>) => {
    setUnidades(unidades.map(u => {
      if (u.id === unidadId) {
        return { ...u, temas: u.temas.map(t => t.id === temaId ? { ...t, ...updates } : t) };
      }
      return u;
    }));
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === 'unidad') {
      setUnidades(unidades.filter(u => u.id !== deleteDialog.id).map((u, i) => ({ ...u, numero: i + 1 })));
    } else if (deleteDialog.parentId) {
      setUnidades(unidades.map(u => u.id === deleteDialog.parentId ? { ...u, temas: u.temas.filter(t => t.id !== deleteDialog.id) } : u));
    }
    setDeleteDialog(null);
    //toast.success("Eliminado correctamente");
  };

  const totalHoras = unidades.reduce((acc, u) => acc + u.temas.reduce((sum, t) => sum + (t.horasEstimadas || 0), 0), 0);

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Contenido Temático</h2>
          <p className="text-sm text-slate-500 mt-1">
            {unidades.length} unidades • {totalHoras} horas estimadas totales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addUnidad} className="gap-2">
            <Plus className="w-4 h-4" /> Nueva unidad
          </Button>
          <Button onClick={() => { setIsSaving(true); setTimeout(() => { setIsSaving(false); /*toast.success("Guardado")*/; }, 1000); }} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {unidades.map((unidad) => (
          <Card key={unidad.id} className="overflow-hidden border-slate-200 shadow-sm">
            <Collapsible open={expandedUnits.has(unidad.id)} onOpenChange={() => toggleUnit(unidad.id)}>
              <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      {expandedUnits.has(unidad.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <Badge className="bg-blue-600 font-mono">Unidad {unidad.numero}</Badge>
                  
                  {editingUnit === unidad.id ? (
                    <Input 
                      value={unidad.nombre} 
                      onChange={(e) => updateUnidadNombre(unidad.id, e.target.value)}
                      onBlur={() => setEditingUnit(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingUnit(null)}
                      className="max-w-md h-8 bg-white" 
                      autoFocus 
                    />
                  ) : (
                    <CardTitle className="text-base font-semibold cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setEditingUnit(unidad.id)}>
                      {unidad.nombre}
                    </CardTitle>
                  )}
                  
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {unidad.temas.reduce((sum, t) => sum + (t.horasEstimadas || 0), 0)}h
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => setDeleteDialog({ type: 'unidad', id: unidad.id })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-4 bg-white">
                  <div className="space-y-1 ml-10 border-l-2 border-slate-50 pl-4">
                    {unidad.temas.map((tema, idx) => (
                      <TemaRow 
                        key={tema.id} 
                        tema={tema} 
                        index={idx + 1} 
                        isEditing={editingTema?.unitId === unidad.id && editingTema?.temaId === tema.id}
                        onEdit={() => setEditingTema({ unitId: unidad.id, temaId: tema.id })}
                        onStopEditing={() => setEditingTema(null)}
                        onUpdate={(updates) => updateTema(unidad.id, tema.id, updates)}
                        onDelete={() => setDeleteDialog({ type: 'tema', id: tema.id, parentId: unidad.id })}
                      />
                    ))}
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full justify-start mt-2" onClick={() => addTema(unidad.id)}>
                      <Plus className="w-3 h-3 mr-2" /> Añadir subtema
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      <DeleteConfirmDialog dialog={deleteDialog} setDialog={setDeleteDialog} onConfirm={handleDelete} />
    </div>
  );
}

// --- Componentes Auxiliares ---
interface TemaRowProps {
  tema: Tema;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onStopEditing: () => void;
  onUpdate: (updates: Partial<Tema>) => void;
  onDelete: () => void;
}

function TemaRow({ tema, index, isEditing, onEdit, onStopEditing, onUpdate, onDelete }: TemaRowProps) {
  return (
    <div className={cn("flex items-center gap-3 p-2 rounded-md group transition-all", isEditing ? "bg-blue-50 ring-1 ring-blue-100" : "hover:bg-slate-50")}>
      <span className="text-xs font-mono text-slate-400 w-4">{index}.</span>
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-left-2">
          <Input value={tema.nombre} onChange={(e) => onUpdate({ nombre: e.target.value })} className="h-8 flex-1 bg-white" placeholder="Nombre" autoFocus />
          <Input type="number" value={tema.horasEstimadas} onChange={(e) => onUpdate({ horasEstimadas: parseInt(e.target.value) || 0 })} className="h-8 w-16 bg-white" />
          <Button size="sm" className="bg-emerald-600 h-8" onClick={onStopEditing}>Listo</Button>
        </div>
      ) : (
        <>
          <div className="flex-1 cursor-pointer" onClick={onEdit}>
            <p className="text-sm font-medium text-slate-700">{tema.nombre}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] opacity-60">{tema.horasEstimadas}h</Badge>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={onEdit}><Edit3 className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={onDelete}><Trash2 className="w-3 h-3" /></Button>
          </div>
        </>
      )}
    </div>
  );
}

interface DeleteDialogState {
  type: 'unidad' | 'tema';
  id: string;
  parentId?: string;
}

interface DeleteConfirmDialogProps {
  dialog: DeleteDialogState | null;
  setDialog: (value: DeleteDialogState | null) => void;
  onConfirm: () => void;
}


function DeleteConfirmDialog({
  dialog,
  setDialog,
  onConfirm,
}: DeleteConfirmDialogProps) {

  return (
    <AlertDialog open={!!dialog} onOpenChange={() => setDialog(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de borrar un {dialog?.type}. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}