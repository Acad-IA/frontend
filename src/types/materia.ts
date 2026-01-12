export type MateriaTab = 
  | 'datos-generales' 
  | 'contenido-tematico' 
  | 'bibliografia' 
  | 'ia-materia' 
  | 'documento-sep' 
  | 'historial';

export interface Materia {
  id: string;
  nombre: string;
  clave: string;
  creditos?: number;
  lineaCurricular?: string;
  ciclo?: string;
  planId: string;
  planNombre: string;
  carrera: string;
  facultad: string;
  estructuraId: string;
}

export interface CampoEstructura {
  id: string;
  nombre: string;
  tipo: 'texto' | 'texto_largo' | 'lista' | 'numero';
  obligatorio: boolean;
  descripcion?: string;
  placeholder?: string;
}

export interface MateriaStructure {
  id: string;
  nombre: string;
  campos: CampoEstructura[];
}

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

export interface BibliografiaEntry {
  id: string;
  tipo: 'BASICA' | 'COMPLEMENTARIA';
  cita: string;
  fuenteBibliotecaId?: string;
  fuenteBiblioteca?: LibraryResource;
}

export interface LibraryResource {
  id: string;
  titulo: string;
  autor: string;
  editorial?: string;
  anio?: number;
  isbn?: string;
  tipo: 'libro' | 'articulo' | 'revista' | 'recurso_digital';
  disponible: boolean;
}

export interface IAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  campoAfectado?: string;
  sugerencia?: IASugerencia;
}

export interface IASugerencia {
  campoId: string;
  campoNombre: string;
  valorActual: string;
  valorSugerido: string;
  aceptada?: boolean;
}

export interface CambioMateria {
  id: string;
  tipo: 'datos' | 'contenido' | 'bibliografia' | 'ia' | 'documento';
  descripcion: string;
  usuario: string;
  fecha: Date;
  detalles?: Record<string, any>;
}

export interface DocumentoMateria {
  id: string;
  materiaId: string;
  version: number;
  fechaGeneracion: Date;
  url?: string;
  estado: 'generando' | 'listo' | 'error';
}

export interface MateriaDetailState {
  materia: Materia | null;
  estructura: MateriaStructure | null;
  datosGenerales: Record<string, any>;
  contenidoTematico: UnidadTematica[];
  bibliografia: BibliografiaEntry[];
  iaMessages: IAMessage[];
  documentoSep: DocumentoMateria | null;
  historial: CambioMateria[];
  activeTab: MateriaTab;
  isSaving: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}
