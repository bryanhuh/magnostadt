import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  variant?: 'danger' | 'default';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmDialogProps) {
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full flex-shrink-0 ${
              variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 leading-6">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex justify-center rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 ${
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600' 
                : 'bg-black hover:bg-gray-800 focus-visible:outline-black'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all active:scale-95 sm:mt-0 sm:w-auto"
          >
            {cancelText}
          </button>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
