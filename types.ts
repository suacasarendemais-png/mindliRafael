export interface Turma {
  id: string; // Changed from number to string for Firestore document ID
  created_at: any; // Firestore timestamp is an object, 'any' for simplicity
  name: string;
  serie: string;
  turno: string;
  studentIds?: string[];
  courseId?: string;
}

export type TurmaComContagemDeAlunos = Turma & { students: number; courseName?: string; };

export interface Usuario {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  role: 'Admin' | 'Professor' | 'Aluno';
}

export interface Curso {
  id: string;
  name: string;
  description: string;
  teacher: string;
  created_at: any;
}

export interface Modulo {
  id: string;
  name: string;
  description: string;
  order: number;
  created_at: any;
}

export interface Licao {
  id: string;
  name: string;
  type: 'video' | 'texto';
  content: string; // URL for video, markdown for text
  order: number;
  created_at: any;
}

// NOVOS TIPOS PARA CONTEÚDO PEDAGÓGICO
export interface Alternativa {
  texto: string;
  correta: boolean;
}

export interface Exercicio {
  id: string;
  disciplina: string;
  serie: string;
  dificuldade: 'Fácil' | 'Médio' | 'Difícil';
  pontuacao: number;
  tipo: 'multipla-escolha' | 'verdadeiro-falso' | 'dissertativa';
  enunciado: string;
  alternativas?: Alternativa[];
  resolucao: string;
  status: 'Ativo' | 'Inativo';
  created_at: any;
  authorId: string; // ID do professor que criou
}

export interface Avaliacao {
  id: string;
  titulo: string;
  tipo: 'Prova' | 'Simulado' | 'Quiz' | 'Diagnóstica';
  disciplina: string;
  status: 'Rascunho' | 'Agendada' | 'Em Andamento' | 'Finalizada';
  exercicioIds: string[]; // Array de IDs dos exercícios
  dataInicio?: any;
  dataFim?: any;
  duracao: number; // em minutos
  turmaIds: string[]; // A quais turmas se aplica
  created_at: any;
  authorId: string;
}


// NOVOS TIPOS PARA A REALIZAÇÃO DE AVALIAÇÕES PELO ALUNO
export interface Resposta {
  exercicioId: string;
  respostaSelecionada: number | string; // index da alternativa ou texto para dissertativa
}

export interface ResultadoAvaliacao {
  id: string;
  alunoId: string;
  avaliacaoId: string;
  turmaId: string; // A turma através da qual a avaliação foi atribuída
  respostas: Resposta[];
  pontuacaoFinal: number;
  pontuacaoTotal: number;
  dataInicio: any; // Firestore timestamp
  dataFim: any; // Firestore timestamp
  status: 'Concluído';
}

// TIPO COMBINADO PARA A PÁGINA DE RESULTADOS
export type ResultadoComAluno = ResultadoAvaliacao & {
  aluno: Usuario;
};

// TIPO COMBINADO PARA A PÁGINA DE REVISÃO DETALHADA
export interface RevisaoDetalhada {
  resultado: ResultadoAvaliacao;
  avaliacao: Avaliacao;
  exercicios: Exercicio[];
  aluno: Usuario;
}

// NOVO TIPO PARA BIBLIOTECA
export interface MaterialBiblioteca {
  id: string;
  name: string;
  type: string; // PDF, DOC, Vídeo, etc.
  discipline: string;
  size: number; // in bytes
  uploaderName: string;
  uploaderId: string;
  downloadURL: string;
  storagePath: string;
  created_at: any;
}