import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Calendar, User, MessageSquare, CheckCircle, Clock, Star, DollarSign, X, MapPin, Heart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { demandService } from '../../services/demandService';
import { Demand } from '../../types';

export function MyJobsPage() {
  const { state } = useApp();
  const { getCurrentUser, getUserId, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [activeJobs, setActiveJobs] = useState<Demand[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Demand[]>([]);
  const [interestedJobs, setInterestedJobs] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    interested: 0,
    total: 0
  });
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);

  const currentUserId = parseInt(getUserId() || '0');

  // Debug: verificar estado do usuário
  console.log('MyJobsPage - Estado do usuário:', {
    currentUser: state.currentUser,
    djangoUser: state.djangoUser,
    currentUserId,
    hasUser: !!state.currentUser,
    hasDjangoUser: !!state.djangoUser,
    userType: state.currentUser?.type,
    djangoUserType: state.djangoUser?.user_type,
    authUserId: getUserId(),
    authUser: getCurrentUser()
  });

  // Carregar dados das demandas
  const loadMyJobs = useCallback(async () => {
    console.log('loadMyJobs chamado - currentUserId:', currentUserId);
    
    if (!currentUserId || currentUserId === 0) {
      console.log('currentUserId não encontrado ou inválido:', currentUserId);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Carregando trabalhos para usuário:', currentUserId);
      
      // Carregar trabalhos ativos
      const activeResponse = await demandService.getMyJobs('EM ANDAMENTO', currentUserId);
      setActiveJobs(activeResponse.demands || []);
      
      // Carregar trabalhos concluídos
      const completedResponse = await demandService.getMyJobs('CONCLUÍDA', currentUserId);
      setCompletedJobs(completedResponse.demands || []);
      
      // Carregar candidaturas (demandas onde o usuário está interessado mas não selecionado)
      const interestedResponse = await demandService.getMyJobs('ABERTA', undefined, currentUserId);
      setInterestedJobs(interestedResponse.demands || []);
      
      // Atualizar estatísticas
      setStats({
        active: activeResponse.counters.emAndamento || 0,
        completed: completedResponse.counters.concluidas || 0,
        interested: interestedResponse.counters.abertas || 0,
        total: (activeResponse.counters.emAndamento || 0) + (completedResponse.counters.concluidas || 0) + (interestedResponse.counters.abertas || 0)
      });
      
      console.log('Trabalhos carregados com sucesso:', {
        active: activeResponse.demands.length,
        completed: completedResponse.demands.length,
        interested: interestedResponse.demands.length
      });
      
    } catch (error) {
      console.error('Erro ao carregar meus trabalhos:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    console.log('useEffect executado - currentUserId:', currentUserId, 'isAuthenticated:', isAuthenticated, 'loadMyJobs:', loadMyJobs);
    
    if (isAuthenticated && currentUserId && currentUserId > 0) {
      console.log('Usuário autenticado, chamando loadMyJobs...');
      loadMyJobs();
    } else {
      console.log('Usuário não autenticado ou ID inválido, não carregando trabalhos. currentUserId:', currentUserId, 'isAuthenticated:', isAuthenticated);
      setLoading(false);
    }
  }, [currentUserId, loadMyJobs, isAuthenticated]);

  const handleContactClient = (demand: Demand) => {
    if (demand.user_cellphone) {
      const message = `Olá! Sou o profissional selecionado para seu projeto na VINKO. Vamos conversar sobre os detalhes?`;
      const whatsappUrl = `https://wa.me/55${demand.user_cellphone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('Telefone não cadastrado');
    }
  };

  const handleCardClick = (demand: Demand) => {
    setSelectedDemand(demand);
  };

  // Funções vazias para o modal (botões removidos)
  const handleContactWhatsApp = () => {};
  const handleStartConversationDemand = () => {};
  const handleShowInterest = () => {};

  const statsCards = [
    { label: 'Trabalhos Ativos', value: stats.active, color: 'text-blue-600', bg: 'bg-blue-100', icon: Briefcase },
    { label: 'Concluídos', value: stats.completed, color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
    { label: 'Candidaturas', value: stats.interested, color: 'text-purple-600', bg: 'bg-purple-100', icon: Clock },
    { label: 'Total', value: stats.total, color: 'text-gray-600', bg: 'bg-gray-100', icon: Star },
  ];

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Trabalhos</h1>
        <p className="text-gray-600">
          Gerencie seus projetos em andamento e histórico de trabalhos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'active', label: 'Ativos', count: stats.active },
              { id: 'completed', label: 'Concluídos', count: stats.completed },
              { id: 'interested', label: 'Candidaturas', count: stats.interested },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'active' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando trabalhos...</p>
                </div>
              ) : activeJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum trabalho ativo no momento</p>
                </div>
              ) : (
                activeJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(job)}
                  >
                    {/* Topo do card: Título à esquerda, Botão à direita */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 
                          className="text-lg font-semibold text-gray-900 truncate"
                          title={job.title}
                        >
                          {job.title}
                        </h3>
                        {job.description && (
                          <p 
                            className="text-sm text-gray-600 truncate mt-1"
                            title={job.description}
                          >
                            {job.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactClient(job);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Conversar
                        </button>
                      </div>
                    </div>
                    
                    {/* Informações na parte inferior */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Cliente: {job.user_full_name}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.budget.min > 0 || job.budget.max > 0 
                          ? (() => {
                              const min = job.budget.min > 0 ? `R$ ${job.budget.min.toLocaleString('pt-BR')}` : '';
                              const max = job.budget.max > 0 ? `R$ ${job.budget.max.toLocaleString('pt-BR')}` : '';
                              if (min && max) {
                                return `Mín: ${min} - Máx: ${max}`;
                              } else if (min) {
                                return `Mín: ${min}`;
                              } else if (max) {
                                return `Máx: ${max}`;
                              }
                              return '-';
                            })()
                          : '-'
                        }
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Prazo: {job.deadline ? new Date(job.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando trabalhos...</p>
                </div>
              ) : completedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum trabalho concluído ainda</p>
                </div>
              ) : (
                completedJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-green-50 rounded-lg p-6 border border-green-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(job)}
                  >
                    {/* Topo do card: Título à esquerda, Status à direita */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 
                          className="text-lg font-semibold text-gray-900 truncate"
                          title={job.title}
                        >
                          {job.title}
                        </h3>
                        {job.description && (
                          <p 
                            className="text-sm text-gray-600 truncate mt-1"
                            title={job.description}
                          >
                            {job.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Concluído
                          </span>
                        </div>
                    </div>
                        
                    {/* Informações na parte inferior */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                        Cliente: {job.user_full_name}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                        {job.budget.min > 0 || job.budget.max > 0 
                          ? (() => {
                              const min = job.budget.min > 0 ? `R$ ${job.budget.min.toLocaleString('pt-BR')}` : '';
                              const max = job.budget.max > 0 ? `R$ ${job.budget.max.toLocaleString('pt-BR')}` : '';
                              if (min && max) {
                                return `Mín: ${min} - Máx: ${max}`;
                              } else if (min) {
                                return `Mín: ${min}`;
                              } else if (max) {
                                return `Máx: ${max}`;
                              }
                              return '-';
                            })()
                          : '-'
                        }
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                        Concluído em: {new Date(job.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'interested' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando candidaturas...</p>
                </div>
              ) : interestedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma candidatura ativa</p>
                </div>
              ) : (
                interestedJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-yellow-50 rounded-lg p-6 border border-yellow-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(job)}
                  >
                    {/* Topo do card: Título à esquerda, Status à direita */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 
                          className="text-lg font-semibold text-gray-900 truncate"
                          title={job.title}
                        >
                          {job.title}
                        </h3>
                        {job.description && (
                          <p 
                            className="text-sm text-gray-600 truncate mt-1"
                            title={job.description}
                          >
                            {job.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Aguardando
                          </span>
                        </div>
                    </div>
                        
                    {/* Informações na parte inferior */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                          Cliente: {job.user_full_name}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                          {job.budget.min > 0 || job.budget.max > 0 
                            ? (() => {
                                const min = job.budget.min > 0 ? `R$ ${job.budget.min.toLocaleString('pt-BR')}` : '';
                                const max = job.budget.max > 0 ? `R$ ${job.budget.max.toLocaleString('pt-BR')}` : '';
                                if (min && max) {
                                  return `Mín: ${min} - Máx: ${max}`;
                                } else if (min) {
                                  return `Mín: ${min}`;
                                } else if (max) {
                                  return `Máx: ${max}`;
                                }
                                return '-';
                              })()
                            : '-'
                          }
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                          Prazo: {job.deadline ? new Date(job.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                        </div>
                      </div>

                      {/* Informações dos interessados */}
                      <div className="flex-shrink-0 ml-4">
                        <p className="text-sm text-gray-500 mb-2 text-right">
                          {job.interested_professionals_count} profissionais interessados
                        </p>
                        <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                          Interesse demonstrado
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Demanda */}
      {selectedDemand && (
        <DemandDetailsModal
          demand={selectedDemand}
          onClose={() => setSelectedDemand(null)}
          onContactWhatsApp={handleContactWhatsApp}
          onStartConversation={handleStartConversationDemand}
          onShowInterest={handleShowInterest}
          isInterested={false}
        />
      )}
    </div>
  );
}

// Modal de Detalhes da Demanda (mesmo da tela de oportunidades, adaptado)
interface DemandDetailsModalProps {
  demand: Demand;
  onClose: () => void;
  onContactWhatsApp: (demand: Demand) => void;
  onStartConversation: (demand: Demand) => void;
  onShowInterest: (demandId: string) => void;
  isInterested: boolean;
}

function DemandDetailsModal({ 
  demand, 
  onClose, 
  onContactWhatsApp, 
  onStartConversation, 
  onShowInterest, 
  isInterested 
}: DemandDetailsModalProps) {
  const [demandFiles, setDemandFiles] = useState<{id: number; file: string; created_at: string; updated_at: string; demand: number}[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; index: number } | null>(null);

  // Carregar arquivos da demanda
  useEffect(() => {
    const loadDemandFiles = async () => {
      setLoadingFiles(true);
      try {
        const files = await demandService.getDemandFiles(parseInt(demand.id));
        setDemandFiles(files);
      } catch (error) {
        console.error('Erro ao carregar arquivos da demanda:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadDemandFiles();
  }, [demand.id]);

  const openImageModal = (src: string, index: number) => {
    setSelectedImage({ src, index });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage || !demand.attachments) return;
    
    const currentIndex = selectedImage.index;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : demand.attachments.length - 1;
    } else {
      newIndex = currentIndex < demand.attachments.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage({ src: demand.attachments[newIndex], index: newIndex });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h2 
                className="text-2xl font-semibold text-gray-900 mb-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
                title={demand.title}
              >
                {demand.title}
              </h2>
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                demand.status === 'open' ? 'bg-green-100 text-green-800' :
                demand.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                demand.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {demand.status === 'open' ? 'Demanda Aberta' :
                 demand.status === 'in_progress' ? 'Em Andamento' :
                 demand.status === 'completed' ? 'Concluída' : 'Cancelada'}
              </span>
            </div>
            
            {/* Seção de Profissionais Interessados */}
            <div className="flex items-center mx-4 bg-gray-50 rounded-lg px-3 py-2">
              <Heart className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-sm text-gray-500">
                {demand.interested_professionals_count || 0} profissionais interessados
              </span>
            </div>
            
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Descrição do Projeto</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <p className="text-gray-600 leading-relaxed">{demand.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                Orçamento
              </h3>
              <p className={demand.budget.min > 0 || demand.budget.max > 0 ? "text-sm text-green-600" : "text-gray-500 text-xs"}>
                {demand.budget.min > 0 || demand.budget.max > 0 
                  ? (() => {
                      const min = demand.budget.min > 0 ? `R$ ${demand.budget.min.toLocaleString('pt-BR')}` : '';
                      const max = demand.budget.max > 0 ? `R$ ${demand.budget.max.toLocaleString('pt-BR')}` : '';
                      if (min && max) {
                        return `Mín: ${min} - Máx: ${max}`;
                      } else if (min) {
                        return `Mín: ${min}`;
                      } else if (max) {
                        return `Máx: ${max}`;
                      }
                      return 'Nenhum orçamento informado';
                    })()
                  : 'Nenhum orçamento informado'
                }
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Prazo
              </h3>
              <p className={demand.deadline ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }) : 'Nenhum prazo informado'}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                Localização
              </h3>
              <p className={demand.location.city || demand.location.state ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {(() => {
                  if (demand.location.city && demand.location.state) {
                    return `${demand.location.city}, ${demand.location.state}`;
                  } else if (demand.location.city) {
                    return demand.location.city;
                  } else if (demand.location.state) {
                    return demand.location.state;
                  }
                  return 'Nenhuma localização informada';
                })()}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <User className="h-4 w-4 mr-2 text-purple-600" />
                Tipo de Serviço
              </h3>
              <p className={demand.serviceType ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.serviceType || 'Nenhum tipo de serviço informado'}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Área de Atuação
              </h3>
              <p className={demand.area ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.area || 'Nenhuma área de atuação informada'}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Especialidade
              </h3>
              <p className={demand.specialty ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.specialty || 'Nenhuma especialidade informada'}
              </p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Tipo de Tecido
              </h3>
              <p className={demand.tecidType ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.tecidType || 'Nenhum tipo de tecido informado'}
              </p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Quantidade
              </h3>
              <p className={demand.amount ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.amount ? demand.amount.toLocaleString('pt-BR') : 'Nenhuma quantidade informada'}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-red-600" />
                Disponibilidade
              </h3>
              <p className={demand.availability ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.availability || 'Nenhuma disponibilidade informada'}
              </p>
            </div>
          </div>


          {/* Arquivos Anexados */}
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="h-5 w-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Arquivos Anexados ({demandFiles.length})
            </h3>
            
            {loadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Carregando arquivos...</span>
              </div>
            ) : demandFiles.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum arquivo anexado</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {demandFiles.map((file) => {
                  const fileName = file.file.split('/').pop() || 'Arquivo';
                  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                  
                  return (
                    <div 
                      key={file.id} 
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group flex-shrink-0 w-24"
                      onClick={() => window.open(file.file, '_blank')}
                    >
                      <div className="flex flex-col items-center text-center">
                        {isImage ? (
                          <img 
                            src={file.file} 
                            alt={fileName}
                            className="w-10 h-10 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-pink-200 transition-colors">
                            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <p className="text-xs text-gray-600 truncate w-full" title={fileName}>
                          {fileName.length > 12 ? fileName.substring(0, 12) + '...' : fileName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(file.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 whitespace-nowrap">
              Criada em {new Date(demand.createdAt).toLocaleDateString('pt-BR')} | Atualizada em {new Date(demand.updatedAt).toLocaleDateString('pt-BR')}
            </div>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-[95vw] max-h-[95vh] overflow-auto">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-10 shadow-lg"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Arrows */}
            {demand.attachments && demand.attachments.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all z-10"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all z-10"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={selectedImage.src}
              alt={`Imagem ${selectedImage.index + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
