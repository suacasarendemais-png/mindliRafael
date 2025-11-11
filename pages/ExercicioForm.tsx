import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import { Exercicio, Alternativa } from '../types';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, CheckIcon } from '../components/Icons';

const STEPS = [
  { id: 1, name: 'Informações' },
  { id: 2, name: 'Enunciado' },
  { id: 3, name: 'Alternativas' },
  { id: 4, name: 'Resolução' },
];

const ExercicioForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [formData, setFormData] = useState({
        disciplina: 'Matemática',
        serie: '1º Ano EM',
        dificuldade: 'Fácil' as Exercicio['dificuldade'],
        pontuacao: 10,
        tipo: 'multipla-escolha' as Exercicio['tipo'],
        enunciado: '',
        alternativas: [
            { texto: '', correta: true },
            { texto: '', correta: false },
            { texto: '', correta: false },
        ] as Alternativa[],
        resolucao: '',
        status: 'Ativo' as Exercicio['status'],
    });

    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
            const fetchExercicio = async () => {
                setIsFetching(true);
                try {
                    const docRef = doc(db, 'exercicios', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as Exercicio;
                        setFormData({
                            disciplina: data.disciplina,
                            serie: data.serie,
                            dificuldade: data.dificuldade,
                            pontuacao: data.pontuacao,
                            tipo: data.tipo,
                            enunciado: data.enunciado,
                            alternativas: data.alternativas || [],
                            resolucao: data.resolucao,
                            status: data.status,
                        });
                    } else {
                        addToast('Exercício não encontrado.', 'error');
                        navigate('/exercicios/gerenciar');
                    }
                } catch (error) {
                    addToast('Erro ao carregar exercício.', 'error');
                } finally {
                    setIsFetching(false);
                }
            };
            fetchExercicio();
        } else {
            setIsFetching(false);
        }
    }, [id, isEditMode, navigate, addToast]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAlternative = () => {
        if (formData.alternativas.length < 6) {
            setFormData(prev => ({ ...prev, alternativas: [...prev.alternativas, { texto: '', correta: false }] }));
        }
    };

    const handleRemoveAlternative = (index: number) => {
        if (formData.alternativas.length > 2) {
            setFormData(prev => ({ ...prev, alternativas: prev.alternativas.filter((_, i) => i !== index) }));
        }
    };

    const handleAlternativeChange = (index: number, text: string) => {
        const newAlternatives = [...formData.alternativas];
        newAlternatives[index].texto = text;
        setFormData(prev => ({ ...prev, alternativas: newAlternatives }));
    };

    const handleCorrectChange = (index: number) => {
        const newAlternatives = formData.alternativas.map((alt, i) => ({
            ...alt,
            correta: i === index,
        }));
        setFormData(prev => ({ ...prev, alternativas: newAlternatives }));
    };

    const handleSave = async () => {
        if (!userProfile) {
            addToast('Você precisa estar logado para salvar.', 'error');
            return;
        }
        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                authorId: userProfile.id,
                pontuacao: Number(formData.pontuacao),
            };

            if (isEditMode) {
                const docRef = doc(db, 'exercicios', id);
                await updateDoc(docRef, dataToSave);
                addToast('Exercício atualizado com sucesso!', 'success');
            } else {
                await addDoc(collection(db, 'exercicios'), {
                    ...dataToSave,
                    created_at: serverTimestamp(),
                });
                addToast('Exercício criado com sucesso!', 'success');
            }
            navigate('/exercicios/gerenciar');
        } catch (error: any) {
            addToast(`Erro ao salvar: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isFetching) {
        return <div>Carregando...</div>
    }


    const renderStepContent = () => {
        switch (step) {
            case 1: // Informações
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Disciplina</label>
                            <select name="disciplina" value={formData.disciplina} onChange={handleChange} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"><option>Matemática</option><option>História</option></select>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Série/Ano</label>
                                <select name="serie" value={formData.serie} onChange={handleChange} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"><option>1º Ano EM</option><option>2º Ano EM</option></select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Dificuldade</label>
                                <select name="dificuldade" value={formData.dificuldade} onChange={handleChange} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"><option>Fácil</option><option>Médio</option><option>Difícil</option></select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Pontuação</label>
                            <input name="pontuacao" type="number" value={formData.pontuacao} onChange={handleChange} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                    </div>
                );
            case 2: // Enunciado
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Questão</label>
                            <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="multipla-escolha">Múltipla Escolha</option>
                                <option value="verdadeiro-falso">Verdadeiro ou Falso</option>
                                <option value="dissertativa">Dissertativa</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Enunciado</label>
                            <textarea name="enunciado" value={formData.enunciado} onChange={handleChange} rows={5} placeholder="Digite a pergunta aqui..." className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white"></textarea>
                        </div>
                    </div>
                );
            case 3: // Alternativas
                 if (formData.tipo === 'multipla-escolha') {
                    return (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Defina as alternativas e marque a correta.</label>
                            {formData.alternativas.map((alt, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <button onClick={() => handleCorrectChange(index)} className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${alt.correta ? 'bg-green-500 border-green-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                                        {alt.correta && <CheckIcon className="w-5 h-5 text-white" />}
                                    </button>
                                    <input type="text" value={alt.texto} onChange={e => handleAlternativeChange(index, e.target.value)} placeholder={`Alternativa ${index + 1}`} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                                    <button onClick={() => handleRemoveAlternative(index)} disabled={formData.alternativas.length <= 2} className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            ))}
                            <button onClick={handleAddAlternative} disabled={formData.alternativas.length >= 6} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <PlusCircleIcon className="w-5 h-5"/> Adicionar Alternativa
                            </button>
                        </div>
                    );
                }
                return <p className="text-gray-400">Não é necessário adicionar alternativas para este tipo de questão.</p>;
            case 4: // Resolução
                 return (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Explicação da Resposta</label>
                        <textarea name="resolucao" value={formData.resolucao} onChange={handleChange} rows={8} placeholder="Descreva a resolução detalhada do exercício..." className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white"></textarea>
                    </div>
                );
        }
    };
    
    return (
        <div>
            <Link to="/exercicios/gerenciar" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                <ArrowLeftIcon className="w-5 h-5" />
                Voltar para Gerenciamento
            </Link>

            <h1 className="text-3xl font-bold text-white mb-2">{isEditMode ? 'Editar Exercício' : 'Novo Exercício'}</h1>
            <p className="text-gray-400 mb-8">Siga as etapas para criar ou editar uma questão.</p>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8">
                {/* Stepper */}
                <div className="mb-8">
                    <ol className="flex items-center w-full">
                        {STEPS.map((s, index) => (
                            <li key={s.id} className={`flex w-full items-center ${index < STEPS.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block" : ''} ${s.id < step ? 'text-blue-500 after:border-blue-500' : 'text-gray-500 after:border-gray-700'}`}>
                                <span className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${s.id <= step ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>{s.id}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Form Content */}
                <div className="min-h-[300px]">
                    {renderStepContent()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-8 border-t border-gray-700">
                    <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">Anterior</button>
                    {step < STEPS.length ? (
                        <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">Próximo</button>
                    ) : (
                         <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors min-w-[160px]">
                            {loading ? 'Salvando...' : 'Salvar Exercício'}
                         </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExercicioForm;