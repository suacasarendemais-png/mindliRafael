import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchIcon, ChevronDownIcon, PencilIcon, TrashIcon } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Usuario } from '../types';
import { useToast } from '../components/Toaster';

const UsuarioForm: React.FC<{ 
  onClose: () => void; 
  onSuccess: () => void; 
  usuarioToEdit?: Usuario | null 
}> = ({ onClose, onSuccess, usuarioToEdit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Aluno' | 'Professor' | 'Admin'>('Aluno');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (usuarioToEdit) {
      setName(usuarioToEdit.name);
      setEmail(usuarioToEdit.email);
      setRole(usuarioToEdit.role);
    }
  }, [usuarioToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (usuarioToEdit) {
        // Edit existing user in Firestore
        const userRef = doc(db, 'users', usuarioToEdit.id);
        await updateDoc(userRef, { name, role });
        addToast(`Usuário "${name}" atualizado com sucesso!`, 'success');
      } else {
        // Create new user in Auth and Firestore
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        await setDoc(doc(db, 'users', newUser.uid), {
          name,
          email,
          role,
        });
        addToast(`Usuário "${name}" criado com sucesso!`, 'success');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        addToast('Este email já está em uso.', 'error');
      } else {
        addToast(`Erro: ${error.message}`, 'error');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="user-name" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
        <input id="user-name" type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: João da Silva"/>
      </div>
      <div>
        <label htmlFor="user-email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
        <input id="user-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={!!usuarioToEdit} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" placeholder="joao.silva@email.com"/>
      </div>
       <div>
        <label htmlFor="user-role" className="block text-sm font-medium text-gray-300 mb-2">Função</label>
        <select id="user-role" required value={role} onChange={e => setRole(e.target.value as any)} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="Aluno">Aluno</option>
          <option value="Professor">Professor</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      {!usuarioToEdit && (
        <div>
          <label htmlFor="user-password"className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
          <input id="user-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Mínimo 6 caracteres"/>
        </div>
      )}
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors" disabled={loading}>Cancelar</button>
        <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center min-w-[140px]" disabled={loading}>
            {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (usuarioToEdit ? 'Salvar Alterações' : 'Criar Usuário')}
        </button>
      </div>
    </form>
  );
};


const Usuarios: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todas as Funções');
  const { addToast } = useToast();

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'users'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const usuariosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));
      setUsuarios(usuariosData);
    } catch (err) {
      console.error("Error fetching usuarios:", err);
      setError("Não foi possível carregar os usuários. Missing or insufficient permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);
  
  const handleEditClick = (usuario: Usuario) => {
    setUsuarioToEdit(usuario);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete) return;
    try {
      // IMPORTANT: This only deletes the Firestore record, not the Firebase Auth user.
      // Deleting an Auth user requires admin privileges, typically via a Cloud Function.
      await deleteDoc(doc(db, 'users', usuarioToDelete.id));
      addToast(`Usuário "${usuarioToDelete.name}" excluído do banco de dados!`, 'success');
      fetchUsuarios(); // Refresh list
    } catch (error) {
      addToast("Erro ao excluir usuário.", 'error');
      console.error("Error deleting user document:", error);
    } finally {
      setIsConfirmModalOpen(false);
      setUsuarioToDelete(null);
    }
  };

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(usuario => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = usuario.name.toLowerCase().includes(searchTermLower) || usuario.email.toLowerCase().includes(searchTermLower);
      const matchesRole = filterRole === 'Todas as Funções' || usuario.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [usuarios, searchTerm, filterRole]);


  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'professor': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'aluno': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex justify-center items-center p-20">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p>;
    }

    if (usuarios.length > 0 && filteredUsuarios.length === 0) {
        return (
            <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                <h3 className="text-xl font-semibold text-white">Nenhum usuário encontrado</h3>
                <p className="text-gray-400 mt-2">Tente ajustar seus filtros de busca.</p>
            </div>
        );
    }

    if (filteredUsuarios.length === 0) {
        return (
            <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                <h3 className="text-xl font-semibold text-white">Nenhum usuário encontrado</h3>
                <p className="text-gray-400 mt-2">Comece criando o primeiro usuário da plataforma.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-x-auto">
          <table className="w-full text-left min-w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th scope="col" className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Nome</th>
                <th scope="col" className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Email</th>
                <th scope="col" className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Função</th>
                <th scope="col" className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsuarios.map(usuario => (
                <tr key={usuario.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 whitespace-nowrap text-white font-medium">{usuario.name}</td>
                  <td className="p-4 whitespace-nowrap text-gray-400">{usuario.email}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRoleColor(usuario.role)}`}>
                      {usuario.role}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => handleEditClick(usuario)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors" aria-label={`Editar ${usuario.name}`}>
                        <PencilIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => handleDeleteClick(usuario)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" aria-label={`Excluir ${usuario.name}`}>
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    );
  };


  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
            <h1 className="text-3xl font-bold text-white">Gerenciamento de Usuários</h1>
            <p className="text-gray-400 mt-1">Adicione, edite e gerencie os usuários da plataforma.</p>
          </div>
          <button 
            onClick={() => {
                setUsuarioToEdit(null);
                setIsModalOpen(true);
            }}
            className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Novo Usuário
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="relative w-full md:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option>Todas as Funções</option>
              <option>Admin</option>
              <option>Professor</option>
              <option>Aluno</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        {renderContent()}

      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={usuarioToEdit ? "Editar Usuário" : "Criar Novo Usuário"}
      >
        <UsuarioForm 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchUsuarios}
            usuarioToEdit={usuarioToEdit}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza de que deseja excluir o usuário "${usuarioToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
};

export default Usuarios;