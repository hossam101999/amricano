import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 ${bgColor} text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm sm:text-base">{message}</span>
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="h-8 w-8 rounded-full text-white/90 hover:text-white hover:bg-white/10 font-bold text-lg leading-none transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast;
