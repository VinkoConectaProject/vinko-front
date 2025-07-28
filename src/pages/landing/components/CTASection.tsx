import React, { useState } from 'react';
import { Search, MapPin, Phone, Mail } from 'lucide-react';

interface CTASectionProps {
  onNavigateToAuth: (mode: 'login' | 'register' | 'forgot') => void;
}

export function CTASection({ onNavigateToAuth }: CTASectionProps) {
  const [activeTab, setActiveTab] = useState('cliente');

  const handleRegister = () => {
    onNavigateToAuth('register');
  };

  return (
    <section id="oportunidades" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-pink-500 font-medium mb-4">Oportunidades</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Experimente a VINKO na prática
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Veja como funciona a plataforma, seja você uma marca em busca de parceiros ou um
            prestador pronto para novos trabalhos. Navegue e entenda a experiência de cada perfil.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('prestador')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'prestador'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Prestador de Serviços
            </button>
            <button
              onClick={() => setActiveTab('cliente')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'cliente'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cliente/Marca
            </button>
          </div>
        </div>

        {/* Plano PRO Badge */}
        <div className="flex justify-end mb-6">
          <div className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center">
            <span className="mr-2">✓</span>
            <span className="font-medium">Plano PRO</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Procurar"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
            <option>Área de Atuação</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
            <option>Cidade</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
            <option>Estado</option>
          </select>
        </div>

        {/* Professional Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nome do Prestador de Serviço
              </h3>
              <p className="text-gray-600 mb-4">Tipo de Serviço</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-4 h-4 mr-3 bg-pink-100 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded"></div>
                  </div>
                  <span>Confecção sob medida</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-4 h-4 mr-3 bg-pink-100 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded"></div>
                  </div>
                  <span>Moda Feminina</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-4 h-4 mr-3 bg-pink-100 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-pink-500 rounded"></div>
                  </div>
                  <span>Vestidos de festa</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-3 text-pink-500" />
                  <span>Belo Horizonte – MG</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-3 text-pink-500" />
                  <span>(31) 9 9999-9999</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-pink-500" />
                  <span>contato@profissional.com</span>
                </div>
              </div>

              <button
                onClick={handleRegister}
                className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium"
              >
                Entrar em contato
              </button>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button
            onClick={handleRegister}
            className="bg-pink-500 text-white px-8 py-4 rounded-lg hover:bg-pink-600 transition-colors font-semibold text-lg"
          >
            Quero me cadastrar agora
          </button>
        </div>
      </div>
    </section>
  );
}