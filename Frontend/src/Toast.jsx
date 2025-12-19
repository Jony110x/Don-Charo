import { useState, createContext, useContext } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

// Context para gestionar los toasts globalmente
const ToastContext = createContext();

// Hook personalizado para usar toasts
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};

// Provider que envuelve la aplicación
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    const duration = type === 'success' ? 2000 : 3000;
    
    setToasts(prev => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message) => addToast(message, 'success'),
    warning: (message) => addToast(message, 'warning'),
    error: (message) => addToast(message, 'error'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Contenedor de toasts
const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

// Componente individual de Toast
const Toast = ({ message, type, onClose }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: '#10b981',
      shadowColor: 'rgba(16, 185, 129, 0.4)',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: '#f59e0b',
      shadowColor: 'rgba(245, 158, 11, 0.4)',
    },
    error: {
      icon: AlertCircle,
      bgColor: '#ef4444',
      shadowColor: 'rgba(239, 68, 68, 0.4)',
    },
  };

  const { icon: Icon, bgColor, shadowColor } = config[type];

  return (
    <div 
      className="toast"
      style={{
        '--bg-color': bgColor,
        '--shadow-color': shadowColor,
      }}
    >
      <div className="toast-icon">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <p className="toast-message">{message}</p>
      <button className="toast-close" onClick={onClose} aria-label="Cerrar">
        <X size={18} />
      </button>
    </div>
  );
};

// Estilos CSS embebidos
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@400;600&display=swap');

  .toast-container {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-color);
    color: white;
    padding: 14px 18px;
    border-radius: 12px;
    box-shadow: 
      0 4px 12px var(--shadow-color),
      0 2px 4px rgba(0, 0, 0, 0.1);
    min-width: 320px;
    max-width: 420px;
    font-family: 'Outfit', sans-serif;
    position: relative;
    overflow: hidden;
    
    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .toast::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: rgba(255, 255, 255, 0.5);
  }

  .toast.removing {
    animation: slideOut 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }

  @keyframes slideIn {
    from {
      transform: translateX(calc(100% + 24px));
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0) scale(1);
      opacity: 1;
    }
    to {
      transform: translateX(calc(100% + 24px)) scale(0.9);
      opacity: 0;
    }
  }

  .toast-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    backdrop-filter: blur(8px);
  }

  .toast-message {
    flex: 1;
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    letter-spacing: 0.01em;
  }

  .toast-close {
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.05);
  }

  .toast-close:active {
    transform: scale(0.95);
  }

  @media (max-width: 640px) {
    .toast-container {
      left: 12px;
      right: 12px;
      top: 12px;
    }

    .toast {
      min-width: unset;
      max-width: unset;
    }
  }
`;

// Inyectar estilos en el documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Toast;