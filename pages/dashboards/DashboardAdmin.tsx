import React, { useState, useEffect } from 'react';
import { UsersIcon, BookOpenIcon } from '../../components/Icons';
import { db } from '../../lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsuarios: '0',
    totalTurmas: '0',
    alunosAtivos: '0',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersCol = collection(db, 'users');
        const turmasCol = collection(db, 'turmas');

        const totalUsuariosQuery = query(usersCol);
        const totalTurmasQuery = query(turmasCol);
        const alunosAtivosQuery = query(usersCol, where('role', '==', 'Aluno'));

        const [totalUsuariosSnap, totalTurmasSnap, alunosAtivosSnap] = await Promise.all([
          getCountFromServer(totalUsuariosQuery),
          getCountFromServer(totalTurmasQuery),
          getCountFromServer(alunosAtivosQuery),
        ]);

        setStats({
          totalUsuarios: totalUsuariosSnap.data().count.toString(),
          totalTurmas: totalTurmasSnap.data().count.toString(),
          alunosAtivos: alunosAtivosSnap.data().count.toString(),
        });

      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Não foi possível carregar as estatísticas.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total de Usuários', stat: stats.totalUsuarios, icon: UsersIcon },
    { name: 'Total de Turmas', stat: stats.totalTurmas, icon: BookOpenIcon },
    { name: 'Alunos Ativos', stat: stats.alunosAtivos, icon: UsersIcon },
  ];

  const StatCardContent: React.FC<{ stat: string; isLoading: boolean }> = ({ stat, isLoading }) => {
    if (isLoading) {
      return <div className="h-9 w-12 bg-gray-700 rounded-md animate-pulse"></div>
    }
    return <dd className="text-3xl font-bold text-white">{stat}</dd>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard do Administrador</h1>

      {error && <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg mb-6">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((item) => (
          <div key={item.name} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 flex items-center">
            <div className="flex-shrink-0 bg-blue-600/20 text-blue-400 rounded-lg p-3">
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-400 truncate">{item.name}</dt>
                <StatCardContent stat={item.stat} isLoading={loading} />
              </dl>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Atividades Recentes</h2>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
          <ul className="divide-y divide-gray-700">
            <li className="p-4 flex items-center justify-between">
              <p className="text-gray-300">Novo aluno <span className="font-semibold text-white">João da Silva</span> cadastrado na turma <span className="font-semibold text-white">Desenvolvimento Web com React</span>.</p>
              <p className="text-sm text-gray-500">2 horas atrás</p>
            </li>
            <li className="p-4 flex items-center justify-between">
              <p className="text-gray-300">Turma <span className="font-semibold text-white">Machine Learning Avançado</span> foi criada.</p>
              <p className="text-sm text-gray-500">1 dia atrás</p>
            </li>
            <li className="p-4 flex items-center justify-between">
              <p className="text-gray-300">Nova aluna <span className="font-semibold text-white">Maria Oliveira</span> cadastrada na turma <span className="font-semibold text-white">Turma de IA para Iniciantes</span>.</p>
              <p className="text-sm text-gray-500">3 dias atrás</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;