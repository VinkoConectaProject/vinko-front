import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ApiMessageProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const ApiMessage: React.FC<ApiMessageProps> = ({ 
  message, 
  type, 
  onClose 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-300';
      case 'error':
        return 'bg-red-100 border-red-300';
      case 'info':
        return 'bg-blue-100 border-blue-300';
      default:
        return 'bg-blue-100 border-blue-300';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-auto mx-4">
      <div className={`${getBgColor()} border rounded-lg p-4 shadow-lg`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {message}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
