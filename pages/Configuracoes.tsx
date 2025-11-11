import React, { useState } from 'react';

const Configuracoes: React.FC = () => {
    const [activeTab, setActiveTab] = useState('perfil');

    const tabs = [
        { id: 'perfil', label: 'Perfil Pessoal' },
        { id: 'seguranca', label: 'Segurança' },
        { id: 'notificacoes', label: 'Notificações' },
        { id: 'preferencias', label: 'Preferências' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'perfil':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                            <input type="text" defaultValue="Aluno Teste" className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input type="email" defaultValue="aluno@mindli.com" disabled className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white disabled:opacity-50" />
                        </div>
                    </div>
                );
            case 'seguranca':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Senha Atual</label>
                            <input type="password" placeholder="********" className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nova Senha</label>
                            <input type="password" placeholder="********" className="w-full bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                    </div>
                );
            case 'notificacoes':
                 return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                            <div>
                                <h4 className="font-semibold text-white">Novas mensagens</h4>
                                <p className="text-sm text-gray-400">Receber notificações por email sobre novas mensagens.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                         <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                            <div>
                                <h4 className="font-semibold text-white">Lembretes de avaliações</h4>
                                <p className="text-sm text-gray-400">Receber emails sobre próximas avaliações.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                );
            case 'preferencias':
                 return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Idioma</label>
                            <select className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white">
                                <option>Português (Brasil)</option>
                                <option>English</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
                             <select className="w-full appearance-none bg-gray-700/60 border border-gray-600 rounded-lg px-4 py-2 text-white">
                                <option>Escuro</option>
                                <option>Claro</option>
                            </select>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Configurações</h1>
                <p className="text-gray-400 mt-1">Gerencie suas preferências e informações da conta.</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="border-b border-gray-700">
                    <nav className="flex space-x-2 p-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-6">
                    {renderContent()}
                    <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end">
                        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Configuracoes;