import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { RevisaoDetalhada, Exercicio } from '../types';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '../components/Icons';

const RevisaoAvaliacao: React.FC = () => {
    const { resultadoId } = useParams<{ resultadoId: string }>();
    const navigate = useNavigate();
    const [reviewData, setReviewData] = useState<RevisaoDetalhada | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!resultadoId) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Resultado
            const resultadoRef = doc(db, 'resultadosAvaliacoes', resultadoId);
            const resultadoSnap = await getDoc(resultadoRef);
            if (!resultadoSnap.exists()) throw new Error("Resultado não encontrado.");
            const resultado = { id: resultadoSnap.id, ...resultadoSnap.data() } as RevisaoDetalhada['resultado'];

            // 2. Fetch Avaliacao
            const avaliacaoRef = doc(db, 'avaliacoes', resultado.avaliacaoId);
            const avaliacaoSnap = await getDoc(avaliacaoRef);
            if (!avaliacaoSnap.exists()) throw new Error("Avaliação correspondente não encontrada.");
            const avaliacao = { id: avaliacaoSnap.id, ...avaliacaoSnap.data() } as RevisaoDetalhada['avaliacao'];

            // 3. Fetch Exercicios
            const exerciciosRef = collection(db, 'exercicios');
            const exerciciosQuery = query(exerciciosRef, where(documentId(), 'in', avaliacao.exercicioIds));
            const exerciciosSnap = await getDocs(exerciciosQuery);
            const exerciciosMap = new Map(exerciciosSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Exercicio]));
            const exercicios = avaliacao.exercicioIds.map(id => exerciciosMap.get(id)).filter(Boolean) as Exercicio[];

            // 4. Fetch Aluno
            const alunoRef = doc(db, 'users', resultado.alunoId);
            const alunoSnap = await getDoc(alunoRef);
            if (!alunoSnap.exists()) throw new Error("Perfil do aluno não encontrado.");
            const aluno = { id: alunoSnap.id, ...alunoSnap.data() } as RevisaoDetalhada['aluno'];

            setReviewData({ resultado, avaliacao, exercicios, aluno });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [resultadoId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getAnswerStyle = (exercicio: Exercicio, altIndex: number) => {
        const studentAnswer = reviewData?.resultado.respostas.find(r => r.exercicioId === exercicio.id)?.respostaSelecionada;
        const correctIndex = exercicio.alternativas?.findIndex(a => a.correta);

        if (altIndex === correctIndex) {
            return 'bg-green-500/20 border-green-500/50'; // Correct answer is always green
        }
        if (altIndex === studentAnswer && altIndex !== correctIndex) {
            return 'bg-red-500/20 border-red-500/50'; // Student's wrong answer is red
        }
        return 'bg-gray-700/50 border-gray-700';
    };

    if (loading) {
        return <div className="text-center p-8">Carregando revisão...</div>;
    }

    if (error || !reviewData) {
        return <div className="text-center p-8 text-red-400">{error || "Não foi possível carregar os dados."}</div>;
    }
    
    const { resultado, avaliacao, exercicios, aluno } = reviewData;

    return (
        <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                <ArrowLeftIcon className="w-5 h-5" />
                Voltar
            </button>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 mb-8">
                <h1 className="text-3xl font-bold text-white">{avaliacao.titulo}</h1>
                <p className="text-gray-400 mt-1">Revisão detalhada da avaliação de <span className="font-semibold text-white">{aluno.name}</span></p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Nota Final:</span>
                        <span className="font-bold text-cyan-400">{resultado.pontuacaoFinal} / {resultado.pontuacaoTotal}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="text-gray-400">Data:</span>
                        <span className="font-semibold text-white">{resultado.dataFim.toDate().toLocaleString('pt-BR')}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {exercicios.map((ex, index) => {
                     const studentAnswer = resultado.respostas.find(r => r.exercicioId === ex.id);
                     const correctIndex = ex.alternativas?.findIndex(a => a.correta);
                     const isCorrect = studentAnswer?.respostaSelecionada === correctIndex;

                    return (
                        <div key={ex.id} className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Questão {index + 1}</h2>
                                    <p className="text-gray-300 mt-2 whitespace-pre-wrap">{ex.enunciado}</p>
                                </div>
                                {isCorrect ? 
                                    <span className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full bg-green-500/20 text-green-400"><CheckCircleIcon className="w-5 h-5"/> Correto</span> :
                                    <span className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full bg-red-500/20 text-red-400"><XCircleIcon className="w-5 h-5"/> Incorreto</span>
                                }
                             </div>
                            
                             <div className="space-y-3 my-6">
                                {ex.alternativas?.map((alt, altIndex) => (
                                    <div key={altIndex} className={`p-3 rounded-lg border-2 ${getAnswerStyle(ex, altIndex)}`}>
                                        <span className="font-semibold mr-2">{String.fromCharCode(65 + altIndex)})</span>
                                        {alt.texto}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <h3 className="flex items-center gap-2 font-semibold text-blue-400 mb-2"><InformationCircleIcon className="w-5 h-5"/> Resolução</h3>
                                <p className="text-gray-300 bg-gray-900/50 p-4 rounded-lg whitespace-pre-wrap">{ex.resolucao || "Nenhuma resolução fornecida."}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    );
};

export default RevisaoAvaliacao;