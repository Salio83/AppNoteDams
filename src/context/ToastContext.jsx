import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast variants with icons and colors
const variants = {
    success: {
        icon: CheckCircle,
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
        iconClass: 'text-emerald-500',
        textClass: 'text-emerald-800 dark:text-emerald-200'
    },
    error: {
        icon: AlertCircle,
        bgClass: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
        iconClass: 'text-rose-500',
        textClass: 'text-rose-800 dark:text-rose-200'
    },
    warning: {
        icon: AlertTriangle,
        bgClass: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
        iconClass: 'text-orange-500',
        textClass: 'text-orange-800 dark:text-orange-200'
    },
    info: {
        icon: Info,
        bgClass: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
        iconClass: 'text-blue-500',
        textClass: 'text-blue-800 dark:text-blue-200'
    }
};

// Individual Toast component
const Toast = ({ id, message, variant = 'info', onDismiss }) => {
    const config = variants[variant] || variants.info;
    const Icon = config.icon;

    return (
        <div
            className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slideUp',
                config.bgClass
            )}
            role="alert"
        >
            <Icon className={clsx('w-5 h-5 flex-shrink-0', config.iconClass)} />
            <p className={clsx('flex-1 text-sm font-medium', config.textClass)}>
                {message}
            </p>
            <button
                onClick={() => onDismiss(id)}
                className={clsx(
                    'p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors',
                    config.textClass
                )}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Toast container (fixed bottom-right)
const ToastContainer = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, variant = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, variant }]);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        }

        return id;
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Convenience methods
    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
        dismiss: dismissToast,
        dismissAll: () => setToasts([])
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
};
