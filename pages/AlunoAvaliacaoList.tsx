import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Avaliacao, ResultadoAvaliacao } from '../types';
import { ClipboardDocumentListIcon, CheckCircleIcon } from '../components/Icons';

const AlunoAvaliacaoList: React.FC = () => {
    const { userProfile } = useAuth();
    const [pending, setPending] = useState<Avaliacao[]>([]);
    const [completed, setCompleted] = useState<ResultadoAvaliacao[]>([]);
    const [allAssigned, setAllAssigned] = useState<Avaliacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!userProfile) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Find student's turmas
            const turmasRef = collection(db, 'turmas');
            const turmasQuery = query(turmasRef, where('studentIds', 'array-contains', userProfile.id));
            const turmasSnap = await getDocs(turmasQuery);
            const studentTurmaIds = turmasSnap.docs.map(doc => doc.id);

            if (studentTurmaIds.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Fetch all assigned assessments
            const avaliacoesRef = collection(db, 'avaliacoes');
            const avaliacoesQuery = query(avaliacoesRef, where('turmaIds', 'array-contains-any', studentTurmaIds));
            const avaliacoesSnap = await getDocs(avaliacoesQuery);
            const assignedList = avaliacoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Avaliacao));
            setAllAssigned(assignedList);

            // 3. Fetch student's results
            const resultadosRef = collection(db, 'resultadosAvaliacoes');
            const resultadosQuery = query(resultadosRef, where('alunoId', '==', userProfile.id));
            const resultadosSnap = await getDocs(resultadosQuery);
            const completedList = resultadosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResultadoAvaliacao));
            setCompleted(completedList);
            const completedIds = completedList.map(c => c.avaliacaoId);
            
            // 4. Determine pending assessments
            const pendingList = assignedList.filter(av => !completedIds.includes(av.id));
            setPending(pendingList);

        } catch (err) {
            console.error("Error fetching student assessments: ", err);
            setError("Não foi possível carregar suas avaliações.");
        } finally {
            setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getCompletedResult = (avaliacaoId: string) => {
        return completed.find(c => c.avaliacaoId === avaliacaoId);
    }
    
    if (loading) {
        return <div className="text-center p-8">Carregando avaliações...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400">{error}</div>;
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Minhas Avaliações</h1>
                <p className="text-gray-400 mt-1">Acompanhe suas atividades pendentes e seus resultados.</p>
            </div>

            <div className="space-y-8">
                {/* Pending Assessments */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Pendentes</h2>
                    {pending.length === 0 ? (
                        <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-500" />
                            <h3 className="mt-4 text-xl font-semibold text-white">Nenhuma avaliação pendente!</h3>
                            <p className="text-gray-400 mt-2">Você está em dia. Bom trabalho!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pending.map(av => (
                                <div key={av.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col">
                                    <div className="p-6 flex-grow">
                                        <p className="text-sm font-medium text-gray-400">{av.tipo} de {av.disciplina}</p>
                                        <h3 className="text-xl font-bold text-white truncate my-2">{av.titulo}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-300">
                                            <span>{av.exercicioIds.length} Questões</span>
                                            <span>{av.duracao} min</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-900/30 border-t border-gray-700 flex justify-end">
                                        <Link to={`/avaliacoes/realizar/${av.id}`} className="px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                                            Realizar Agora
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Assessments */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Concluídas</h2>
                     {completed.length === 0 ? (
                        <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-500" />
                            <h3 className="mt-4 text-xl font-semibold text-white">Nenhuma avaliação concluída</h3>
                            <p className="text-gray-400 mt-2">Seus resultados aparecerão aqui assim que você finalizar uma avaliação.</p>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th className="p-4 font-semibold text-sm text-gray-300">Avaliação</th>
                                        <th className="p-4 font-semibold text-sm text-gray-300">Data de Conclusão</th>
                                        <th className="p-4 font-semibold text-sm text-gray-300">Resultado</th>
                                        <th className="p-4 font-semibold text-sm text-gray-300">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {allAssigned.filter(av => completed.some(c => c.avaliacaoId === av.id)).map(av => {
                                        const result = getCompletedResult(av.id);
                                        if (!result) return null;
                                        return (
                                            <tr key={av.id}>
                                                <td className="p-4 text-white font-medium">{av.titulo}</td>
                                                <td className="p-4 text-gray-400">{result.dataFim.toDate().toLocaleDateString('pt-BR')}</td>
                                                <td className="p-4">
                                                    <span className="font-bold text-lg text-cyan-400">{result.pontuacaoFinal}</span>
                                                    <span className="text-gray-400"> / {result.pontuacaoTotal}</span>
                                                </td>
                                                <td className="p-4">
                                                    <Link to={`/avaliacoes/revisao/${result.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                                                      Ver Detalhes
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlunoAvaliacaoList;