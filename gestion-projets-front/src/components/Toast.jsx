import React, { useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', surFermer }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      surFermer();
    }, 4500); // Fermeture automatique après 4.5 secondes

    return () => clearTimeout(timer);
  }, [surFermer]);

  const obtenirIcone = () => {
    switch (type) {
      case 'mail':
        return <Mail size={20} className="text-warning" />;
      case 'error':
        return <AlertCircle size={20} className="text-danger" />;
      default:
        return <CheckCircle2 size={20} className="text-success" />;
    }
  };

  const obtenirBordure = () => {
    switch (type) {
      case 'mail':
        return 'border-warning';
      case 'error':
        return 'border-danger';
      default:
        return 'border-success';
    }
  };

  return (
    <div 
      className={`position-fixed bottom-0 end-0 m-4 card bg-white text-dark border shadow-lg rounded-3 ${obtenirBordure()} slide-in`}
      style={{ 
        zIndex: 2000, 
        maxWidth: '350px',
        animation: 'toast-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div className="card-body p-3 d-flex align-items-center gap-3">
        <div className="flex-shrink-0">
          {obtenirIcone()}
        </div>
        <div className="flex-grow-1 fs-7 fw-medium text-dark">
          {message}
        </div>
        <button 
          type="button" 
          className="btn btn-sm btn-link text-secondary p-0 m-0 border-0" 
          onClick={surFermer}
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Barre de progression d'expiration du toast */}
      <div 
        className={`position-absolute bottom-0 start-0 ${type === 'mail' ? 'bg-warning' : type === 'error' ? 'bg-danger' : 'bg-success'}`}
        style={{
          height: '3px',
          width: '100%',
          animation: 'toast-progress 4.5s linear forwards',
          transformOrigin: 'left'
        }}
      />
    </div>
  );
}
