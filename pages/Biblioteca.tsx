import React, { useState } from 'react';
import { SearchIcon, ChevronDownIcon, DocumentTextIcon, PlayCircleIcon, DocumentArrowDownIcon, EyeIcon } from '../components/Icons';

const filesData = [
  { id: 1, name: 'Apostila de Química Orgânica', type: 'PDF', discipline: 'Química', size: '5.2 MB', uploader: 'Prof. Ricardo' },
  { id: 2, name: 'Videoaula: Teorema de Pitágoras', type: 'Vídeo', discipline: 'Matemática', size: '78.4 MB', uploader: 'Prof. Ana' },
  { id: 3, name: 'Lista de Exercícios - Genética', type: 'DOC', discipline: 'Biologia', size: '1.1 MB', uploader: 'Prof. Carlos' },
  { id: 4, name: 'Slides: Revolução Industrial', type: 'PPT', discipline: 'História', size: '12.8 MB', uploader: 'Prof. Maria' },
  { id: 5, name: 'Artigo sobre Buracos Negros', type: 'PDF', discipline: 'Física', size: '3.9 MB', uploader: 'Coordenação' },
  { id: 6, name: 'Tutorial de Redação ENEM', type: 'Vídeo', discipline: 'Português', size: '150.2 MB', uploader: 'Prof. Helena' },
];

const Biblioteca: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos os Tipos');
    const [filterDiscipline, setFilterDiscipline] = useState('Todas as Disciplinas');

    const getIconForType = (type: string) => {
        switch(type) {
            case 'PDF': return <DocumentTextIcon className="w-8 h-8 text-red-400" />;
            case 'Vídeo': return <PlayCircleIcon className="w-8 h-8 text-cyan-400" />;
            case 'DOC': return <DocumentTextIcon className="w-8 h-8 text-blue-400" />;
            case 'PPT': return <DocumentTextIcon className="w-8 h-8 text-orange-400" />;
            default: return <DocumentTextIcon className="w-8 h-8 text-gray-400" />;
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Biblioteca de Materiais</h1>
                    <p className="text-gray-400 mt-1">Encontre apostilas, videoaulas e outros materiais de apoio.</p>
                </div>
                <button className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap">
                    Upload de Material
                </button>
            </div>

            <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full md:flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome do material..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option>Todos os Tipos</option>
                        <option>PDF</option>
                        <option>Vídeo</option>
                        <option>DOC</option>
                        <option>PPT</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative w-full md:w-48">
                    <select
                        value={filterDiscipline}
                        onChange={e => setFilterDiscipline(e.target.value)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filesData.map(file => (
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
                             <div className="flex justify-between"><span>Tipo:</span> <span className="font-semibold text-gray-300">{file.type}</span></div>
                             <div className="flex justify-between"><span>Tamanho:</span> <span className="font-semibold text-gray-300">{file.size}</span></div>
                             <div className="flex justify-between"><span>Uploader:</span> <span className="font-semibold text-gray-300">{file.uploader}</span></div>
                        </div>
                        <div className="p-2 bg-gray-900/30 border-t border-gray-700 flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><DocumentArrowDownIcon className="w-4 h-4" /> Baixar</button>
                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"><EyeIcon className="w-4 h-4" /> Visualizar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Biblioteca;