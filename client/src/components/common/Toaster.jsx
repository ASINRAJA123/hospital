import { useState, useEffect, useCallback } from 'react';

let toastEmitter = null;

export const toast = {
  success: (message) => toastEmitter?.(message, 'success'),
  error: (message) => toastEmitter?.(message, 'error'),
  info: (message) => toastEmitter?.(message, 'info'),
};

export const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    toastEmitter = addToast;
    return () => {
      toastEmitter = null;
    };
  }, [addToast]);
  
  const getBgColor = (type) => {
    switch(type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-indigo-500';
    }
  }

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] space-y-2 flex flex-col items-center sm:items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-6 py-3 rounded-lg text-white shadow-lg text-sm w-full max-w-sm sm:w-auto ${getBgColor(toast.type)} animate-fade-in-right`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};