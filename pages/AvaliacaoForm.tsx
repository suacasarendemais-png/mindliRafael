import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, query, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import { Avaliacao, Exercicio } from '../types';
import { ArrowLeftIcon, SearchIcon, PlusIcon, TrashIcon } from '../components/Icons';

const STEPS = [
  { id: 1, name: 'Informações' },
  { id: 2, name: 'Exercícios' },
  { id: 3, name: 'Configurações' },
];

const AvaliacaoForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [availableExercises, setAvailableExercises] = useState<Exercicio[]>([]);
    const [selectedExercises, setSelectedExercises] = useState<Exercicio[]>([]);

    const [formData, setFormData] = useState<Partial<Avaliacao>>({
        titulo: '',
        tipo: 'Prova',
        disciplina: 'Matemática',
        status: 'Rascunho',
        duracao: 90,
        turmaIds: [],
    });

    const isEditMode = !!id;

    useEffect(() => {
        const fetchAllExercises = async () => {
            try {
                const q = query(collection(db, 'exercicios'));
                const snapshot = await getDocs(q);
                const exercisesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercicio));
                setAvailableExercises(exercisesList);
            } catch (error) {
                addToast('Erro ao carregar banco de exercícios.', 'error');
            }
        };

        const fetchAvaliacao = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'avaliacoes', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as Avaliacao;
                    setFormData(data);
                    // Hydrate selected exercises
                    const selected = availableExercises.filter(ex => data.exercicioIds.includes(ex.id));
                    setSelectedExercises(selected);
                }
            } catch (error) {
                addToast('Erro ao carregar avaliação.', 'error');
            }
        };

        const initialize = async () => {
            setIsFetching(true);
            await fetchAllExercises();
            if (isEditMode) {
                await fetchAvaliacao();
            }
            setIsFetching(false);
        };
        
        initialize();
    }, [id, isEditMode, addToast]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddExercise = (exercise: Exercicio) => {
        if (!selectedExercises.some(e => e.id === exercise.id)) {
            setSelectedExercises([...selectedExercises, exercise]);
        }
    };
    
    const handleRemoveExercise = (exerciseId: string) => {
        setSelectedExercises(selectedExercises.filter(e => e.id !== exerciseId));
    };
    
    const handleSave = async () => {
        if (!userProfile) return addToast('Você precisa estar logado.', 'error');
        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                authorId: userProfile.id,
                exercicioIds: selectedExercises.map(e => e.id),
                duracao: Number(formData.duracao),
            };

            if (isEditMode) {
                const docRef = doc(db, 'avaliacoes', id);
                await updateDoc(docRef, dataToSave);
                addToast('Avaliação atualizada com sucesso!', 'success');
            } else {
                await addDoc(collection(db, 'avaliacoes'), {
                    ...dataToSave,
                    created_at: serverTimestamp(),
                });
                addToast('Avaliação criada com sucesso!', 'success');
            }
            navigate('/avaliacoes/gerenciar');
        } catch (error: any) {
            addToast(`Erro ao salvar: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    if (isFetching) return <div>Carregando...</div>

    const renderStepContent = () => {
        switch (step) {
            case 1: // Informações
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Título da Avaliação</label>
                            <input name="titulo" value={formData.titulo} onChange={handleChange} type="text" placeholder="Ex: Prova Mensal de Matemática" className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                                <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white"><option>Prova</option><option>Simulado</option><option>Quiz</option><option>Diagnóstica</option></select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Disciplina</label>
                                <select name="disciplina" value={formData.disciplina} onChange={handleChange} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white"><option>Matemática</option><option>História</option></select>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Exercícios
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Search & Available Exercises */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Banco de Exercícios</h3>
                             <div className="mb-4 p-3 bg-gray-900/50 rounded-lg flex items-center gap-2">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="Buscar..." className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-9 pr-3 py-1.5 text-sm" />
                                </div>
                                <select className="w-32 appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-3 py-1.5 text-sm"><option>Dificuldade</option></select>
                            </div>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {availableExercises.map(ex => (
                                    <div key={ex.id} className="p-3 bg-gray-700/50 rounded-lg flex justify-between items-center">
                                        <p className="text-sm truncate pr-2">{ex.enunciado}</p>
                                        <button onClick={() => handleAddExercise(ex)} className="p-1.5 text-gray-300 hover:text-white bg-blue-600 hover:bg-blue-500 rounded-full"><PlusIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Right: Selected Exercises */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Exercícios Selecionados ({selectedExercises.length})</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 border border-gray-700 rounded-lg p-3 bg-gray-900/50">
                                {selectedExercises.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">Adicione exercícios do banco.</p> 
                                : selectedExercises.map((ex, index) => (
                                     <div key={ex.id} className="p-3 bg-gray-700/50 rounded-lg flex justify-between items-center">
                                        <div className="text-sm truncate pr-2"><span className="font-bold">{index + 1}.</span> {ex.enunciado}</div>
                                        <button onClick={() => handleRemoveExercise(ex.id)} className="p-1.5 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3: // Configurações
                return (
                    <div className="space-y-6 max-w-lg mx-auto">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Data de Início</label>
                                <input name="dataInicio" type="date" className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Data de Fim</label>
                                <input name="dataFim" type="date" className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Duração (em minutos)</label>
                            <input name="duracao" value={formData.duracao} onChange={handleChange} type="number" placeholder="90" className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Aplicar para Turmas</label>
                             <select className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white"><option>1º Ano A</option><option>1º Ano B</option></select>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div>
            <Link to="/avaliacoes/gerenciar" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                <ArrowLeftIcon className="w-5 h-5" />
                Voltar para Gerenciamento
            </Link>

            <h1 className="text-3xl font-bold text-white mb-2">{isEditMode ? 'Editar Avaliação' : 'Nova Avaliação'}</h1>
            <p className="text-gray-400 mb-8">Siga as etapas para criar ou editar uma avaliação.</p>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8">
                {/* Stepper */}
                <div className="mb-8">
                     <ol className="flex items-center w-full max-w-md mx-auto">
                        {STEPS.map((s, index) => (
                            <li key={s.id} className={`flex w-full items-center ${index < STEPS.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block" : ''} ${s.id < step ? 'text-blue-500 after:border-blue-500' : 'text-gray-500 after:border-gray-700'}`}>
                                <span className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${s.id <= step ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>{s.id}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Form Content */}
                <div className="min-h-[350px]">
                    {renderStepContent()}
                </div>

                {/* Navigation */}
                 <div className="flex justify-between items-center pt-8 border-t border-gray-700">
                    <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">Anterior</button>
                    {step < STEPS.length ? (
                        <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">Próximo</button>
                    ) : (
                         <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors min-w-[170px]">
                            {loading ? 'Salvando...' : 'Salvar Avaliação'}
                         </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvaliacaoForm;