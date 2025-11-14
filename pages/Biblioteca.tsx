import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { SearchIcon, ChevronDownIcon, DocumentTextIcon, PlayCircleIcon, DocumentArrowDownIcon, EyeIcon } from '../components/Icons';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import { MaterialBiblioteca } from '../types';
import Modal from '../components/Modal';

const UploadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
    const { userProfile } = useAuth();
    const { addToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [discipline, setDiscipline] = useState('Matemática');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file || !userProfile) {
            addToast('Selecione um arquivo e esteja logado.', 'error');
            return;
        }

        setIsUploading(true);
        const storageRef = ref(storage, `biblioteca/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                addToast(`Erro no upload: ${error.message}`, 'error');
                setIsUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                await addDoc(collection(db, 'biblioteca'), {
                    name: file.name,
                    type: file.type,
                    discipline: discipline,
                    size: file.size,
                    uploaderName: userProfile.name,
                    uploaderId: userProfile.id,
                    downloadURL: downloadURL,
                    storagePath: storageRef.fullPath,
                    created_at: serverTimestamp(),
                });

                addToast('Arquivo enviado com sucesso!', 'success');
                setIsUploading(false);
                onSuccess();
                onClose();
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload de Novo Material">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Arquivo</label>
                    <input type="file" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Disciplina</label>
                    <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white">
                        <option>Matemática</option>
                        <option>Português</option>
                        <option>História</option>
                        <option>Geografia</option>
                        <option>Ciências</option>
                        <option>Física</option>
                        <option>Química</option>
                        <option>Biologia</option>
                    </select>
                </div>
                {isUploading && (
                    <div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <p className="text-center text-sm text-gray-400 mt-2">{Math.round(uploadProgress)}%</p>
                    </div>
                )}
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 font-semibold rounded-lg" disabled={isUploading}>Cancelar</button>
                    <button onClick={handleUpload} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg disabled:opacity-50" disabled={isUploading || !file}>
                        {isUploading ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}


const Biblioteca: React.FC = () => {
    const [materials, setMaterials] = useState<MaterialBiblioteca[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'biblioteca'), orderBy('created_at', 'desc'));
            const querySnapshot = await getDocs(q);
            const materialsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaterialBiblioteca));
            setMaterials(materialsData);
        } catch (error) {
            console.error("Error fetching materials: ", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const getIconForType = (type: string) => {
        if (type.includes('pdf')) return <DocumentTextIcon className="w-8 h-8 text-red-400" />;
        if (type.includes('video')) return <PlayCircleIcon className="w-8 h-8 text-cyan-400" />;
        if (type.includes('word')) return <DocumentTextIcon className="w-8 h-8 text-blue-400" />;
        if (type.includes('presentation') || type.includes('powerpoint')) return <DocumentTextIcon className="w-8 h-8 text-orange-400" />;
        return <DocumentTextIcon className="w-8 h-8 text-gray-400" />;
    };
    
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <>
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Biblioteca de Materiais</h1>
                    <p className="text-gray-400 mt-1">Encontre apostilas, videoaulas e outros materiais de apoio.</p>
                </div>
                <button onClick={() => setUploadModalOpen(true)} className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap">
                    Upload de Material
                </button>
            </div>

            <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome do material..."
                        className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <select
                        className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option>Todas as Disciplinas</option>
                        <option>Química</option>
                        <option>Matemática</option>
                        <option>Biologia</option>
                        <option>História</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>
            
            {loading ? <p className="text-center py-10">Carregando materiais...</p> : 
             materials.length === 0 ? <p className="text-center py-10 text-gray-400">Nenhum material encontrado.</p> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {materials.map(file => (
                    <div key={file.id} className="bg-gray-800/50 rounded-xl border border-gray-700 flex flex-col group transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20">
                        <div className="p-6 flex-grow flex items-center">
                            <div className="mr-4 flex-shrink-0">
                                {getIconForType(file.type)}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">{file.name}</h3>
                                <p className="text-sm text-gray-400">{file.discipline}</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700 text-xs text-gray-500 space-y-2">
                             <div className="flex justify-between"><span>Tamanho:</span> <span className="font-semibold text-gray-300">{formatSize(file.size)}</span></div>
                             <div className="flex justify-between"><span>Uploader:</span> <span className="font-semibold text-gray-300">{file.uploaderName}</span></div>
                        </div>
                        <div className="p-2 bg-gray-900/30 border-t border-gray-700 flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={file.downloadURL} target="_blank" rel="noopener noreferrer" download={file.name} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><DocumentArrowDownIcon className="w-4 h-4" /> Baixar</a>
                            <a href={file.downloadURL} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><EyeIcon className="w-4 h-4" /> Visualizar</a>
                        </div>
                    </div>
                ))}
            </div>}
        </div>
        <UploadModal 
            isOpen={isUploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onSuccess={fetchMaterials}
        />
        </>
    );
};

export default Biblioteca;