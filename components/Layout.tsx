import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { HomeIcon, UsersIcon, BookOpenIcon, LogOutIcon, RectangleStackIcon, CogIcon, ArchiveBoxIcon, ChatBubbleLeftRightIcon, TrophyIcon, ClipboardDocumentListIcon, DocumentTextIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();


  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const navLinks = [
    // Comuns
    { to: "/", text: "Dashboard", icon: HomeIcon, roles: ['Admin', 'Aluno', 'Professor'] },
    
    // Aluno
    { to: "/avaliacoes/aluno", text: "Minhas Avaliações", icon: ClipboardDocumentListIcon, roles: ['Aluno'] },
    
    // Admin & Professor
    { to: "/turmas", text: "Turmas", icon: RectangleStackIcon, roles: ['Admin', 'Professor'] },
    { to: "/cursos", text: "Cursos", icon: BookOpenIcon, roles: ['Admin', 'Professor'] },
    { to: "/usuarios", text: "Usuários", icon: UsersIcon, roles: ['Admin'] },
    { to: "/exercicios/gerenciar", text: "Exercícios", icon: DocumentTextIcon, roles: ['Admin', 'Professor'] },
    { to: "/avaliacoes/gerenciar", text: "Avaliações", icon: ClipboardDocumentListIcon, roles: ['Admin', 'Professor'] },
    
    // Comuns
    { to: "/gamificacao", text: "Gamificação", icon: TrophyIcon, roles: ['Admin', 'Aluno', 'Professor'] },
    { to: "/mensagens", text: "Mensagens", icon: ChatBubbleLeftRightIcon, roles: ['Admin', 'Aluno', 'Professor'] },
    { to: "/biblioteca", text: "Biblioteca", icon: ArchiveBoxIcon, roles: ['Admin', 'Aluno', 'Professor'] },
    { to: "/configuracoes", text: "Configurações", icon: CogIcon, roles: ['Admin', 'Aluno', 'Professor'] },
  ];

  const filteredNavLinks = navLinks.filter(link => userProfile && link.roles.includes(userProfile.role));


  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 text-transparent bg-clip-text">
            MINDLI
          </h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavLinks.map(link => (
             <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700'
                }`
              }
            >
              <link.icon className="w-5 h-5 mr-3" />
              {link.text}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            <LogOutIcon className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
