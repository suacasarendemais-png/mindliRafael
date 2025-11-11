import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Turma, TurmaComContagemDeAlunos } from '../types';
import { SearchIcon, ChevronDownIcon, UsersIcon, EyeIcon, PencilIcon, TrashIcon } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../components/Toaster';
import { Link } from 'react-router-dom';

const TurmaForm: React.FC<{ 
  onClose: () => void; 
  onSuccess: () => void;
  turmaToEdit?: Turma | null;
}> = ({ onClose, onSuccess, turmaToEdit }) => {
  const [name, setName] = useState('');
  const [serie, setSerie] = useState('1º Ano EM');
  const [turno, setTurno] = useState('Manhã');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (turmaToEdit) {
      setName(turmaToEdit.name);
      setSerie(turmaToEdit.serie);
      setTurno(turmaToEdit.turno);
    }
  }, [turmaToEdit]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (turmaToEdit) {
        // Update existing turma
        const turmaRef = doc(db, 'turmas', turmaToEdit.id);
        await updateDoc(turmaRef, { name, serie, turno });
        addToast('Turma atualizada com sucesso!', 'success');
      } else {
        // Create new turma
        await addDoc(collection(db, 'turmas'), {
          name,
          serie,
          turno,
          created_at: serverTimestamp(),
          studentIds: [],
        });
        addToast('Turma criada com sucesso!', 'success');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      addToast(`Erro ao ${turmaToEdit ? 'atualizar' : 'criar'} a turma: ` + error.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="turma-name" className="block text-sm font-medium text-gray-300 mb-2">
          Nome da Turma
        </label>
        <input
          id="turma-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Ex: Desenvolvimento Web Avançado"
        />
      </div>
       <div>
        <label htmlFor="turma-serie" className="block text-sm font-medium text-gray-300 mb-2">
          Série / Ano
        </label>
        <select 
          id="turma-serie"
          required
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
          className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option>1º Ano EM</option>
          <option>2º Ano EM</option>
          <option>3º Ano EM</option>
          <option>Curso Livre</option>
        </select>
      </div>
      <div>
        <label htmlFor="turma-turno" className="block text-sm font-medium text-gray-300 mb-2">
          Turno
        </label>
        <select 
          id="turma-turno"
          required
          value={turno}
          onChange={(e) => setTurno(e.target.value)}
          className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option>Manhã</option>
          <option>Tarde</option>
          <option>Noite</option>
        </select>
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
          ) : (turmaToEdit ? 'Salvar' : 'Criar Turma')}
        </button>
      </div>
    </form>
  )
}

const Turmas: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [turmaToEdit, setTurmaToEdit] = useState<Turma | null>(null);
  const [turmaToDelete, setTurmaToDelete] = useState<Turma | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [turmas, setTurmas] = useState<TurmaComContagemDeAlunos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSerie, setFilterSerie] = useState('Todas as Séries');
  const [filterTurno, setFilterTurno] = useState('Todos os Turnos');
  const { addToast } = useToast();

  const fetchTurmas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const turmasCollection = collection(db, 'turmas');
      const q = query(turmasCollection, orderBy('created_at', 'desc'));
      const turmasSnapshot = await getDocs(q);
      const turmasList = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turma));

      const turmasComAlunos = turmasList.map(t => ({ 
        ...t, 
        students: t.studentIds ? t.studentIds.length : 0 
      }));
      setTurmas(turmasComAlunos);

    } catch (fetchError: any) {
      setError('Não foi possível carregar as turmas: ' + fetchError.message);
      console.error(fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurmas();
  }, [fetchTurmas]);

  const handleEditClick = (turma: Turma) => {
    setTurmaToEdit(turma);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (turma: Turma) => {
    setTurmaToDelete(turma);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!turmaToDelete) return;
    try {
      await deleteDoc(doc(db, 'turmas', turmaToDelete.id));
      addToast('Turma excluída com sucesso!', 'success');
      fetchTurmas();
    } catch (error: any) {
      addToast('Erro ao excluir turma: ' + error.message, 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setTurmaToDelete(null);
    }
  };

  const filteredTurmas = useMemo(() => {
    return turmas.filter(turma => {
      const matchesSearch = turma.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSerie = filterSerie === 'Todas as Séries' || turma.serie === filterSerie;
      const matchesTurno = filterTurno === 'Todos os Turnos' || turma.turno === filterTurno;
      return matchesSearch && matchesSerie && matchesTurno;
    });
  }, [turmas, searchTerm, filterSerie, filterTurno]);


  const getTurnoColor = (turno: string) => {
    switch (turno.toLowerCase()) {
      case 'manhã': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'tarde': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'noite': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSerieColor = (serie: string) => {
     if (serie.includes('EM')) return 'bg-green-500/20 text-green-400 border-green-500/30';
     if (serie.includes('Livre')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
     return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }

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

    if (turmas.length > 0 && filteredTurmas.length === 0) {
      return (
        <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <h3 className="text-xl font-semibold text-white">Nenhuma turma encontrada</h3>
            <p className="text-gray-400 mt-2">Tente ajustar seus filtros de busca.</p>
        </div>
      );
    }

    if (filteredTurmas.length === 0) {
      return (
        <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <h3 className="text-xl font-semibold text-white">Nenhuma turma encontrada</h3>
            <p className="text-gray-400 mt-2">Comece criando a primeira turma da sua escola.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTurmas.map(turma => (
          <div key={turma.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20">
            <div className="p-6 flex-grow">
              <h2 className="text-xl font-bold text-white truncate mb-3">{turma.name}</h2>
              <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getSerieColor(turma.serie)}`}>{turma.serie}</span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getTurnoColor(turma.turno)}`}>{turma.turno}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <UsersIcon className="w-5 h-5 mr-2" />
                <span>{turma.students} Alunos</span>
              </div>
            </div>
            <div className="p-4 bg-gray-900/30 border-t border-gray-700 flex justify-end items-center gap-2">
                <Link to={`/turmas/${turma.id}`} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><EyeIcon className="w-5 h-5"/></Link>
                <button onClick={() => handleEditClick(turma)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><PencilIcon className="w-5 h-5"/></button>
                <button onClick={() => handleDeleteClick(turma)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><TrashIcon className="w-5 h-5"/></button>
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
            <h1 className="text-3xl font-bold text-white">Gerenciamento de Turmas</h1>
            <p className="text-gray-400 mt-1">Visualize, crie e gerencie as turmas da sua escola.</p>
          </div>
          <button 
            onClick={() => {
              setTurmaToEdit(null);
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Nova Turma
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome da turma..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="relative w-full md:w-48">
            <select
              value={filterSerie}
              onChange={e => setFilterSerie(e.target.value)}
              className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option>Todas as Séries</option>
              <option>1º Ano EM</option>
              <option>2º Ano EM</option>
              <option>3º Ano EM</option>
              <option>Curso Livre</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative w-full md:w-48">
            <select 
              value={filterTurno}
              onChange={e => setFilterTurno(e.target.value)}
              className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option>Todos os Turnos</option>
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Turmas Content */}
        {renderContent()}

      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={turmaToEdit ? "Editar Turma" : "Criar Nova Turma"}
      >
        <TurmaForm 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchTurmas}
          turmaToEdit={turmaToEdit}
        />
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza de que deseja excluir a turma "${turmaToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
};

export default Turmas;