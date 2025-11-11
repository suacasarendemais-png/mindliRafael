import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Curso } from '../types';
import { SearchIcon, ChevronDownIcon, EyeIcon, PencilIcon, TrashIcon } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../components/Toaster';
import { Link } from 'react-router-dom';

const CursoForm: React.FC<{ 
    onClose: () => void; 
    onSuccess: () => void; 
    cursoToEdit?: Curso | null 
}> = ({ onClose, onSuccess, cursoToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacher, setTeacher] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (cursoToEdit) {
      setName(cursoToEdit.name);
      setDescription(cursoToEdit.description);
      setTeacher(cursoToEdit.teacher);
    }
  }, [cursoToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cursoToEdit) {
        const cursoRef = doc(db, 'cursos', cursoToEdit.id);
        await updateDoc(cursoRef, { name, description, teacher });
        addToast('Curso atualizado com sucesso!', 'success');
      } else {
        await addDoc(collection(db, 'cursos'), {
          name,
          description,
          teacher,
          created_at: serverTimestamp(),
        });
        addToast('Curso criado com sucesso!', 'success');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      addToast(`Erro ao ${cursoToEdit ? 'atualizar' : 'criar'} o curso: ` + error.message, 'error');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="curso-name" className="block text-sm font-medium text-gray-300 mb-2">Nome do Curso</label>
        <input
          id="curso-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Ex: React - Do Básico ao Avançado"
        />
      </div>
      <div>
        <label htmlFor="curso-description" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
        <textarea
          id="curso-description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Uma breve descrição sobre o conteúdo do curso..."
        />
      </div>
      <div>
        <label htmlFor="curso-teacher" className="block text-sm font-medium text-gray-300 mb-2">Professor Responsável</label>
        <input
          id="curso-teacher"
          type="text"
          required
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
          className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Ex: Dr. Alan Turing"
        />
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50" disabled={loading}>
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (cursoToEdit ? 'Salvar' : 'Criar Curso')}
        </button>
      </div>
    </form>
  )
}

const Cursos: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [cursoToEdit, setCursoToEdit] = useState<Curso | null>(null);
  const [cursoToDelete, setCursoToDelete] = useState<Curso | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cursosCollection = collection(db, 'cursos');
      const q = query(cursosCollection, orderBy('created_at', 'desc'));
      const cursosSnapshot = await getDocs(q);
      const cursosList = cursosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Curso));
      setCursos(cursosList);

    } catch (fetchError: any) {
      setError('Não foi possível carregar os cursos: ' + fetchError.message);
      console.error(fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  const handleEditClick = (curso: Curso) => {
    setCursoToEdit(curso);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (curso: Curso) => {
    setCursoToDelete(curso);
    setIsConfirmModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!cursoToDelete) return;

    try {
      // Check if any turma is linked to this course
      const turmasRef = collection(db, 'turmas');
      const q = query(turmasRef, where("courseId", "==", cursoToDelete.id));
      const turmasSnap = await getDocs(q);
      
      if (!turmasSnap.empty) {
        addToast(`Não é possível excluir. O curso está vinculado a ${turmasSnap.size} turma(s).`, 'error');
        setIsConfirmModalOpen(false);
        setCursoToDelete(null);
        return;
      }

      await deleteDoc(doc(db, 'cursos', cursoToDelete.id));
      addToast('Curso excluído com sucesso!', 'success');
      fetchCursos();
    } catch (error: any) {
      addToast('Erro ao excluir curso: ' + error.message, 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setCursoToDelete(null);
    }
  };

  const filteredCursos = useMemo(() => {
    return cursos.filter(curso => {
      const searchTermLower = searchTerm.toLowerCase();
      return curso.name.toLowerCase().includes(searchTermLower) || curso.teacher.toLowerCase().includes(searchTermLower);
    });
  }, [cursos, searchTerm]);


  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-20">
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }

    if (error) {
       return <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p>;
    }

     if (cursos.length > 0 && filteredCursos.length === 0) {
      return (
        <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <h3 className="text-xl font-semibold text-white">Nenhum curso encontrado</h3>
            <p className="text-gray-400 mt-2">Tente ajustar seus filtros de busca.</p>
        </div>
      );
    }

    if (filteredCursos.length === 0) {
      return (
        <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <h3 className="text-xl font-semibold text-white">Nenhum curso encontrado</h3>
            <p className="text-gray-400 mt-2">Comece criando o primeiro curso da sua plataforma.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCursos.map(curso => (
          <div key={curso.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20">
            <div className="p-6 flex-grow">
              <h2 className="text-xl font-bold text-white truncate mb-2">{curso.name}</h2>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{curso.description}</p>
              <div className="flex items-center text-gray-400">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    Prof. {curso.teacher}
                </span>
              </div>
            </div>
            <div className="p-4 bg-gray-900/30 border-t border-gray-700 flex justify-end items-center gap-2">
                <Link to={`/cursos/${curso.id}`} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors">
                  <EyeIcon className="w-5 h-5"/>
                </Link>
                <button onClick={() => handleEditClick(curso)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><PencilIcon className="w-5 h-5"/></button>
                <button onClick={() => handleDeleteClick(curso)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><TrashIcon className="w-5 h-5"/></button>
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Gerenciamento de Cursos</h1>
            <p className="text-gray-400 mt-1">Crie e gerencie os cursos e trilhas de aprendizado.</p>
          </div>
          <button 
            onClick={() => {
              setCursoToEdit(null);
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Novo Curso
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome do curso ou professor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="relative w-full md:w-48">
            <select className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" disabled>
              <option>Todos os Professores</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Cursos Content */}
        {renderContent()}

      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={cursoToEdit ? "Editar Curso" : "Criar Novo Curso"}
      >
        <CursoForm 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchCursos}
          cursoToEdit={cursoToEdit}
        />
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza de que deseja excluir o curso "${cursoToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
};

export default Cursos;