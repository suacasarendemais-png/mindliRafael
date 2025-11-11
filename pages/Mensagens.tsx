import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SearchIcon, PaperClipIcon, CheckIcon } from '../components/Icons';

const conversationsData = [
  { id: 1, name: 'Prof. Ana Silva', lastMessage: 'Não se esqueça da tarefa de amanhã!', time: '14:30', unread: 2, online: true },
  { id: 2, name: 'Grupo: Projeto de Biologia', lastMessage: 'Bruno: Eu já enviei minha parte.', time: '11:15', unread: 0, online: false },
  { id: 3, name: 'Carlos Souza', lastMessage: 'Valeu pela ajuda com o exercício!', time: 'Ontem', unread: 0, online: false },
  { id: 4, name: 'Secretaria da Escola', lastMessage: 'Aviso: As rematrículas estão abertas.', time: 'Sexta-feira', unread: 1, online: true },
];

const messagesData: { [key: number]: any[] } = {
  1: [
    { id: 1, text: 'Olá! Tenho uma dúvida sobre a última aula.', sender: 'me', time: '14:25' },
    { id: 2, text: 'Claro, pode perguntar.', sender: 'other', time: '14:26' },
    { id: 3, text: 'É sobre a fórmula de Bhaskara...', sender: 'me', time: '14:27' },
    { id: 4, text: 'Não se esqueça da tarefa de amanhã!', sender: 'other', time: '14:30' },
  ],
  2: [
    { id: 1, text: 'Pessoal, precisamos finalizar o projeto.', sender: 'other', time: '11:10' },
    { id: 2, text: 'Bruno: Eu já enviei minha parte.', sender: 'other', time: '11:15' },
  ]
};


const Mensagens: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(1);
  const [message, setMessage] = useState('');

  const activeConversation = conversationsData.find(c => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messagesData[activeConversationId] || [] : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;
    console.log("Sending message:", message);
    setMessage('');
    // Logic to add message to state would go here
  };
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Mensagens</h1>
        <p className="text-gray-400 mt-1">Converse com professores, alunos e a administração.</p>
      </div>
      <div className="flex-grow flex bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Buscar conversas..." className="w-full bg-gray-700/60 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none" />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {conversationsData.map(convo => (
              <div
                key={convo.id}
                onClick={() => setActiveConversationId(convo.id)}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-700/50 ${activeConversationId === convo.id ? 'bg-blue-600/20' : ''}`}
              >
                <div className="relative mr-4">
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center font-bold text-xl">
                    {convo.name.charAt(0)}
                  </div>
                  {convo.online && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-800" />}
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-semibold text-white truncate">{convo.name}</p>
                  <p className="text-sm text-gray-400 truncate">{convo.lastMessage}</p>
                </div>
                <div className="flex flex-col items-end text-xs text-gray-500 ml-2">
                  <p className="whitespace-nowrap">{convo.time}</p>
                  {convo.unread > 0 && (
                    <span className="mt-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {convo.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col">
          {activeConversation ? (
            <>
              <div className="p-4 border-b border-gray-700 flex items-center">
                <div className="relative mr-4">
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center font-bold text-xl">
                        {activeConversation.name.charAt(0)}
                    </div>
                    {activeConversation.online && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-800" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{activeConversation.name}</h2>
                  <p className="text-sm text-green-400">Online</p>
                </div>
              </div>
              <div className="flex-grow p-6 overflow-y-auto space-y-4">
                {activeMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'me' ? 'bg-blue-600 rounded-br-lg' : 'bg-gray-700 rounded-bl-lg'}`}>
                      <p className="text-white">{msg.text}</p>
                      <div className="flex justify-end items-center mt-1">
                        <span className="text-xs text-gray-300/70 mr-1">{msg.time}</span>
                        {msg.sender === 'me' && <CheckIcon className="w-4 h-4 text-cyan-300" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                  <button type="button" className="p-2 text-gray-400 hover:text-white"><PaperClipIcon className="w-6 h-6"/></button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-grow bg-gray-700/60 border border-gray-600 rounded-full px-4 py-3 text-white focus:outline-none"
                  />
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors">
                    Enviar
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              <p>Selecione uma conversa para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mensagens;