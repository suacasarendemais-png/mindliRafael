import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { Curso, Turma, Avaliacao } from '../../types';
import { BookOpenIcon, AwardIcon, ClipboardDocumentListIcon } from '../../components/Icons';
import { Link } from 'react-router-dom';

const LoadingSkeleton = () => (
    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
    </div>
);

const DashboardAluno: React.FC = () => {
    const { userProfile } = useAuth();
    const [myCourses, setMyCourses] = useState<Curso[]>([]);
    const [myAvaliacoes, setMyAvaliacoes] = useState<Avaliacao[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userProfile) return;

        const fetchStudentData = async () => {
            setLoadingCourses(true);
            setLoadingAvaliacoes(true);
            setError(null);
            try {
                // 1. Find which turmas the student is in
                const turmasRef = collection(db, 'turmas');
                const turmasQuery = query(turmasRef, where('studentIds', 'array-contains', userProfile.id));
                const turmasSnap = await getDocs(turmasQuery);
                const studentTurmas = turmasSnap.docs.map(doc => doc.data() as Turma);
                const studentTurmaIds = turmasSnap.docs.map(doc => doc.id);


                // 2. Fetch Courses
                const courseIds = studentTurmas.map(t => t.courseId).filter(Boolean) as string[];
                if (courseIds.length > 0) {
                    const coursesRef = collection(db, 'cursos');
                    const coursesQuery = query(coursesRef, where(documentId(), 'in', courseIds));
                    const coursesSnap = await getDocs(coursesQuery);
                    setMyCourses(coursesSnap.docs.map(doc => ({id: doc.id, ...doc.data() } as Curso)));
                } else {
                    setMyCourses([]);
                }
                setLoadingCourses(false);

                // 3. Fetch Avaliacoes
                if (studentTurmaIds.length > 0) {
                    const avaliacoesRef = collection(db, 'avaliacoes');
                    const avaliacoesQuery = query(avaliacoesRef, where('turmaIds', 'array-contains-any', studentTurmaIds));
                    const avaliacoesSnap = await getDocs(avaliacoesQuery);
                    // TODO: Filter out already completed assessments
                    setMyAvaliacoes(avaliacoesSnap.docs.map(doc => ({id: doc.id, ...doc.data()} as Avaliacao)));
                } else {
                    setMyAvaliacoes([]);
                }
                setLoadingAvaliacoes(false);
                
            } catch (err) {
                console.error("Error fetching student data:", err);
                setError("Não foi possível carregar seus dados.");
                setLoadingCourses(false);
                setLoadingAvaliacoes(false);
            }
        };

        fetchStudentData();

    }, [userProfile]);

    const gamificationStats = [
        { name: 'Pontos Totais', stat: '1.250', icon: AwardIcon },
        { name: 'Badges Conquistados', stat: '8', icon: AwardIcon },
        { name: 'Dias Seguidos', stat: '12', icon: AwardIcon },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">
                Olá, {userProfile?.name?.split(' ')[0] || 'Aluno'}!
            </h1>
            <p className="text-gray-400 mb-8">Bem-vindo(a) de volta. Pronto para aprender?</p>

            {error && <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg mb-6">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {gamificationStats.map((item) => (
                    <div key={item.name} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 flex items-center">
                        <div className="flex-shrink-0 bg-yellow-500/20 text-yellow-400 rounded-lg p-3">
                            <item.icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-400 truncate">{item.name}</dt>
                                <dd className="text-3xl font-bold text-white">{item.stat}</dd>
                            </dl>
                        </div>
                    </div>
                ))}
            </div>

             <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Próximas Atividades</h2>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
                    {loadingAvaliacoes ? <div className="p-4 text-center text-gray-400">Carregando atividades...</div> :
                     myAvaliacoes.length === 0 ? (
                        <div className="p-10 text-center">
                            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-500" />
                            <h3 className="mt-4 text-xl font-semibold text-white">Nenhuma atividade pendente</h3>
                            <p className="text-gray-400 mt-2">Você está em dia com todas as suas avaliações!</p>
                        </div>
                     ) : (
                        <ul className="divide-y divide-gray-700">
                            {myAvaliacoes.map(av => (
                                <li key={av.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
                                    <div>
                                        <p className="text-gray-300">{av.tipo} de {av.disciplina}</p>
                                        <p className="font-semibold text-white">{av.titulo}</p>
                                    </div>
                                    <Link to={`/avaliacoes/realizar/${av.id}`} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                                        Iniciar
                                    </Link>
                                </li>
                            ))}
                        </ul>
                     )
                    }
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Meus Cursos</h2>
                {loadingCourses && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <LoadingSkeleton />
                        <LoadingSkeleton />
                    </div>
                )}
                {!loadingCourses && myCourses.length === 0 ? (
                     <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="mt-4 text-xl font-semibold text-white">Você não está em nenhum curso</h3>
                        <p className="text-gray-400 mt-2">Peça ao administrador para te matricular em uma turma.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {myCourses.map(curso => (
                             <div key={curso.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20">
                                <div className="p-6 flex-grow">
                                <h2 className="text-xl font-bold text-white truncate mb-2">{curso.name}</h2>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{curso.description}</p>
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                    Prof. {curso.teacher}
                                </span>
                                </div>
                                <div className="p-4 bg-gray-900/30 border-t border-gray-700 flex justify-end items-center">
                                    <button className="px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                                        Continuar Aprendendo
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardAluno;
