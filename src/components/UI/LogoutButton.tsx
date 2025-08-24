import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LogoutButtonProps {
  variant?: 'default' | 'minimal' | 'text';
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ 
  variant = 'default', 
  className = '',
  children 
}: LogoutButtonProps) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const baseClasses = 'flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium',
    minimal: 'p-2 text-red-600 hover:bg-red-50 rounded-lg',
    text: 'text-red-600 hover:text-red-700 font-medium underline'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button 
      onClick={handleLogout}
      className={buttonClasses}
      title="Sair da aplicação"
    >
      {variant !== 'text' && <LogOut className="h-4 w-4 mr-2" />}
      {children || 'Sair'}
    </button>
  );
}
