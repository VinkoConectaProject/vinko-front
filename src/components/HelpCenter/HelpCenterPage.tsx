import React, { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle, MessageCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FAQItem[];
}

export function HelpCenterPage() {
  const { getUserType } = useAuth();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const professionalFAQs: FAQCategory[] = [
    {
      title: 'Cadastro e Perfil',
      icon: HelpCircle,
      items: [
        {
          question: 'Como editar meus dados de perfil?',
          answer: 'Acesse o menu lateral e clique em "Perfil". Lá, você pode atualizar nome, e-mail, telefone e localização. Após editar, clique em "Salvar".'
        },
        {
          question: 'Como atualizar meu maquinário?',
          answer: 'Dentro do menu "Perfil", na aba "Maquinário", selecione ou desmarque os equipamentos que você possui e clique em "Salvar".'
        }
      ]
    },
    {
      title: 'Interesses e Serviços',
      icon: HelpCircle,
      items: [
        {
          question: 'Como adicionar ou remover os serviços que ofereço?',
          answer: 'Vá até o menu "Perfil" e clique na aba "Interesses". Marque os serviços que você oferece e clique em "Salvar".'
        },
        {
          question: 'Posso alterar os serviços depois de cadastrar?',
          answer: 'Sim. Basta voltar na aba "Interesses" sempre que quiser ajustar os serviços disponíveis.'
        }
      ]
    },
    {
      title: 'Demandas Recebidas',
      icon: HelpCircle,
      items: [
        {
          question: 'Onde vejo as solicitações de clientes/marcas?',
          answer: 'As solicitações ficam disponíveis no menu "Demanda". Você verá as informações básicas da solicitação e poderá decidir se quer entrar em contato.'
        },
        {
          question: 'Como entro em contato com o cliente/marca?',
          answer: 'O contato é feito diretamente via WhatsApp. Cada solicitação no menu "Demanda" exibe o número de contato do cliente/marca para facilitar o envio de mensagem.'
        }
      ]
    },
    {
      title: 'Funcionalidades da Plataforma',
      icon: HelpCircle,
      items: [
        {
          question: 'Preciso pagar alguma coisa para usar a VINKO?',
          answer: 'Não. Toda a utilização por parte de prestadores de serviço é 100% gratuita.'
        },
        {
          question: 'Consigo saber se fui escolhido para um orçamento?',
          answer: 'Como o contato é direto via WhatsApp, o cliente/marca entrará em contato com você caso queira fechar o orçamento.'
        }
      ]
    },
    {
      title: 'Suporte Técnico',
      icon: HelpCircle,
      items: [
        {
          question: 'Estou com problema técnico, o que faço?',
          answer: 'Acesse a Central de Dúvidas e vá até a categoria "Suporte Técnico". Clique na opção "Falar com Suporte" e você será redirecionado ao WhatsApp da equipe VINKO.'
        }
      ]
    },
    {
      title: 'Outras Dúvidas',
      icon: HelpCircle,
      items: [
        {
          question: 'Preciso estar sempre disponível na plataforma?',
          answer: 'Não. Você acessa quando desejar. Apenas mantenha seu perfil atualizado para que os clientes/marcas encontrem seus serviços.'
        }
      ]
    }
  ];

  const clientFAQs: FAQCategory[] = [
    {
      title: 'Cadastro e Perfil',
      icon: HelpCircle,
      items: [
        {
          question: 'Como editar meus dados de perfil?',
          answer: 'Para editar seus dados de perfil, acesse o menu "Perfil" na sua área logada e clique em "Editar Perfil". Você poderá atualizar informações como nome, CPF, telefone, e endereço. Após realizar as alterações, clique em "Salvar" para que as mudanças sejam aplicadas.'
        }
      ]
    },
    {
      title: 'Planos e Preços',
      icon: HelpCircle,
      items: [
        {
          question: 'Qual é a diferença entre o Plano Basic e o Plano PRO?',
          answer: 'O Plano Basic permite que você crie solicitações e visualize solicitações que criou anteriormente, com status "Aberto" e "Fechado". Já o Plano PRO permite que você busque prestadores de serviços ativamente através do menu "Profissionais" e entre em contato diretamente com eles. O Plano PRO oferece funcionalidades exclusivas para uma interação mais dinâmica com os prestadores de serviços.'
        },
        {
          question: 'Como assinar o Plano PRO?',
          answer: 'Para assinar o Plano PRO, vá até o menu "Plano" e selecione a opção Plano PRO. Você será redirecionado para a página de pagamento. Após o pagamento, sua conta será atualizada automaticamente para o Plano PRO.'
        },
        {
          question: 'Posso trocar de plano?',
          answer: 'Sim! Se você estiver no Plano Basic, pode fazer o upgrade para o Plano PRO a qualquer momento. Basta acessar a seção "Plano" e seguir as instruções de pagamento.'
        }
      ]
    },
    {
      title: 'Funcionalidades da Plataforma',
      icon: HelpCircle,
      items: [
        {
          question: 'Como criar uma solicitação?',
          answer: 'Para criar uma solicitação, acesse o menu "Solicitações" e clique em "Criar Solicitação". Preencha os detalhes da solicitação, como tipo de serviço, e aguarde que os prestadores de serviços interessados entrem em contato com você.'
        },
        {
          question: 'Como encerrar uma solicitação?',
          answer: 'Para encerrar uma solicitação, acesse o menu "Solicitações", selecione a solicitação que deseja encerrar e clique na opção "Encerrar Solicitação". O prestador de serviço será notificado sobre o encerramento.'
        }
      ]
    },
    {
      title: 'Pagamentos e Planos',
      icon: HelpCircle,
      items: [
        {
          question: 'Como será cobrado o meu plano?',
          answer: 'O pagamento do seu plano será debitado conforme a modalidade escolhida no momento da contratação (Pix, Cartão de Crédito ou Boleto). Não geramos faturas, mas o pagamento será realizado automaticamente conforme a escolha do método. A renovação do plano deverá ser feita ativamente pelo usuário, e a data de expiração estará visível no menu "Plano".'
        }
      ]
    },
    {
      title: 'Suporte Técnico',
      icon: HelpCircle,
      items: [
        {
          question: 'Como solucionar problemas técnicos na plataforma?',
          answer: 'Se você estiver enfrentando problemas técnicos, tente acessar a Central de Dúvidas para ver se a sua dúvida já foi respondida. Caso não encontre a resposta que precisa, clique no botão "Falar com Suporte" abaixo e nossa equipe de suporte via WhatsApp estará pronta para te ajudar.'
        }
      ]
    },
    {
      title: 'Outras Dúvidas',
      icon: HelpCircle,
      items: [
        {
          question: 'Como posso atualizar minhas informações comerciais?',
          answer: 'Caso precise atualizar informações comerciais, como nome fantasia, CNPJ, entre outros, você deverá acessar o menu "Perfil" e editar seus dados na sessão "Dados Comerciais".'
        }
      ]
    }
  ];

  const faqs = getUserType() === 'PROFISSIONAL' ? professionalFAQs : clientFAQs;

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategory(expandedCategory === categoryTitle ? null : categoryTitle);
  };

  const toggleItem = (itemId: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    setExpandedItems(newExpandedItems);
  };

  const handleSupportClick = () => {
    // Redirecionar para WhatsApp da equipe VINKO
    window.open('https://wa.me/5511999999999?text=Olá! Preciso de ajuda com a plataforma VINKO.', '_blank');
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Central de Dúvidas</h1>
        <p className="text-gray-600">
          Encontre respostas para as principais dúvidas sobre a plataforma VINKO
        </p>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-4">
        {faqs.map((category, categoryIndex) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.title;
          
          return (
            <div key={categoryIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-pink-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-200">
                  {category.items.map((item, itemIndex) => {
                    const itemId = `${categoryIndex}-${itemIndex}`;
                    const isItemExpanded = expandedItems.has(itemId);
                    
                    return (
                      <div key={itemIndex} className="border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-700 pr-4">
                            {item.question}
                          </span>
                          {isItemExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        
                        {isItemExpanded && (
                          <div className="px-4 pb-4">
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Section */}
      <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-lg text-white">
        <h3 className="text-xl font-semibold mb-2">Suporte VINKO</h3>
        <p className="text-orange-100 mb-4">
          Precisa de ajuda? Nossa equipe está aqui para você
        </p>
        
        <button
          onClick={handleSupportClick}
          className="bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          <span>Falar com Suporte</span>
        </button>
      </div>
    </div>
  );
} 
