import { useState } from 'react';
import { Plus, Search, BookOpen, Trash2, Library, Edit3, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
//import { toast } from 'sonner';
//import { mockLibraryResources } from '@/data/mockMateriaData';

export const mockLibraryResources = [
  {
    id: 'lib-1',
    titulo: 'Deep Learning',
    autor: 'Goodfellow, I., Bengio, Y., & Courville, A.',
    editorial: 'MIT Press',
    anio: 2016,
    isbn: '9780262035613',
    disponible: true
  },
  {
    id: 'lib-2',
    titulo: 'Artificial Intelligence: A Modern Approach',
    autor: 'Russell, S., & Norvig, P.',
    editorial: 'Pearson',
    anio: 2020,
    isbn: '9780134610993',
    disponible: true
  },
  {
    id: 'lib-3',
    titulo: 'Hands-On Machine Learning',
    autor: 'Aurélien Géron',
    editorial: 'O\'Reilly Media',
    anio: 2019,
    isbn: '9781492032649',
    disponible: false
  }
];

// --- Interfaces ---
export interface BibliografiaEntry {
  id: string;
  tipo: 'BASICA' | 'COMPLEMENTARIA';
  cita: string;
  fuenteBibliotecaId?: string;
  fuenteBiblioteca?: any;
}

interface BibliografiaTabProps {
  bibliografia: BibliografiaEntry[];
  onSave: (bibliografia: BibliografiaEntry[]) => void;
  isSaving: boolean;
}

export function BibliographyItem({ bibliografia, onSave, isSaving }: BibliografiaTabProps) {
  const [entries, setEntries] = useState<BibliografiaEntry[]>(bibliografia);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntryType, setNewEntryType] = useState<'BASICA' | 'COMPLEMENTARIA'>('BASICA');

  const basicaEntries = entries.filter(e => e.tipo === 'BASICA');
  const complementariaEntries = entries.filter(e => e.tipo === 'COMPLEMENTARIA');

  const handleAddManual = (cita: string) => {
    const newEntry: BibliografiaEntry = { id: `manual-${Date.now()}`, tipo: newEntryType, cita };
    setEntries([...entries, newEntry]);
    setIsAddDialogOpen(false);
    //toast.success('Referencia manual añadida');
  };

  const handleAddFromLibrary = (resource: any, tipo: 'BASICA' | 'COMPLEMENTARIA') => {
    const cita = `${resource.autor} (${resource.anio}). ${resource.titulo}. ${resource.editorial}.`;
    const newEntry: BibliografiaEntry = {
      id: `lib-ref-${Date.now()}`,
      tipo,
      cita,
      fuenteBibliotecaId: resource.id,
      fuenteBiblioteca: resource,
    };
    setEntries([...entries, newEntry]);
    setIsLibraryDialogOpen(false);
    //toast.success('Añadido desde biblioteca');
  };

  const handleUpdateCita = (id: string, cita: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, cita } : e));
  };

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bibliografía</h2>
          <p className="text-sm text-slate-500 mt-1">
            {basicaEntries.length} básica • {complementariaEntries.length} complementaria
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isLibraryDialogOpen} onOpenChange={setIsLibraryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Library className="w-4 h-4 mr-2" /> Buscar en biblioteca
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <LibrarySearchDialog onSelect={handleAddFromLibrary} existingIds={entries.map(e => e.fuenteBibliotecaId || '')} />
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Añadir manual</Button>
            </DialogTrigger>
            <DialogContent>
              <AddManualDialog tipo={newEntryType} onTypeChange={setNewEntryType} onAdd={handleAddManual} />
            </DialogContent>
          </Dialog>

          <Button onClick={() => onSave(entries)} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        {/* BASICA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-blue-600 rounded-full" />
            <h3 className="font-semibold text-slate-800">Bibliografía Básica</h3>
          </div>
          <div className="grid gap-3">
            {basicaEntries.map(entry => (
              <BibliografiaCard 
                key={entry.id} 
                entry={entry} 
                isEditing={editingId === entry.id}
                onEdit={() => setEditingId(entry.id)}
                onStopEditing={() => setEditingId(null)}
                onUpdateCita={handleUpdateCita}
                onDelete={() => setDeleteId(entry.id)}
              />
            ))}
          </div>
        </section>

        {/* COMPLEMENTARIA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-slate-400 rounded-full" />
            <h3 className="font-semibold text-slate-800">Bibliografía Complementaria</h3>
          </div>
          <div className="grid gap-3">
            {complementariaEntries.map(entry => (
              <BibliografiaCard 
                key={entry.id} 
                entry={entry} 
                isEditing={editingId === entry.id}
                onEdit={() => setEditingId(entry.id)}
                onStopEditing={() => setEditingId(null)}
                onUpdateCita={handleUpdateCita}
                onDelete={() => setDeleteId(entry.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar referencia?</AlertDialogTitle>
            <AlertDialogDescription>La referencia será quitada del plan de estudios.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setEntries(entries.filter(e => e.id !== deleteId)); setDeleteId(null); }} className="bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Subcomponentes ---

function BibliografiaCard({ entry, isEditing, onEdit, onStopEditing, onUpdateCita, onDelete }: any) {
  const [localCita, setLocalCita] = useState(entry.cita);

  return (
    <Card className={cn("group transition-all hover:shadow-md", isEditing && "ring-2 ring-blue-500")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <BookOpen className={cn("w-5 h-5 mt-1", entry.tipo === 'BASICA' ? "text-blue-600" : "text-slate-400")} />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea value={localCita} onChange={(e) => setLocalCita(e.target.value)} className="min-h-[80px]" />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={onStopEditing}>Cancelar</Button>
                  <Button size="sm" className="bg-emerald-600" onClick={() => { onUpdateCita(entry.id, localCita); onStopEditing(); }}>Guardar</Button>
                </div>
              </div>
            ) : (
              <div onClick={onEdit} className="cursor-pointer">
                <p className="text-sm leading-relaxed text-slate-700">{entry.cita}</p>
                {entry.fuenteBiblioteca && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">Biblioteca</Badge>
                    {entry.fuenteBiblioteca.disponible && <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">Disponible</Badge>}
                  </div>
                )}
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={onEdit}><Edit3 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddManualDialog({ tipo, onTypeChange, onAdd }: any) {
  const [cita, setCita] = useState('');
  return (
    <div className="space-y-4 py-4">
      <DialogHeader><DialogTitle>Referencia Manual</DialogTitle></DialogHeader>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-slate-500">Tipo</label>
        <Select value={tipo} onValueChange={onTypeChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="BASICA">Básica</SelectItem>
            <SelectItem value="COMPLEMENTARIA">Complementaria</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-slate-500">Cita APA</label>
        <Textarea value={cita} onChange={(e) => setCita(e.target.value)} placeholder="Autor, A. (Año). Título..." className="min-h-[120px]" />
      </div>
      <Button onClick={() => onAdd(cita)} disabled={!cita.trim()} className="w-full bg-blue-600">Añadir a la lista</Button>
    </div>
  );
}

function LibrarySearchDialog({ onSelect, existingIds }: any) {
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState<'BASICA' | 'COMPLEMENTARIA'>('BASICA');
  const filtered = mockLibraryResources.filter(r => 
    !existingIds.includes(r.id) && r.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 py-2">
      <DialogHeader><DialogTitle>Catálogo de Biblioteca</DialogTitle></DialogHeader>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o autor..." className="pl-10" />
        </div>
        <Select value={tipo} onValueChange={(v:any) => setTipo(v)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="BASICA">Básica</SelectItem><SelectItem value="COMPLEMENTARIA">Complem.</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
        {filtered.map(res => (
          <div key={res.id} onClick={() => onSelect(res, tipo)} className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer flex justify-between items-center group">
            <div>
              <p className="text-sm font-semibold text-slate-700">{res.titulo}</p>
              <p className="text-xs text-slate-500">{res.autor}</p>
            </div>
            <Plus className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
}