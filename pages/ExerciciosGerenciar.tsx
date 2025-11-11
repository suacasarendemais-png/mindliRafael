import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Exercicio } from '../types';
import { SearchIcon, ChevronDownIcon, EyeIcon, PencilIcon, TrashIcon, PlusIcon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import ConfirmationModal from '../components/ConfirmationModal';


const ExerciciosGerenciar: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [exercicios, setExercicios] = useState<Exercicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exercicioToDelete, setExercicioToDelete] = useState<Exercicio | null>(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    const fetchExercicios = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'exercicios'), orderBy('created_at', 'desc'));
            const querySnapshot = await getDocs(q);
            const exerciciosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercicio));
            setExercicios(exerciciosList);
        } catch (err: any) {
            setError("Não foi possível carregar os exercícios.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExercicios();
    }, [fetchExercicios]);

    const handleDeleteClick = (exercicio: Exercicio) => {
        setExercicioToDelete(exercicio);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!exercicioToDelete) return;
        try {
            await deleteDoc(doc(db, 'exercicios', exercicioToDelete.id));
            addToast('Exercício excluído com sucesso!', 'success');
            fetchExercicios();
        } catch (error: any) {
            addToast('Erro ao excluir exercício: ' + error.message, 'error');
        } finally {
            setConfirmOpen(false);
            setExercicioToDelete(null);
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-8">Carregando exercícios...</div>;
        }
        if (error) {
            return <div className="text-center p-8 text-red-400">{error}</div>;
        }
        if (exercicios.length === 0) {
            return <div className="text-center p-8 text-gray-400">Nenhum exercício encontrado. Crie o primeiro!</div>;
        }
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-x-auto">
                <table className="w-full text-left min-w-full">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Enunciado</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Disciplina</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Dificuldade</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {exercicios.map(ex => (
                            <tr key={ex.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 text-white font-medium max-w-md truncate">{ex.enunciado}</td>
                                <td className="p-4 text-gray-400">{ex.disciplina}</td>
                                <td className="p-4"><span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{ex.dificuldade}</span></td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${ex.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-gray-300">{ex.status}</span>
                                    </div>
                                </td>
                                <td className="p-4 whitespace-nowrap text-right space-x-2">
                                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><EyeIcon className="w-5 h-5"/></button>
                                    <Link to={`/exercicio/editar/${ex.id}`} className="p-2 inline-block text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><PencilIcon className="w-5 h-5"/></Link>
                                    <button onClick={() => handleDeleteClick(ex)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <>
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gerenciar Exercícios</h1>
                    <p className="text-gray-400 mt-1">Crie, edite e organize o banco de questões da plataforma.</p>
                </div>
                <button 
                    onClick={() => navigate('/exercicio/novo')}
                    className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                >
                    <PlusIcon className="w-5 h-5"/>
                    Novo Exercício
                </button>
            </div>

            <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col md:flex-row items-center gap-4">
                 <div className="relative w-full md:flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Buscar por enunciado..." className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="relative w-full md:w-48">
                    <select className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option>Todas as Disciplinas</option>
                        <option>Matemática</option>
                        <option>História</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative w-full md:w-48">
                    <select className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option>Todos os Status</option>
                        <option>Ativo</option>
                        <option>Inativo</option>
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
            message={`Tem certeza de que deseja excluir o exercício? Esta ação não pode ser desfeita.`}
        />
        </>
    );
};

export default ExerciciosGerenciar;