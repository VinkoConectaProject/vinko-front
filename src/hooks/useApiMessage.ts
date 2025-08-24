import { useState, useCallback } from 'react';
import { sanitizeErrorMessage, ERROR_MESSAGES } from '../config/errorMessages';

interface ApiMessage {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

export const useApiMessage = () => {
  const [apiMessage, setApiMessage] = useState<ApiMessage>({
    message: '',
    type: 'info',
    show: false
  });

  const showMessage = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Aplicar sanitização apenas para mensagens de erro
    const sanitizedMessage = type === 'error' ? sanitizeErrorMessage(message) : message;
    
    setApiMessage({
      message: sanitizedMessage,
      type,
      show: true
    });

    // Auto-hide todas as mensagens após 5 segundos
    setTimeout(() => {
      setApiMessage(prev => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  const hideMessage = useCallback(() => {
    setApiMessage(prev => ({ ...prev, show: false }));
  }, []);

  const handleApiError = useCallback((error: any) => {
    let message = ERROR_MESSAGES.UNEXPECTED_ERROR;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }

    showMessage(message, 'error');
  }, [showMessage]);

  const handleApiSuccess = useCallback((message: string) => {
    showMessage(message, 'success');
  }, [showMessage]);

  return {
    apiMessage,
    showMessage,
    hideMessage,
    handleApiError,
    handleApiSuccess
  };
};
