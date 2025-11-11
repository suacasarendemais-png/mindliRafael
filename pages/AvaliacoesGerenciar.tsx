import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Avaliacao } from '../types';
import { SearchIcon, ChevronDownIcon, EyeIcon, PencilIcon, TrashIcon, PlusIcon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import ConfirmationModal from '../components/ConfirmationModal';

const getStatusStyles = (status: string) => {
    switch (status) {
        case 'Finalizada': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'Em Andamento': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'Agendada': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'Rascunho': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        default: return '';
    }
};

const AvaliacoesGerenciar: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [avaliacaoToDelete, setAvaliacaoToDelete] = useState<Avaliacao | null>(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    const fetchAvaliacoes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'avaliacoes'), orderBy('created_at', 'desc'));
            const querySnapshot = await getDocs(q);
            const avaliacoesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Avaliacao));
            setAvaliacoes(avaliacoesData);
        } catch (err) {
            console.error("Error fetching avaliacoes:", err);
            setError("Não foi possível carregar as avaliações.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvaliacoes();
    }, [fetchAvaliacoes]);

    const handleDeleteClick = (avaliacao: Avaliacao) => {
        setAvaliacaoToDelete(avaliacao);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!avaliacaoToDelete) return;
        try {
            await deleteDoc(doc(db, 'avaliacoes', avaliacaoToDelete.id));
            addToast('Avaliação excluída com sucesso!', 'success');
            fetchAvaliacoes(); // Refresh
        } catch (error) {
            addToast("Erro ao excluir avaliação.", 'error');
            console.error("Error deleting avaliacao:", error);
        } finally {
            setConfirmOpen(false);
            setAvaliacaoToDelete(null);
        }
    };
    
    const renderContent = () => {
        if (loading) return <div className="text-center p-8">Carregando avaliações...</div>;
        if (error) return <div className="text-center p-8 text-red-400">{error}</div>;
        if (avaliacoes.length === 0) return <div className="text-center p-8 text-gray-400">Nenhuma avaliação encontrada. Crie a primeira!</div>;

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {avaliacoes.map(av => (
                    <div key={av.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col transition-all duration-300 hover:border-blue-500">
                        <div className="p-6 flex-grow">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusStyles(av.status)}`}>{av.status}</span>
                                <span className="text-sm font-medium text-gray-400">{av.tipo}</span>
                            </div>
                            <h2 className="text-xl font-bold text-white truncate mb-4">{av.titulo}</h2>
                            <div className="flex items-center gap-6 text-gray-300">
                                <div><p className="text-xs text-gray-500">Questões</p><p className="font-bold">{av.exercicioIds.length}</p></div>
                                {/* <div><p className="text-xs text-gray-500">Realizações</p><p className="font-bold">0</p></div> */}
                                <div><p className="text-xs text-gray-500">Duração</p><p className="font-bold">{av.duracao} min</p></div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-900/30 border-t border-gray-700 flex justify-end items-center gap-2">
                             <Link to={`/avaliacoes/resultados/${av.id}`} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors">
                                <EyeIcon className="w-5 h-5"/>
                             </Link>
                             <Link to={`/avaliacao/editar/${av.id}`} className="p-2 inline-block text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><PencilIcon className="w-5 h-5"/></Link>
                             <button onClick={() => handleDeleteClick(av)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <>
            <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Gerenciar Avaliações</h1>
                        <p className="text-gray-400 mt-1">Crie provas, simulados e outras atividades avaliativas.</p>
                    </div>
                    <button
                        onClick={() => navigate('/avaliacao/nova')}
                        className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5"/>
                        Nova Avaliação
                    </button>
                </div>

                <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Buscar por título..." className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div className="relative w-full md:w-48">
                        <select className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option>Todos os Tipos</option>
                            <option>Prova</option>
                            <option>Simulado</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative w-full md:w-48">
                        <select className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option>Todos os Status</option>
                            <option>Rascunho</option>
                            <option>Agendada</option>
                            <option>Em Andamento</option>
                            <option>Finalizada</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                {renderContent()}
            </div>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza de que deseja excluir a avaliação "${avaliacaoToDelete?.titulo}"?`}
            />
        </>
    );
};

export default AvaliacoesGerenciar;