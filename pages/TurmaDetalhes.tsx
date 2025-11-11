import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query, where, documentId, deleteField, orderBy } from 'firebase/firestore';
import { Turma, Usuario, Curso } from '../types';
import { ArrowLeftIcon, UsersIcon, TrashIcon, BookOpenIcon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import Modal from '../components/Modal';

const AddStudentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  turmaId: string;
  enrolledStudentIds: string[];
  onSuccess: () => void;
}> = ({ isOpen, onClose, turmaId, enrolledStudentIds, onSuccess }) => {
  const [availableStudents, setAvailableStudents] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingStudentId, setAddingStudentId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const fetchAvailableStudents = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'Aluno'));
        const querySnapshot = await getDocs(q);
        const allStudents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));
        
        // Filter out students already enrolled
        const available = allStudents.filter(student => !enrolledStudentIds.includes(student.id));
        setAvailableStudents(available);
      } catch (error) {
        console.error("Error fetching available students: ", error);
        addToast("Erro ao carregar alunos disponíveis.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableStudents();
  }, [isOpen, enrolledStudentIds, addToast]);

  const handleAddStudent = async (studentId: string) => {
    setAddingStudentId(studentId);
    try {
      const turmaRef = doc(db, 'turmas', turmaId);
      await updateDoc(turmaRef, {
        studentIds: arrayUnion(studentId)
      });
      addToast("Aluno adicionado com sucesso!", "success");
      onSuccess(); // Refresh the parent component's student list
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error adding student: ", error);
      addToast("Erro ao adicionar aluno.", "error");
    } finally {
      setAddingStudentId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Aluno à Turma">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {loading && <p>Carregando alunos...</p>}
        {!loading && availableStudents.length === 0 && <p className="text-gray-400">Nenhum aluno novo disponível para adicionar.</p>}
        {!loading && availableStudents.map(student => (
          <div key={student.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div>
              <p className="font-semibold text-white">{student.name}</p>
              <p className="text-sm text-gray-400">{student.email}</p>
            </div>
            <button
              onClick={() => handleAddStudent(student.id)}
              disabled={addingStudentId === student.id}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {addingStudentId === student.id ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
};

const LinkCourseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  turmaId: string;
  onSuccess: () => void;
}> = ({ isOpen, onClose, turmaId, onSuccess }) => {
  const [availableCourses, setAvailableCourses] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingCourseId, setLinkingCourseId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const fetchAvailableCourses = async () => {
      setLoading(true);
      try {
        const coursesRef = collection(db, 'cursos');
        const q = query(coursesRef, orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const allCourses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Curso));
        setAvailableCourses(allCourses);
      } catch (error) {
        console.error("Error fetching available courses: ", error);
        addToast("Erro ao carregar cursos disponíveis.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableCourses();
  }, [isOpen, addToast]);

  const handleLinkCourse = async (courseId: string) => {
    setLinkingCourseId(courseId);
    try {
      const turmaRef = doc(db, 'turmas', turmaId);
      await updateDoc(turmaRef, {
        courseId: courseId
      });
      addToast("Curso vinculado com sucesso!", "success");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error linking course: ", error);
      addToast("Erro ao vincular curso.", "error");
    } finally {
      setLinkingCourseId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vincular Curso à Turma">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {loading && <p>Carregando cursos...</p>}
        {!loading && availableCourses.length === 0 && <p className="text-gray-400">Nenhum curso cadastrado na plataforma.</p>}
        {!loading && availableCourses.map(course => (
          <div key={course.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div>
              <p className="font-semibold text-white">{course.name}</p>
              <p className="text-sm text-gray-400">Prof. {course.teacher}</p>
            </div>
            <button
              onClick={() => handleLinkCourse(course.id)}
              disabled={linkingCourseId === course.id}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {linkingCourseId === course.id ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
};


const TurmaDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [associatedCourse, setAssociatedCourse] = useState<Curso | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const { addToast } = useToast();

  const fetchTurmaDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setAssociatedCourse(null);
    setEnrolledStudents([]);

    try {
      const turmaRef = doc(db, 'turmas', id);
      const turmaSnap = await getDoc(turmaRef);

      if (!turmaSnap.exists()) {
        setError("Turma não encontrada.");
        setLoading(false);
        return;
      }

      const turmaData = { id: turmaSnap.id, ...turmaSnap.data() } as Turma;
      setTurma(turmaData);

      if (turmaData.courseId) {
        const courseRef = doc(db, 'cursos', turmaData.courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          setAssociatedCourse({ id: courseSnap.id, ...courseSnap.data() } as Curso);
        }
      }
      
      const studentIds = turmaData.studentIds || [];
      if (studentIds.length > 0) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where(documentId(), 'in', studentIds));
        const studentsSnap = await getDocs(q);
        const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));
        setEnrolledStudents(studentsList);
      } else {
        setEnrolledStudents([]);
      }

    } catch (e) {
      console.error(e);
      setError("Não foi possível carregar os detalhes da turma.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTurmaDetails();
  }, [fetchTurmaDetails]);

  const handleRemoveStudent = async (studentId: string) => {
    if(!id) return;
    try {
      const turmaRef = doc(db, 'turmas', id);
      await updateDoc(turmaRef, {
        studentIds: arrayRemove(studentId)
      });
      addToast("Aluno removido com sucesso!", "success");
      fetchTurmaDetails();
    } catch(error) {
      console.error("Error removing student: ", error);
      addToast("Erro ao remover aluno.", "error");
    }
  }

  const handleUnlinkCourse = async () => {
    if (!id) return;
    if (window.confirm("Tem certeza que deseja desvincular este curso da turma? A ação não poderá ser desfeita.")) {
      try {
        const turmaRef = doc(db, 'turmas', id);
        await updateDoc(turmaRef, {
          courseId: deleteField()
        });
        addToast("Curso desvinculado com sucesso!", "success");
        fetchTurmaDetails(); // Refresh details
      } catch (error) {
        console.error("Error unlinking course: ", error);
        addToast("Erro ao desvincular o curso.", "error");
      }
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
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

  return (
    <>
      <div>
        <Link to="/turmas" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeftIcon className="w-5 h-5" />
          Voltar para Turmas
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{turma?.name}</h1>
          <p className="text-gray-400 mt-1">{turma?.serie} - {turma?.turno}</p>
        </div>
        
        {/* Course Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Curso Vinculado</h2>
          {associatedCourse ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-2">{associatedCourse.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{associatedCourse.description}</p>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-4 inline-block">
                  Prof. {associatedCourse.teacher}
              </span>
              <div className="flex items-center gap-4 mt-4">
                <button onClick={() => setIsCourseModalOpen(true)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                  Alterar Curso
                </button>
                <button onClick={handleUnlinkCourse} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" aria-label="Desvincular Curso">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-4 text-xl font-semibold text-white">Nenhum curso vinculado</h3>
              <p className="text-gray-400 mt-2 mb-4">Associe um curso a esta turma para definir o plano de estudos.</p>
              <button onClick={() => setIsCourseModalOpen(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap">
                Vincular Curso
              </button>
            </div>
          )}
        </div>

        {/* Student List Section */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-white">Alunos Matriculados ({enrolledStudents.length})</h2>
            <button
              onClick={() => setIsStudentModalOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Adicionar Aluno
            </button>
          </div>
          {enrolledStudents.length === 0 ? (
             <div className="text-center p-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-4 text-xl font-semibold text-white">Nenhum aluno matriculado</h3>
                <p className="text-gray-400 mt-2">Adicione o primeiro aluno a esta turma.</p>
            </div>
          ) : (
             <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-x-auto">
              <table className="w-full text-left min-w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th scope="col" className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Nome do Aluno</th>
                    <th scope="col" className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider">Email</th>
                    <th scope="col" className="p-4 font-semibold text-sm text-gray-300 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {enrolledStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-white font-medium">{student.name}</td>
                      <td className="p-4 whitespace-nowrap text-gray-400">{student.email}</td>
                      <td className="p-4 whitespace-nowrap text-right space-x-2">
                        <button 
                            onClick={() => handleRemoveStudent(student.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" 
                            aria-label={`Remover ${student.name}`}
                        >
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {turma && (
        <>
          <AddStudentModal
            isOpen={isStudentModalOpen}
            onClose={() => setIsStudentModalOpen(false)}
            turmaId={turma.id}
            enrolledStudentIds={turma.studentIds || []}
            onSuccess={fetchTurmaDetails}
          />
          <LinkCourseModal
            isOpen={isCourseModalOpen}
            onClose={() => setIsCourseModalOpen(false)}
            turmaId={turma.id}
            onSuccess={fetchTurmaDetails}
          />
        </>
      )}
    </>
  );
};

export default TurmaDetalhes;