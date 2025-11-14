import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toaster';

import Layout from './components/Layout';
import Login from './pages/Login';
import DashboardAdmin from './pages/dashboards/DashboardAdmin';
import DashboardAluno from './pages/dashboards/DashboardAluno';
import Turmas from './pages/Turmas';
import TurmaDetalhes from './pages/TurmaDetalhes';
import Cursos from './pages/Cursos';
import CursoDetalhes from './pages/CursoDetalhes';
import Usuarios from './pages/Usuarios';
import Importacao from './pages/Importacao'; // Nova Importação
import Gamificacao from './pages/Gamificacao';
import Mensagens from './pages/Mensagens';
import Biblioteca from './pages/Biblioteca';
import Configuracoes from './pages/Configuracoes';
import ExerciciosGerenciar from './pages/ExerciciosGerenciar';
import ExercicioForm from './pages/ExercicioForm';
import AvaliacoesGerenciar from './pages/AvaliacoesGerenciar';
import AvaliacaoForm from './pages/AvaliacaoForm';
import AlunoAvaliacaoList from './pages/AlunoAvaliacaoList';
import RealizarAvaliacao from './pages/RealizarAvaliacao';
import AvaliacaoResultados from './pages/AvaliacaoResultados';
import RevisaoAvaliacao from './pages/RevisaoAvaliacao';


const AppRoutes: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 bg-dots-pattern">
        <Login />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white p-4">
            <h2 className="text-2xl font-bold">Erro de Perfil</h2>
            <p className="text-gray-400 mt-2">Não foi possível encontrar seu perfil de usuário no banco de dados.</p>
            <p className="text-gray-500 mt-1">Por favor, contate o administrador da plataforma.</p>
        </div>
      </div>
    )
  }
  
  const getDashboardByRole = () => {
    switch(userProfile?.role) {
      case 'Admin':
        return <DashboardAdmin />;
      case 'Aluno':
        return <DashboardAluno />;
      // TODO: Add dashboards for Professor, etc.
      default:
        // Fallback for other roles or if profile is not loaded yet
        return <div className="text-white">Dashboard em construção para o seu perfil.</div>;
    }
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Layout>
        <Routes>
          <Route path="/" element={getDashboardByRole()} />
          <Route path="/turmas" element={<Turmas />} />
          <Route path="/turmas/:id" element={<TurmaDetalhes />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/cursos/:id" element={<CursoDetalhes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/importacao" element={<Importacao />} />
          <Route path="/gamificacao" element={<Gamificacao />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          
          {/* Rotas de Conteúdo (Admin/Professor) */}
          <Route path="/exercicios/gerenciar" element={<ExerciciosGerenciar />} />
          <Route path="/exercicio/novo" element={<ExercicioForm />} />
          <Route path="/exercicio/editar/:id" element={<ExercicioForm />} />
          <Route path="/avaliacoes/gerenciar" element={<AvaliacoesGerenciar />} />
          <Route path="/avaliacao/nova" element={<AvaliacaoForm />} />
          <Route path="/avaliacao/editar/:id" element={<AvaliacaoForm />} />
          <Route path="/avaliacoes/resultados/:avaliacaoId" element={<AvaliacaoResultados />} />


          {/* Rotas de Aluno */}
          <Route path="/avaliacoes/aluno" element={<AlunoAvaliacaoList />} />
          <Route path="/avaliacoes/realizar/:avaliacaoId" element={<RealizarAvaliacao />} />

          {/* Rota Comum (Aluno e Professor/Admin) */}
          <Route path="/avaliacoes/revisao/:resultadoId" element={<RevisaoAvaliacao />} />


          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;