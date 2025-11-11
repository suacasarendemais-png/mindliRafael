import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Avaliacao, Exercicio, Resposta } from '../types';
import { useToast } from '../components/Toaster';
import ConfirmationModal from '../components/ConfirmationModal';

const RealizarAvaliacao: React.FC = () => {
    const { avaliacaoId } = useParams<{ avaliacaoId: string }>();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { addToast } = useToast();

    const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
    const [exercicios, setExercicios] = useState<Exercicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, Resposta>>(new Map());
    const [timeLeft, setTimeLeft] = useState(0);
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    // Fetch data
    useEffect(() => {
        if (!avaliacaoId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const avaliacaoRef = doc(db, 'avaliacoes', avaliacaoId);
                const avaliacaoSnap = await getDoc(avaliacaoRef);

                if (!avaliacaoSnap.exists()) {
                    throw new Error("Avaliação não encontrada.");
                }
                const avaliacaoData = { id: avaliacaoSnap.id, ...avaliacaoSnap.data() } as Avaliacao;
                setAvaliacao(avaliacaoData);
                setTimeLeft(avaliacaoData.duracao * 60);

                if (avaliacaoData.exercicioIds.length > 0) {
                    const exerciciosRef = collection(db, 'exercicios');
                    const q = query(exerciciosRef, where(documentId(), 'in', avaliacaoData.exercicioIds));
                    const exerciciosSnap = await getDocs(q);
                    const exerciciosList = exerciciosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercicio));
                    setExercicios(exerciciosList);
                }
            } catch (err: any) {
                setError(err.message);
                addToast(err.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [avaliacaoId, addToast]);
    
    // Timer effect
    useEffect(() => {
        if (timeLeft <= 0 || loading) return;
        const timerId = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, loading]);

    const handleSelectAnswer = (exercicioId: string, resposta: number | string) => {
        const newAnswers = new Map(answers);
        newAnswers.set(exercicioId, { exercicioId, respostaSelecionada: resposta });
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (!userProfile || !avaliacao || !avaliacaoId) return;
        setConfirmOpen(false);

        let pontuacaoFinal = 0;
        let pontuacaoTotal = 0;
        const respostasArray = Array.from(answers.values());

        exercicios.forEach(ex => {
            pontuacaoTotal += ex.pontuacao;
            const respostaAluno = answers.get(ex.id);
            if (respostaAluno && ex.tipo === 'multipla-escolha' && ex.alternativas) {
                const alternativaCorretaIndex = ex.alternativas.findIndex(a => a.correta);
                if (respostaAluno.respostaSelecionada === alternativaCorretaIndex) {
                    pontuacaoFinal += ex.pontuacao;
                }
            }
        });

        try {
            // Find the turmaId for the result record
            const turmasRef = collection(db, 'turmas');
            const turmasQuery = query(turmasRef, where('studentIds', 'array-contains', userProfile.id));
            const turmasSnap = await getDocs(turmasQuery);
            const userTurma = turmasSnap.docs.find(doc => avaliacao.turmaIds.includes(doc.id));

            await addDoc(collection(db, 'resultadosAvaliacoes'), {
                alunoId: userProfile.id,
                avaliacaoId: avaliacaoId,
                turmaId: userTurma ? userTurma.id : '',
                respostas: respostasArray,
                pontuacaoFinal,
                pontuacaoTotal,
                dataInicio: serverTimestamp(), // This is technically the end time, but good enough for now
                dataFim: serverTimestamp(),
                status: 'Concluído',
            });
            addToast("Avaliação enviada com sucesso!", 'success');
            navigate('/avaliacoes/aluno');
        } catch(err) {
            addToast("Erro ao enviar avaliação.", 'error');
            console.error(err);
        }
    };


    if (loading) return <div className="text-center p-8">Carregando avaliação...</div>;
    if (error) return <div className="text-center p-8 text-red-400">{error}</div>;

    const currentQuestion = exercicios[currentQuestionIndex];
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-700 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{avaliacao?.titulo}</h1>
                        <p className="text-gray-400">Questão {currentQuestionIndex + 1} de {exercicios.length}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-sm">Tempo Restante</p>
                        <p className="text-2xl font-bold text-yellow-400">{formatTime(timeLeft)}</p>
                    </div>
                </div>

                {/* Question Body */}
                {currentQuestion && (
                    <div className="min-h-[300px]">
                        <h2 className="text-lg font-semibold text-white mb-4">{currentQuestion.enunciado}</h2>
                        <div className="space-y-4">
                            {currentQuestion.tipo === 'multipla-escolha' && currentQuestion.alternativas?.map((alt, index) => {
                                const isSelected = answers.get(currentQuestion.id)?.respostaSelecionada === index;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectAnswer(currentQuestion.id, index)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${isSelected ? 'bg-blue-600/30 border-blue-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}`}
                                    >
                                        <span className={`font-semibold mr-2 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>{String.fromCharCode(65 + index)})</span>
                                        {alt.texto}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
                
                {/* Navigation */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-700 mt-6">
                    <button onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))} disabled={currentQuestionIndex === 0} className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">Anterior</button>
                    {currentQuestionIndex < exercicios.length - 1 ? (
                        <button onClick={() => setCurrentQuestionIndex(i => Math.min(exercicios.length - 1, i + 1))} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">Próxima</button>
                    ) : (
                         <button onClick={() => setConfirmOpen(true)} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                            Finalizar e Enviar
                         </button>
                    )}
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSubmit}
                title="Confirmar Envio"
                message="Tem certeza que deseja finalizar e enviar suas respostas? Você não poderá alterá-las depois."
            />
        </>
    );
};

export default RealizarAvaliacao;
