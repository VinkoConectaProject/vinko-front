import React from 'react';

export function HowItWorksSection() {
  return (
    <section id="para-quem" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Para quem é a VINKO?
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            A VINKO conecta quem busca profissionais da moda com quem oferece serviços, de
            forma simples e direta. Clientes, marcas e prestadores têm espaço garantido.
          </p>
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Clientes / Marcas */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mr-4">
                <div className="w-8 h-8 bg-pink-500 rounded-lg"></div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Clientes / Marcas</h3>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              Conecte-se com profissionais da moda
              qualificados sem burocracia.
            </p>
          </div>

          {/* Prestadores de Serviço */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mr-4">
                <div className="w-8 h-8 bg-pink-500 rounded-lg"></div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Prestadores de Serviço</h3>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              Ganhe visibilidade, receba pedidos de
              orçamento e amplie suas oportunidades.
            </p>
          </div>
        </div>

        {/* Platform Preview */}
        <div className="mt-16 bg-pink-500 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="text-3xl font-bold mb-4">Vinko <span className="font-normal">conecta</span></div>
            </div>
            
            {/* Mock Browser Windows */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Browser */}
              <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                <div className="bg-gray-100 px-4 py-2 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
                    vinko.com/inicio
                  </div>
                </div>
                <div className="p-4 text-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold">Vinko</div>
                    <div className="text-sm">Perfil</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Maria Paula - Prestador de Serviços</div>
                    <div className="text-xs text-gray-500">Última avaliação em 22 de Abril</div>
                    <div className="space-y-2">
                      <div className="text-xs">Dados Pessoais | Dados Comerciais | ...</div>
                      <div className="text-xs font-medium">Dados do Administrador</div>
                      <div className="text-xs">Nome Completo</div>
                      <div className="text-xs">Maria Paula</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Browser */}
              <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                <div className="bg-gray-100 px-4 py-2 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
                    vinko.com/inicio
                  </div>
                </div>
                <div className="p-4 text-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold">Vinko</div>
                    <div className="text-sm">Solicitações</div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Minhas Solicitações</div>
                    <div className="text-xs text-gray-500">Gerencie aqui todas as solicitações de serviço já criadas...</div>
                    <div className="flex space-x-4 text-xs">
                      <span className="text-gray-600">Todas</span>
                      <span className="text-gray-600">Abertas</span>
                      <span className="text-gray-600">Encerradas</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs font-medium">Produção de Peças Fitness</div>
                        <div className="text-xs text-green-600">Aberta</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs font-medium">Produção de Peças Moda Praia</div>
                        <div className="text-xs text-gray-600">Encerrada</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}