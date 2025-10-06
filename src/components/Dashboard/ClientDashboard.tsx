import React, { useMemo, useState, useEffect } from 'react';
import { Briefcase, Users, Calendar, TrendingUp, Plus, Eye, MessageSquare, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { userService } from '../../services/userService';
import { demandService } from '../../services/demandService';
import { Demand } from '../../types';

interface ClientDashboardProps {
  onPageChange: (page: string) => void;
  onShowDemandForm: () => void;
  onShowDemandDetails: (demandId: string) => void;
  onStartConversation?: (otherUserId: string, demandId?: string, initialMessage?: string) => void;
}

export function ClientDashboard({ onPageChange, onShowDemandForm, onShowDemandDetails, onStartConversation }: ClientDashboardProps) {
  const { state } = useApp();
  const [currentPage, setCurrentPage] = React.useState(1);
  const demandsPerPage = 10;
  const [analytics, setAnalytics] = useState({
    active_demands: 0,
    interested_professionals: 0,
    completed_jobs: 0,
    available_professionals: 0
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [recentDemands, setRecentDemands] = useState<Demand[]>([]);
  const [isLoadingDemands, setIsLoadingDemands] = useState(true);
  const [totalDemands, setTotalDemands] = useState(0);

  const userProfile = state.clientProfiles.find(p => p.userId === state.currentUser?.id);
  const userDemands = state.demands.filter(d => d.clientId === state.currentUser?.id);
  const totalProfessionals = state.professionalProfiles.filter(p => p.isApproved).length;
  
  // 5. AJUSTE: Contar profissionais únicos interessados em demandas abertas do cliente
  const uniqueInterestedProfessionals = useMemo(() => {
    const activeDemands = userDemands.filter(d => d.status === 'open' || d.status === 'in_progress');
    const allInterestedProfessionals = new Set();
    
    activeDemands.forEach(demand => {
      demand.interestedProfessionals.forEach(professionalId => {
        allInterestedProfessionals.add(professionalId);
      });
    });
    
    return allInterestedProfessionals.size;
  }, [userDemands]);

  const stats = [
    {
      label: 'Demandas Ativas',
      value: isLoadingAnalytics ? '...' : analytics.active_demands.toString(),
      icon: Briefcase,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
    {
      label: 'Profissionais Interessados',
      value: isLoadingAnalytics ? '...' : analytics.interested_professionals.toString(),
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Trabalhos Concluídos',
      value: isLoadingAnalytics ? '...' : analytics.completed_jobs.toString(),
      icon: TrendingUp,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
    {
      label: 'Profissionais Disponíveis',
      value: isLoadingAnalytics ? '...' : analytics.available_professionals.toString(),
      icon: Eye,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  // Paginação
  const totalPages = Math.ceil(userDemands.length / demandsPerPage);
  const startIndex = (currentPage - 1) * demandsPerPage;
  const endIndex = startIndex + demandsPerPage;
  const paginatedDemands = userDemands.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Carregar analytics do dashboard
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoadingAnalytics(true);
        console.log('Carregando analytics do dashboard do cliente...');
        
        const analyticsData = await userService.getClientAnalytics();
        console.log('Analytics do cliente carregadas:', analyticsData);
        setAnalytics(analyticsData);
        
      } catch (error) {
        console.error('Erro ao carregar analytics do cliente:', error);
        // Usar dados locais como fallback
        setAnalytics({
          active_demands: userDemands.filter(d => d.status === 'open' || d.status === 'in_progress').length,
          interested_professionals: uniqueInterestedProfessionals,
          completed_jobs: userDemands.filter(d => d.status === 'completed').length,
          available_professionals: totalProfessionals
        });
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, []);

  // Carregar demandas recentes da API
  useEffect(() => {
    const loadRecentDemands = async () => {
      try {
        setIsLoadingDemands(true);
        const userId = state.currentUser?.id ? parseInt(state.currentUser.id) : undefined;
        const { demands, counters } = await demandService.getDemands(undefined, userId);
        // Pegar apenas as 3 primeiras demandas
        setRecentDemands(demands.slice(0, 3));
        setTotalDemands(counters.total);
      } catch (error) {
        console.error('Erro ao carregar demandas recentes:', error);
        setRecentDemands([]);
        setTotalDemands(0);
      } finally {
        setIsLoadingDemands(false);
      }
    };

    loadRecentDemands();
  }, [state.currentUser?.id]);

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Olá, {userProfile?.name || 'Cliente'}!
        </h1>
        <p className="text-gray-600">
          Gerencie suas demandas e encontre os melhores profissionais para seus projetos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6 rounded-lg text-white">
          <h3 className="text-xl font-semibold mb-2">Publique uma nova demanda</h3>
          <p className="text-pink-100 mb-4">
            Descreva seu projeto e encontre profissionais qualificados
          </p>
          <button 
            onClick={onShowDemandForm}
            className="bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Demanda
          </button>
        </div>

        <div className="bg-gradient-to-r from-pink-400 to-pink-500 p-6 rounded-lg text-white">
          <h3 className="text-xl font-semibold mb-2">Buscar profissionais</h3>
          <p className="text-pink-100 mb-4">
            Explore perfis e encontre o profissional ideal para seu projeto
          </p>
          <button 
            onClick={() => onPageChange('find-professionals')}
            className="bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Buscar Profissionais
          </button>
        </div>
      </div>

      {/* Recent Demands */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Suas Demandas</h2>
          <div className="flex items-center space-x-4">
            {totalDemands > 0 && (
              <span className="text-sm text-gray-500">
                {totalDemands} demanda{totalDemands !== 1 ? 's' : ''} total
              </span>
            )}
            {totalDemands > 3 && (
              <button 
                onClick={() => onPageChange('my-demands')}
                className="flex items-center text-pink-600 hover:text-pink-700 transition-colors text-sm font-medium"
              >
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>
        </div>
        
        {isLoadingDemands ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            <span className="ml-2 text-gray-600">Carregando demandas...</span>
          </div>
        ) : recentDemands.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Você ainda não publicou nenhuma demanda</p>
            <button 
              onClick={onShowDemandForm}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Publicar primeira demanda
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {recentDemands.map((demand) => (
                <DemandCard
                  key={demand.id}
                  demand={demand}
                  onManage={() => {
                    console.log('Clicou em Gerenciar para demanda:', demand.id);
                    onPageChange('my-demands');
                    onShowDemandDetails(demand.id);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Support Card - Footer */}
<div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-lg text-white">
  <h3 className="text-xl font-semibold mb-2">Suporte VINKO</h3>
  <p className="text-orange-100 mb-4">
    Precisa de ajuda? Nossa equipe está aqui para você
  </p>

  <a
    href="https://wa.me/5548999585658?text=Olá%2C+preciso+de+ajuda+com+a+plataforma+Vinko."
    target="_blank"
    rel="noopener noreferrer"
  >
    <button className="bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center">
      <MessageSquare className="h-4 w-4 mr-2" />
      <span>Falar com Suporte</span>
    </button>
  </a>
</div>
    </div>
  );
}

// Componente de Card de Demanda para o Dashboard
interface DemandCardProps {
  demand: Demand;
  onManage: () => void;
}

function DemandCard({ demand, onManage }: DemandCardProps) {
  // Função para truncar texto
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter o texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluída';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-4">
          {/* Título */}
          <h3 
            className="font-semibold text-gray-900 mb-1" 
            title={demand.title}
          >
            {demand.title}
          </h3>
          
          {/* Descrição */}
          <p 
            className="text-gray-600 text-sm mb-3" 
            title={demand.description}
          >
            {truncateText(demand.description, 150)}
          </p>
          
          {/* Informações do status, interessados e data */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(demand.status)}`}>
              {getStatusText(demand.status)}
            </span>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1 flex-shrink-0" />
              {demand.interestedProfessionals?.length || 0} interessados
            </span>
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
              {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR') : '-'}
            </span>
          </div>
        </div>
        
        {/* Botão Gerenciar */}
        <button
          onClick={onManage}
          className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium flex-shrink-0"
        >
          Gerenciar
        </button>
      </div>
    </div>
  );
}