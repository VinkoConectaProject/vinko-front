import React from 'react';

interface FooterProps {
  onNavigateToAuth: (mode: 'login' | 'register' | 'forgot') => void;
}

export function Footer({ onNavigateToAuth }: FooterProps) {
  const handleLogin = () => {
    onNavigateToAuth('login');
  };

  const handleRegister = () => {
    onNavigateToAuth('register');
  };

  return (
    <section className="py-20 lg:py-32 bg-pink-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-pink-200 font-medium mb-4">Quem somos</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8">
            Unimos moda, pessoas e propósito.
          </h2>
          <p className="text-xl text-pink-100 max-w-4xl mx-auto mb-8">
            Na VINKO, acreditamos que a moda vai muito além da criação — ela transforma vidas,
            movimenta economias e conecta talentos. Por isso, criamos uma plataforma que facilita
            essas conexões de forma transparente, segura e eficiente.
          </p>
          <p className="text-pink-100 max-w-2xl mx-auto">
            Conheça o que nos move:
          </p>
        </div>

        {/* Mission and Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Mission */}
          <div className="bg-pink-400 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-yellow-400 rounded-full mr-3"></div>
              <h3 className="text-2xl font-bold">Missão</h3>
            </div>
            <p className="text-pink-100 leading-relaxed">
              Conectar profissionais, marcas e fornecedores da cadeia da
              moda. Criamos um ambiente onde negócios acontecem, talentos
              são valorizados e oportunidades se tornam realidade — com
              simplicidade, segurança e transparência.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-pink-400 rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-yellow-400 rounded-full mr-3"></div>
              <h3 className="text-2xl font-bold">Visão</h3>
            </div>
            <p className="text-pink-100 leading-relaxed">
              Ser o maior ecossistema digital da moda na América Latina.
              Reunindo serviços, produtos e pessoas para impulsionar o
              desenvolvimento profissional e o crescimento econômico em
              cada elo da indústria.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="bg-pink-400 rounded-2xl p-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-yellow-400 rounded-full mr-3"></div>
            <h3 className="text-2xl font-bold">Nossos Valores</h3>
          </div>
          <p className="text-pink-100 mb-6">
            Acreditamos que <strong>CONFIAR</strong> é a base de tudo.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">C – Compromisso com o sucesso do outro</h4>
                <p className="text-pink-100 text-sm">
                  Nosso crescimento é o reflexo do sucesso de quem está com a gente.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">O – Oportunidades para todos</h4>
                <p className="text-pink-100 text-sm">
                  Democratizamos o acesso ao trabalho e ao talento.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">N – Nobreza nas relações</h4>
                <p className="text-pink-100 text-sm">
                  Agimos com respeito, ética e integridade.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">F – Foco em inovação com propósito</h4>
                <p className="text-pink-100 text-sm">
                  Tecnologia a serviço da vida real e das conexões humanas.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2">I – Integridade</h4>
                <p className="text-pink-100 text-sm">
                  Atuamos com clareza, transparência e verdade.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">A – Acolhimento</h4>
                <p className="text-pink-100 text-sm">
                  Criamos um ambiente empático, seguro e inclusivo.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">R – Responsabilidade</h4>
                <p className="text-pink-100 text-sm">
                  Levamos a sério nosso impacto social e produtivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}