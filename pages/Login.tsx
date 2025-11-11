import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
  // Prefill apenas em modo demo controlado por variáveis de ambiente locais
  const isDemo = (import.meta as any).env?.VITE_DEMO_MODE === 'true';
  const demoEmail = (import.meta as any).env?.VITE_DEMO_EMAIL ?? '';
  const demoPassword = (import.meta as any).env?.VITE_DEMO_PASSWORD ?? '';

  const [email, setEmail] = useState(isDemo ? demoEmail : '');
  const [password, setPassword] = useState(isDemo ? demoPassword : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email ou senha inválidos.');
      } else {
        setError('Ocorreu um erro ao tentar fazer login.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 text-transparent bg-clip-text">
          MINDLI
        </h1>
        <p className="text-gray-400 mt-2">Educação Digital do Futuro</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password"className="block text-sm font-medium text-gray-300">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="********"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
              Lembrar-me
            </label>
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-blue-400 hover:text-blue-300">
              Esqueceu sua senha?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Entrar'
            )}
          </button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-sm text-gray-400">
        Não tem uma conta?{' '}
        <a href="#" className="font-medium text-blue-400 hover:text-blue-300">
          Cadastre-se
        </a>
      </p>
    </div>
  );
};

export default Login;