import React from 'react';
import { UserPlus, FileText, MessageSquare } from 'lucide-react';

interface FeaturesSectionProps {
  onNavigateToAuth: (mode: 'login' | 'register' | 'forgot') => void;
}

export function FeaturesSection({ onNavigateToAuth }: FeaturesSectionProps) {
  const handleRegister = () => {
    onNavigateToAuth('register');
  };

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-pink-500 font-medium mb-4">Funcionamento</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Entenda como a VINKO facilita
            <br />
            sua rotina na moda
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Em 3 passos...
          </p>
          <p className="text-gray-600 max-w-4xl mx-auto">
            Em poucos passos, você já pode usar a VINKO para encontrar
            profissionais da moda ou divulgar seus serviços. Tudo foi
            pensado para ser simples, direto e acessível para quem vive o
            dia a dia da moda.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserPlus className="h-10 w-10 text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Cadastre-se Gratuitamente
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Crie seu perfil como cliente ou prestador
              de serviço e comece a explorar a
              plataforma sem custos.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Publique ou receba solicitações
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Se você precisa contratar, publique o que
              procura. Se oferece serviços, receba
              pedidos direto no seu perfil.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-10 w-10 text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Conecte-se
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Converse, negocie e feche parcerias com
              quem entende do mercado da moda.
              Tudo em um só lugar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}