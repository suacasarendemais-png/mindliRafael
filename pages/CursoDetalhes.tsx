import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { Turma, Curso, Modulo, Licao } from '../types';
import { ArrowLeftIcon, EyeIcon, PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon, PlayCircleIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useToast } from '../components/Toaster';
import ConfirmationModal from '../components/ConfirmationModal';

// --- SUB-COMPONENTS FOR FORMS ---

const ModuleForm: React.FC<{
    cursoId: string;
    onClose: () => void;
    onSuccess: () => void;
    moduleToEdit?: Modulo | null;
    moduleCount: number;
}> = ({ cursoId, onClose, onSuccess, moduleToEdit, moduleCount }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (moduleToEdit) {
            setName(moduleToEdit.name);
            setDescription(moduleToEdit.description);
        }
    }, [moduleToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const modulesRef = collection(db, 'cursos', cursoId, 'modulos');
            if (moduleToEdit) {
                const moduleRef = doc(modulesRef, moduleToEdit.id);
                await updateDoc(moduleRef, { name, description });
                addToast('Módulo atualizado com sucesso!', 'success');
            } else {
                await addDoc(modulesRef, {
                    name,
                    description,
                    order: moduleCount + 1,
                    created_at: serverTimestamp(),
                });
                addToast('Módulo criado com sucesso!', 'success');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(`Erro: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="module-name" className="block text-sm font-medium text-gray-300 mb-2">Nome do Módulo</label>
                <input id="module-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
                <label htmlFor="module-desc" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea id="module-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors" disabled={loading}>Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors min-w-[120px]" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </form>
    );
};

const LessonForm: React.FC<{
    cursoId: string;
    moduleId: string;
    onClose: () => void;
    onSuccess: () => void;
    lessonToEdit?: Licao | null;
    lessonCount: number;
}> = ({ cursoId, moduleId, onClose, onSuccess, lessonToEdit, lessonCount }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'video' | 'texto'>('video');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (lessonToEdit) {
            setName(lessonToEdit.name);
            setType(lessonToEdit.type);
            setContent(lessonToEdit.content);
        }
    }, [lessonToEdit]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const lessonsRef = collection(db, 'cursos', cursoId, 'modulos', moduleId, 'licoes');
            if (lessonToEdit) {
                const lessonRef = doc(lessonsRef, lessonToEdit.id);
                await updateDoc(lessonRef, { name, type, content });
                addToast('Lição atualizada com sucesso!', 'success');
            } else {
                await addDoc(lessonsRef, {
                    name,
                    type,
                    content,
                    order: lessonCount + 1,
                    created_at: serverTimestamp(),
                });
                addToast('Lição criada com sucesso!', 'success');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
             addToast(`Erro: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="lesson-name" className="block text-sm font-medium text-gray-300 mb-2">Nome da Lição</label>
                <input id="lesson-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
                <label htmlFor="lesson-type" className="block text-sm font-medium text-gray-300 mb-2">Tipo de Lição</label>
                <select id="lesson-type" required value={type} onChange={e => setType(e.target.value as any)} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="video">Vídeo</option>
                    <option value="texto">Texto</option>
                </select>
            </div>
            <div>
                <label htmlFor="lesson-content" className="block text-sm font-medium text-gray-300 mb-2">{type === 'video' ? 'URL do Vídeo (YouTube, Vimeo)' : 'Conteúdo do Texto'}</label>
                <textarea id="lesson-content" required value={content} onChange={(e) => setContent(e.target.value)} rows={type === 'texto' ? 8 : 1} className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors" disabled={loading}>Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors min-w-[120px]" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </form>
    );
};

// --- MAIN PAGE COMPONENT ---

const CursoDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [curso, setCurso] = useState<Curso | null>(null);
    const [modulos, setModulos] = useState<Modulo[]>([]);
    const [licoes, setLicoes] = useState<Record<string, Licao[]>>({});
    const [linkedTurmas, setLinkedTurmas] = useState<Turma[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    // Modal States
    const [isModuleModalOpen, setModuleModalOpen] = useState(false);
    const [moduleToEdit, setModuleToEdit] = useState<Modulo | null>(null);
    const [isLessonModalOpen, setLessonModalOpen] = useState(false);
    const [lessonToEdit, setLessonToEdit] = useState<Licao | null>(null);
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{type: 'module' | 'lesson', data: Modulo | Licao, moduleId?: string} | null>(null);


    const fetchCursoDetails = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const cursoRef = doc(db, 'cursos', id);
            const cursoSnap = await getDoc(cursoRef);
            if (!cursoSnap.exists()) {
                setError("Curso não encontrado.");
                setLoading(false);
                return;
            }
            setCurso({ id: cursoSnap.id, ...cursoSnap.data() } as Curso);

            // Fetch Modules
            const modulosRef = collection(db, 'cursos', id, 'modulos');
            const modulosQuery = query(modulosRef, orderBy('order'));
            const modulosSnap = await getDocs(modulosQuery);
            const modulosList = modulosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Modulo));
            setModulos(modulosList);

            // Fetch Lessons for each module
            const licoesMap: Record<string, Licao[]> = {};
            await Promise.all(modulosList.map(async (modulo) => {
                const licoesRef = collection(modulosRef, modulo.id, 'licoes');
                const licoesQuery = query(licoesRef, orderBy('order'));
                const licoesSnap = await getDocs(licoesQuery);
                licoesMap[modulo.id] = licoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Licao));
            }));
            setLicoes(licoesMap);

            // Fetch linked turmas
            const turmasRef = collection(db, 'turmas');
            const turmasQuery = query(turmasRef, where("courseId", "==", id));
            const turmasSnap = await getDocs(turmasQuery);
            setLinkedTurmas(turmasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turma)));

        } catch (e) {
            console.error(e);
            setError("Não foi possível carregar os detalhes do curso.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCursoDetails();
    }, [fetchCursoDetails]);

    // --- Handlers for Modals and Actions ---

    const handleOpenModuleModal = (module?: Modulo) => {
        setModuleToEdit(module || null);
        setModuleModalOpen(true);
    };

    const handleOpenLessonModal = (moduleId: string, lesson?: Licao) => {
        setCurrentModuleId(moduleId);
        setLessonToEdit(lesson || null);
        setLessonModalOpen(true);
    };

    const handleDeleteClick = (type: 'module' | 'lesson', data: Modulo | Licao, moduleId?: string) => {
        setItemToDelete({type, data, moduleId});
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete || !id) return;
        const { type, data, moduleId } = itemToDelete;

        try {
            if (type === 'module') {
                const module = data as Modulo;
                const lessonsCount = licoes[module.id]?.length || 0;
                if (lessonsCount > 0) {
                   addToast(`Exclua as ${lessonsCount} lições deste módulo primeiro.`, 'error');
                   return;
                }
                await deleteDoc(doc(db, 'cursos', id, 'modulos', module.id));
                addToast('Módulo excluído com sucesso!', 'success');
            } else if (type === 'lesson' && moduleId) {
                await deleteDoc(doc(db, 'cursos', id, 'modulos', moduleId, 'licoes', data.id));
                addToast('Lição excluída com sucesso!', 'success');
            }
            fetchCursoDetails();
        } catch(e: any) {
            addToast(`Erro ao excluir: ${e.message}`, 'error');
        } finally {
            setConfirmOpen(false);
            setItemToDelete(null);
        }
    };


    const renderContent = () => {
      if (loading) {
          return <div className="flex justify-center items-center p-20"><svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>;
      }
      if (error) {
          return <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p>;
      }
      return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content: Course Structure */}
              <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Estrutura do Curso</h2>
                    <button onClick={() => handleOpenModuleModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                        <PlusIcon className="w-5 h-5"/> Novo Módulo
                    </button>
                  </div>
                  {modulos.length === 0 ? (
                    <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                        <h3 className="text-xl font-semibold text-white">Curso Vazio</h3>
                        <p className="text-gray-400 mt-2">Adicione o primeiro módulo para começar a construir o conteúdo.</p>
                    </div>
                  ) : modulos.map(modulo => (
                      <div key={modulo.id} className="bg-gray-800/50 rounded-xl border border-gray-700">
                          <div className="p-4 flex justify-between items-center border-b border-gray-700">
                              <div>
                                  <h3 className="text-xl font-bold text-white">{modulo.name}</h3>
                                  <p className="text-sm text-gray-400">{modulo.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => handleOpenLessonModal(modulo.id)} className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">Adicionar Lição</button>
                                  <button onClick={() => handleOpenModuleModal(modulo)} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                                  <button onClick={() => handleDeleteClick('module', modulo)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                              </div>
                          </div>
                          <div className="p-4 space-y-3">
                              {(licoes[modulo.id] || []).length === 0 && <p className="text-sm text-gray-500">Nenhuma lição neste módulo.</p>}
                              {(licoes[modulo.id] || []).map(licao => (
                                  <div key={licao.id} className="flex items-center justify-between p-3 bg-gray-700/60 rounded-lg">
                                      <div className="flex items-center gap-3">
                                          {licao.type === 'video' ? <PlayCircleIcon className="w-5 h-5 text-cyan-400"/> : <DocumentTextIcon className="w-5 h-5 text-cyan-400"/>}
                                          <span className="text-white">{licao.name}</span>
                                      </div>
                                       <div className="flex items-center gap-2">
                                          <button onClick={() => handleOpenLessonModal(modulo.id, licao)} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                                          <button onClick={() => handleDeleteClick('lesson', licao, modulo.id)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
              {/* Sidebar: Course Info & Linked Turmas */}
              <div className="space-y-6">
                   <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
                      <h1 className="text-2xl font-bold text-white">{curso?.name}</h1>
                      <p className="text-gray-400 mt-2">{curso?.description}</p>
                      <div className="mt-4">
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                              Prof. {curso?.teacher}
                          </span>
                      </div>
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-white mb-4">Turmas Vinculadas ({linkedTurmas.length})</h2>
                      {linkedTurmas.length > 0 ? (
                        <div className="space-y-3">
                            {linkedTurmas.map(turma => (
                               <div key={turma.id} className="bg-gray-800/50 rounded-lg border border-gray-700 p-3 flex justify-between items-center">
                                   <span className="font-semibold">{turma.name}</span>
                                   <Link to={`/turmas/${turma.id}`} className="p-2 text-gray-400 hover:text-white"><EyeIcon className="w-5 h-5"/></Link>
                               </div>
                            ))}
                        </div>
                      ) : <p className="text-sm text-gray-400">Nenhuma turma vinculada.</p>}
                  </div>
              </div>
          </div>
      );
    }

    return (
        <>
            <div>
                <Link to="/cursos" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Voltar para Cursos
                </Link>
                {renderContent()}
            </div>
            
            {/* Modals */}
            {id && <Modal isOpen={isModuleModalOpen} onClose={() => setModuleModalOpen(false)} title={moduleToEdit ? 'Editar Módulo' : 'Novo Módulo'}>
                <ModuleForm cursoId={id} onClose={() => setModuleModalOpen(false)} onSuccess={fetchCursoDetails} moduleToEdit={moduleToEdit} moduleCount={modulos.length}/>
            </Modal>}

            {id && currentModuleId && <Modal isOpen={isLessonModalOpen} onClose={() => setLessonModalOpen(false)} title={lessonToEdit ? 'Editar Lição' : 'Nova Lição'}>
                <LessonForm cursoId={id} moduleId={currentModuleId} onClose={() => setLessonModalOpen(false)} onSuccess={fetchCursoDetails} lessonToEdit={lessonToEdit} lessonCount={licoes[currentModuleId]?.length || 0} />
            </Modal>}
            
            <ConfirmationModal 
              isOpen={isConfirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={confirmDelete}
              title={`Confirmar Exclusão de ${itemToDelete?.type === 'module' ? 'Módulo' : 'Lição'}`}
              message={`Tem certeza que deseja excluir "${itemToDelete?.data.name}"? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};

export default CursoDetalhes;