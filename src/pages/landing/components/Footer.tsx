import React from 'react';
import { Facebook, Instagram, Linkedin, Mail, MessageCircle, Phone } from 'lucide-react';

interface FooterProps {
  onNavigateToAuth: (mode: 'login' | 'register' | 'forgot') => void;
}

export function Footer({ onNavigateToAuth }: FooterProps) {
  const handleWhatsAppClick = () => {
    const phone = '5548988254592';
    const message = 'Olá! Gostaria de saber mais sobre a plataforma VINKO.';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/vinkoconecta', '_blank');
  };

  const handleFacebookClick = () => {
    window.open('https://www.facebook.com/share/1BRJxyGdLK/?mibextid=wwXIfr', '_blank');
  };

  const handleLinkedInClick = () => {
    window.open('https://www.linkedin.com/company/vinkoconecta', '_blank');
  };

  const handleEmailClick = () => {
    window.open('mailto:contato@vinkoconecta.com.br', '_blank');
  };

  const handlePhoneClick = () => {
    const phone = '5548988254592';
    const message = 'Olá! Gostaria de saber mais sobre a plataforma VINKO.';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <footer className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo */}
          <div className="md:col-span-1">
            <div className="text-2xl font-bold text-gray-900">
              Vinko <span className="text-pink-500 font-normal">conecta</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato</h3>
            <button
              onClick={handleEmailClick}
              className="flex items-center text-gray-600 hover:text-pink-500 transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              contato@vinkoconecta.com.br
            </button>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suporte</h3>
            <button
              onClick={handlePhoneClick}
              className="flex items-center text-gray-600 hover:text-green-500 transition-colors"
            >
              <Phone className="h-4 w-4 mr-2 text-green-500" />
              (48) 98825-4592
            </button>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociais</h3>
            <div className="flex space-x-4">
              <button
                onClick={handleFacebookClick}
                className="w-10 h-10 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-colors"
                title="Facebook"
              >
                <Facebook className="h-5 w-5" fill="currentColor" />
              </button>
              
              <button
                onClick={handleInstagramClick}
                className="w-10 h-10 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" fill="currentColor" />
              </button>
              
              <button
                onClick={handleLinkedInClick}
                className="w-10 h-10 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="h-5 w-5" fill="currentColor" />
              </button>
            </div>
          </div>
        </div>

        {/* Copyright and Links */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4 text-sm text-gray-500">
            <span>Copyright © 2025 Vinko Conecta</span>
            <span className="hidden md:inline">|</span>
            <span>Todos os Direitos Reservados</span>
            <span className="hidden md:inline">|</span>
            <button 
              className="hover:text-pink-500 transition-colors"
              onClick={() => {}}
            >
              Termos de Uso
            </button>
            <span className="hidden md:inline">|</span>
            <button 
              className="hover:text-pink-500 transition-colors"
              onClick={() => {}}
            >
              Políticas de Privacidade
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}