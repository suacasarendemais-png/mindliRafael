import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AwardIcon, TrophyIcon } from '../components/Icons';

const Gamificacao: React.FC = () => {
  const { userProfile } = useAuth();

  const currentUser = {
    name: userProfile?.name || 'Aluno Teste',
    level: 12,
    levelName: 'Mestre Jedi',
    points: 12345,
    stars: 87,
    streak: 23,
    progress: 65, // in percent
  };

  const stats = [
    { name: 'Pontos Totais', value: currentUser.points.toLocaleString('pt-BR') },
    { name: 'Badges Conquistados', value: 15 },
    { name: 'Dias Seguidos', value: currentUser.streak },
  ];

  const recentBadges = [
    { name: 'Conquistador de Cursos', date: '2 dias atrás' },
    { name: 'Mestre da Matemática', date: '5 dias atrás' },
    { name: 'Explorador de História', date: '1 semana atrás' },
    { name: 'Participação Perfeita', date: '2 semanas atrás' },
  ];

  const ranking = [
    { rank: 1, name: 'Ana Clara', level: 15, points: 18230 },
    { rank: 2, name: 'Bruno Costa', level: 14, points: 16540 },
    { rank: 3, name: 'Carla Dias', level: 13, points: 14890 },
    { rank: 4, name: 'Daniel Alves', level: 13, points: 14120 },
    { rank: 5, name: userProfile?.name, level: 12, points: 12345 },
    { rank: 6, name: 'Fernanda Lima', level: 11, points: 11980 },
    { rank: 7, name: 'Gustavo Borges', level: 10, points: 10500 },
  ];

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gamificação</h1>
        <p className="text-gray-400 mt-1">Acompanhe seu progresso, conquistas e ranking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile and Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-4xl font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gray-700 border-2 border-gray-800 rounded-full px-2 py-0.5 text-xs font-bold">
                Nível {currentUser.level}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">{currentUser.name}</h2>
            <p className="text-blue-400 font-semibold">{currentUser.levelName}</p>
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Progresso para Nível {currentUser.level + 1}</span>
                <span>{currentUser.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${currentUser.progress}%` }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {stats.map(stat => (
              <div key={stat.name} className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 flex items-center">
                <div className="p-2 bg-gray-700 rounded-lg mr-4">
                  <AwardIcon className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{stat.name}</p>
                  <p className="text-white font-bold text-xl">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Badges and Ranking */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Conquistas Recentes</h3>
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 space-y-3">
              {recentBadges.map((badge, index) => (
                <div key={index} className="flex items-center p-2">
                  <div className="p-2 bg-gray-700 rounded-lg mr-4">
                    <TrophyIcon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{badge.name}</p>
                    <p className="text-xs text-gray-400">{badge.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Ranking da Escola</h3>
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <ul className="divide-y divide-gray-700">
                {ranking.map((player) => (
                  <li key={player.rank} className={`flex items-center p-4 ${player.name === currentUser.name ? 'bg-blue-600/20' : ''}`}>
                    <div className="flex items-center w-1/12">
                      <span className={`font-bold text-lg ${getMedalColor(player.rank)}`}>{player.rank}</span>
                    </div>
                    <div className="flex items-center w-7/12">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold mr-4">
                        {player.name?.charAt(0)}
                      </div>
                      <span className="font-semibold text-white">{player.name}</span>
                    </div>
                    <div className="w-2/12 text-gray-400 text-sm">Nível {player.level}</div>
                    <div className="w-2/12 text-white font-bold text-right">{player.points.toLocaleString('pt-BR')} pts</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gamificacao;