import React from 'react';

export function TestimonialsSection() {
  return (
    <section id="como-funciona" className="py-20 lg:py-32 bg-pink-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-pink-200 font-medium mb-4">Como Funciona:</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8">
            Facilitamos sua rotina no mundo
            <br />
            da moda!
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Feature 1 */}
          <div className="bg-pink-400 rounded-2xl p-8">
            <div className="text-6xl font-bold text-pink-300 mb-4">1</div>
            <h3 className="text-2xl font-bold mb-4">Conexão Direta</h3>
            <p className="text-pink-100 leading-relaxed">
              Nada de intermediários. Aqui, marcas e
              prestadores se falam diretamente, combinam
              serviços e fecham parcerias do seu jeito.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-pink-400 rounded-2xl p-8">
            <div className="text-6xl font-bold text-pink-300 mb-4">2</div>
            <h3 className="text-2xl font-bold mb-4">Cadastro Gratuito</h3>
            <p className="text-pink-100 leading-relaxed">
              Você cria seu perfil em poucos minutos, sem
              taxas ou etapas complexas — seja para
              contratar ou para oferecer serviços.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-pink-400 rounded-2xl p-8">
            <div className="text-6xl font-bold text-pink-300 mb-4">3</div>
            <h3 className="text-2xl font-bold mb-4">Profissionais</h3>
            <p className="text-pink-100 leading-relaxed">
              Encontre prestadores qualificados de diversas
              regiões, especialidades e interesses,
              ampliando suas possibilidades de produção.
            </p>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature 4 */}
          <div className="bg-pink-400 rounded-2xl p-8">
            <div className="text-6xl font-bold text-pink-300 mb-4">4</div>
            <h3 className="text-2xl font-bold mb-4">Perfil completo para prestadores</h3>
            <p className="text-pink-100 leading-relaxed">
              Prestadores têm perfil organizado e detalhado, com serviços oferecidos,
              localização, maquinário e disponibilidade — tudo para facilitar a decisão de
              quem contrata.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-pink-400 rounded-2xl p-8">
            <div className="text-6xl font-bold text-pink-300 mb-4">5</div>
            <h3 className="text-2xl font-bold mb-4">Filtros avançados para clientes PRO</h3>
            <p className="text-pink-100 leading-relaxed">
              Clientes/Marcas com plano PRO podem buscar profissionais com filtros por
              serviço, região, maquinário, palavras-chave e muito mais — contratando
              com mais agilidade, precisão e acesso a perfis ilimitados.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}