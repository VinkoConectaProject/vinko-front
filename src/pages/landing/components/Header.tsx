import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onNavigateToAuth: (mode: 'login' | 'register' | 'forgot') => void;
}

export function Header({ onNavigateToAuth }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = () => {
    onNavigateToAuth('login');
  };

  const handleRegister = () => {
    onNavigateToAuth('register');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-900">
              Vinko <span className="text-pink-500 font-normal">conecta</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#como-funciona" className="text-gray-600 hover:text-pink-500 transition-colors font-medium">
              Como Funciona
            </a>
            <a href="#oportunidades" className="text-gray-600 hover:text-pink-500 transition-colors font-medium">
              Oportunidades
            </a>
            <a href="#precos" className="text-gray-600 hover:text-pink-500 transition-colors font-medium">
              Preço
            </a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleRegister}
              className="text-pink-500 hover:text-pink-600 font-medium transition-colors"
            >
              Quero me cadastrar
            </button>
            <button
              onClick={handleLogin}
              className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors font-medium"
            >
              Fazer Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <a 
                href="#como-funciona" 
                className="text-gray-600 hover:text-pink-500 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Como Funciona
              </a>
              <a 
                href="#oportunidades" 
                className="text-gray-600 hover:text-pink-500 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Oportunidades
              </a>
              <a 
                href="#precos" 
                className="text-gray-600 hover:text-pink-500 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Preço
              </a>
              <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleRegister}
                  className="text-pink-500 hover:text-pink-600 font-medium transition-colors text-left"
                >
                  Quero me cadastrar
                </button>
                <button
                  onClick={handleLogin}
                  className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium text-center"
                >
                  Fazer Login
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}