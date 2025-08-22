import React, { useMemo } from 'react';
import { Briefcase, Users, Calendar, TrendingUp, Plus, Eye, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

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
      value: userDemands.filter(d => d.status === 'open' || d.status === 'in_progress').length,
      icon: Briefcase,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
    {
      label: 'Profissionais Interessados',
      value: uniqueInterestedProfessionals,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Trabalhos Concluídos',
      value: userDemands.filter(d => d.status === 'completed').length,
      icon: TrendingUp,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
    {
      label: 'Profissionais Disponíveis',
      value: totalProfessionals,
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
          {userDemands.length > 0 && (
            <span className="text-sm text-gray-500">
              {userDemands.length} demanda{userDemands.length !== 1 ? 's' : ''} total
            </span>
          )}
        </div>
        
        {userDemands.length === 0 ? (
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
              {paginatedDemands.map((demand) => (
                <div key={demand.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{demand.title}</h3>
                      <p className="text-gray-600 mt-1">{demand.description}</p>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          demand.status === 'open' ? 'bg-green-100 text-green-800' :
                          demand.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {demand.status === 'open' ? 'Aberta' : 
                           demand.status === 'in_progress' ? 'Em andamento' : 
                           'Concluída'}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {demand.interestedProfessionals.length} interessados
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(demand.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onShowDemandDetails(demand.id)}
                      className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, userDemands.length)} de {userDemands.length} demandas
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
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