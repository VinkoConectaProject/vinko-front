import React from 'react';
import { MapPin, Phone, Mail, Calendar, DollarSign } from 'lucide-react';

interface HeroSectionProps {
  onNavigateToAuth: (mode: 'login' | 'register' | 'forgot') => void;
}

export function HeroSection({ onNavigateToAuth }: HeroSectionProps) {
  const handleRegister = () => {
    onNavigateToAuth('register');
  };

  return (
    <section className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Encontre ou ofereça
              <br />
              <span className="text-pink-500">serviços de moda</span> com
              <br />
              agilidade.
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Costureiras, modelistas, facções, designers... tudo isso e
              <br />
              muito mais em um só lugar.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleRegister}
              className="bg-pink-500 text-white px-8 py-4 rounded-lg hover:bg-pink-600 transition-colors font-semibold text-lg"
            >
              Quero me cadastrar
            </button>
          </div>

          {/* Right Content - Service Card */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Service Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-pink-500 rounded"></div>
                  <span className="font-medium text-gray-700">Nome do Profissional</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                </div>
              </div>

              {/* Service Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Produção de Peças Fitness
              </h3>
              <p className="text-sm text-gray-500 mb-4">Vinko Conecta</p>

              {/* Status Tabs */}
              <div className="flex space-x-2 mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Aberta</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Contactada</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Aceita</span>
              </div>

              {/* Service Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-4 h-4 mr-2 bg-pink-100 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded"></div>
                  </div>
                  <span>Confecção</span>
                  <span className="ml-auto">Malha</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-4 h-4 mr-2 bg-pink-100 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded"></div>
                  </div>
                  <span>300 Peças</span>
                  <span className="ml-auto">Até 20 dias</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-pink-500" />
                  <span>Belo Horizonte - MG</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-pink-500" />
                  <span>(31) 9 9999-9999</span>
                  <span className="ml-auto text-green-600 font-medium">R$ 4.500</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-pink-500" />
                  <span>contato@profissional.com</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                  <span>Criada em 22 de Abril</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg text-sm font-medium">
                  Entrar em contato
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">
                  Classificar
                </button>
                <button className="bg-pink-500 text-white py-2 px-4 rounded-lg text-sm font-medium">
                  Entrar em contato
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}