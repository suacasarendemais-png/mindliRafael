import React, { useState, useCallback, useContext, createContext, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { XIcon, CheckCircleIcon, XCircleIcon } from './Icons';

// Define types
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}
interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ToastProvider component
let toastId = 0;
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = toastId++;
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000); // Auto-dismiss after 5 seconds
  }, []);

  const removeToast = (id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <Toaster toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Custom hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toaster container component
const Toaster: React.FC<{ toasts: Toast[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  return ReactDOM.createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-sm">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  );
};

// Single Toast component
const ToastComponent: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const toastStyles = {
    success: {
      icon: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
      bg: 'bg-green-500/10 border-green-500/30',
    },
    error: {
      icon: <XCircleIcon className="w-6 h-6 text-red-400" />,
      bg: 'bg-red-500/10 border-red-500/30',
    },
    info: {
      icon: <div className="w-6 h-6 text-blue-400">i</div>, // Placeholder
      bg: 'bg-blue-500/10 border-blue-500/30',
    },
  };

  const style = toastStyles[toast.type];

  return (
    <div className={`flex items-start p-4 rounded-lg shadow-lg border backdrop-blur-sm animate-toast-in bg-gray-800/80 ${style.bg}`}>
      <div className="flex-shrink-0">{style.icon}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-200">{toast.message}</p>
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button 
          onClick={onDismiss} 
          className="inline-flex text-gray-400 rounded-md hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          aria-label="Close"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
