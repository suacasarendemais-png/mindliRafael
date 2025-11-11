import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { Avaliacao, ResultadoComAluno, ResultadoAvaliacao, Usuario } from '../types';
import { ArrowLeftIcon, CheckCircleIcon, UsersIcon, TrophyIcon } from '../components/Icons';

const LoadingSkeleton = () => (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-gray-700 rounded w-1/2"></div>
    </div>
);

const AvaliacaoResultados: React.FC = () => {
    const { avaliacaoId } = useParams<{ avaliacaoId: string }>();
    const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
    const [resultados, setResultados] = useState<ResultadoComAluno[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!avaliacaoId) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Avaliação details
            const avaliacaoRef = doc(db, 'avaliacoes', avaliacaoId);
            const avaliacaoSnap = await getDoc(avaliacaoRef);
            if (!avaliacaoSnap.exists()) throw new Error("Avaliação não encontrada.");
            setAvaliacao({ id: avaliacaoSnap.id, ...avaliacaoSnap.data() } as Avaliacao);

            // 2. Fetch all results for this assessment
            const resultadosRef = collection(db, 'resultadosAvaliacoes');
            const q = query(resultadosRef, where('avaliacaoId', '==', avaliacaoId));
            const resultadosSnap = await getDocs(q);
            const resultadosList = resultadosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResultadoAvaliacao));

            if (resultadosList.length === 0) {
                setResultados([]);
                setLoading(false);
                return;
            }

            // 3. Fetch user data for each result
            const alunoIds = [...new Set(resultadosList.map(r => r.alunoId))];
            const usersRef = collection(db, 'users');
            const usersQuery = query(usersRef, where(documentId(), 'in', alunoIds));
            const usersSnap = await getDocs(usersQuery);
            const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Usuario]));

            // 4. Combine results with user data
            const combinedResultados: ResultadoComAluno[] = resultadosList.map(res => ({
                ...res,
                aluno: usersMap.get(res.alunoId) || { id: res.alunoId, name: 'Aluno Desconhecido', email: '', role: 'Aluno' }
            })).sort((a, b) => b.pontuacaoFinal - a.pontuacaoFinal); // Sort by score descending

            setResultados(combinedResultados);

        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [avaliacaoId]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        if (resultados.length === 0) {
            return {
                completions: 0,
                average: 0,
                highest: 0,
                lowest: 0,
            };
        }
        const scores = resultados.map(r => r.pontuacaoFinal);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        return {
            completions: resultados.length,
            average: parseFloat((totalScore / resultados.length).toFixed(1)),
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
        };
    }, [resultados]);
    
    if (loading) {
        return (
            <div>
                <div className="h-8 bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-700 rounded w-1/2 mb-8 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                </div>
                 <div className="h-96 bg-gray-800/50 rounded-xl border border-gray-700 animate-pulse"></div>
            </div>
        )
    }

    if (error) {
        return <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p>;
    }

    return (
        <div>
            <Link to="/avaliacoes/gerenciar" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                <ArrowLeftIcon className="w-5 h-5" />
                Voltar para Avaliações
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">{avaliacao?.titulo}</h1>
                <p className="text-gray-400 mt-1">Resultados e estatísticas de desempenho.</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700"><CheckCircleIcon className="w-6 h-6 text-green-400 mb-3" /><p className="text-sm text-gray-400">Concluíram</p><p className="text-3xl font-bold text-white">{stats.completions}</p></div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700"><UsersIcon className="w-6 h-6 text-blue-400 mb-3" /><p className="text-sm text-gray-400">Média Geral</p><p className="text-3xl font-bold text-white">{stats.average} <span className="text-lg font-normal">/ {resultados[0]?.pontuacaoTotal || '-'}</span></p></div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700"><TrophyIcon className="w-6 h-6 text-yellow-400 mb-3" /><p className="text-sm text-gray-400">Maior Nota</p><p className="text-3xl font-bold text-white">{stats.highest}</p></div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700"><TrophyIcon className="w-6 h-6 text-red-400 mb-3" /><p className="text-sm text-gray-400">Menor Nota</p><p className="text-3xl font-bold text-white">{stats.lowest}</p></div>
            </div>

            {/* Results Table */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Resultados por Aluno</h2>
                 {resultados.length === 0 ? (
                    <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                        <h3 className="text-xl font-semibold text-white">Nenhum resultado ainda</h3>
                        <p className="text-gray-400 mt-2">Os resultados aparecerão aqui assim que os alunos concluírem a avaliação.</p>
                    </div>
                 ) : (
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="p-4 font-semibold text-sm text-gray-300">Aluno</th>
                                    <th className="p-4 font-semibold text-sm text-gray-300">Data de Conclusão</th>
                                    <th className="p-4 font-semibold text-sm text-gray-300">Pontuação</th>
                                    <th className="p-4 font-semibold text-sm text-gray-300">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {resultados.map(res => (
                                    <tr key={res.id}>
                                        <td className="p-4 text-white font-medium">{res.aluno.name}</td>
                                        <td className="p-4 text-gray-400">{res.dataFim.toDate().toLocaleString('pt-BR')}</td>
                                        <td className="p-4">
                                            <span className="font-bold text-lg text-cyan-400">{res.pontuacaoFinal}</span>
                                            <span className="text-gray-400"> / {res.pontuacaoTotal}</span>
                                        </td>
                                        <td className="p-4">
                                            <Link to={`/avaliacoes/revisao/${res.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                                                Ver Respostas
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvaliacaoResultados;