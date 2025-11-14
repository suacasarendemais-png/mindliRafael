import React, { useState } from 'react';
import { DocumentArrowDownIcon, DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';
import * as XLSX from 'xlsx';
import { useToast } from '../components/Toaster';

// Placeholder para o link do arquivo de modelo
const TEMPLATE_FILE_URL = '/MINDLI_Modelo_Importacao.xlsx';

const Importacao: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [validationResults, setValidationResults] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                addToast('Formato de arquivo inválido. Por favor, envie um .xlsx', 'error');
                return;
            }
            setFile(selectedFile);
            setFileName(selectedFile.name);
            handleFileProcessing(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
             if (droppedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                addToast('Formato de arquivo inválido. Por favor, envie um .xlsx', 'error');
                return;
            }
            setFile(droppedFile);
            setFileName(droppedFile.name);
            handleFileProcessing(droppedFile);
        }
    };

    const handleFileProcessing = (fileToProcess: File) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Lógica de validação placeholder
                const cursosSheet = workbook.Sheets['Cursos'];
                const turmasSheet = workbook.Sheets['Turmas'];
                const alunosSheet = workbook.Sheets['Alunos'];
                const professoresSheet = workbook.Sheets['Professores'];

                if (!cursosSheet || !turmasSheet || !alunosSheet || !professoresSheet) {
                    addToast('Planilha inválida. Faltam abas obrigatórias.', 'error');
                    setIsProcessing(false);
                    return;
                }

                const cursosData = XLSX.utils.sheet_to_json(cursosSheet);
                 const turmasData = XLSX.utils.sheet_to_json(turmasSheet);
                 const alunosData = XLSX.utils.sheet_to_json(alunosSheet);
                 const professoresData = XLSX.utils.sheet_to_json(professoresSheet);

                // TODO: Implementar validação detalhada aqui
                setValidationResults({
                    cursos: { count: cursosData.length, errors: 0 },
                    turmas: { count: turmasData.length, errors: 0 },
                    alunos: { count: alunosData.length, errors: 1 }, // Exemplo de erro
                    professores: { count: professoresData.length, errors: 0 },
                });

                addToast('Planilha processada com sucesso. Verifique a pré-visualização.', 'success');
                setCurrentStep(2);

            } catch (error) {
                addToast('Ocorreu um erro ao ler a planilha.', 'error');
                console.error(error);
                resetState();
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(fileToProcess);
    };

    const handleImport = async () => {
        addToast('Funcionalidade de importação final ainda não implementada.', 'info');
        // TODO: Implementar a lógica de escrita no Firestore
        // 1. Criar Professores (Auth + Firestore)
        // 2. Criar Alunos (Auth + Firestore)
        // 3. Criar Cursos
        // 4. Criar Turmas
        // 5. Vincular alunos às turmas
    };

    const resetState = () => {
        setFile(null);
        setFileName('');
        setValidationResults(null);
        setCurrentStep(1);
    }
    
    const totalErrors = validationResults ? Object.values(validationResults).reduce((acc: number, item: any) => acc + item.errors, 0) : 0;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Importação em Lote</h1>
                <p className="text-gray-400 mt-1">Cadastre cursos, turmas, professores e alunos de uma só vez usando uma planilha.</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8">
                {/* ETAPA 1: Download do Modelo e Upload */}
                {currentStep === 1 && (
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-white mb-4">Passo 1: Prepare e envie sua planilha</h2>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Para começar, baixe nosso modelo de planilha. Preencha com os dados da escola e depois faça o upload do arquivo preenchido aqui.</p>
                        
                        <a 
                            href={TEMPLATE_FILE_URL} 
                            download="MINDLI_Modelo_Importacao.xlsx"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors mb-10"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5"/>
                            Baixar Modelo de Planilha
                        </a>

                        <div 
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="relative block w-full rounded-lg border-2 border-dashed border-gray-600 p-12 text-center hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-500" />
                            <span className="mt-4 block font-semibold text-white">Arraste e solte o arquivo aqui</span>
                            <span className="block text-sm text-gray-400">ou</span>
                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-blue-400 hover:text-blue-300">
                                <span>selecione um arquivo</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx" onChange={handleFileChange} />
                            </label>
                             <p className="text-xs text-gray-500 mt-2">Apenas arquivos .xlsx</p>
                        </div>
                    </div>
                )}
                
                {/* ETAPA 2: Validação e Pré-visualização */}
                {currentStep === 2 && validationResults && (
                     <div className="text-center">
                        <h2 className="text-2xl font-semibold text-white mb-4">Passo 2: Validação e Pré-visualização</h2>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Analisamos sua planilha. Confira o resumo abaixo e, se tudo estiver correto, prossiga com a importação.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left mb-8">
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="font-bold text-lg text-white">Cursos</h3>
                                <p className="text-gray-300">{validationResults.cursos.count} registros encontrados</p>
                                {/* Fix: Cast errors to Number before comparison to avoid TypeScript error. */}
                                {Number(validationResults.cursos.errors) > 0 ? <p className="text-red-400 flex items-center gap-1"><XCircleIcon className="w-4 h-4" />{validationResults.cursos.errors} erros</p> : <p className="text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" />Nenhum erro</p>}
                            </div>
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="font-bold text-lg text-white">Professores</h3>
                                <p className="text-gray-300">{validationResults.professores.count} registros encontrados</p>
                                {/* Fix: Cast errors to Number before comparison to avoid TypeScript error. */}
                                {Number(validationResults.professores.errors) > 0 ? <p className="text-red-400 flex items-center gap-1"><XCircleIcon className="w-4 h-4" />{validationResults.professores.errors} erros</p> : <p className="text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" />Nenhum erro</p>}
                            </div>
                             <div className="bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="font-bold text-lg text-white">Turmas</h3>
                                <p className="text-gray-300">{validationResults.turmas.count} registros encontrados</p>
                                {/* Fix: Cast errors to Number before comparison to avoid TypeScript error. */}
                                {Number(validationResults.turmas.errors) > 0 ? <p className="text-red-400 flex items-center gap-1"><XCircleIcon className="w-4 h-4" />{validationResults.turmas.errors} erros</p> : <p className="text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" />Nenhum erro</p>}
                            </div>
                             <div className="bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="font-bold text-lg text-white">Alunos</h3>
                                <p className="text-gray-300">{validationResults.alunos.count} registros encontrados</p>
                                {/* Fix: Cast errors to Number before comparison to avoid TypeScript error. */}
                                {Number(validationResults.alunos.errors) > 0 ? <p className="text-red-400 flex items-center gap-1"><XCircleIcon className="w-4 h-4" />{validationResults.alunos.errors} erros</p> : <p className="text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" />Nenhum erro</p>}
                            </div>
                        </div>

                        {totalErrors > 0 && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-8 text-left">
                                <h4 className="font-bold">Erros Encontrados!</h4>
                                <p>Detectamos {totalErrors} erro(s) em sua planilha. Por favor, corrija o arquivo e faça o upload novamente para poder continuar. (Ex: Email 'aluno@.com' na linha 15 da aba 'Alunos' é inválido.)</p>
                            </div>
                        )}
                        
                        <div className="flex justify-center gap-4">
                             <button onClick={resetState} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">
                                Enviar Outro Arquivo
                            </button>
                            <button onClick={handleImport} disabled={totalErrors > 0 || isProcessing} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isProcessing ? 'Processando...' : `Confirmar e Importar`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Importacao;
